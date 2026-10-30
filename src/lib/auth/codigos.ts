// Códigos de invitación: generación, normalización y comparación segura.
// Funciones puras (sin base de datos) para poder probarlas por separado.
import { createHash, randomInt, timingSafeEqual } from "node:crypto";

// Sin caracteres que se confundan al dictarlos o copiarlos a mano (0/O, 1/I).
const ALFABETO = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const LARGO = 12;

/** El código inicial del .env debe tener al menos 12 letras o números para aceptarse. */
export const LARGO_MINIMO_CODIGO_INICIAL = 12;

/** Genera un código con el formato «K7QH-M2ZD-9RXA» (60 bits de azar). */
export function generarCodigo(): string {
  let codigo = "";
  for (let i = 0; i < LARGO; i++) {
    if (i > 0 && i % 4 === 0) codigo += "-";
    codigo += ALFABETO[randomInt(ALFABETO.length)];
  }
  return codigo;
}

/** Acepta el código como lo escriban: sin importar mayúsculas, espacios ni guiones. */
export function normalizarCodigo(codigo: string): string {
  return codigo.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

/** En la base de datos solo se guarda este hash, nunca el código. */
export function hashCodigo(codigo: string): string {
  return createHash("sha256").update(normalizarCodigo(codigo)).digest("hex");
}

/** Compara contra el código inicial del .env en tiempo constante (no filtra pistas por tiempo). */
export function esCodigoInicial(ingresado: string, configurado: string | undefined): boolean {
  if (!configurado || normalizarCodigo(configurado).length < LARGO_MINIMO_CODIGO_INICIAL) {
    return false;
  }
  const a = Buffer.from(hashCodigo(ingresado), "hex");
  const b = Buffer.from(hashCodigo(configurado), "hex");
  return timingSafeEqual(a, b);
}
