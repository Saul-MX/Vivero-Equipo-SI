"use server";

import { refresh, updateTag } from "next/cache";
import { z } from "zod";
import { requerirUsuario } from "@/lib/auth/sesion";
import { ETIQUETA_CATALOGOS, ETIQUETA_TEMPORADAS } from "@/lib/catalogo/etiquetas";
import { erroresDeCampos, type ResultadoAccion } from "@/lib/resultado";
import { guardarModoTemporada, guardarTemporada } from "@/lib/temporadas/temporadas";
import {
  esquemaModoTemporada,
  esquemaTemporada,
  type EntradaModoTemporada,
  type EntradaTemporada,
} from "@/lib/validacion/temporada";

function renovar() {
  updateTag(ETIQUETA_TEMPORADAS);
  updateTag(ETIQUETA_CATALOGOS);
  refresh();
}

export async function guardarModoAccion(
  entrada: EntradaModoTemporada,
): Promise<ResultadoAccion<keyof EntradaModoTemporada>> {
  await requerirUsuario();
  const validacion = esquemaModoTemporada.safeParse(entrada);
  if (!validacion.success) {
    return { ok: false, error: "revisaCampos", campos: erroresDeCampos(validacion.error) };
  }
  const resultado = await guardarModoTemporada(validacion.data);
  if (!resultado.ok) return { ok: false, error: "noEncontrado" };
  renovar();
  return { ok: true };
}

export async function guardarTemporadaAccion(
  id: number,
  entrada: EntradaTemporada,
): Promise<ResultadoAccion<keyof EntradaTemporada>> {
  await requerirUsuario();
  const idValido = z.number().int().positive().parse(id);
  const validacion = esquemaTemporada.safeParse(entrada);
  if (!validacion.success) {
    return { ok: false, error: "revisaCampos", campos: erroresDeCampos(validacion.error) };
  }
  const resultado = await guardarTemporada(idValido, validacion.data);
  if (!resultado.ok) return { ok: false, error: "noEncontrado" };
  renovar();
  return { ok: true };
}
