"use server";

import { refresh, updateTag } from "next/cache";
import { z } from "zod";
import { requerirUsuario } from "@/lib/auth/sesion";
import {
  cambiarVisibleCatalogo,
  eliminarCatalogo,
  guardarCatalogo,
  moverCatalogo,
  type ResultadoEliminarCatalogo,
} from "@/lib/catalogo/catalogos";
import { ETIQUETA_CATALOGOS, ETIQUETA_TEMPORADAS } from "@/lib/catalogo/etiquetas";
import { erroresDeCampos, type ResultadoAccion } from "@/lib/resultado";
import { esquemaCatalogo, type EntradaCatalogo } from "@/lib/validacion/catalogo";

const esquemaId = z.number().int().positive();

function renovarCaches() {
  updateTag(ETIQUETA_CATALOGOS);
  updateTag(ETIQUETA_TEMPORADAS);
}

export async function moverCatalogoAccion(id: number, direccion: "subir" | "bajar"): Promise<void> {
  await requerirUsuario();
  await moverCatalogo(esquemaId.parse(id), z.enum(["subir", "bajar"]).parse(direccion));
  renovarCaches();
  refresh();
}

export async function cambiarVisibleCatalogoAccion(id: number, visible: boolean): Promise<void> {
  await requerirUsuario();
  await cambiarVisibleCatalogo(esquemaId.parse(id), z.boolean().parse(visible));
  renovarCaches();
  refresh();
}

export async function guardarCatalogoAccion(
  entrada: EntradaCatalogo,
  id: number | null,
): Promise<ResultadoAccion<keyof EntradaCatalogo, { id: number }>> {
  await requerirUsuario();
  const idValido = esquemaId.nullable().parse(id);
  const validacion = esquemaCatalogo.safeParse(entrada);
  if (!validacion.success) {
    return { ok: false, error: "revisaCampos", campos: erroresDeCampos(validacion.error) };
  }

  const resultado = await guardarCatalogo(validacion.data, idValido);
  if (!resultado.ok) return { ok: false, error: resultado.error };
  renovarCaches();
  return { ok: true, id: resultado.id };
}

export async function eliminarCatalogoAccion(id: number): Promise<ResultadoEliminarCatalogo> {
  await requerirUsuario();
  const resultado = await eliminarCatalogo(esquemaId.parse(id));
  if (resultado.ok) {
    renovarCaches();
    refresh();
  }
  return resultado;
}
