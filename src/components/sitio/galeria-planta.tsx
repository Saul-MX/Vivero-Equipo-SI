"use client";

import Image from "next/image";
import { useState } from "react";
import { SproutIcon } from "lucide-react";
import { urlImagen } from "@/lib/archivos/claves";
import { cn } from "@/lib/utils";

type Foto = { archivo: string; ancho: number; alto: number };

/**
 * Fotos de la ficha: la grande arriba (empieza con la portada) y las miniaturas para cambiarla.
 * `textos` llega ya traducido desde el servidor: la descripción y el botón de cada foto.
 */
export function GaleriaPlanta({
  fotos,
  textos,
}: {
  fotos: Foto[];
  textos: { fotos: string[]; verFoto: string[] };
}) {
  const [actual, setActual] = useState(0);
  const foto = fotos[actual];

  if (!foto) {
    return (
      <div aria-hidden className="flex aspect-4/5 items-center justify-center rounded-md bg-muted text-salvia">
        <SproutIcon className="size-16" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <Image
        key={foto.archivo}
        src={urlImagen(foto.archivo)}
        alt={textos.fotos[actual]}
        width={foto.ancho}
        height={foto.alto}
        unoptimized
        preload={actual === 0}
        className="aspect-4/5 h-auto w-full rounded-md bg-muted object-cover"
      />
      {fotos.length > 1 && (
        <ul className="flex gap-2 overflow-x-auto pb-1">
          {fotos.map((miniatura, indice) => (
            <li key={miniatura.archivo} className="shrink-0">
              <button
                type="button"
                aria-pressed={indice === actual}
                onClick={() => setActual(indice)}
                className={cn(
                  "block overflow-hidden rounded-xl ring-2 outline-none focus-visible:ring-4 focus-visible:ring-ring/60",
                  indice === actual ? "ring-acento" : "ring-transparent opacity-80 hover:opacity-100",
                )}
              >
                <Image
                  src={urlImagen(miniatura.archivo, "tarjeta")}
                  alt=""
                  width={80}
                  height={80}
                  unoptimized
                  className="size-20 object-cover"
                />
                <span className="sr-only">{textos.verFoto[indice]}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
