import "server-only";
import { borrarArchivo, resolverArchivo } from "@/lib/archivos/almacen";
import { prisma } from "@/lib/db";
import type { FertilizanteValidado } from "@/lib/validacion/fertilizante";

// Fertilizantes que vende el vivero. Salen en la página Fertilizantes y en la ficha de cada planta.

export type FertilizanteEnLista = {
  id: number;
  nombre: string;
  tipo: string | null;
  presentacion: string | null;
  foto: string | null;
  visible: boolean;
  catalogos: string[];
  plantas: number;
};

export async function listarFertilizantesPanel(): Promise<FertilizanteEnLista[]> {
  const filas = await prisma.fertilizante.findMany({
    orderBy: [{ nombre: "asc" }, { id: "asc" }],
    select: {
      id: true,
      nombre: true,
      tipo: true,
      presentacion: true,
      foto: true,
      visible: true,
      catalogosRecomendados: {
        orderBy: { catalogo: { orden: "asc" } },
        select: { catalogo: { select: { nombre: true } } },
      },
      _count: { select: { plantas: true } },
    },
  });
  return filas.map(({ catalogosRecomendados, _count, ...fertilizante }) => ({
    ...fertilizante,
    catalogos: catalogosRecomendados.map((fila) => fila.catalogo.nombre),
    plantas: _count.plantas,
  }));
}

export function obtenerFertilizante(id: number) {
  return prisma.fertilizante.findUnique({
    where: { id },
    include: {
      catalogosRecomendados: { select: { catalogoId: true } },
      _count: { select: { plantas: true } },
    },
  });
}

export async function cambiarVisibleFertilizante(id: number, visible: boolean) {
  await prisma.fertilizante.update({ where: { id }, data: { visible } });
}

export async function guardarFertilizante(
  datos: FertilizanteValidado,
  id: number | null,
): Promise<{ ok: true; id: number } | { ok: false; error: "noEncontrado" | "archivoNoEncontrado" }> {
  const actual = id ? await prisma.fertilizante.findUnique({ where: { id }, select: { foto: true } }) : null;
  if (id !== null && !actual) return { ok: false, error: "noEncontrado" };

  const foto = await resolverArchivo(datos.foto, actual?.foto ?? null, "fertilizantes", "imagen");
  if (!foto) return { ok: false, error: "archivoNoEncontrado" };
  const catalogos = await prisma.catalogo.findMany({ where: { id: { in: datos.catalogos } }, select: { id: true } });

  const campos = {
    nombre: datos.nombre,
    tipo: datos.tipo,
    paraQueSirve: datos.paraQueSirve,
    dosis: datos.dosis,
    frecuencia: datos.frecuencia,
    pasosAplicacion: datos.pasosAplicacion,
    precauciones: datos.precauciones || null,
    presentacion: datos.presentacion,
    visible: datos.visible,
    foto: foto.clave,
  };

  const guardadoId = await prisma.$transaction(async (tx) => {
    const fertilizanteId =
      id === null
        ? (await tx.fertilizante.create({ data: campos })).id
        : (await tx.fertilizante.update({ where: { id }, data: campos })).id;
    // «Recomendado para» se reemplaza completo por los catálogos elegidos.
    await tx.fertilizanteCatalogo.deleteMany({ where: { fertilizanteId } });
    await tx.fertilizanteCatalogo.createMany({
      data: catalogos.map((catalogo) => ({ fertilizanteId, catalogoId: catalogo.id })),
    });
    return fertilizanteId;
  });

  await borrarArchivo(foto.borrar, "imagen");
  return { ok: true, id: guardadoId };
}

/**
 * Elimina un fertilizante. Las plantas que lo recomendaban NO se borran: quedan con
 * «Ninguno» como fertilizante recomendado (la base lo hace sola al borrarlo).
 */
export async function eliminarFertilizante(
  id: number,
): Promise<{ ok: true; nombre: string; plantas: number } | { ok: false }> {
  const fertilizante = await prisma.fertilizante.findUnique({
    where: { id },
    select: { nombre: true, foto: true, _count: { select: { plantas: true } } },
  });
  if (!fertilizante) return { ok: false };
  await prisma.fertilizante.delete({ where: { id } });
  await borrarArchivo(fertilizante.foto, "imagen");
  return { ok: true, nombre: fertilizante.nombre, plantas: fertilizante._count.plantas };
}
