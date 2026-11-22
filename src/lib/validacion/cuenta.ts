import { z } from "zod";

// Reglas de los formularios de acceso. Se usan en el navegador (para avisar al momento)
// y otra vez en el servidor (que es el que manda: nunca se confía en lo que llega del navegador).
// Los mensajes son claves de traducción de la sección «errores» de messages/es-MX.json.

const usuarioNuevo = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "usuarioCorto")
  .max(30, "usuarioLargo")
  .regex(/^[a-z0-9._-]+$/, "usuarioFormato")
  // El usuario también forma su correo interno (usuario@cuentas.vivero.invalid), y un correo no puede
  // empezar ni terminar con punto ni llevar dos seguidos.
  .refine(esUsuarioConPuntosValidos, "usuarioPuntos");

/** Misma regla en el formulario y en better-auth (auth.ts). */
export function esUsuarioConPuntosValidos(usuario: string): boolean {
  return !usuario.startsWith(".") && !usuario.endsWith(".") && !usuario.includes("..");
}

const contrasenaNueva = z
  .string()
  .min(8, "contrasenaCorta")
  .max(128, "contrasenaLarga");

export const esquemaIngreso = z.object({
  usuario: z.string().trim().toLowerCase().min(1, "usuarioRequerido").max(30, "usuarioLargo"),
  contrasena: z.string().min(1, "contrasenaRequerida").max(128, "contrasenaLarga"),
});

const codigoInvitacion = z.string().trim().min(1, "codigoRequerido").max(64, "codigoInvalido");

/** Registro con Google: solo se pide el código; el nombre y el correo los da Google. */
export const esquemaRegistroGoogle = z.object({ codigo: codigoInvitacion });

export const esquemaRegistro = z
  .object({
    codigo: codigoInvitacion,
    usuario: usuarioNuevo,
    contrasena: contrasenaNueva,
    repetirContrasena: z.string().min(1, "repetirRequerida"),
  })
  .refine((datos) => datos.contrasena === datos.repetirContrasena, {
    error: "contrasenasNoCoinciden",
    path: ["repetirContrasena"],
  });

export const esquemaCambioContrasena = z
  .object({
    actual: z.string().min(1, "contrasenaActualRequerida").max(128, "contrasenaLarga"),
    nueva: contrasenaNueva,
    repetir: z.string().min(1, "repetirRequerida"),
  })
  .refine((datos) => datos.nueva === datos.repetir, {
    error: "contrasenasNoCoinciden",
    path: ["repetir"],
  })
  .refine((datos) => datos.nueva !== datos.actual, {
    error: "contrasenaIgualActual",
    path: ["nueva"],
  });

export type DatosIngreso = z.infer<typeof esquemaIngreso>;
export type DatosRegistro = z.infer<typeof esquemaRegistro>;
export type DatosRegistroGoogle = z.infer<typeof esquemaRegistroGoogle>;
export type DatosCambioContrasena = z.infer<typeof esquemaCambioContrasena>;
