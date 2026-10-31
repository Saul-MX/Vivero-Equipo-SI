"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { MonitorIcon, SmartphoneIcon } from "lucide-react";
import { MarcoEscalado } from "@/components/panel/marco-escalado";
import { DiapositivaAnuncio, type DatosDiapositiva } from "@/components/sitio/diapositiva-anuncio";
import { Button } from "@/components/ui/button";

const ANCHO = { computadora: 1280, celular: 390 } as const;

/** «Así se verá en la portada», en Computadora o Celular; cambia mientras se escribe. */
export function VistaPreviaAnuncio({ anuncio, enlaceWhatsapp }: { anuncio: DatosDiapositiva; enlaceWhatsapp: string | null }) {
  const t = useTranslations("panel.carrusel.vistaPrevia");
  const [vista, setVista] = useState<"computadora" | "celular">("computadora");

  return (
    <section aria-labelledby="titulo-vista-previa" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="titulo-vista-previa" className="text-lg font-semibold">
          {t("titulo")}
        </h2>
        <div role="group" aria-label={t("dispositivo")} className="flex gap-1 rounded-full bg-muted p-1">
          {(["computadora", "celular"] as const).map((opcion) => (
            <Button
              key={opcion}
              type="button"
              size="sm"
              variant={vista === opcion ? "default" : "ghost"}
              aria-pressed={vista === opcion}
              onClick={() => setVista(opcion)}
            >
              {opcion === "computadora" ? <MonitorIcon aria-hidden /> : <SmartphoneIcon aria-hidden />}
              {t(opcion)}
            </Button>
          ))}
        </div>
      </div>
      <div
        data-testid="vista-previa-anuncio"
        data-vista={vista}
        className="mx-auto w-full overflow-hidden rounded-2xl ring-1 ring-border"
        style={{ maxWidth: vista === "celular" ? ANCHO.celular : undefined }}
      >
        <MarcoEscalado anchoVirtual={ANCHO[vista]}>
          <DiapositivaAnuncio anuncio={anuncio} enlaceWhatsapp={enlaceWhatsapp} vistaPrevia={vista} />
        </MarcoEscalado>
      </div>
      <p className="text-sm text-texto-suave">{t("ayuda")}</p>
    </section>
  );
}
