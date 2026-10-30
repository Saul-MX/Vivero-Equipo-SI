import "server-only";
import { getLocale, getTranslations } from "next-intl/server";
import { nombreMes } from "./meses";
import type { EstadoTemporadas } from "./temporadas";

/** «Ahora se ve: Cempasúchil (Octubre)», «… (forzada)» o «… (fijo)». */
export async function textoTemporadaActual({ vigente, motivo, mes }: EstadoTemporadas): Promise<string> {
  const t = await getTranslations("panel.temporadas");
  if (!vigente) return t("ningunaSeVe");
  const detalle =
    motivo === "forzada"
      ? t("detalle.forzada")
      : motivo === "fija"
        ? t("detalle.fija")
        : nombreMes(mes, await getLocale());
  return t("ahoraSeVe", { temporada: vigente.catalogo.nombre, detalle });
}
