"use client";

import { useId } from "react";
import { Switch } from "@/components/ui/switch";

type Props = {
  etiqueta: string;
  /** Explicación breve de qué pasa al encenderlo o apagarlo. */
  ayuda?: string;
  activo: boolean;
  alCambiar: (activo: boolean) => void;
  deshabilitado?: boolean;
};

/** Interruptor con su etiqueta y ayuda, para formularios («Visible en el sitio», «Disponible», …). */
export function CampoInterruptor({ etiqueta, ayuda, activo, alCambiar, deshabilitado }: Props) {
  const id = useId();

  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border border-border bg-card p-4">
      <div className="min-w-0">
        <label htmlFor={id} className="text-sm font-medium text-foreground">
          {etiqueta}
        </label>
        {ayuda && (
          <p id={`${id}-ayuda`} className="mt-0.5 text-sm text-texto-suave">
            {ayuda}
          </p>
        )}
      </div>
      <Switch
        id={id}
        checked={activo}
        onCheckedChange={alCambiar}
        disabled={deshabilitado}
        aria-describedby={ayuda ? `${id}-ayuda` : undefined}
        className="mt-0.5"
      />
    </div>
  );
}
