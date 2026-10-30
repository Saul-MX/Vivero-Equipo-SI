import type { ZodError } from "zod";
import mensajes from "../../messages/es-MX.json";

/** Clave de un mensaje de error traducible (sección «errores» de messages/es-MX.json). */
export type ClaveError = keyof (typeof mensajes)["errores"];

/**
 * Lo que devuelve una acción del servidor a un formulario.
 * Los errores viajan como claves de traducción; el formulario los muestra en el idioma del sitio.
 */
export type ResultadoAccion<Campo extends string = string> =
  | { ok: true }
  | {
      ok: false;
      error?: ClaveError;
      minutos?: number;
      campos?: Partial<Record<Campo, ClaveError>>;
    };

function esClaveError(valor: string): valor is ClaveError {
  return valor in mensajes.errores;
}

/** Convierte los errores de Zod en { campo: claveDeError }, uno por campo. */
export function erroresDeCampos<Campo extends string>(
  error: ZodError,
): Partial<Record<Campo, ClaveError>> {
  const campos: Partial<Record<string, ClaveError>> = {};
  for (const problema of error.issues) {
    const campo = String(problema.path[0] ?? "");
    if (campo && !campos[campo]) {
      campos[campo] = esClaveError(problema.message) ? problema.message : "inesperado";
    }
  }
  return campos as Partial<Record<Campo, ClaveError>>;
}
