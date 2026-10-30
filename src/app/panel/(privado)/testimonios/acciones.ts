"use server";

import { refresh, updateTag } from "next/cache";
import { z } from "zod";
import { ETIQUETA_TESTIMONIOS } from "@/lib/apartados/etiquetas";
import {
  cambiarVisibleTestimonio,
  eliminarTestimonio,
  guardarTestimonio,
  moverTestimonio,
} from "@/lib/apartados/testimonios";
import { requerirUsuario } from "@/lib/auth/sesion";
import { erroresDeCampos, type ResultadoAccion } from "@/lib/resultado";
import { esquemaTestimonio, type EntradaTestimonio } from "@/lib/validacion/testimonio";

const esquemaId = z.number().int().positive();

function renovar() {
  updateTag(ETIQUETA_TESTIMONIOS);
  refresh();
}

export async function guardarTestimonioAccion(
  entrada: EntradaTestimonio,
  id: number | null,
): Promise<ResultadoAccion<keyof EntradaTestimonio>> {
  await requerirUsuario();
  const idValido = esquemaId.nullable().parse(id);
  const validacion = esquemaTestimonio.safeParse(entrada);
  if (!validacion.success) {
    return { ok: false, error: "revisaCampos", campos: erroresDeCampos(validacion.error) };
  }
  const resultado = await guardarTestimonio(validacion.data, idValido);
  if (!resultado.ok) return { ok: false, error: resultado.error };
  renovar();
  return { ok: true };
}

export async function cambiarVisibleTestimonioAccion(id: number, visible: boolean): Promise<void> {
  await requerirUsuario();
  await cambiarVisibleTestimonio(esquemaId.parse(id), z.boolean().parse(visible));
  renovar();
}

export async function eliminarTestimonioAccion(id: number): Promise<boolean> {
  await requerirUsuario();
  const eliminado = await eliminarTestimonio(esquemaId.parse(id));
  renovar();
  return eliminado;
}

export async function moverTestimonioAccion(id: number, direccion: "subir" | "bajar"): Promise<void> {
  await requerirUsuario();
  await moverTestimonio(esquemaId.parse(id), z.enum(["subir", "bajar"]).parse(direccion));
  renovar();
}
