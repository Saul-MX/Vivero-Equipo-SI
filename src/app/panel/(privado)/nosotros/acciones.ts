"use server";

import { updateTag } from "next/cache";
import { ETIQUETA_NOSOTROS } from "@/lib/apartados/etiquetas";
import { guardarNosotros, leerNosotros } from "@/lib/apartados/nosotros";
import { requerirUsuario } from "@/lib/auth/sesion";
import { erroresDeCampos, type ResultadoAccion } from "@/lib/resultado";
import { esquemaNosotros, type EntradaNosotros } from "@/lib/validacion/nosotros";

/** Guarda todo Nosotros y devuelve lo guardado (con las fotos ya en su carpeta final). */
export async function guardarNosotrosAccion(
  entrada: EntradaNosotros,
): Promise<ResultadoAccion<string, { nosotros: EntradaNosotros }>> {
  await requerirUsuario();
  const validacion = esquemaNosotros.safeParse(entrada);
  if (!validacion.success) {
    return { ok: false, error: "revisaCampos", campos: erroresDeCampos(validacion.error) };
  }
  const resultado = await guardarNosotros(validacion.data);
  if (!resultado.ok) return { ok: false, error: resultado.error };
  updateTag(ETIQUETA_NOSOTROS);
  return { ok: true, nosotros: await leerNosotros() };
}
