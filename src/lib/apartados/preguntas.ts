import "server-only";
import { prisma } from "@/lib/db";
import { moverId } from "@/lib/orden";
import type { PreguntaValidada } from "@/lib/validacion/pregunta";

// Preguntas frecuentes: aparecen como acordeón al final de la página Contacto, en este orden.

export type PreguntaEnLista = { id: number; pregunta: string; respuesta: string };

const ORDEN = [{ orden: "asc" }, { id: "asc" }] as const;

export function listarPreguntas(): Promise<PreguntaEnLista[]> {
  return prisma.preguntaFrecuente.findMany({
    orderBy: [...ORDEN],
    select: { id: true, pregunta: true, respuesta: true },
  });
}

/** Crea (al final de la lista) o edita una pregunta. Devuelve false si la pregunta ya no existe. */
export async function guardarPregunta(datos: PreguntaValidada, id: number | null): Promise<boolean> {
  if (id === null) {
    const ultimo = await prisma.preguntaFrecuente.aggregate({ _max: { orden: true } });
    await prisma.preguntaFrecuente.create({ data: { ...datos, orden: (ultimo._max.orden ?? 0) + 1 } });
    return true;
  }
  const { count } = await prisma.preguntaFrecuente.updateMany({ where: { id }, data: datos });
  return count === 1;
}

export async function eliminarPregunta(id: number): Promise<boolean> {
  const { count } = await prisma.preguntaFrecuente.deleteMany({ where: { id } });
  return count === 1;
}

export async function moverPregunta(id: number, direccion: "subir" | "bajar"): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const ids = (await tx.preguntaFrecuente.findMany({ orderBy: [...ORDEN], select: { id: true } })).map(
      (fila) => fila.id,
    );
    const nuevos = moverId(ids, id, direccion);
    if (!nuevos) return;
    // Se renumera toda la lista (1, 2, 3…) para que el orden quede siempre limpio.
    for (const [indice, idPregunta] of nuevos.entries()) {
      await tx.preguntaFrecuente.update({ where: { id: idPregunta }, data: { orden: indice + 1 } });
    }
  });
}
