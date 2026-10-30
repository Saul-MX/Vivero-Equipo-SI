"use client";

import { useTranslations } from "next-intl";

type Traducir = (clave: string, valores?: Record<string, string | number>) => string;

/**
 * Convierte una clave de error (de Zod o de una acción del servidor) en el texto del idioma actual.
 * Si la clave no existe, muestra el mensaje genérico en lugar de una clave rara.
 */
export function useTraductorErrores() {
  const t = useTranslations("errores");
  const traducir = t as unknown as Traducir;

  return (clave?: string, valores?: Record<string, string | number>) => {
    if (!clave) return undefined;
    return t.has(clave as Parameters<typeof t.has>[0]) ? traducir(clave, valores) : t("inesperado");
  };
}
