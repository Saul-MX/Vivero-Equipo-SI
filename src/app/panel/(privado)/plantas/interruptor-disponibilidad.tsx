"use client";

import { useOptimistic, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { CampoInterruptor } from "@/components/formularios/campo-interruptor";
import { useTraductorErrores } from "@/components/formularios/use-traductor-errores";
import { cambiarMostrarDisponibilidadAccion } from "./acciones";

/** Interruptor general «Mostrar disponibilidad en el sitio» (se guarda al momento). */
export function InterruptorDisponibilidad({ activo }: { activo: boolean }) {
  const t = useTranslations("panel.plantas");
  const traducir = useTraductorErrores();
  const [, iniciar] = useTransition();
  const [mostrar, setMostrar] = useOptimistic(activo);

  return (
    <CampoInterruptor
      etiqueta={t("disponibilidadGeneral")}
      ayuda={t("disponibilidadGeneralAyuda")}
      activo={mostrar}
      alCambiar={(valor) =>
        iniciar(async () => {
          setMostrar(valor);
          try {
            await cambiarMostrarDisponibilidadAccion(valor);
            toast.success(t("disponibilidadGeneralCambiada", { mostrar: String(valor) }));
          } catch {
            toast.error(traducir("inesperado"));
          }
        })
      }
    />
  );
}
