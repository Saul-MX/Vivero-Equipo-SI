"use client";

import type { ReactNode } from "react";
import { CheckIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type OpcionChip = { valor: string; etiqueta: string; color?: string };

/**
 * Selección múltiple en forma de chips (Luz, Colores, Tamaños de maceta).
 * Por dentro son casillas de verificación normales: funcionan con teclado y lectores de pantalla.
 */
export function ChipsSeleccion({
  leyenda,
  opciones,
  valor,
  alCambiar,
  vacio,
}: {
  leyenda: string;
  opciones: OpcionChip[];
  valor: string[];
  alCambiar: (valor: string[]) => void;
  /** Lo que se muestra si no hay opciones para elegir. */
  vacio?: ReactNode;
}) {
  const cambiar = (opcion: string, marcada: boolean) => {
    const elegidas = new Set(valor);
    if (marcada) elegidas.add(opcion);
    else elegidas.delete(opcion);
    // Se conserva el orden de las opciones (el de «Datos y redes»).
    alCambiar(opciones.filter((o) => elegidas.has(o.valor)).map((o) => o.valor));
  };

  return (
    <fieldset className="flex flex-col">
      <legend className="mb-2 text-sm font-medium text-foreground">{leyenda}</legend>
      {opciones.length === 0 ? (
        <p className="text-sm text-texto-suave">{vacio}</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {opciones.map((opcion) => {
            const activa = valor.includes(opcion.valor);
            return (
              <label
                key={opcion.valor}
                className={cn(
                  "relative inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-full border px-4 text-sm transition-colors has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50",
                  activa ? "border-hoja bg-hoja text-white" : "border-salvia bg-card text-foreground hover:bg-muted",
                )}
              >
                {/* Casilla transparente que cubre todo el chip: el toque cae directo en ella. */}
                <input
                  type="checkbox"
                  className="absolute inset-0 size-full cursor-pointer appearance-none rounded-full opacity-0"
                  checked={activa}
                  onChange={(evento) => cambiar(opcion.valor, evento.target.checked)}
                />
                {opcion.color && (
                  <span
                    aria-hidden
                    className="size-3.5 rounded-full ring-1 ring-black/20"
                    style={{ backgroundColor: opcion.color }}
                  />
                )}
                {activa && <CheckIcon aria-hidden className="size-3.5" />}
                {opcion.etiqueta}
              </label>
            );
          })}
        </div>
      )}
    </fieldset>
  );
}
