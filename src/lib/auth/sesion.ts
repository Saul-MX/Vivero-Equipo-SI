import "server-only";
import { getSessionCookie } from "better-auth/cookies";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { prisma } from "@/lib/db";
import { auth, esCorreoInterno } from "./auth";
import { PREFIJO_COOKIES, RUTA_INGRESO } from "./constantes";

// Sesiones de better-auth guardadas en la base de datos:
// - La cookie (httpOnly) lleva un token aleatorio firmado con BETTER_AUTH_SECRET.
// - Cada petición se revisa contra la base (sin caché en cookie), así que cerrar una sesión
//   la invalida de inmediato, también en otros aparatos.

export type UsuarioActual = {
  id: string;
  /** Nombre de usuario; null si la cuenta se creó con Google. */
  usuario: string | null;
  /** Lo que se muestra en el saludo: el usuario, o el nombre de pila que trae Google. */
  nombreVisible: string;
  /** Correo de Google; null en las cuentas de usuario y contraseña. */
  correo: string | null;
};

/** Sesión vigente de quien hace la petición (o null). Se consulta una sola vez por petición. */
export const obtenerSesion = cache(
  async (): Promise<{ sesionId: string; usuario: UsuarioActual } | null> => {
    // Las cookies se leen con cookies() y no del encabezado original: si una acción acaba de cambiar
    // la sesión (por ejemplo, al cambiar la contraseña better-auth da un token nuevo), la página que
    // se vuelve a dibujar en esa misma petición ya debe usar el token nuevo.
    const encabezados = new Headers(await headers());
    encabezados.set("cookie", (await cookies()).toString());
    if (!getSessionCookie(encabezados, { cookiePrefix: PREFIJO_COOKIES })) return null;

    // Desde aquí todo depende de la visita (la base de datos y la hora actual), así que Next
    // no debe intentar prepararlo por adelantado. Las páginas que llaman a requerirUsuario()
    // quedan cubiertas también para sus consultas posteriores.
    await connection();

    const sesion = await auth.api.getSession({ headers: encabezados });
    if (!sesion) return null;

    const { user } = sesion;
    const usuario = user.username ?? null;
    return {
      sesionId: sesion.session.id,
      usuario: {
        id: user.id,
        usuario,
        nombreVisible: usuario ?? (user.name.split(" ")[0] || user.email),
        correo: esCorreoInterno(user.email) ? null : user.email,
      },
    };
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

/** Cierra la sesión actual (borra la fila y la cookie). */
export async function cerrarSesion(): Promise<void> {
  try {
    await auth.api.signOut({ headers: await headers() });
  } catch {
    // Si la sesión ya no existía, no hay nada que cerrar.
  }
}

/** Borra sesiones y datos temporales vencidos para que las tablas no crezcan sin fin. */
export async function limpiarVencidos(): Promise<void> {
  const ahora = new Date();
  await prisma.sesion.deleteMany({ where: { expiraEn: { lt: ahora } } });
  await prisma.verificacion.deleteMany({ where: { expiraEn: { lt: ahora } } });
}
