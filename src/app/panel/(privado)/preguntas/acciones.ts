"use server";

import { refresh, updateTag } from "next/cache";
import { z } from "zod";
import { ETIQUETA_PREGUNTAS } from "@/lib/apartados/etiquetas";
import { eliminarPregunta, guardarPregunta, moverPregunta } from "@/lib/apartados/preguntas";
import { requerirUsuario } from "@/lib/auth/sesion";
import { erroresDeCampos, type ResultadoAccion } from "@/lib/resultado";
import { esquemaPregunta, type EntradaPregunta } from "@/lib/validacion/pregunta";

const esquemaId = z.number().int().positive();

function renovar() {
  updateTag(ETIQUETA_PREGUNTAS);
  refresh();
}

export async function guardarPreguntaAccion(
  entrada: EntradaPregunta,
  id: number | null,
): Promise<ResultadoAccion<keyof EntradaPregunta>> {
  await requerirUsuario();
  const idValido = esquemaId.nullable().parse(id);
  const validacion = esquemaPregunta.safeParse(entrada);
  if (!validacion.success) {
    return { ok: false, error: "revisaCampos", campos: erroresDeCampos(validacion.error) };
  }
  if (!(await guardarPregunta(validacion.data, idValido))) return { ok: false, error: "noEncontrado" };
  renovar();
  return { ok: true };
}

export async function eliminarPreguntaAccion(id: number): Promise<boolean> {
  await requerirUsuario();
  const eliminada = await eliminarPregunta(esquemaId.parse(id));
  renovar();
  return eliminada;
}

export async function moverPreguntaAccion(id: number, direccion: "subir" | "bajar"): Promise<void> {
  await requerirUsuario();
  await moverPregunta(esquemaId.parse(id), z.enum(["subir", "bajar"]).parse(direccion));
  renovar();
}
