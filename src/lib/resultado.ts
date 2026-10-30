import type { ZodError } from "zod";
import mensajes from "../../messages/es-MX.json";

/** Clave de un mensaje de error traducible (sección «errores» de messages/es-MX.json). */
export type ClaveError = keyof (typeof mensajes)["errores"];

/**
 * Lo que devuelve una acción del servidor a un formulario.
 * Los errores viajan como claves de traducción; el formulario los muestra en el idioma del sitio.
 * `Extra` son datos que la acción devuelve al salir bien (por ejemplo, la lista ya guardada).
 */
export type ResultadoAccion<Campo extends string = string, Extra extends object = object> =
  | ({ ok: true } & Extra)
  | {
      ok: false;
      error?: ClaveError;
      minutos?: number;
      campos?: Partial<Record<Campo, ClaveError>>;
    };

function esClaveError(valor: string): valor is ClaveError {
  return valor in mensajes.errores;
}

/**
 * Convierte los errores de Zod en { campo: claveDeError }, uno por campo.
 * En listas, el campo lleva su posición: «colores.2.nombre».
 */
export function erroresDeCampos<Campo extends string>(
  error: ZodError,
): Partial<Record<Campo, ClaveError>> {
  const campos: Partial<Record<string, ClaveError>> = {};
  for (const problema of error.issues) {
    const campo = problema.path.map(String).join(".");
    if (campo && !campos[campo]) {
      campos[campo] = esClaveError(problema.message) ? problema.message : "inesperado";
    }
  }
  return campos as Partial<Record<Campo, ClaveError>>;
}
