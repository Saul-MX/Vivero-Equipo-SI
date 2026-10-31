// Claves de los archivos subidos («plantas/<uuid>») y sus direcciones públicas.
// Sin dependencias de servidor: se usa también en el navegador para mostrar las fotos.

export const CARPETAS = [
  "catalogos",
  "plantas",
  "fertilizantes",
  "folletos",
  "anuncios",
  "nosotros",
  "testimonios",
  "novedades",
] as const;
export type Carpeta = (typeof CARPETAS)[number];
export type TipoArchivo = "imagen" | "pdf" | "video";

const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
// Los videos llevan su formato en la clave («anuncios/<uuid>.mp4»); fotos y PDF, no.
const EXTENSION_VIDEO = "\\.(?:mp4|webm)";
const PATRON_CLAVE = new RegExp(`^(temporal|${CARPETAS.join("|")})/${UUID}(${EXTENSION_VIDEO})?$`);
const PATRON_TEMPORAL = new RegExp(`^temporal/${UUID}(${EXTENSION_VIDEO})?$`);
const PATRON_VIDEO = new RegExp(`${EXTENSION_VIDEO}$`);

/** Archivo servido por /archivos/…: carpeta, uuid y variante (-g.webp grande, -t.webp tarjeta, .pdf, video). */
export const PATRON_ARCHIVO_PUBLICO = new RegExp(
  `^(temporal|${CARPETAS.join("|")})/(${UUID})(-g\\.webp|-t\\.webp|\\.pdf|\\.mp4|\\.webm)$`,
);

export const esClaveValida = (clave: string) => PATRON_CLAVE.test(clave);
export const esClaveTemporal = (clave: string) => PATRON_TEMPORAL.test(clave);
export const esClaveVideo = (clave: string) => PATRON_VIDEO.test(clave);

/** Archivos en disco que forman cada clave (una foto se guarda en dos tamaños). */
export function sufijosDe(tipo: TipoArchivo): string[] {
  if (tipo === "imagen") return ["-g.webp", "-t.webp"];
  return tipo === "pdf" ? [".pdf"] : [""];
}

/** Dirección pública de una imagen: «grande» para fichas y portadas, «tarjeta» para listas. */
export function urlImagen(clave: string, tamano: "grande" | "tarjeta" = "grande"): string {
  return `/archivos/${clave}${tamano === "grande" ? "-g" : "-t"}.webp`;
}

export function urlPdf(clave: string): string {
  return `/archivos/${clave}.pdf`;
}

export function urlVideo(clave: string): string {
  return `/archivos/${clave}`;
}
