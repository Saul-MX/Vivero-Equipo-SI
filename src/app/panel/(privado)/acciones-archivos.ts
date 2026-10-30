"use server";

import { z } from "zod";
import {
  guardarImagenTemporal,
  guardarPdfTemporal,
  guardarVideoTemporal,
  MAXIMO_BYTES,
  MAXIMO_BYTES_VIDEO,
} from "@/lib/archivos/almacen";
import { requerirUsuario } from "@/lib/auth/sesion";
import type { ClaveError } from "@/lib/resultado";

// Subida de archivos del panel: uno por envío (así ninguno pasa del límite por petición).
// El archivo queda en «temporal/» hasta que se guarda el formulario que lo usa.

export type ResultadoSubida =
  | { ok: true; clave: string; ancho?: number; alto?: number }
  | { ok: false; error: ClaveError };

async function leerArchivo(datos: FormData, maximo = MAXIMO_BYTES): Promise<Buffer | ClaveError> {
  const archivo = datos.get("archivo");
  if (!(archivo instanceof File) || archivo.size === 0) return "archivoRequerido";
  if (archivo.size > maximo) return maximo === MAXIMO_BYTES_VIDEO ? "videoGrande" : "archivoGrande";
  return Buffer.from(await archivo.arrayBuffer());
}

export async function subirImagen(datos: FormData, perfil: "normal" | "anuncio" = "normal"): Promise<ResultadoSubida> {
  await requerirUsuario();
  const perfilValido = z.enum(["normal", "anuncio"]).parse(perfil);
  const contenido = await leerArchivo(datos);
  if (typeof contenido === "string") return { ok: false, error: contenido };

  const imagen = await guardarImagenTemporal(contenido, perfilValido);
  if (!imagen) return { ok: false, error: perfilValido === "anuncio" ? "imagenAnuncioInvalida" : "imagenInvalida" };
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

export async function subirVideo(datos: FormData): Promise<ResultadoSubida> {
  await requerirUsuario();
  const contenido = await leerArchivo(datos, MAXIMO_BYTES_VIDEO);
  if (typeof contenido === "string") return { ok: false, error: contenido };

  const clave = await guardarVideoTemporal(contenido);
  if (!clave) return { ok: false, error: "videoInvalido" };
  return { ok: true, clave };
}
