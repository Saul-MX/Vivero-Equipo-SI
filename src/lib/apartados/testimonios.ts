import "server-only";
import { borrarArchivo, resolverArchivo } from "@/lib/archivos/almacen";
import { prisma } from "@/lib/db";
import { moverId } from "@/lib/orden";
import type { TestimonioValidado } from "@/lib/validacion/testimonio";

// Testimonios de clientes: se muestran en Inicio (los visibles, en este orden).
// Los captura el administrador; no hay envío público de reseñas.

export type TestimonioEnLista = {
  id: number;
  nombre: string;
  texto: string;
  avatar: string | null;
  visible: boolean;
};

const ORDEN = [{ orden: "asc" }, { id: "asc" }] as const;

export function listarTestimonios(): Promise<TestimonioEnLista[]> {
  return prisma.testimonio.findMany({
    orderBy: [...ORDEN],
    select: { id: true, nombre: true, texto: true, avatar: true, visible: true },
  });
}

export type ResultadoGuardarTestimonio = { ok: true } | { ok: false; error: "noEncontrado" | "archivoNoEncontrado" };

/** Crea (al final de la lista) o edita un testimonio, con su foto de perfil. */
export async function guardarTestimonio(
  datos: TestimonioValidado,
  id: number | null,
): Promise<ResultadoGuardarTestimonio> {
  const actual = id ? await prisma.testimonio.findUnique({ where: { id }, select: { avatar: true } }) : null;
  if (id !== null && !actual) return { ok: false, error: "noEncontrado" };

  const avatar = await resolverArchivo(datos.avatar, actual?.avatar ?? null, "testimonios", "imagen");
  if (!avatar) return { ok: false, error: "archivoNoEncontrado" };

  const campos = { nombre: datos.nombre, texto: datos.texto, visible: datos.visible, avatar: avatar.clave };
  if (id === null) {
    const ultimo = await prisma.testimonio.aggregate({ _max: { orden: true } });
    await prisma.testimonio.create({ data: { ...campos, orden: (ultimo._max.orden ?? 0) + 1 } });
  } else {
    await prisma.testimonio.update({ where: { id }, data: campos });
  }
  await borrarArchivo(avatar.borrar, "imagen");
  return { ok: true };
}

export async function cambiarVisibleTestimonio(id: number, visible: boolean): Promise<void> {
  await prisma.testimonio.updateMany({ where: { id }, data: { visible } });
}

export async function eliminarTestimonio(id: number): Promise<boolean> {
  const testimonio = await prisma.testimonio.findUnique({ where: { id }, select: { avatar: true } });
  if (!testimonio) return false;
  await prisma.testimonio.delete({ where: { id } });
  await borrarArchivo(testimonio.avatar, "imagen");
  return true;
}

export async function moverTestimonio(id: number, direccion: "subir" | "bajar"): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const ids = (await tx.testimonio.findMany({ orderBy: [...ORDEN], select: { id: true } })).map((fila) => fila.id);
    const nuevos = moverId(ids, id, direccion);
    if (!nuevos) return;
    for (const [indice, idTestimonio] of nuevos.entries()) {
      await tx.testimonio.update({ where: { id: idTestimonio }, data: { orden: indice + 1 } });
    }
  });
}
