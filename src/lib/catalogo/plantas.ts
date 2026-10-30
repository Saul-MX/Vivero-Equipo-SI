import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { borrarArchivo, confirmarArchivo, existeTemporal, medidasImagen } from "@/lib/archivos/almacen";
import { esClaveTemporal } from "@/lib/archivos/claves";
import { prisma } from "@/lib/db";
import { crearSlug, slugUnico } from "@/lib/slug";
import type { FiltrosPlantas, PlantaValidada } from "@/lib/validacion/planta";

// Plantas: listado con filtros, ficha completa, guardado (con fotos) y eliminación.

export type PlantaEnLista = {
  id: number;
  nombre: string;
  variedad: string | null;
  slug: string;
  catalogo: string;
  fotos: number;
  portada: string | null;
  disponible: boolean;
  visible: boolean;
};

export async function listarPlantasPanel(filtros: FiltrosPlantas): Promise<PlantaEnLista[]> {
  const donde: Prisma.PlantaWhereInput = {
    // La base compara sin distinguir mayúsculas ni acentos («nochebuena» encuentra «Nochebuena»).
    ...(filtros.q && { OR: [{ nombre: { contains: filtros.q } }, { variedad: { contains: filtros.q } }] }),
    ...(filtros.catalogo && { catalogoId: filtros.catalogo }),
    ...(filtros.color && { colores: { some: { colorId: filtros.color } } }),
    ...(filtros.disponible && { disponible: filtros.disponible === "si" }),
  };
  const filas = await prisma.planta.findMany({
    where: donde,
    orderBy: [{ nombre: "asc" }, { id: "asc" }],
    select: {
      id: true,
      nombre: true,
      variedad: true,
      slug: true,
      disponible: true,
      visible: true,
      catalogo: { select: { nombre: true } },
      fotos: { where: { esPortada: true }, select: { archivo: true }, take: 1 },
      _count: { select: { fotos: true } },
    },
  });
  return filas.map((planta) => ({
    id: planta.id,
    nombre: planta.nombre,
    variedad: planta.variedad,
    slug: planta.slug,
    catalogo: planta.catalogo.nombre,
    fotos: planta._count.fotos,
    portada: planta.fotos[0]?.archivo ?? null,
    disponible: planta.disponible,
    visible: planta.visible,
  }));
}

export function contarPlantas() {
  return prisma.planta.count();
}

export function obtenerPlanta(id: number) {
  return prisma.planta.findUnique({
    where: { id },
    include: {
      luces: true,
      colores: { select: { colorId: true } },
      macetas: { select: { macetaId: true } },
      fotos: { orderBy: { orden: "asc" }, select: { id: true, archivo: true, esPortada: true } },
    },
  });
}

/** Catálogos, colores, macetas y fertilizantes para las listas del formulario. */
export async function opcionesFormularioPlanta() {
  const [catalogos, colores, macetas, fertilizantes] = await Promise.all([
    prisma.catalogo.findMany({ orderBy: [{ orden: "asc" }, { id: "asc" }], select: { id: true, nombre: true } }),
    prisma.color.findMany({ orderBy: [{ orden: "asc" }, { id: "asc" }], select: { id: true, nombre: true, hex: true } }),
    prisma.maceta.findMany({ orderBy: [{ orden: "asc" }, { id: "asc" }], select: { id: true, nombre: true } }),
    prisma.fertilizante.findMany({ orderBy: { nombre: "asc" }, select: { id: true, nombre: true } }),
  ]);
  return { catalogos, colores, macetas, fertilizantes };
}
export type OpcionesFormularioPlanta = Awaited<ReturnType<typeof opcionesFormularioPlanta>>;

export async function cambiarVisiblePlanta(id: number, visible: boolean) {
  await prisma.planta.update({ where: { id }, data: { visible } });
}

export async function cambiarDisponiblePlanta(id: number, disponible: boolean) {
  await prisma.planta.update({ where: { id }, data: { disponible } });
}

/** Interruptor general «Mostrar disponibilidad en el sitio». */
export async function leerMostrarDisponibilidad(): Promise<boolean> {
  const configuracion = await prisma.configuracionSitio.findUnique({ where: { id: 1 } });
  return configuracion?.mostrarDisponibilidad ?? false;
}

export async function cambiarMostrarDisponibilidad(mostrar: boolean) {
  await prisma.configuracionSitio.upsert({
    where: { id: 1 },
    create: { id: 1, mostrarDisponibilidad: mostrar },
    update: { mostrarDisponibilidad: mostrar },
  });
}

export type ResultadoGuardarPlanta =
  | { ok: true; id: number }
  | { ok: false; error: "noEncontrado" | "catalogoRequerido" | "archivoNoEncontrado" };

/**
 * Guarda una planta nueva (id = null) o existente.
 * - El slug se crea SOLO al darla de alta (nombre + variedad) y no cambia al renombrarla:
 *   así su dirección y su código QR siguen funcionando.
 * - Las fotos nuevas pasan de «temporal/» a «plantas/»; las que se quitaron se borran al final.
 * - Siempre queda una sola foto de portada (si no se marcó ninguna, la primera).
 */
