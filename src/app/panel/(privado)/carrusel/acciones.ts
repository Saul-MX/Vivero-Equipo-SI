"use server";

import { refresh, updateTag } from "next/cache";
import { z } from "zod";
import { ETIQUETA_ANUNCIOS } from "@/lib/apartados/etiquetas";
import { requerirUsuario } from "@/lib/auth/sesion";
import {
  cambiarVisibleAnuncio,
  eliminarAnuncio,
  eliminarArchivoCarrusel,
  guardarAnuncio,
  moverAnuncio,
} from "@/lib/carrusel/anuncios";
import { erroresDeCampos, type ResultadoAccion } from "@/lib/resultado";
import { esquemaAnuncio, type EntradaAnuncio } from "@/lib/validacion/anuncio";

const esquemaId = z.number().int().positive();

export async function guardarAnuncioAccion(
  entrada: EntradaAnuncio,
  id: number | null,
): Promise<ResultadoAccion<keyof EntradaAnuncio, { id: number }>> {
  await requerirUsuario();
  const idValido = esquemaId.nullable().parse(id);
  const validacion = esquemaAnuncio.safeParse(entrada);
  if (!validacion.success) {
    return { ok: false, error: "revisaCampos", campos: erroresDeCampos(validacion.error) };
  }
  const resultado = await guardarAnuncio(validacion.data, idValido);
  if (!resultado.ok) return { ok: false, error: resultado.error };
  updateTag(ETIQUETA_ANUNCIOS);
  return { ok: true, id: resultado.id };
}

export async function cambiarVisibleAnuncioAccion(id: number, visible: boolean): Promise<void> {
  await requerirUsuario();
  await cambiarVisibleAnuncio(esquemaId.parse(id), z.boolean().parse(visible));
  updateTag(ETIQUETA_ANUNCIOS);
  refresh();
}

export async function moverAnuncioAccion(id: number, direccion: "subir" | "bajar"): Promise<void> {
  await requerirUsuario();
  await moverAnuncio(esquemaId.parse(id), z.enum(["subir", "bajar"]).parse(direccion));
  updateTag(ETIQUETA_ANUNCIOS);
  refresh();
}

export async function eliminarAnuncioAccion(id: number): Promise<{ ok: true; titulo: string } | { ok: false }> {
  await requerirUsuario();
  const titulo = await eliminarAnuncio(esquemaId.parse(id));
  if (titulo === null) return { ok: false };
  updateTag(ETIQUETA_ANUNCIOS);
  return { ok: true, titulo };
}

export async function eliminarArchivoCarruselAccion(clave: string): Promise<"ok" | "enUso" | "noEncontrado"> {
  await requerirUsuario();
  const resultado = await eliminarArchivoCarrusel(z.string().max(200).parse(clave));
  if (resultado === "ok") refresh();
  return resultado;
}
