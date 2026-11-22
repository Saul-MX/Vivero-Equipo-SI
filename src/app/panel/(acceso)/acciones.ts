"use server";

import { randomUUID } from "node:crypto";
import { isAPIError } from "better-auth/api";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  auth,
  correoInterno,
  ENCABEZADO_INTENTO,
  ENCABEZADO_INVITACION,
  googleConfigurado,
  tomarReservaSinCuenta,
} from "@/lib/auth/auth";
import { hashCodigo } from "@/lib/auth/codigos";
import { MINUTO_MS, RUTA_INGRESO, RUTA_PANEL, RUTA_REGISTRO } from "@/lib/auth/constantes";
import { invitacionVigente, liberarInvitacion } from "@/lib/auth/invitaciones";
import {
  consumirIntento,
  devolverIntento,
  limpiarIntentos,
  type ReglaIntentos,
} from "@/lib/auth/limite-intentos";
import { limpiarVencidos } from "@/lib/auth/sesion";
import { prisma } from "@/lib/db";
import { obtenerIp } from "@/lib/peticion";
import { erroresDeCampos, type ResultadoAccion } from "@/lib/resultado";
import {
  esquemaIngreso,
  esquemaRegistro,
  esquemaRegistroGoogle,
  type DatosIngreso,
  type DatosRegistro,
  type DatosRegistroGoogle,
} from "@/lib/validacion/cuenta";

// Los límites cuentan el intento ANTES de hacerlo (consumirIntento) y lo devuelven si al final no
// contaba (salió bien o el error no era culpa de quien lo intentó). Ver limite-intentos.ts.

const VENTANA_INGRESO_MS = 15 * MINUTO_MS;
const VENTANA_REGISTRO_MS = 60 * MINUTO_MS;

/** 10 códigos equivocados por hora desde la misma IP bloquean temporalmente (con o sin Google). */
async function reglaRegistro(): Promise<ReglaIntentos> {
  return { clave: `registro:ip:${await obtenerIp()}`, maximo: 10, ventanaMs: VENTANA_REGISTRO_MS };
}

/**
 * Cada viaje a Google guarda su «state» en la base: se limitan a 20 por IP cada 15 minutos para que
 * nadie pueda llenar la tabla a propósito (se cuentan todos los viajes, no solo los fallidos).
 */
async function limitarViajesAGoogle(): Promise<number | null> {
  return consumirIntento([
    { clave: `google:ip:${await obtenerIp()}`, maximo: 20, ventanaMs: VENTANA_INGRESO_MS },
  ]);
}

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
  const minutos = await consumirIntento(reglas);
  if (minutos) return { ok: false, error: "demasiadosIntentos", minutos };

  try {
    // Si el usuario no existe, better-auth calcula un hash de todos modos: tarda lo mismo y no
    // delata qué nombres existen. Si sale bien, deja la cookie de sesión en la respuesta.
    await auth.api.signInUsername({
      body: { username: usuario, password: contrasena, rememberMe: true },
      headers: await headers(),
    });
  } catch (error) {
    if (!isAPIError(error)) throw error;
    // El intento ya quedó contado. Mismo mensaje si el usuario no existe o si la contraseña está mal.
    return { ok: false, error: "credencialesInvalidas" };
  }

  await limpiarIntentos(reglas[0].clave);
  await devolverIntento([reglas[1].clave]);
  await limpiarVencidos();
  redirect(RUTA_PANEL);
}

