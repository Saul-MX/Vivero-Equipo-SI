"use client";

import { useState, type ReactNode } from "react";
import { CheckIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * «Solo disponibles» (sección 4.2): oculta las plantas agotadas de la rejilla. Solo cambia un
 * atributo; el CSS (globals.css) esconde las tarjetas marcadas como agotadas, así casi no usa JavaScript.
 */
export function FiltroDisponibles({ texto, children }: { texto: string; children: ReactNode }) {
  const [solo, setSolo] = useState(false);

  return (
    <div data-solo-disponibles={solo} className="flex flex-col gap-5">
      <button
        type="button"
        aria-pressed={solo}
        onClick={() => setSolo((valor) => !valor)}
        className={cn(
          "inline-flex min-h-10 items-center gap-2 self-start rounded-full border px-4 text-sm font-medium outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50",
          solo ? "border-hoja bg-hoja text-white" : "border-salvia bg-white text-foreground hover:bg-muted",
        )}
      >
        {solo && <CheckIcon aria-hidden className="size-4" />}
        {texto}
      </button>
      {children}
    </div>
  );
}
