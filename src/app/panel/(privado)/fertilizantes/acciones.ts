"use server";

import { refresh, updateTag } from "next/cache";
import { z } from "zod";
import { requerirUsuario } from "@/lib/auth/sesion";
import { ETIQUETA_FERTILIZANTES, ETIQUETA_PLANTAS } from "@/lib/catalogo/etiquetas";
import { cambiarVisibleFertilizante, eliminarFertilizante, guardarFertilizante } from "@/lib/catalogo/fertilizantes";
import { erroresDeCampos, type ResultadoAccion } from "@/lib/resultado";
import { esquemaFertilizante, type EntradaFertilizante } from "@/lib/validacion/fertilizante";

const esquemaId = z.number().int().positive();

function renovar() {
  updateTag(ETIQUETA_FERTILIZANTES);
  updateTag(ETIQUETA_PLANTAS); // la ficha de cada planta muestra su fertilizante recomendado
}

export async function guardarFertilizanteAccion(
  entrada: EntradaFertilizante,
  id: number | null,
): Promise<ResultadoAccion<keyof EntradaFertilizante, { id: number }>> {
  await requerirUsuario();
  const idValido = esquemaId.nullable().parse(id);
  const validacion = esquemaFertilizante.safeParse(entrada);
  if (!validacion.success) {
    return { ok: false, error: "revisaCampos", campos: erroresDeCampos(validacion.error) };
  }
  const resultado = await guardarFertilizante(validacion.data, idValido);
  if (!resultado.ok) return { ok: false, error: resultado.error };
  renovar();
  return { ok: true, id: resultado.id };
}

export async function eliminarFertilizanteAccion(id: number) {
  await requerirUsuario();
  const resultado = await eliminarFertilizante(esquemaId.parse(id));
  if (resultado.ok) renovar();
  return resultado;
}

export async function cambiarVisibleFertilizanteAccion(id: number, visible: boolean) {
  await requerirUsuario();
  await cambiarVisibleFertilizante(esquemaId.parse(id), z.boolean().parse(visible));
  renovar();
  refresh();
}
