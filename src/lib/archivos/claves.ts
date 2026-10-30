// Claves de los archivos subidos («plantas/<uuid>») y sus direcciones públicas.
// Sin dependencias de servidor: se usa también en el navegador para mostrar las fotos.

export const CARPETAS = ["catalogos", "plantas", "fertilizantes", "folletos"] as const;
export type Carpeta = (typeof CARPETAS)[number];
export type TipoArchivo = "imagen" | "pdf";

const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
const PATRON_CLAVE = new RegExp(`^(temporal|${CARPETAS.join("|")})/${UUID}$`);
const PATRON_TEMPORAL = new RegExp(`^temporal/${UUID}$`);

/** Archivo servido por /archivos/…: carpeta, uuid y variante (-g.webp grande, -t.webp tarjeta, .pdf). */
export const PATRON_ARCHIVO_PUBLICO = new RegExp(
  `^(temporal|${CARPETAS.join("|")})/(${UUID})(-g\\.webp|-t\\.webp|\\.pdf)$`,
);

export const esClaveValida = (clave: string) => PATRON_CLAVE.test(clave);
export const esClaveTemporal = (clave: string) => PATRON_TEMPORAL.test(clave);

export function sufijosDe(tipo: TipoArchivo): string[] {
  return tipo === "imagen" ? ["-g.webp", "-t.webp"] : [".pdf"];
}

/** Dirección pública de una imagen: «grande» para fichas y portadas, «tarjeta» para listas. */
export function urlImagen(clave: string, tamano: "grande" | "tarjeta" = "grande"): string {
  return `/archivos/${clave}${tamano === "grande" ? "-g" : "-t"}.webp`;
}

export function urlPdf(clave: string): string {
  return `/archivos/${clave}.pdf`;
}
