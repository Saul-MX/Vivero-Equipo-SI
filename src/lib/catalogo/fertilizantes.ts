import "server-only";
import { prisma } from "@/lib/db";

// Fertilizantes que vende el vivero.

/** Para el selector «Fertilizante recomendado» del riego de cada planta. */
export function listarFertilizantesParaElegir() {
  return prisma.fertilizante.findMany({
    orderBy: { nombre: "asc" },
    select: { id: true, nombre: true },
  });
}
