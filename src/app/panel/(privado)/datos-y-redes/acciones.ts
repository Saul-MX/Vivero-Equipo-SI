"use server";

import { updateTag } from "next/cache";
import { z } from "zod";
import { requerirUsuario } from "@/lib/auth/sesion";
import { ETIQUETA_PLANTAS } from "@/lib/catalogo/etiquetas";
import { ETIQUETA_DATOS_NEGOCIO, guardarDatosNegocio } from "@/lib/datos-negocio/datos";
import {
  eliminarColor,
  eliminarMaceta,
  guardarColores,
  guardarMacetas,
  listarColoresConUso,
  listarMacetasConUso,
  type ColorConUso,
  type MacetaConUso,
  type ResultadoEliminar,
} from "@/lib/datos-negocio/opciones-planta";
import { erroresDeCampos, type ResultadoAccion } from "@/lib/resultado";
import {
  esquemaColores,
  esquemaDatosNegocio,
  esquemaMacetas,
  type DatosNegocioValidados,
  type EntradaColores,
  type EntradaDatosNegocio,
  type EntradaMacetas,
} from "@/lib/validacion/datos-negocio";

const esquemaId = z.number().int().positive();

export async function guardarDatos(
  entrada: EntradaDatosNegocio,
): Promise<ResultadoAccion<keyof EntradaDatosNegocio, { datos: DatosNegocioValidados }>> {
  await requerirUsuario();
  const validacion = esquemaDatosNegocio.safeParse(entrada);
  if (!validacion.success) {
    return { ok: false, error: "revisaCampos", campos: erroresDeCampos(validacion.error) };
  }

  await guardarDatosNegocio(validacion.data);
  // El sitio público lee estos datos de la caché: se renueva ya mismo.
  updateTag(ETIQUETA_DATOS_NEGOCIO);
  return { ok: true, datos: validacion.data };
}

export async function guardarListaColores(
  entrada: EntradaColores,
): Promise<ResultadoAccion<string, { colores: ColorConUso[] }>> {
  await requerirUsuario();
  const validacion = esquemaColores.safeParse(entrada);
  if (!validacion.success) {
    return { ok: false, error: "revisaCampos", campos: erroresDeCampos(validacion.error) };
  }

  const resultado = await guardarColores(validacion.data);
  if (!resultado.ok) return { ok: false, error: resultado.error };
  updateTag(ETIQUETA_PLANTAS); // las fichas de las plantas muestran sus colores
  return { ok: true, colores: await listarColoresConUso() };
}

export async function borrarColor(id: number): Promise<ResultadoEliminar> {
  await requerirUsuario();
  const resultado = await eliminarColor(esquemaId.parse(id));
  updateTag(ETIQUETA_PLANTAS);
  return resultado;
}

export async function guardarListaMacetas(
  entrada: EntradaMacetas,
): Promise<ResultadoAccion<string, { macetas: MacetaConUso[] }>> {
  await requerirUsuario();
  const validacion = esquemaMacetas.safeParse(entrada);
  if (!validacion.success) {
    return { ok: false, error: "revisaCampos", campos: erroresDeCampos(validacion.error) };
  }

  const resultado = await guardarMacetas(validacion.data);
  if (!resultado.ok) return { ok: false, error: resultado.error };
  updateTag(ETIQUETA_PLANTAS); // y sus tamaños de maceta
  return { ok: true, macetas: await listarMacetasConUso() };
}

export async function borrarMaceta(id: number): Promise<ResultadoEliminar> {
  await requerirUsuario();
  const resultado = await eliminarMaceta(esquemaId.parse(id));
  updateTag(ETIQUETA_PLANTAS);
  return resultado;
}
