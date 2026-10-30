// Limpieza y validación de los datos de contacto, mapa y redes.
// Funciones puras (sin base de datos): se usan en el navegador, en el servidor y en las pruebas.

const soloDigitos = (texto: string) => texto.replace(/\D/g, "");

const esDominio = (host: string, dominio: string) => host === dominio || host.endsWith(`.${dominio}`);

/** Lee una dirección web; acepta que la escriban sin «https://» y la pasa a https. */
function leerUrl(texto: string): URL | null {
  const conProtocolo = /^[a-z][a-z0-9+.-]*:/i.test(texto) ? texto : `https://${texto}`;
  let url: URL;
  try {
    url = new URL(conProtocolo);
  } catch {
    return null;
  }
  // Solo enlaces web normales: nada de «javascript:», «data:» ni contraseñas en la dirección.
  if ((url.protocol !== "https:" && url.protocol !== "http:") || url.username || url.password) {
    return null;
  }
  url.protocol = "https:";
  return url;
}

// ── WhatsApp y teléfonos ──

/** «244 123-4567» → «2441234567» (quita espacios, guiones, puntos y paréntesis). */
export function normalizarWhatsapp(texto: string): string {
  return texto.replace(/[\s\-().]/g, "");
}

export function esWhatsappValido(numero: string): boolean {
  return /^\d{10}$/.test(numero);
}

/** Enlace para abrir el chat (regla 10): https://wa.me/52 + número, con mensaje inicial opcional. */
export function crearEnlaceWhatsapp(numero: string, mensaje?: string): string {
  const base = `https://wa.me/52${numero}`;
  return mensaje ? `${base}?text=${encodeURIComponent(mensaje)}` : base;
}

/** Cada teléfono (separados con coma) debe tener entre 7 y 15 números. */
export function sonTelefonosValidos(texto: string): boolean {
  const telefonos = separarTelefonos(texto);
  return (
    telefonos.length > 0 &&
    telefonos.every((telefono) => {
      const digitos = soloDigitos(telefono).length;
      return /^[\d\s()+.-]+$/.test(telefono) && digitos >= 7 && digitos <= 15;
    })
  );
}

export function separarTelefonos(texto: string | null): string[] {
  if (!texto) return [];
  return texto
    .split(",")
    .map((telefono) => telefono.trim().replace(/\s+/g, " "))
    .filter(Boolean);
}

/** «244 761 52 53,244 122 83 37 ,» → «244 761 52 53, 244 122 83 37». */
export function normalizarTelefonos(texto: string): string {
  return separarTelefonos(texto).join(", ");
}

// ── Google Maps ──

/** Enlace para el botón «Cómo llegar»: debe ser de Google Maps. */
export function normalizarEnlaceMaps(texto: string): string | null {
  const url = leerUrl(texto.trim());
  if (!url) return null;
  const host = url.hostname.toLowerCase();
  const esGoogle = ["google.com", "google.com.mx"].some((d) => host === d || host === `www.${d}`);
  const valido =
    host === "maps.app.goo.gl" ||
    host === "maps.google.com" ||
    host === "maps.google.com.mx" ||
    (host === "goo.gl" && url.pathname.startsWith("/maps")) ||
    (esGoogle && url.pathname.startsWith("/maps"));
  return valido ? url.toString() : null;
}

const HOSTS_MAPA = [
  "www.google.com",
  "google.com",
  "maps.google.com",
  "www.google.com.mx",
  "google.com.mx",
  "maps.google.com.mx",
];

/**
 * Del código «Insertar un mapa» de Google Maps (<iframe src="…">) obtiene SOLO la dirección del mapa.
 * Todo lo demás del código pegado (atributos, scripts, etc.) se descarta. También acepta la dirección sola.
 * Devuelve null si no es un mapa de Google Maps con https. El sitio arma su propio <iframe> con este src.
 */
export function extraerSrcMapa(texto: string): string | null {
  const limpio = texto.trim();
  if (!limpio) return null;

  const etiqueta = limpio.match(/<iframe\b[^>]*?\bsrc\s*=\s*(["'])(.*?)\1/i);
  if (!etiqueta && limpio.includes("<")) return null;
  // El código que copia Google escribe los «&» como «&amp;».
  const candidato = (etiqueta ? etiqueta[2] : limpio)
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#0?39;/g, "'");

  let url: URL;
  try {
    url = new URL(candidato);
  } catch {
    return null;
  }
  const esMapaInsertable =
    url.pathname.startsWith("/maps/embed") ||
    (url.pathname === "/maps" && url.searchParams.get("output") === "embed");
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    !HOSTS_MAPA.includes(url.hostname.toLowerCase()) ||
    !esMapaInsertable
  ) {
    return null;
  }
  return url.toString();
}

// ── Redes sociales ──

export function normalizarFacebook(texto: string): string | null {
  const url = leerUrl(texto.trim());
  if (!url) return null;
  const host = url.hostname.toLowerCase();
  const esFacebook = esDominio(host, "facebook.com") || host === "fb.com" || host === "fb.me";
  if (!esFacebook || url.pathname.length <= 1) return null;
  url.hash = "";
  return url.toString();
}

/** Acepta el enlace del perfil o el usuario con arroba («@vivero») y devuelve el enlace. */
export function normalizarInstagram(texto: string): string | null {
  const limpio = texto.trim();
  const usuario = limpio.match(/^@([A-Za-z0-9._]{1,30})$/);
  if (usuario) return `https://www.instagram.com/${usuario[1]}/`;

  const url = leerUrl(limpio);
  if (!url || !esDominio(url.hostname.toLowerCase(), "instagram.com") || url.pathname.length <= 1) {
    return null;
  }
  // Se quitan los parámetros de rastreo que agrega la app (?igsh=…).
  return `https://www.instagram.com${url.pathname}`;
}

// ── Listas de colores y macetas ──

/** Para comparar nombres como lo hace la base de datos: sin distinguir mayúsculas ni acentos. */
export function claveNombre(nombre: string): string {
  return nombre
    .trim()
    .toLocaleLowerCase("es-MX")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

/** Posiciones de los nombres que repiten uno anterior de la lista. */
export function indicesRepetidos(nombres: string[]): number[] {
  const vistos = new Set<string>();
  const repetidos: number[] = [];
  nombres.forEach((nombre, indice) => {
    const clave = claveNombre(nombre);
    if (vistos.has(clave)) repetidos.push(indice);
    vistos.add(clave);
  });
  return repetidos;
}
