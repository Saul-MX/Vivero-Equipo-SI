"use client";

import { useTranslations } from "next-intl";
import { DropletsIcon } from "lucide-react";

type Props = {
  dias: string; // «» = sin dato, «1»…«6», «7» = diario
  cantidad: string; // «» o POCA | MODERADA | ABUNDANTE
  fertilizante: string | null; // nombre del fertilizante elegido
  nota: string;
};

/** «Así se ve en la ficha»: el bloque de riego tal como lo verá el visitante. */
export function VistaPreviaRiego({ dias, cantidad, fertilizante, nota }: Props) {
  const t = useTranslations("panel.plantas.formulario");
  const lineas = [
    dias === "7" ? t("diario") : dias ? t("vecesPorSemana", { n: Number(dias) }) : null,
    cantidad ? t("previaCantidad", { cantidad: t(`cantidades.${cantidad as "POCA"}`).toLowerCase() }) : null,
    fertilizante ? t("previaFertilizante", { nombre: fertilizante }) : null,
    nota.trim() || null,
  ].filter(Boolean);

  return (
    <div className="self-start rounded-2xl border border-border bg-muted/50 p-4">
      <p className="mb-3 text-xs font-semibold tracking-[0.12em] text-texto-suave uppercase">{t("vistaPrevia")}</p>
      <div data-testid="vista-previa-riego" className="flex gap-3 rounded-xl bg-card p-4">
        <span aria-hidden className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-hoja">
          <DropletsIcon className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="font-serif text-lg font-semibold text-pino">{t("previaRiego")}</p>
          {lineas.length === 0 ? (
            <p className="text-sm text-texto-suave">{t("previaVacia")}</p>
          ) : (
            <ul className="text-sm text-foreground">
              {lineas.map((linea) => (
                <li key={linea}>{linea}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
