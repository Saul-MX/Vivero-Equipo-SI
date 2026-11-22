"use server";

import { isAPIError } from "better-auth/api";
import { refresh } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth, googleConfigurado } from "@/lib/auth/auth";
import { MINUTO_MS, RUTA_MI_CUENTA } from "@/lib/auth/constantes";
import { cancelarInvitacion, crearInvitacion } from "@/lib/auth/invitaciones";
import {
  limpiarIntentos,
  minutosDeBloqueo,
  registrarFallo,
  type ReglaIntentos,
} from "@/lib/auth/limite-intentos";
import { requerirUsuario } from "@/lib/auth/sesion";
import { prisma } from "@/lib/db";
import { erroresDeCampos, type ResultadoAccion } from "@/lib/resultado";
import { esquemaCambioContrasena, type DatosCambioContrasena } from "@/lib/validacion/cuenta";

export async function cambiarContrasena(
  datos: DatosCambioContrasena,
): Promise<ResultadoAccion<keyof DatosCambioContrasena>> {
  const usuario = await requerirUsuario();
  const validacion = esquemaCambioContrasena.safeParse(datos);
  if (!validacion.success) return { ok: false, campos: erroresDeCampos(validacion.error) };
  const { actual, nueva } = validacion.data;

  // Si alguien dejó la sesión abierta, no puede adivinar la contraseña actual a la fuerza.
  const regla: ReglaIntentos = {
    clave: `contrasena:usuario:${usuario.id}`,
    maximo: 5,
    ventanaMs: 15 * MINUTO_MS,
  };
  const minutos = await minutosDeBloqueo([regla]);
  if (minutos) return { ok: false, error: "demasiadosIntentos", minutos };

  try {
    // Por seguridad se cierran TODAS las sesiones y esta recibe un token nuevo (better-auth actualiza
    // la cookie): quien tuviera el token anterior, en este u otro aparato, ya no puede usarlo.
    await auth.api.changePassword({
      body: { currentPassword: actual, newPassword: nueva, revokeOtherSessions: true },
      headers: await headers(),
    });
  } catch (error) {
    if (!isAPIError(error)) throw error;
    if (error.body?.code === "INVALID_PASSWORD") {
      await registrarFallo([regla]);
      return { ok: false, campos: { actual: "contrasenaActualIncorrecta" } };
    }
    if (error.body?.code === "CREDENTIAL_ACCOUNT_NOT_FOUND") return { ok: false, error: "sinContrasena" };
    throw error;
  }
  await limpiarIntentos(regla.clave);

  return { ok: true };
}

/** Lleva a Google para vincular esa cuenta a la del panel; al volver, regresa a «Mi cuenta». */
export async function vincularGoogle(): Promise<ResultadoAccion> {
  await requerirUsuario();
  if (!googleConfigurado) return { ok: false, error: "googleNoDisponible" };
  const { url } = await auth.api.linkSocialAccount({
    body: {
      provider: "google",
      callbackURL: `${RUTA_MI_CUENTA}?google=vinculada`,
      errorCallbackURL: RUTA_MI_CUENTA,
      disableRedirect: true,
    },
    headers: await headers(),
  });
  if (!url) return { ok: false, error: "inesperado" };
  redirect(url);
}

/** Quita Google. Solo se puede si la cuenta tiene contraseña (si no, ya no habría cómo entrar). */
export async function desvincularGoogle(): Promise<ResultadoAccion> {
  const usuario = await requerirUsuario();
  const google = await prisma.cuentaAcceso.findFirst({
    where: { usuarioId: usuario.id, proveedor: "google" },
    select: { id: true },
  });
  if (!google) {
    refresh();
    return { ok: true };
  }
  try {
    // better-auth vuelve a revisar que esa forma de entrar sea del usuario de la sesión.
    await auth.api.unlinkAccount({ body: { accountId: google.id }, headers: await headers() });
  } catch (error) {
    if (!isAPIError(error)) throw error;
    if (error.body?.code === "FAILED_TO_UNLINK_LAST_ACCOUNT") return { ok: false, error: "googleUnicoAcceso" };
    // better-auth pide una sesión reciente (de menos de un día) para quitar una forma de entrar.
    if (error.body?.code === "SESSION_NOT_FRESH") return { ok: false, error: "sesionNoReciente" };
    throw error;
  }
  refresh();
  return { ok: true };
}

export async function crearCodigoInvitacion(): Promise<{ codigo: string }> {
  const usuario = await requerirUsuario();
  const { codigo } = await crearInvitacion(usuario.id);
  refresh();
  return { codigo };
}

export async function cancelarCodigoInvitacion(id: number): Promise<void> {
  await requerirUsuario();
  const idValido = z.number().int().positive().parse(id);
  await cancelarInvitacion(idValido);
  refresh();
}
