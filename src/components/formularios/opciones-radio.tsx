"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

/**
 * Elegir UNA opción, con el mismo aspecto de chips que «ChipsSeleccion»
 * (Foto o video, posición del texto). Por dentro son botones de opción normales.
 */
export function OpcionesRadio<Valor extends string>({
  leyenda,
  opciones,
  valor,
  alCambiar,
}: {
  leyenda: string;
  opciones: { valor: Valor; etiqueta: string }[];
  valor: Valor;
  alCambiar: (valor: Valor) => void;
}) {
  const nombre = useId();

  return (
    <fieldset className="flex flex-col">
      <legend className="mb-2 text-sm font-medium text-foreground">{leyenda}</legend>
      <div className="flex flex-wrap gap-2">
        {opciones.map((opcion) => {
          const activa = opcion.valor === valor;
          return (
            <label
              key={opcion.valor}
              className={cn(
                "relative inline-flex min-h-10 cursor-pointer items-center rounded-full border px-4 text-sm transition-colors has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50",
                activa ? "border-hoja bg-hoja text-white" : "border-salvia bg-card text-foreground hover:bg-muted",
              )}
            >
              <input
                type="radio"
                name={nombre}
                value={opcion.valor}
                className="absolute inset-0 size-full cursor-pointer appearance-none rounded-full opacity-0"
                checked={activa}
                onChange={() => alCambiar(opcion.valor)}
              />
              {opcion.etiqueta}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
