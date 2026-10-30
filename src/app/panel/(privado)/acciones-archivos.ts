"use server";

import { guardarImagenTemporal, guardarPdfTemporal, MAXIMO_BYTES } from "@/lib/archivos/almacen";
import { requerirUsuario } from "@/lib/auth/sesion";
import type { ClaveError } from "@/lib/resultado";

// Subida de archivos del panel: uno por envío (así ninguno pasa del límite de 16 MB por petición).
// El archivo queda en «temporal/» hasta que se guarda el formulario que lo usa.

export type ResultadoSubida =
  | { ok: true; clave: string; ancho?: number; alto?: number }
  | { ok: false; error: ClaveError };

async function leerArchivo(datos: FormData): Promise<Buffer | ClaveError> {
  const archivo = datos.get("archivo");
  if (!(archivo instanceof File) || archivo.size === 0) return "archivoRequerido";
  if (archivo.size > MAXIMO_BYTES) return "archivoGrande";
  return Buffer.from(await archivo.arrayBuffer());
}

export async function subirImagen(datos: FormData): Promise<ResultadoSubida> {
  await requerirUsuario();
  const contenido = await leerArchivo(datos);
  if (typeof contenido === "string") return { ok: false, error: contenido };

  const imagen = await guardarImagenTemporal(contenido);
  if (!imagen) return { ok: false, error: "imagenInvalida" };
  return { ok: true, ...imagen };
}

export async function subirPdf(datos: FormData): Promise<ResultadoSubida> {
  await requerirUsuario();
  const contenido = await leerArchivo(datos);
  if (typeof contenido === "string") return { ok: false, error: contenido };

  const clave = await guardarPdfTemporal(contenido);
  if (!clave) return { ok: false, error: "pdfInvalido" };
  return { ok: true, clave };
}
