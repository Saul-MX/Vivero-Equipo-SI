import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import {
  ETIQUETA_ANUNCIOS,
  ETIQUETA_NOSOTROS,
  ETIQUETA_PREGUNTAS,
  ETIQUETA_TESTIMONIOS,
} from "@/lib/apartados/etiquetas";
import { anunciosDeHoy, fechaEnMexico } from "@/lib/carrusel/regla";
import { ETIQUETA_CATALOGOS, ETIQUETA_FERTILIZANTES, ETIQUETA_PLANTAS, ETIQUETA_TEMPORADAS } from "@/lib/catalogo/etiquetas";
import { prisma } from "@/lib/db";
import { leerEstadoTemporadas } from "@/lib/temporadas/temporadas";
import type { DatosDiapositiva } from "@/components/sitio/diapositiva-anuncio";

// Lo que lee el sitio público. Todo sale de lo que se captura en el panel y solo lo visible.
//
// Cada función se guarda en caché con las etiquetas de lo que usa: cuando el panel guarda algo,
// renueva esa etiqueta (updateTag) y el sitio lo muestra al momento.
// Lo que depende de la fecha (temporada vigente, anuncios de hoy) además se recalcula cada
// 15 minutos, para que el cambio de mes o de día se note sin que nadie toque el panel.

const SEGUN_LA_FECHA = { stale: 300, revalidate: 900, expire: 86400 } as const;

// ───────────── Temporada ─────────────

export type TemporadaDelSitio = {
  temporadaId: number;
  catalogoId: number;
  nombre: string;
  slug: string;
  color: string;
  fotoPortada: string | null;
  textoAviso: string | null;
};

/** La temporada que se ve hoy (con su color de acento) y el año, para el pie de página. */
export async function temporadaDelSitio(): Promise<{ vigente: TemporadaDelSitio | null; anio: number }> {
  "use cache";
  cacheTag(ETIQUETA_TEMPORADAS, ETIQUETA_CATALOGOS);
  cacheLife(SEGUN_LA_FECHA);
  const { vigente } = await leerEstadoTemporadas();
  return {
    vigente: vigente && {
      temporadaId: vigente.id,
      catalogoId: vigente.catalogo.id,
      nombre: vigente.catalogo.nombre,
      slug: vigente.catalogo.slug,
      color: vigente.catalogo.color,
      fotoPortada: vigente.catalogo.fotoPortada,
      textoAviso: vigente.textoAviso,
    },
    anio: Number(fechaEnMexico().slice(0, 4)),
  };
}

/** Anuncios del carrusel que salen hoy (regla 6), en orden. */
export async function anunciosDeHoySitio(): Promise<(DatosDiapositiva & { id: number })[]> {
  "use cache";
  cacheTag(ETIQUETA_ANUNCIOS, ETIQUETA_TEMPORADAS, ETIQUETA_CATALOGOS);
  cacheLife(SEGUN_LA_FECHA);
  const [filas, { vigente }] = await Promise.all([
    prisma.anuncio.findMany({ where: { visible: true, archivo: { not: null } } }),
    leerEstadoTemporadas(),
  ]);
  const texto = (fecha: Date | null) => (fecha ? fecha.toISOString().slice(0, 10) : null);
  const deHoy = anunciosDeHoy(
    filas.map((fila) => ({ ...fila, desde: texto(fila.desde), hasta: texto(fila.hasta) })),
    vigente?.id ?? null,
    fechaEnMexico(),
  );
  return deHoy.map((fila) => ({
    id: fila.id,
    tipoMedio: fila.tipoMedio,
    archivo: fila.archivo,
    archivoMovil: fila.archivoMovil,
    imagenEspera: fila.imagenEspera,
    imagenConTexto: fila.imagenConTexto,
    textoPequeno: fila.textoPequeno ?? "",
    titulo: fila.titulo ?? "",
    texto: fila.texto ?? "",
    boton1Texto: fila.boton1Texto ?? "",
    boton1Destino: fila.boton1Destino ?? "",
    boton2Texto: fila.boton2Texto ?? "",
    boton2Destino: fila.boton2Destino ?? "",
    posicionTexto: fila.posicionTexto,
    oscurecido: fila.oscurecido,
  }));
}

// ───────────── Catálogos ─────────────

export type CatalogoEnSitio = {
  id: number;
  nombre: string;
  slug: string;
  color: string;
  permanente: boolean;
  fotoPortada: string | null;
  presentacion: string | null;
  plantas: number;
};

