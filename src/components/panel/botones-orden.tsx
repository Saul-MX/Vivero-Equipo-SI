"use client";

import { ArrowDownIcon, ArrowUpIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Flechas para subir o bajar un elemento de una lista; las etiquetas nombran al elemento. */
export function BotonesOrden({
  esPrimero,
  esUltimo,
  deshabilitado,
  etiquetaSubir,
  etiquetaBajar,
  alMover,
}: {
  esPrimero: boolean;
  esUltimo: boolean;
  deshabilitado?: boolean;
  etiquetaSubir: string;
  etiquetaBajar: string;
  alMover: (direccion: "subir" | "bajar") => void;
}) {
  return (
    <div className="flex shrink-0">
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        disabled={deshabilitado || esPrimero}
        onClick={() => alMover("subir")}
      >
        <ArrowUpIcon aria-hidden />
        <span className="sr-only">{etiquetaSubir}</span>
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        disabled={deshabilitado || esUltimo}
        onClick={() => alMover("bajar")}
      >
        <ArrowDownIcon aria-hidden />
        <span className="sr-only">{etiquetaBajar}</span>
      </Button>
    </div>
  );
}
