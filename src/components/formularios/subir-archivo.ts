"use client";

import type { ResultadoSubida } from "@/app/panel/subir/route";

// Revisión rápida en el navegador antes de subir; el servidor (/panel/subir) vuelve a revisar todo.

export type { ResultadoSubida };

export const MAXIMO_BYTES = 15 * 1024 * 1024;
export const MAXIMO_BYTES_VIDEO = 40 * 1024 * 1024;
export const TIPOS_IMAGEN = ["image/jpeg", "image/png", "image/webp"];
export const ACEPTA_IMAGEN = "image/jpeg,image/png,image/webp";
export const ACEPTA_IMAGEN_ANUNCIO = `${ACEPTA_IMAGEN},image/gif`;
export const ACEPTA_VIDEO = "video/mp4,video/webm";

export type TipoSubida = "imagen" | "imagenAnuncio" | "pdf" | "video";

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