/** Catálogos visibles en el orden del panel, con cuántas plantas visibles tiene cada uno. */
export async function catalogosVisibles(): Promise<CatalogoEnSitio[]> {
  "use cache";
  cacheTag(ETIQUETA_CATALOGOS, ETIQUETA_PLANTAS);
  cacheLife("days");
  const filas = await prisma.catalogo.findMany({
    where: { visible: true },
    orderBy: [{ orden: "asc" }, { id: "asc" }],
    select: {
      id: true,
      nombre: true,
      slug: true,
      color: true,
      permanente: true,
      fotoPortada: true,
      presentacion: true,
      _count: { select: { plantas: { where: { visible: true } } } },
    },
  });
  return filas.map(({ _count, ...catalogo }) => ({ ...catalogo, plantas: _count.plantas }));
}

/** Menú «Catálogos» (regla 5): los visibles marcados como permanentes, en su orden. */
export async function catalogosDelMenu(): Promise<{ nombre: string; slug: string }[]> {
  return (await catalogosVisibles())
    .filter((catalogo) => catalogo.permanente)
    .map(({ nombre, slug }) => ({ nombre, slug }));
}

export async function catalogoPorSlug(slug: string) {
  "use cache";
  cacheTag(ETIQUETA_CATALOGOS, ETIQUETA_PLANTAS);
  cacheLife("days");
  const catalogo = await prisma.catalogo.findFirst({
    where: { slug, visible: true },
    select: {
      id: true,
      nombre: true,
      slug: true,
      color: true,
      fotoPortada: true,
      presentacion: true,
      destacados: true,
      folletoPdf: true,
    },
  });
  if (!catalogo) return null;
  return {
    ...catalogo,
    destacados: (catalogo.destacados ?? "")
      .split("\n")
      .map((linea) => linea.trim())
      .filter(Boolean),
    plantas: await plantasVisibles({ catalogoId: catalogo.id }),
  };
}

// ───────────── Plantas ─────────────

export type TarjetaPlanta = {
  slug: string;
  nombre: string;
  variedad: string | null;
  etiqueta: "NUEVO" | "OFERTA" | null;
  disponible: boolean;
  catalogo: string;
  portada: { archivo: string; ancho: number; alto: number } | null;
};

/** Plantas visibles (de un catálogo o todas), por nombre, con su foto de portada. */
export async function plantasVisibles(filtro: { catalogoId?: number } = {}): Promise<TarjetaPlanta[]> {
  "use cache";
  cacheTag(ETIQUETA_PLANTAS, ETIQUETA_CATALOGOS);
  cacheLife("days");
  const filas = await prisma.planta.findMany({
    where: { visible: true, ...(filtro.catalogoId ? { catalogoId: filtro.catalogoId } : {}) },
    orderBy: [{ nombre: "asc" }, { id: "asc" }],
    select: {
      slug: true,
      nombre: true,
      variedad: true,
      etiqueta: true,
      disponible: true,
      catalogo: { select: { nombre: true } },
      fotos: {
        orderBy: [{ esPortada: "desc" }, { orden: "asc" }],
        take: 1,
        select: { archivo: true, ancho: true, alto: true },
      },
    },
  });
  return filas.map(({ catalogo, fotos, ...planta }) => ({
    ...planta,
    catalogo: catalogo.nombre,
    portada: fotos[0] ?? null,
  }));
}

/** Interruptor general «Mostrar disponibilidad en el sitio». */
export async function mostrarDisponibilidad(): Promise<boolean> {
  "use cache";
  cacheTag(ETIQUETA_PLANTAS);
  cacheLife("days");
  const configuracion = await prisma.configuracionSitio.findUnique({
    where: { id: 1 },
    select: { mostrarDisponibilidad: true },
  });
  return configuracion?.mostrarDisponibilidad ?? false;
}

/** Ficha de una planta visible, o null si no existe o está oculta. */
export async function plantaPorSlug(slug: string) {
  "use cache";
  cacheTag(ETIQUETA_PLANTAS, ETIQUETA_CATALOGOS, ETIQUETA_FERTILIZANTES);
  cacheLife("days");
  const planta = await prisma.planta.findFirst({
    where: { slug, visible: true },
    select: {
      slug: true,
      nombre: true,
      variedad: true,
      etiqueta: true,
      disponible: true,
      descripcionCorta: true,
      cuidados: true,
      riegoDiasSemana: true,
      cantidadAgua: true,
      notaRiego: true,
      catalogo: { select: { nombre: true, slug: true, visible: true } },
      fertilizante: { select: { id: true, nombre: true, visible: true } },
      luces: { select: { luz: true }, orderBy: { luz: "asc" } },
      colores: { select: { color: { select: { nombre: true, hex: true, orden: true } } } },
      macetas: { select: { maceta: { select: { nombre: true, orden: true } } } },
      fotos: {
        orderBy: [{ esPortada: "desc" }, { orden: "asc" }],
        select: { archivo: true, ancho: true, alto: true },
      },
    },
  });
  if (!planta) return null;
  return {
    ...planta,
    luces: planta.luces.map((fila) => fila.luz),
    colores: planta.colores.map((fila) => fila.color).sort((a, b) => a.orden - b.orden),
    macetas: planta.macetas.map((fila) => fila.maceta).sort((a, b) => a.orden - b.orden),
    // Un fertilizante oculto no se recomienda en el sitio.
    fertilizante: planta.fertilizante?.visible ? planta.fertilizante : null,
  };
}

