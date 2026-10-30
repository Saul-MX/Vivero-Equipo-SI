import { getRequestConfig } from "next-intl/server";

// Por ahora el sitio solo está en español de México. Cuando llegue la versión en inglés,
// aquí se elegirá el idioma (por ejemplo, según la URL /en/...) y se agregará messages/en.json.
export const IDIOMA_PREDETERMINADO = "es-MX";

// Zona horaria del vivero: las fechas (y el cálculo de la temporada) se interpretan en hora de Puebla,
// aunque el servidor de Hostinger esté en otra zona.
export const ZONA_HORARIA = "America/Mexico_City";

export default getRequestConfig(async () => {
  const locale = IDIOMA_PREDETERMINADO;
  return {
    locale,
    timeZone: ZONA_HORARIA,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
