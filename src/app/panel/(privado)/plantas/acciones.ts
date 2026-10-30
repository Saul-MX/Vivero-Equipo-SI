"use server";

import { refresh, updateTag } from "next/cache";
import { z } from "zod";
import { requerirUsuario } from "@/lib/auth/sesion";
import { ETIQUETA_PLANTAS } from "@/lib/catalogo/etiquetas";
import {
  cambiarDisponiblePlanta,
  cambiarMostrarDisponibilidad,
  cambiarVisiblePlanta,
  eliminarPlanta,
  guardarPlanta,
} from "@/lib/catalogo/plantas";
import { erroresDeCampos, type ResultadoAccion } from "@/lib/resultado";
import { esquemaPlanta, type EntradaPlanta } from "@/lib/validacion/planta";

const esquemaId = z.number().int().positive();

export async function guardarPlantaAccion(
  entrada: EntradaPlanta,
  id: number | null,
): Promise<ResultadoAccion<keyof EntradaPlanta, { id: number }>> {
  await requerirUsuario();
  const idValido = esquemaId.nullable().parse(id);
  const validacion = esquemaPlanta.safeParse(entrada);
  if (!validacion.success) {
    return { ok: false, error: "revisaCampos", campos: erroresDeCampos(validacion.error) };
  }

  const resultado = await guardarPlanta(validacion.data, idValido);
  if (!resultado.ok) {
    if (resultado.error === "catalogoRequerido") return { ok: false, campos: { catalogoId: "catalogoRequerido" } };
    return { ok: false, error: resultado.error };
  }
  updateTag(ETIQUETA_PLANTAS);
  return { ok: true, id: resultado.id };
}

export async function eliminarPlantaAccion(id: number) {
  await requerirUsuario();
  const resultado = await eliminarPlanta(esquemaId.parse(id));
  if (resultado.ok) updateTag(ETIQUETA_PLANTAS);
  return resultado;
}

export async function cambiarVisiblePlantaAccion(id: number, visible: boolean) {
  await requerirUsuario();
  await cambiarVisiblePlanta(esquemaId.parse(id), z.boolean().parse(visible));
  updateTag(ETIQUETA_PLANTAS);
  refresh();
}

export async function cambiarDisponiblePlantaAccion(id: number, disponible: boolean) {
  await requerirUsuario();
  await cambiarDisponiblePlanta(esquemaId.parse(id), z.boolean().parse(disponible));
  updateTag(ETIQUETA_PLANTAS);
  refresh();
}

export async function cambiarMostrarDisponibilidadAccion(mostrar: boolean) {
  await requerirUsuario();
  await cambiarMostrarDisponibilidad(z.boolean().parse(mostrar));
  updateTag(ETIQUETA_PLANTAS);
  refresh();
}
