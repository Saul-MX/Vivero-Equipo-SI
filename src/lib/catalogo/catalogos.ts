import "server-only";
import { Prisma } from "@/generated/prisma/client";
import { borrarArchivo, resolverArchivo } from "@/lib/archivos/almacen";
import { prisma } from "@/lib/db";
import { crearSlug, slugUnico } from "@/lib/slug";
import type { CatalogoValidado } from "@/lib/validacion/catalogo";

// Catálogos (Nochebuena, Todo el año, Árboles, …) y la temporada de cada uno.

export type TemporadaResumen = {
  id: number;
  mesInicio: number;
  mesFin: number;
  todoElAnio: boolean;
  visible: boolean;
};

export type CatalogoEnLista = {
  id: number;
  nombre: string;
  slug: string;
  color: string;
  visible: boolean;
  permanente: boolean;
  fotoPortada: string | null;
  plantas: number;
  temporada: TemporadaResumen | null;
};

const SELECCION_TEMPORADA = {
  select: { id: true, mesInicio: true, mesFin: true, todoElAnio: true, visible: true },
} as const;

export async function listarCatalogosPanel(): Promise<CatalogoEnLista[]> {
  const filas = await prisma.catalogo.findMany({
    orderBy: [{ orden: "asc" }, { id: "asc" }],
    select: {
      id: true,
      nombre: true,
      slug: true,
      color: true,
      visible: true,
      permanente: true,
      fotoPortada: true,
      temporada: SELECCION_TEMPORADA,
      _count: { select: { plantas: true } },
    },
  });
  return filas.map(({ _count, ...catalogo }) => ({ ...catalogo, plantas: _count.plantas }));
}

/** Para los selectores de otros formularios (planta, fertilizante): id y nombre, en orden. */
export function listarCatalogosParaElegir() {
  return prisma.catalogo.findMany({
    orderBy: [{ orden: "asc" }, { id: "asc" }],
    select: { id: true, nombre: true, color: true },
  });
}

export function obtenerCatalogo(id: number) {
  return prisma.catalogo.findUnique({
    where: { id },
    select: {
      id: true,
      nombre: true,
      slug: true,
      color: true,
      visible: true,
      permanente: true,
      fotoPortada: true,
      presentacion: true,
      destacados: true,
      folletoPdf: true,
      temporada: SELECCION_TEMPORADA,
      _count: { select: { plantas: true } },
    },
  });
}

/** Sube o baja un catálogo una posición. El orden de esta lista es el del menú y la portada. */
export async function moverCatalogo(id: number, direccion: "subir" | "bajar"): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const ids = (
      await tx.catalogo.findMany({ orderBy: [{ orden: "asc" }, { id: "asc" }], select: { id: true } })
    ).map((catalogo) => catalogo.id);
    const actual = ids.indexOf(id);
    const destino = direccion === "subir" ? actual - 1 : actual + 1;
    if (actual < 0 || destino < 0 || destino >= ids.length) return;

    [ids[actual], ids[destino]] = [ids[destino], ids[actual]];
    // Se renumera toda la lista (1, 2, 3…) para que el orden quede siempre limpio.
    for (const [indice, idCatalogo] of ids.entries()) {
      await tx.catalogo.update({ where: { id: idCatalogo }, data: { orden: indice + 1 } });
    }
  });
}

export async function cambiarVisibleCatalogo(id: number, visible: boolean): Promise<void> {
  await prisma.catalogo.update({ where: { id }, data: { visible } });
}

export type ResultadoGuardarCatalogo =
  | { ok: true; id: number }
  | { ok: false; error: "noEncontrado" | "archivoNoEncontrado" | "temporadaEnUso" };

