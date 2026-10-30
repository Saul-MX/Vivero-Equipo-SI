import "server-only";
import { prisma } from "@/lib/db";
import type { ModoTemporadaValidado, TemporadaValidada } from "@/lib/validacion/temporada";
import { calcularTemporadaVigente, mesEnMexico, type ConfiguracionTemporadas, type MotivoTemporada } from "./vigente";

// Temporadas guardadas, configuración del modo y la temporada que se ve hoy.

export type TemporadaConCatalogo = {
  id: number;
  mesInicio: number;
  mesFin: number;
  todoElAnio: boolean;
  textoAviso: string | null;
  prioridad: number;
  visible: boolean;
  ordenCatalogo: number;
  catalogo: { id: number; nombre: string; slug: string; color: string; fotoPortada: string | null };
};

export type EstadoTemporadas = {
  temporadas: TemporadaConCatalogo[];
  configuracion: ConfiguracionTemporadas;
  vigente: TemporadaConCatalogo | null;
  motivo: MotivoTemporada;
  mes: number;
};

/** Lee todo lo necesario y calcula la temporada vigente para la fecha indicada (por defecto, hoy). */
export async function leerEstadoTemporadas(fecha: Date = new Date()): Promise<EstadoTemporadas> {
  const [filas, configuracionGuardada] = await Promise.all([
    prisma.temporada.findMany({
      orderBy: [{ catalogo: { orden: "asc" } }, { catalogoId: "asc" }],
      select: {
        id: true,
        mesInicio: true,
        mesFin: true,
        todoElAnio: true,
        textoAviso: true,
        prioridad: true,
        visible: true,
        catalogo: {
          select: { id: true, nombre: true, slug: true, color: true, fotoPortada: true, orden: true },
        },
      },
    }),
    prisma.configuracionSitio.findUnique({ where: { id: 1 } }),
  ]);

  const temporadas = filas.map(({ catalogo: { orden, ...catalogo }, ...temporada }) => ({
    ...temporada,
    ordenCatalogo: orden,
    catalogo,
  }));
  const configuracion: ConfiguracionTemporadas = {
    modo: configuracionGuardada?.modoTemporada ?? "AUTOMATICA",
    temporadaForzadaId: configuracionGuardada?.temporadaForzadaId ?? null,
  };
  const mes = mesEnMexico(fecha);
  const { temporada, motivo } = calcularTemporadaVigente(temporadas, configuracion, mes);
  return { temporadas, configuracion, vigente: temporada, motivo, mes };
}

export async function guardarModoTemporada(datos: ModoTemporadaValidado): Promise<{ ok: boolean }> {
  if (datos.modo === "FORZADA") {
    const existe = await prisma.temporada.findUnique({ where: { id: datos.temporadaForzadaId! } });
    if (!existe) return { ok: false };
  }
  const valores = {
    modoTemporada: datos.modo,
    temporadaForzadaId: datos.modo === "FORZADA" ? datos.temporadaForzadaId : null,
  };
  await prisma.configuracionSitio.upsert({ where: { id: 1 }, create: { id: 1, ...valores }, update: valores });
  return { ok: true };
}

/** Guarda una tarjeta de temporada. El color es el de su catálogo (se guarda ahí). */
export async function guardarTemporada(id: number, datos: TemporadaValidada): Promise<{ ok: boolean }> {
  const temporada = await prisma.temporada.findUnique({ where: { id }, select: { catalogoId: true, todoElAnio: true } });
  if (!temporada) return { ok: false };

  await prisma.$transaction([
    prisma.temporada.update({
      where: { id },
      // En la temporada base solo se cambia el aviso: sus meses, prioridad y visibilidad no aplican.
      data: temporada.todoElAnio
        ? { textoAviso: datos.textoAviso || null }
        : {
            mesInicio: datos.mesInicio,
            mesFin: datos.mesFin,
            textoAviso: datos.textoAviso || null,
            prioridad: datos.prioridad,
            visible: datos.visible,
          },
    }),
    prisma.catalogo.update({ where: { id: temporada.catalogoId }, data: { color: datos.color } }),
  ]);
  return { ok: true };
}
