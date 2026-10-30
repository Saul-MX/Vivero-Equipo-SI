"use client";

import { subirImagen, subirPdf, type ResultadoSubida } from "@/app/panel/(privado)/acciones-archivos";

// Revisión rápida en el navegador antes de subir (el servidor vuelve a revisar todo).

export const MAXIMO_BYTES = 15 * 1024 * 1024;
export const TIPOS_IMAGEN = ["image/jpeg", "image/png", "image/webp"];
export const ACEPTA_IMAGEN = "image/jpeg,image/png,image/webp";

export async function subirArchivo(archivo: File, tipo: "imagen" | "pdf"): Promise<ResultadoSubida> {
  if (archivo.size > MAXIMO_BYTES) return { ok: false, error: "archivoGrande" };
  if (tipo === "imagen" && !TIPOS_IMAGEN.includes(archivo.type)) return { ok: false, error: "imagenInvalida" };
  if (tipo === "pdf" && archivo.type !== "application/pdf") return { ok: false, error: "pdfInvalido" };

  const datos = new FormData();
  datos.append("archivo", archivo);
  try {
    return await (tipo === "imagen" ? subirImagen(datos) : subirPdf(datos));
  } catch {
    return { ok: false, error: "subidaFallida" };
  }
}