export async function registrarse(
  datos: DatosRegistro,
): Promise<ResultadoAccion<keyof DatosRegistro>> {
  const validacion = esquemaRegistro.safeParse(datos);
  if (!validacion.success) return { ok: false, campos: erroresDeCampos(validacion.error) };
  const { codigo, usuario, contrasena } = validacion.data;

  const regla = await reglaRegistro();
  const minutos = await consumirIntento([regla]);
  if (minutos) return { ok: false, error: "demasiadosIntentos", minutos };

  const hash = hashCodigo(codigo);
  if (!(await invitacionVigente(hash))) {
    return { ok: false, campos: { codigo: "codigoInvalido" } };
  }
  const usuarioOcupado = async () =>
    !!(await prisma.usuario.findUnique({ where: { usuario }, select: { id: true } }));
  if (await usuarioOcupado()) {
    await devolverIntento([regla.clave]);
    return { ok: false, campos: { usuario: "usuarioOcupado" } };
  }

  // El código viaja (como hash) al hook de auth.ts, que lo gasta justo antes de crear la cuenta.
  const intento = randomUUID();
  const encabezados = new Headers(await headers());
  encabezados.set(ENCABEZADO_INVITACION, hash);
  encabezados.set(ENCABEZADO_INTENTO, intento);
  try {
    await auth.api.signUpEmail({
      body: { email: correoInterno(usuario), name: usuario, username: usuario, password: contrasena },
      headers: encabezados,
    });
  } catch (error) {
    // Si este intento alcanzó a gastar el código pero la cuenta no se creó, el código se devuelve.
    const reservada = tomarReservaSinCuenta(intento);
    if (reservada) await liberarInvitacion(reservada);
    if (!isAPIError(error)) throw error;

    // Solo un código que no sirve cuenta como intento fallido.
    if (error.body?.code === "invitacion_invalida") {
      return { ok: false, campos: { codigo: "codigoInvalido" } };
    }
    await devolverIntento([regla.clave]);
    // Lo más común: otra persona tomó el mismo usuario un instante antes.
    if (error.body?.code === "USERNAME_IS_ALREADY_TAKEN" || (await usuarioOcupado())) {
      return { ok: false, campos: { usuario: "usuarioOcupado" } };
    }
    return { ok: false, error: "inesperado" };
  }
  tomarReservaSinCuenta(intento);
  await devolverIntento([regla.clave]);

  redirect(RUTA_PANEL);
}

/** «Continuar con Google» en Entrar: solo sirve si esa cuenta de Google ya está vinculada. */
export async function entrarConGoogle(): Promise<ResultadoAccion> {
  if (!googleConfigurado) return { ok: false, error: "googleNoDisponible" };
  const minutos = await limitarViajesAGoogle();
  if (minutos) return { ok: false, error: "demasiadosIntentos", minutos };
  const { url } = await auth.api.signInSocial({
    body: {
      provider: "google",
      callbackURL: RUTA_PANEL,
      errorCallbackURL: RUTA_INGRESO,
      disableRedirect: true,
    },
    headers: await headers(),
  });
  if (!url) return { ok: false, error: "inesperado" };
  redirect(url);
}

/** «Continuar con Google» en Crear cuenta: revisa el código antes de mandar a Google. */
export async function registrarseConGoogle(
  datos: DatosRegistroGoogle,
): Promise<ResultadoAccion<keyof DatosRegistroGoogle>> {
  if (!googleConfigurado) return { ok: false, error: "googleNoDisponible" };
  const validacion = esquemaRegistroGoogle.safeParse(datos);
  if (!validacion.success) return { ok: false, campos: erroresDeCampos(validacion.error) };

  const regla = await reglaRegistro();
  const minutos = await consumirIntento([regla]);
  if (minutos) return { ok: false, error: "demasiadosIntentos", minutos };

  const hash = hashCodigo(validacion.data.codigo);
  if (!(await invitacionVigente(hash))) {
    return { ok: false, campos: { codigo: "codigoInvalido" } };
  }
  await devolverIntento([regla.clave]);
  const minutosGoogle = await limitarViajesAGoogle();
  if (minutosGoogle) return { ok: false, error: "demasiadosIntentos", minutos: minutosGoogle };

  // El hash queda guardado en la base junto con el «state» del viaje a Google. Al volver, el hook
  // de auth.ts lo vuelve a revisar y lo gasta; si para entonces ya no sirve, la cuenta no se crea.
  // Si esa cuenta de Google ya estaba vinculada, simplemente entra y el código no se gasta.
  const { url } = await auth.api.signInSocial({
    body: {
      provider: "google",
      callbackURL: RUTA_PANEL,
      errorCallbackURL: RUTA_REGISTRO,
      requestSignUp: true,
      additionalData: { invitacion: hash },
      disableRedirect: true,
    },
    headers: await headers(),
  });
  if (!url) return { ok: false, error: "inesperado" };
  redirect(url);
}
