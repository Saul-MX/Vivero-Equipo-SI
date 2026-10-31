import "server-only";
import { resolverArchivo, borrarArchivo } from "@/lib/archivos/almacen";
import { prisma } from "@/lib/db";
import type { EntradaNovedad, NovedadValidada } from "@/lib/validacion/novedad";

// Novedades («Publicar novedad» del Inicio del panel). Las visibles salen en Inicio del sitio,
// de la más nueva a la más vieja.

export type NovedadEnLista = {
  id: number;
  titulo: string;
  texto: string;
  imagen: string | null;
  visible: boolean;
  creadoEn: Date;
};

export function listarNovedadesPanel(): Promise<NovedadEnLista[]> {
  return prisma.novedad.findMany({
    orderBy: [{ creadoEn: "desc" }, { id: "desc" }],
    select: { id: true, titulo: true, texto: true, imagen: true, visible: true, creadoEn: true },
  });
}

/** Una novedad con la forma del formulario, o null si no existe. */
export async function obtenerNovedad(id: number): Promise<EntradaNovedad | null> {
  const fila = await prisma.novedad.findUnique({ where: { id } });
  return fila && { titulo: fila.titulo, texto: fila.texto, imagen: fila.imagen, visible: fila.visible };
}

export type ResultadoGuardarNovedad =
  | { ok: true; id: number }
  | { ok: false; error: "noEncontrado" | "archivoNoEncontrado" };

export async function guardarNovedad(datos: NovedadValidada, id: number | null): Promise<ResultadoGuardarNovedad> {
  const actual = id ? await prisma.novedad.findUnique({ where: { id }, select: { imagen: true } }) : null;
  if (id !== null && !actual) return { ok: false, error: "noEncontrado" };

  const imagen = await resolverArchivo(datos.imagen, actual?.imagen ?? null, "novedades", "imagen");
  if (!imagen) return { ok: false, error: "archivoNoEncontrado" };

  const campos = { titulo: datos.titulo, texto: datos.texto, visible: datos.visible, imagen: imagen.clave };
  const guardadoId =
    id === null
      ? (await prisma.novedad.create({ data: campos })).id
      : (await prisma.novedad.update({ where: { id }, data: campos })).id;
  await borrarArchivo(imagen.borrar, "imagen");
  return { ok: true, id: guardadoId };
}

export async function cambiarVisibleNovedad(id: number, visible: boolean): Promise<void> {
  await prisma.novedad.updateMany({ where: { id }, data: { visible } });
}

/** Elimina la novedad y su imagen. Devuelve su título, o null si ya no existía. */
export async function eliminarNovedad(id: number): Promise<string | null> {
  const novedad = await prisma.novedad.findUnique({ where: { id }, select: { titulo: true, imagen: true } });
  if (!novedad) return null;
  await prisma.novedad.delete({ where: { id } });
  await borrarArchivo(novedad.imagen, "imagen");
  return novedad.titulo;
}
