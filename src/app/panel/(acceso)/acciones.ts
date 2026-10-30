"use server";

import { redirect } from "next/navigation";
import { MINUTO_MS, RUTA_PANEL } from "@/lib/auth/constantes";
import { hashearContrasena, verificarContrasena } from "@/lib/auth/contrasena";
import { registrarUsuario } from "@/lib/auth/invitaciones";
import {
  limpiarIntentos,
  minutosDeBloqueo,
  registrarFallo,
  type ReglaIntentos,
} from "@/lib/auth/limite-intentos";
import { crearSesion, limpiarSesionesVencidas } from "@/lib/auth/sesion";
import { prisma } from "@/lib/db";
import { obtenerIp } from "@/lib/peticion";
import { erroresDeCampos, type ResultadoAccion } from "@/lib/resultado";
import {
  esquemaIngreso,
  esquemaRegistro,
  type DatosIngreso,
  type DatosRegistro,
} from "@/lib/validacion/cuenta";

const VENTANA_INGRESO_MS = 15 * MINUTO_MS;
const VENTANA_REGISTRO_MS = 60 * MINUTO_MS;

export async function ingresar(
  datos: DatosIngreso,
): Promise<ResultadoAccion<keyof DatosIngreso>> {
  const validacion = esquemaIngreso.safeParse(datos);
  if (!validacion.success) return { ok: false, campos: erroresDeCampos(validacion.error) };
  const { usuario, contrasena } = validacion.data;

  // 5 fallos por usuario o 30 por IP en 15 minutos bloquean temporalmente.
  const ip = await obtenerIp();
  const reglas: ReglaIntentos[] = [
    { clave: `ingreso:usuario:${usuario}`, maximo: 5, ventanaMs: VENTANA_INGRESO_MS },
    { clave: `ingreso:ip:${ip}`, maximo: 30, ventanaMs: VENTANA_INGRESO_MS },
  ];
  const minutos = await minutosDeBloqueo(reglas);
  if (minutos) return { ok: false, error: "demasiadosIntentos", minutos };

  const cuenta = await prisma.usuario.findUnique({
    where: { usuario },
    select: { id: true, hashContrasena: true },
  });
  const valida = await verificarContrasena(cuenta?.hashContrasena, contrasena);
  if (!cuenta || !valida) {
    await registrarFallo(reglas);
    // Mismo mensaje si el usuario no existe o si la contraseña está mal.
    return { ok: false, error: "credencialesInvalidas" };
  }

  await limpiarIntentos(reglas[0].clave);
  await limpiarSesionesVencidas();
  await crearSesion(cuenta.id);
  redirect(RUTA_PANEL);
}

export async function registrarse(
  datos: DatosRegistro,
): Promise<ResultadoAccion<keyof DatosRegistro>> {
  const validacion = esquemaRegistro.safeParse(datos);
  if (!validacion.success) return { ok: false, campos: erroresDeCampos(validacion.error) };
  const { codigo, usuario, contrasena } = validacion.data;

  // 10 códigos equivocados por hora desde la misma IP bloquean temporalmente.
  const ip = await obtenerIp();
  const regla: ReglaIntentos = {
    clave: `registro:ip:${ip}`,
    maximo: 10,
    ventanaMs: VENTANA_REGISTRO_MS,
  };
  const minutos = await minutosDeBloqueo([regla]);
  if (minutos) return { ok: false, error: "demasiadosIntentos", minutos };

  const resultado = await registrarUsuario({
    codigo,
    usuario,
    hashContrasena: await hashearContrasena(contrasena),
  });

  if (!resultado.ok) {
    if (resultado.motivo === "codigoInvalido") {
      await registrarFallo([regla]);
      return { ok: false, campos: { codigo: "codigoInvalido" } };
    }
    return { ok: false, campos: { usuario: "usuarioOcupado" } };
  }

  await crearSesion(resultado.usuarioId);
  redirect(RUTA_PANEL);
}
