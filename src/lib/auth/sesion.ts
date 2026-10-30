import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { COOKIE_SESION, DIA_MS, DIAS_SESION, RUTA_INGRESO } from "./constantes";

// Sesiones propias guardadas en la base de datos:
// - La cookie lleva un token aleatorio de 256 bits (httpOnly: el JavaScript del navegador no lo ve).
// - En la base solo se guarda el hash SHA-256 del token; si alguien leyera la base, no podría usarlo.
// - Cerrar sesión borra la fila, así que la cookie deja de servir de inmediato.

export type UsuarioActual = {
  id: number;
  usuario: string;
};

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function crearSesion(usuarioId: number): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  const expiraEn = new Date(Date.now() + DIAS_SESION * DIA_MS);

  await prisma.sesion.create({ data: { id: hashToken(token), usuarioId, expiraEn } });
  (await cookies()).set(COOKIE_SESION, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiraEn,
  });
}

/** Sesión vigente de quien hace la petición (o null). Se consulta una sola vez por petición. */
export const obtenerSesion = cache(
  async (): Promise<{ sesionId: string; usuario: UsuarioActual } | null> => {
    const token = (await cookies()).get(COOKIE_SESION)?.value;
    if (!token) return null;

    const sesion = await prisma.sesion.findUnique({
      where: { id: hashToken(token) },
      select: { id: true, expiraEn: true, usuario: { select: { id: true, usuario: true } } },
    });
    if (!sesion || sesion.expiraEn <= new Date()) return null;

    return { sesionId: sesion.id, usuario: sesion.usuario };
  },
);

/**
 * Exige una sesión válida: si no la hay, manda a la pantalla de inicio de sesión.
 * Se llama en CADA página del panel y en CADA acción del servidor (no basta con el layout).
 */
export async function requerirUsuario(): Promise<UsuarioActual> {
  const sesion = await obtenerSesion();
  if (!sesion) redirect(RUTA_INGRESO);
  return sesion.usuario;
}

export async function cerrarSesion(): Promise<void> {
  const almacen = await cookies();
  const token = almacen.get(COOKIE_SESION)?.value;
  if (token) {
    await prisma.sesion.deleteMany({ where: { id: hashToken(token) } });
  }
  almacen.delete(COOKIE_SESION);
}

/** Cierra las demás sesiones del usuario (por ejemplo, después de cambiar la contraseña). */
export async function cerrarOtrasSesiones(usuarioId: number, sesionActualId: string): Promise<void> {
  await prisma.sesion.deleteMany({ where: { usuarioId, id: { not: sesionActualId } } });
}

/** Borra sesiones vencidas para que la tabla no crezca sin fin. */
export async function limpiarSesionesVencidas(): Promise<void> {
  await prisma.sesion.deleteMany({ where: { expiraEn: { lt: new Date() } } });
}
