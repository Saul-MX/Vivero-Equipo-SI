"use client";

import Image from "next/image";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { SproutIcon } from "lucide-react";
import { urlImagen } from "@/lib/archivos/claves";
import { cn } from "@/lib/utils";

type Foto = { archivo: string; ancho: number; alto: number };

/** Fotos de la ficha: la grande arriba (empieza con la portada) y las miniaturas para cambiarla. */
export function GaleriaPlanta({ fotos, nombre }: { fotos: Foto[]; nombre: string }) {
  const t = useTranslations("sitio.planta");
  const [actual, setActual] = useState(0);
  const foto = fotos[actual];

  if (!foto) {
    return (
      <div aria-hidden className="flex aspect-4/5 items-center justify-center rounded-3xl bg-muted text-salvia">
        <SproutIcon className="size-16" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <Image
        key={foto.archivo}
        src={urlImagen(foto.archivo)}
        alt={t("fotoDe", { nombre, n: actual + 1, total: fotos.length })}
        width={foto.ancho}
        height={foto.alto}
        unoptimized
        preload={actual === 0}
        className="aspect-4/5 h-auto w-full rounded-3xl bg-muted object-cover"
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
                <span className="sr-only">{t("verFoto", { n: indice + 1 })}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
