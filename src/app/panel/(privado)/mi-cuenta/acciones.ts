"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { MINUTO_MS } from "@/lib/auth/constantes";
import { hashearContrasena, verificarContrasena } from "@/lib/auth/contrasena";
import { cancelarInvitacion, crearInvitacion } from "@/lib/auth/invitaciones";
import {
  limpiarIntentos,
  minutosDeBloqueo,
  registrarFallo,
  type ReglaIntentos,
} from "@/lib/auth/limite-intentos";
import { cerrarOtrasSesiones, obtenerSesion, requerirUsuario } from "@/lib/auth/sesion";
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

  const cuenta = await prisma.usuario.findUniqueOrThrow({
    where: { id: usuario.id },
    select: { hashContrasena: true },
  });
  if (!(await verificarContrasena(cuenta.hashContrasena, actual))) {
    await registrarFallo([regla]);
    return { ok: false, campos: { actual: "contrasenaActualIncorrecta" } };
  }

  await prisma.usuario.update({
    where: { id: usuario.id },
    data: { hashContrasena: await hashearContrasena(nueva) },
  });
  await limpiarIntentos(regla.clave);

  // Por seguridad se cierran las sesiones abiertas en otros aparatos; esta sigue activa.
  const sesion = await obtenerSesion();
  if (sesion) await cerrarOtrasSesiones(usuario.id, sesion.sesionId);

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