export async function guardarCatalogo(
  datos: CatalogoValidado,
  id: number | null,
): Promise<ResultadoGuardarCatalogo> {
  const actual = id
    ? await prisma.catalogo.findUnique({
        where: { id },
        select: { fotoPortada: true, folletoPdf: true, temporada: SELECCION_TEMPORADA },
      })
    : null;
  if (id !== null && !actual) return { ok: false, error: "noEncontrado" };

  const portada = await resolverArchivo(datos.fotoPortada, actual?.fotoPortada ?? null, "catalogos", "imagen");
  const folleto = await resolverArchivo(datos.folletoPdf, actual?.folletoPdf ?? null, "folletos", "pdf");
  if (!portada || !folleto) return { ok: false, error: "archivoNoEncontrado" };

  const campos = {
    nombre: datos.nombre,
    color: datos.color,
    visible: datos.visible,
    permanente: datos.permanente,
    fotoPortada: portada.clave,
    presentacion: datos.presentacion || null,
    destacados: datos.destacados || null,
    folletoPdf: folleto.clave,
  };

  try {
    const guardadoId = await prisma.$transaction(async (tx) => {
      let catalogoId = id;
      if (catalogoId === null) {
        const ultimo = await tx.catalogo.aggregate({ _max: { orden: true } });
        const slug = await slugUnico(crearSlug(datos.nombre), async (candidato) =>
          Boolean(await tx.catalogo.findUnique({ where: { slug: candidato }, select: { id: true } })),
        );
        catalogoId = (
          await tx.catalogo.create({ data: { ...campos, slug, orden: (ultimo._max.orden ?? 0) + 1 } })
        ).id;
      } else {
        await tx.catalogo.update({ where: { id: catalogoId }, data: campos });
      }

      // Temporada del catálogo. La temporada base («Todo el año») no se toca desde aquí.
      const temporada = actual?.temporada ?? null;
      if (!temporada?.todoElAnio) {
        if (datos.tieneTemporada) {
          const meses = { mesInicio: datos.mesInicio, mesFin: datos.mesFin };
          await tx.temporada.upsert({
            where: { catalogoId },
            create: { catalogoId, ...meses },
            update: meses,
          });
        } else if (temporada) {
          await quitarDeConfiguracion(tx, temporada.id);
          await tx.temporada.delete({ where: { id: temporada.id } });
        }
      }
      return catalogoId;
    });

    await Promise.all([borrarArchivo(portada.borrar, "imagen"), borrarArchivo(folleto.borrar, "pdf")]);
    return { ok: true, id: guardadoId };
  } catch (error) {
    // Una temporada con anuncios del carrusel no se puede quitar (llega en la fase 4).
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      return { ok: false, error: "temporadaEnUso" };
    }
    throw error;
  }
}

/** Si la temporada que se quita era la «forzada», el sitio vuelve al modo automático. */
async function quitarDeConfiguracion(tx: Prisma.TransactionClient, temporadaId: number) {
  await tx.configuracionSitio.updateMany({
    where: { temporadaForzadaId: temporadaId },
    data: { modoTemporada: "AUTOMATICA", temporadaForzadaId: null },
  });
}

export type ResultadoEliminarCatalogo =
  | { ok: true; nombre: string }
  | { ok: false; error: "noEncontrado" | "catalogoBase" | "temporadaEnUso" }
  | { ok: false; error: "catalogoConPlantas"; plantas: number };

/**
 * Elimina un catálogo con su temporada. No se permite si tiene plantas (quedarían sin catálogo)
 * ni si es el de la temporada base («Todo el año»).
 */
export async function eliminarCatalogo(id: number): Promise<ResultadoEliminarCatalogo> {
  try {
    const resultado = await prisma.$transaction(async (tx) => {
      const catalogo = await tx.catalogo.findUnique({
        where: { id },
        select: {
          nombre: true,
          fotoPortada: true,
          folletoPdf: true,
          temporada: SELECCION_TEMPORADA,
          _count: { select: { plantas: true } },
        },
      });
      if (!catalogo) return { ok: false, error: "noEncontrado" } as const;
      if (catalogo._count.plantas > 0) {
        return { ok: false, error: "catalogoConPlantas", plantas: catalogo._count.plantas } as const;
      }
      if (catalogo.temporada?.todoElAnio) return { ok: false, error: "catalogoBase" } as const;

      if (catalogo.temporada) await quitarDeConfiguracion(tx, catalogo.temporada.id);
      await tx.catalogo.delete({ where: { id } });
      return { ok: true, catalogo } as const;
    });
    if (!resultado.ok) return resultado;

    const { catalogo } = resultado;
    await Promise.all([borrarArchivo(catalogo.fotoPortada, "imagen"), borrarArchivo(catalogo.folletoPdf, "pdf")]);
    return { ok: true, nombre: catalogo.nombre };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      return { ok: false, error: "temporadaEnUso" };
    }
    throw error;
  }
}
