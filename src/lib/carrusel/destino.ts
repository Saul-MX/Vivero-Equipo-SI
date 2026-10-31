// «Lleva a» de los botones del carrusel. Se acepta:
// - una página del sitio: «/catalogos», «/contacto», «/plantas/nochebuena-roja?x=1#fotos»;
// - la palabra «whatsapp» (abre el chat con el número de «Datos y redes»);
// - una dirección completa que empiece con «https://».
// Cualquier otra cosa (http://, javascript:, mailto:, «//otro-sitio») se rechaza.

export const DESTINO_WHATSAPP = "whatsapp";

const RUTA_DEL_SITIO = /^\/(?!\/)[A-Za-z0-9\-._~/%?=&#+]*$/;

/** Devuelve el destino listo para guardar, o null si no es válido. */
export function normalizarDestino(valor: string): string | null {
  const destino = valor.trim();
  if (destino.toLowerCase() === DESTINO_WHATSAPP) return DESTINO_WHATSAPP;
  if (destino.startsWith("/")) return RUTA_DEL_SITIO.test(destino) ? destino : null;
  if (!/^https:\/\//i.test(destino)) return null;
  try {
    const url = new URL(destino);
    if (url.protocol !== "https:" || !url.hostname.includes(".") || url.username || url.password) return null;
    return url.href;
  } catch {
    return null;
  }
}

/** Enlace final de un destino ya guardado. `externo`: se abre en otra pestaña. */
export function enlaceDeDestino(
  destino: string,
  enlaceWhatsapp: string | null,
): { href: string; externo: boolean } | null {
  if (destino === DESTINO_WHATSAPP) return enlaceWhatsapp ? { href: enlaceWhatsapp, externo: true } : null;
  if (destino.startsWith("/")) return { href: destino, externo: false };
  return { href: destino, externo: true };
}
