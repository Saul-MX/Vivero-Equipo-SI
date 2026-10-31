import "server-only";
import { prisma } from "@/lib/db";

// «Pendientes» del Inicio del panel (regla 8): se leen directo de la base, siempre al día.

export type Pendientes = {
  mensajesSinLeer: number;
  plantasOcultas: number;
  plantasSinFoto: number;
  faltaWhatsapp: boolean;
};

export async function leerPendientes(): Promise<Pendientes> {
  const [mensajesSinLeer, plantasOcultas, plantasSinFoto, datos] = await Promise.all([
    prisma.mensaje.count({ where: { leido: false } }),
    prisma.planta.count({ where: { visible: false } }),
    prisma.planta.count({ where: { fotos: { none: {} } } }),
    prisma.datosNegocio.findUnique({ where: { id: 1 }, select: { whatsapp: true } }),
  ]);
  return { mensajesSinLeer, plantasOcultas, plantasSinFoto, faltaWhatsapp: !datos?.whatsapp };
}
