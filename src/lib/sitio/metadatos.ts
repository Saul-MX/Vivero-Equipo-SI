import type { Metadata } from "next";
import { urlImagen } from "@/lib/archivos/claves";

// Título, descripción, dirección canónica y Open Graph (cómo se ve el enlace al compartirlo
// en WhatsApp, Facebook, etc.) de cada página del sitio.

/** Dirección pública del sitio (en Hostinger, el dominio). Sirve para los enlaces absolutos. */
export function urlDelSitio(): URL {
  try {
    return new URL(process.env.SITIO_URL || "http://localhost:3000");
  } catch {
    return new URL("http://localhost:3000");
  }
}

export const OPEN_GRAPH_COMUN = { siteName: "Vivero El Encanto", locale: "es_MX", type: "website" } as const;

export function metadatosPagina({
  titulo,
  descripcion,
  ruta,
  imagen,
  tituloCompleto = false,
}: {
  titulo: string;
  descripcion: string;
  ruta: string;
  /** Clave de una foto subida desde el panel (portada de catálogo, foto de planta, …). */
  imagen?: string | null;
  /** true en Inicio: el título ya es el completo, sin «· Vivero El Encanto». */
  tituloCompleto?: boolean;
}): Metadata {
  const imagenes = imagen ? [{ url: urlImagen(imagen), alt: titulo }] : undefined;
  return {
    title: tituloCompleto ? { absolute: titulo } : titulo,
    description: descripcion,
    alternates: { canonical: ruta },
    openGraph: { ...OPEN_GRAPH_COMUN, title: titulo, description: descripcion, url: ruta, images: imagenes },
    twitter: { card: imagen ? "summary_large_image" : "summary", title: titulo, description: descripcion },
  };
}

/** Recorta un texto largo para la descripción (los buscadores muestran ~155 letras). */
export function resumen(texto: string | null | undefined, porDefecto: string): string {
  const limpio = (texto ?? "").replace(/\s+/g, " ").trim();
  if (!limpio) return porDefecto;
  return limpio.length <= 155 ? limpio : `${limpio.slice(0, 152).replace(/\s+\S*$/, "")}…`;
}
