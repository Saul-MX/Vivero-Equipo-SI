import { z } from "zod";
import { esClaveValida } from "@/lib/archivos/claves";
import type { ClaveError } from "@/lib/resultado";

// Piezas de validación que comparten varios formularios del panel.

export const texto = (maximo: number) => z.string().trim().max(maximo, "textoLargo");
export const requerido = (clave: ClaveError, maximo: number) => texto(maximo).min(1, clave);

export const esquemaTono = z
  .string()
  .trim()
  .regex(/^#[0-9a-fA-F]{6}$/, "colorTonoInvalido")
  .transform((valor) => valor.toUpperCase());

/** Clave de un archivo subido («temporal/…» o ya guardado), o null si no hay archivo. */
export const esquemaArchivo = z.string().refine(esClaveValida, "archivoNoEncontrado").nullable();

/** Mes elegido en una lista: llega como texto «1» … «12» y se guarda como número. */
export const esquemaMes = z
  .string()
  .regex(/^(1[0-2]|[1-9])$/, "mesInvalido")
  .transform(Number);
