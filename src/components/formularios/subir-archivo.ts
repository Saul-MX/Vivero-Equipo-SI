"use client";

import type { ResultadoSubida } from "@/app/panel/subir/route";
import { MARCAS_DE_IMAGEN } from "@/lib/archivos/claves";

// Revisión rápida en el navegador antes de subir; el servidor (/panel/subir) vuelve a revisar todo.

export type { ResultadoSubida };

export const MAXIMO_BYTES = 15 * 1024 * 1024;
export const MAXIMO_BYTES_VIDEO = 40 * 1024 * 1024;
export const TIPOS_IMAGEN = ["image/jpeg", "image/png", "image/webp"];
export const ACEPTA_IMAGEN = "image/jpeg,image/png,image/webp";
export const ACEPTA_IMAGEN_ANUNCIO = `${ACEPTA_IMAGEN},image/gif`;
export const ACEPTA_VIDEO = "video/mp4,video/webm";

export type TipoSubida = "imagen" | "imagenAnuncio" | "pdf" | "video";

const ERROR_FORMATO = {
  imagen: "imagenInvalida",
  imagenAnuncio: "imagenAnuncioInvalida",
  pdf: "pdfInvalido",
  video: "videoInvalido",
} as const;

/**
 * Revisa los primeros bytes del archivo (su «firma»): un texto renombrado a .jpg o un SVG con
 * nombre .png se rechaza aquí mismo, sin enviarlo. El servidor revisa el archivo completo.
 */
async function tieneFirmaValida(archivo: File, tipo: TipoSubida): Promise<boolean> {
  let b: Uint8Array;
  try {
    b = new Uint8Array(await archivo.slice(0, 12).arrayBuffer());
  } catch {
    return true; // si el navegador no lo puede leer, decide el servidor
  }
  const texto = (inicio: number, fin: number) => String.fromCharCode(...b.subarray(inicio, fin));
  const jpg = b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
  const png = b[0] === 0x89 && texto(1, 4) === "PNG";
  const webp = texto(0, 4) === "RIFF" && texto(8, 12) === "WEBP";
  if (tipo === "imagen") return jpg || png || webp;
  if (tipo === "imagenAnuncio") return jpg || png || webp || texto(0, 4) === "GIF8";
  if (tipo === "pdf") return texto(0, 5) === "%PDF-";
  const webm = b[0] === 0x1a && b[1] === 0x45 && b[2] === 0xdf && b[3] === 0xa3;
  return webm || (texto(4, 8) === "ftyp" && !MARCAS_DE_IMAGEN.includes(texto(8, 12)));
}

export async function subirArchivo(archivo: File, tipo: TipoSubida): Promise<ResultadoSubida> {
  if (tipo === "video") {
    if (archivo.size > MAXIMO_BYTES_VIDEO) return { ok: false, error: "videoGrande" };
    if (!ACEPTA_VIDEO.split(",").includes(archivo.type)) return { ok: false, error: "videoInvalido" };
  } else {
    if (archivo.size > MAXIMO_BYTES) return { ok: false, error: "archivoGrande" };
    if (tipo === "imagen" && !TIPOS_IMAGEN.includes(archivo.type)) return { ok: false, error: "imagenInvalida" };
    if (tipo === "imagenAnuncio" && !ACEPTA_IMAGEN_ANUNCIO.split(",").includes(archivo.type)) {
      return { ok: false, error: "imagenAnuncioInvalida" };
    }
    if (tipo === "pdf" && archivo.type !== "application/pdf") return { ok: false, error: "pdfInvalido" };
  }
  // Un archivo vacío tampoco tiene firma: sale «Ese archivo no es una foto…», no «Elige un archivo».
  if (!(await tieneFirmaValida(archivo, tipo))) return { ok: false, error: ERROR_FORMATO[tipo] };

  const datos = new FormData();
  datos.append("archivo", archivo);
  try {
    const respuesta = await fetch(`/panel/subir?tipo=${tipo}`, {
      method: "POST",
      body: datos,
      // Encabezado propio del panel: un sitio ajeno no lo puede enviar (protección contra CSRF).
      headers: { "x-vivero-subida": "1" },
    });
    if (respuesta.headers.get("content-type")?.includes("application/json")) {
      return (await respuesta.json()) as ResultadoSubida;
    }
    return { ok: false, error: respuesta.status === 401 ? "sesionVencida" : "subidaFallida" };
  } catch {
    return { ok: false, error: "subidaFallida" };
  }
}