// ───────────── Fertilizantes ─────────────

export async function fertilizantesVisibles() {
  "use cache";
  cacheTag(ETIQUETA_FERTILIZANTES, ETIQUETA_CATALOGOS);
  cacheLife("days");
  const filas = await prisma.fertilizante.findMany({
    where: { visible: true },
    orderBy: [{ nombre: "asc" }, { id: "asc" }],
    select: {
      id: true,
      nombre: true,
      tipo: true,
      paraQueSirve: true,
      dosis: true,
      frecuencia: true,
      pasosAplicacion: true,
      precauciones: true,
      presentacion: true,
      foto: true,
      catalogosRecomendados: {
        where: { catalogo: { visible: true } },
        select: { catalogo: { select: { nombre: true, slug: true, orden: true } } },
      },
    },
  });
  return filas.map(({ catalogosRecomendados, pasosAplicacion, ...fertilizante }) => ({
    ...fertilizante,
    pasos: (pasosAplicacion ?? "")
      .split("\n")
      .map((paso) => paso.trim())
      .filter(Boolean),
    catalogos: catalogosRecomendados
      .map((fila) => fila.catalogo)
      .sort((a, b) => a.orden - b.orden)
      .map(({ nombre, slug }) => ({ nombre, slug })),
  }));
}

// ───────────── Apartados de página ─────────────

export async function testimoniosVisibles() {
  "use cache";
  cacheTag(ETIQUETA_TESTIMONIOS);
  cacheLife("days");
  return prisma.testimonio.findMany({
    where: { visible: true },
    orderBy: [{ orden: "asc" }, { id: "asc" }],
    select: { id: true, nombre: true, texto: true, avatar: true },
  });
}

export async function preguntasFrecuentes() {
  "use cache";
  cacheTag(ETIQUETA_PREGUNTAS);
  cacheLife("days");
  return prisma.preguntaFrecuente.findMany({
    orderBy: [{ orden: "asc" }, { id: "asc" }],
    select: { id: true, pregunta: true, respuesta: true },
  });
}

/** Historia, Momentos, Misión, Visión y Valores, con sus fotos (y medidas para el mosaico). */
export async function contenidoNosotros() {
  "use cache";
  cacheTag(ETIQUETA_NOSOTROS);
  cacheLife("days");
  const [contenidos, galeria, valores, momentos] = await Promise.all([
    prisma.contenidoNosotros.findMany(),
    prisma.fotoGaleriaNosotros.findMany({ orderBy: [{ orden: "asc" }, { id: "asc" }] }),
    prisma.valorNosotros.findMany({ orderBy: [{ orden: "asc" }, { id: "asc" }] }),
    prisma.momentoNosotros.findMany({ orderBy: [{ orden: "asc" }, { id: "asc" }] }),
  ]);
  const seccion = (clave: "HISTORIA" | "MISION" | "VISION" | "VALORES") => {
    const contenido = contenidos.find((fila) => fila.seccion === clave);
    return {
      parrafos: (contenido?.texto ?? "")
        .split(/\n\s*\n/)
        .map((parrafo) => parrafo.trim())
        .filter(Boolean),
      fotoSuperior: contenido?.fotoSuperior ?? null,
      galeria: galeria
        .filter((foto) => foto.seccion === clave)
        .map(({ archivo, ancho, alto }) => ({ archivo, ancho, alto })),
    };
  };
  return {
    historia: seccion("HISTORIA"),
    momentos: momentos.map(({ id, titulo, texto, foto }) => ({ id, titulo, texto, foto })),
    mision: seccion("MISION"),
    vision: seccion("VISION"),
    valores: {
      ...seccion("VALORES"),
      lista: valores.map(({ id, titulo, descripcion }) => ({ id, titulo, descripcion })),
    },
  };
}