export async function guardarPlanta(datos: PlantaValidada, id: number | null): Promise<ResultadoGuardarPlanta> {
  const actual = id
    ? await prisma.planta.findUnique({ where: { id }, select: { fotos: { select: { id: true, archivo: true } } } })
    : null;
  if (id !== null && !actual) return { ok: false, error: "noEncontrado" };

  const catalogo = await prisma.catalogo.findUnique({ where: { id: datos.catalogoId }, select: { id: true } });
  if (!catalogo) return { ok: false, error: "catalogoRequerido" };

  // Solo se aceptan referencias que existen (un color borrado en otra ventana simplemente se ignora).
  const [colores, macetas, fertilizante] = await Promise.all([
    prisma.color.findMany({ where: { id: { in: datos.colores } }, select: { id: true } }),
    prisma.maceta.findMany({ where: { id: { in: datos.macetas } }, select: { id: true } }),
    datos.fertilizanteId
      ? prisma.fertilizante.findUnique({ where: { id: datos.fertilizanteId }, select: { id: true } })
      : null,
  ]);

  // Fotos: las guardadas deben ser de esta planta; las nuevas, temporales que sigan existiendo.
  const fotosActuales = new Map((actual?.fotos ?? []).map((foto) => [foto.id, foto.archivo]));
  for (const foto of datos.fotos) {
    const valida =
      foto.id === null
        ? esClaveTemporal(foto.clave) && (await existeTemporal(foto.clave, "imagen"))
        : fotosActuales.get(foto.id) === foto.clave;
    if (!valida) return { ok: false, error: "archivoNoEncontrado" };
  }
  const indicePortada = Math.max(0, datos.fotos.findIndex((foto) => foto.esPortada));
  const fotos: { id: number | null; archivo: string; orden: number; esPortada: boolean }[] = [];
  for (const [indice, foto] of datos.fotos.entries()) {
    const archivo = foto.id === null ? await confirmarArchivo(foto.clave, "plantas", "imagen") : foto.clave;
    fotos.push({ id: foto.id, archivo, orden: indice + 1, esPortada: indice === indicePortada });
  }
  const conservadas = new Set(fotos.flatMap((foto) => (foto.id === null ? [] : [foto.id])));
  const quitadas = [...fotosActuales].filter(([idFoto]) => !conservadas.has(idFoto));

  const campos = {
    nombre: datos.nombre,
    variedad: datos.variedad || null,
    catalogoId: catalogo.id,
    etiqueta: datos.etiqueta,
    riegoDiasSemana: datos.riegoDias,
    cantidadAgua: datos.cantidadAgua,
    fertilizanteId: fertilizante?.id ?? null,
    notaRiego: datos.notaRiego || null,
    descripcionCorta: datos.descripcionCorta || null,
    cuidados: datos.cuidados || null,
    disponible: datos.disponible,
    visible: datos.visible,
  };

  const plantaId = await prisma.$transaction(async (tx) => {
    let idPlanta = id;
    if (idPlanta === null) {
      const slug = await slugUnico(crearSlug(`${datos.nombre} ${datos.variedad}`), async (candidato) =>
        Boolean(await tx.planta.findUnique({ where: { slug: candidato }, select: { id: true } })),
      );
      idPlanta = (await tx.planta.create({ data: { ...campos, slug } })).id;
    } else {
      await tx.planta.update({ where: { id: idPlanta }, data: campos });
    }

    // Luz, colores y macetas se reemplazan completos por lo elegido.
    await tx.plantaLuz.deleteMany({ where: { plantaId: idPlanta } });
    await tx.plantaColor.deleteMany({ where: { plantaId: idPlanta } });
    await tx.plantaMaceta.deleteMany({ where: { plantaId: idPlanta } });
    await tx.plantaLuz.createMany({ data: datos.luces.map((luz) => ({ plantaId: idPlanta, luz })) });
    await tx.plantaColor.createMany({ data: colores.map((color) => ({ plantaId: idPlanta, colorId: color.id })) });
    await tx.plantaMaceta.createMany({ data: macetas.map((maceta) => ({ plantaId: idPlanta, macetaId: maceta.id })) });

    if (quitadas.length > 0) {
      await tx.fotoPlanta.deleteMany({ where: { id: { in: quitadas.map(([idFoto]) => idFoto) } } });
    }
    for (const foto of fotos) {
      const datosFoto = { orden: foto.orden, esPortada: foto.esPortada };
      if (foto.id !== null) {
        await tx.fotoPlanta.update({ where: { id: foto.id }, data: datosFoto });
      } else {
        const medidas = await medidasImagen(foto.archivo);
        await tx.fotoPlanta.create({ data: { ...datosFoto, ...medidas, plantaId: idPlanta, archivo: foto.archivo } });
      }
    }
    return idPlanta;
  });

  await Promise.all(quitadas.map(([, archivo]) => borrarArchivo(archivo, "imagen")));
  return { ok: true, id: plantaId };
}

/** Elimina la planta, sus relaciones y sus fotos (las relaciones se borran en cascada). */
export async function eliminarPlanta(id: number): Promise<{ ok: true; nombre: string } | { ok: false }> {
  const planta = await prisma.planta.findUnique({
    where: { id },
    select: { nombre: true, fotos: { select: { archivo: true } } },
  });
  if (!planta) return { ok: false };
  await prisma.planta.delete({ where: { id } });
  await Promise.all(planta.fotos.map((foto) => borrarArchivo(foto.archivo, "imagen")));
  return { ok: true, nombre: planta.nombre };
}
