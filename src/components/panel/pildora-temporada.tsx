"use client";

import { useLocale, useTranslations } from "next-intl";
import type { TemporadaResumen } from "@/lib/catalogo/catalogos";
import { nombreMes } from "@/lib/temporadas/meses";
import { cn } from "@/lib/utils";

/** Texto del rango de una temporada: «Noviembre a diciembre», «Todo el año» o «Sin temporada». */
export function useTextoTemporada() {
  const t = useTranslations("panel.catalogos");
  const idioma = useLocale();
  return (temporada: Pick<TemporadaResumen, "mesInicio" | "mesFin" | "todoElAnio"> | null) => {
    if (!temporada) return t("sinTemporada");
    if (temporada.todoElAnio) return t("todoElAnio");
    if (temporada.mesInicio === temporada.mesFin) return nombreMes(temporada.mesInicio, idioma);
    return t("rango", {
      inicio: nombreMes(temporada.mesInicio, idioma),
      fin: nombreMes(temporada.mesFin, idioma, { mayuscula: false }),
    });
  };
}

export function PildoraTemporada({ temporada }: { temporada: TemporadaResumen | null }) {
  const t = useTranslations("panel.catalogos");
  const texto = useTextoTemporada();

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium",
        temporada ? "bg-secondary text-pino" : "bg-muted text-texto-suave",
      )}
    >
      {texto(temporada)}
      {temporada && !temporada.visible && ` ${t("oculta")}`}
    </span>
  );
}
