"use server";

import { refresh, updateTag } from "next/cache";
import { z } from "zod";
import { ETIQUETA_NOVEDADES } from "@/lib/apartados/etiquetas";
import { cambiarVisibleNovedad, guardarNovedad } from "@/lib/apartados/novedades";
import { requerirUsuario } from "@/lib/auth/sesion";
import { erroresDeCampos, type ResultadoAccion } from "@/lib/resultado";
import { esquemaNovedad, type EntradaNovedad } from "@/lib/validacion/novedad";

const esquemaId = z.number().int().positive();

export async function guardarNovedadAccion(
  entrada: EntradaNovedad,
  id: number | null,
): Promise<ResultadoAccion<keyof EntradaNovedad, { id: number }>> {
  await requerirUsuario();
  const idValido = esquemaId.nullable().parse(id);
  const validacion = esquemaNovedad.safeParse(entrada);
  if (!validacion.success) {
    return { ok: false, error: "revisaCampos", campos: erroresDeCampos(validacion.error) };
  }
  const resultado = await guardarNovedad(validacion.data, idValido);
  if (!resultado.ok) return { ok: false, error: resultado.error };
  updateTag(ETIQUETA_NOVEDADES);
  return { ok: true, id: resultado.id };
}

export async function cambiarVisibleNovedadAccion(id: number, visible: boolean): Promise<void> {
  await requerirUsuario();
  await cambiarVisibleNovedad(esquemaId.parse(id), z.boolean().parse(visible));
  updateTag(ETIQUETA_NOVEDADES);
  refresh();
}
