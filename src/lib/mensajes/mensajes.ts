import "server-only";
import { prisma } from "@/lib/db";

// Mensajes que llegan del formulario de Contacto del sitio (sección 4.1: «Ver mensajes»).

export type MensajeEnLista = {
  id: number;
  nombre: string;
  contacto: string;
  texto: string;
  leido: boolean;
  creadoEn: Date;
};

const SELECCION = { id: true, nombre: true, contacto: true, texto: true, leido: true, creadoEn: true } as const;

/** Del más nuevo al más viejo; con `soloSinLeer`, solo los que no se han abierto. */
export function listarMensajes(soloSinLeer = false): Promise<MensajeEnLista[]> {
  return prisma.mensaje.findMany({
    where: soloSinLeer ? { leido: false } : {},
    orderBy: [{ creadoEn: "desc" }, { id: "desc" }],
    take: 500,
    select: SELECCION,
  });
}

export async function contarMensajes(): Promise<{ total: number; sinLeer: number }> {
  const [total, sinLeer] = await Promise.all([prisma.mensaje.count(), prisma.mensaje.count({ where: { leido: false } })]);
  return { total, sinLeer };
}

export function obtenerMensaje(id: number): Promise<MensajeEnLista | null> {
  return prisma.mensaje.findUnique({ where: { id }, select: SELECCION });
}

export async function marcarMensaje(id: number, leido: boolean): Promise<boolean> {
  const { count } = await prisma.mensaje.updateMany({ where: { id }, data: { leido } });
  return count === 1;
}

export async function eliminarMensaje(id: number): Promise<boolean> {
  const { count } = await prisma.mensaje.deleteMany({ where: { id } });
  return count === 1;
}
