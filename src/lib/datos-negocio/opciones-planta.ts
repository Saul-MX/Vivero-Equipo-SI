import "server-only";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import type { ColoresValidados, MacetasValidadas } from "@/lib/validacion/datos-negocio";

// Listas de opciones que se eligen en cada planta: colores y tamaños de maceta.
// Cada opción lleva el número de plantas que la usan (para el contador y el aviso al eliminar).

export type ColorConUso = { id: number; nombre: string; hex: string; plantas: number };
export type MacetaConUso = { id: number; nombre: string; plantas: number };

export type ResultadoLista = { ok: true } | { ok: false; error: "listaDesactualizada" | "nombreRepetido" };
export type ResultadoEliminar =
  | { ok: true; nombre: string; plantas: number }
  | { ok: false; error: "noEncontrado" };

class ListaDesactualizada extends Error {}

const esNombreRepetido = (error: unknown) =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";

// Al guardar se aparta primero el nombre de las filas renombradas, para poder intercambiar
// nombres entre dos filas («Azul» ↔ «Verde») sin que la base marque un nombre repetido a medio camino.
const nombreTemporal = (id: number) => `~cambiando-${id}`;

async function manejarErrores(guardar: () => Promise<void>): Promise<ResultadoLista> {
  try {
    await guardar();
    return { ok: true };
  } catch (error) {
    if (error instanceof ListaDesactualizada) return { ok: false, error: "listaDesactualizada" };
    if (esNombreRepetido(error)) return { ok: false, error: "nombreRepetido" };
    throw error;
  }
}

// ── Colores ──

export async function listarColoresConUso(): Promise<ColorConUso[]> {
  const filas = await prisma.color.findMany({
    orderBy: [{ orden: "asc" }, { id: "asc" }],
    select: { id: true, nombre: true, hex: true, _count: { select: { plantas: true } } },
  });
  return filas.map(({ _count, ...color }) => ({ ...color, plantas: _count.plantas }));
}

/** Guarda la lista completa: cambios de nombre y tono, colores nuevos y el orden. */
export function guardarColores({ colores }: ColoresValidados): Promise<ResultadoLista> {
  return manejarErrores(() =>
    prisma.$transaction(async (tx) => {
      const existentes = new Map(
        (await tx.color.findMany({ select: { id: true, nombre: true } })).map((c) => [c.id, c.nombre]),
      );
      // Si alguien borró un color en otra ventana, mejor avisar que guardar a ciegas.
      if (colores.some((fila) => fila.colorId !== null && !existentes.has(fila.colorId))) {
        throw new ListaDesactualizada();
      }
      for (const fila of colores) {
        if (fila.colorId !== null && existentes.get(fila.colorId) !== fila.nombre) {
          await tx.color.update({ where: { id: fila.colorId }, data: { nombre: nombreTemporal(fila.colorId) } });
        }
      }
      for (const [indice, fila] of colores.entries()) {
        const datos = { nombre: fila.nombre, hex: fila.hex, orden: indice + 1 };
        if (fila.colorId === null) await tx.color.create({ data: datos });
        else await tx.color.update({ where: { id: fila.colorId }, data: datos });
      }
    }),
  );
}

/**
 * Elimina un color. Si hay plantas que lo usan, primero se les quita ese color (las plantas
 * NO se borran), todo en una sola transacción: nunca quedan plantas apuntando a un color inexistente.
 */
export function eliminarColor(id: number): Promise<ResultadoEliminar> {
  return prisma.$transaction(async (tx) => {
    const color = await tx.color.findUnique({ where: { id }, select: { nombre: true } });
    if (!color) return { ok: false, error: "noEncontrado" } as const;
    const { count } = await tx.plantaColor.deleteMany({ where: { colorId: id } });
    await tx.color.delete({ where: { id } });
    return { ok: true, nombre: color.nombre, plantas: count } as const;
  });
}

// ── Tamaños de maceta ──

export async function listarMacetasConUso(): Promise<MacetaConUso[]> {
  const filas = await prisma.maceta.findMany({
    orderBy: [{ orden: "asc" }, { id: "asc" }],
    select: { id: true, nombre: true, _count: { select: { plantas: true } } },
  });
  return filas.map(({ _count, ...maceta }) => ({ ...maceta, plantas: _count.plantas }));
}

/** Guarda la lista completa: cambios de nombre, tamaños nuevos y el orden (subir/bajar). */
export function guardarMacetas({ macetas }: MacetasValidadas): Promise<ResultadoLista> {
  return manejarErrores(() =>
    prisma.$transaction(async (tx) => {
      const existentes = new Map(
        (await tx.maceta.findMany({ select: { id: true, nombre: true } })).map((m) => [m.id, m.nombre]),
      );
      if (macetas.some((fila) => fila.macetaId !== null && !existentes.has(fila.macetaId))) {
        throw new ListaDesactualizada();
      }
      for (const fila of macetas) {
        if (fila.macetaId !== null && existentes.get(fila.macetaId) !== fila.nombre) {
          await tx.maceta.update({ where: { id: fila.macetaId }, data: { nombre: nombreTemporal(fila.macetaId) } });
        }
      }
      for (const [indice, fila] of macetas.entries()) {
        const datos = { nombre: fila.nombre, orden: indice + 1 };
        if (fila.macetaId === null) await tx.maceta.create({ data: datos });
        else await tx.maceta.update({ where: { id: fila.macetaId }, data: datos });
      }
    }),
  );
}

/** Igual que con los colores: se quita de las plantas que lo usan y luego se elimina. */
export function eliminarMaceta(id: number): Promise<ResultadoEliminar> {
  return prisma.$transaction(async (tx) => {
    const maceta = await tx.maceta.findUnique({ where: { id }, select: { nombre: true } });
    if (!maceta) return { ok: false, error: "noEncontrado" } as const;
    const { count } = await tx.plantaMaceta.deleteMany({ where: { macetaId: id } });
    await tx.maceta.delete({ where: { id } });
    return { ok: true, nombre: maceta.nombre, plantas: count } as const;
  });
}
