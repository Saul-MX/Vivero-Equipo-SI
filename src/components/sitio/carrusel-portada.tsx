"use client";

import { useEffect, useState, type ReactNode } from "react";
import { ChevronLeftIcon, ChevronRightIcon, PauseIcon, PlayIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const INTERVALO_MS = 7000;

export type TextosCarrusel = {
  carrusel: string;
  nombre: string;
  diapositiva: string;
  /** «{n} de {total}» ya armado para cada diapositiva. */
  posiciones: string[];
  anterior: string;
  siguiente: string;
  /** «Ver el anuncio {n}» ya armado para cada punto. */
  irA: string[];
  pausar: string;
  reanudar: string;
};

/**
 * Carrusel de la portada con los anuncios de hoy. Las diapositivas llegan ya armadas desde el
 * servidor; aquí solo se decide cuál se ve. Avanza solo cada 7 segundos, salvo que la persona lo
 * pause, pase el cursor o el teclado por encima, o tenga activado «reducir movimiento».
 */
export function CarruselPortada({ diapositivas, textos }: { diapositivas: ReactNode[]; textos: TextosCarrusel }) {
  const [actual, setActual] = useState(0);
  const [pausado, setPausado] = useState(false);
  const [encima, setEncima] = useState(false);
  const total = diapositivas.length;

  useEffect(() => {
    if (total < 2 || pausado || encima) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const reloj = window.setInterval(() => setActual((indice) => (indice + 1) % total), INTERVALO_MS);
    return () => window.clearInterval(reloj);
  }, [total, pausado, encima]);

  const ir = (indice: number) => setActual((indice + total) % total);

  return (
    <section
      aria-roledescription={textos.carrusel}
      aria-label={textos.nombre}
      onMouseEnter={() => setEncima(true)}
      onMouseLeave={() => setEncima(false)}
      onFocus={() => setEncima(true)}
      onBlur={(evento) => !evento.currentTarget.contains(evento.relatedTarget as Node | null) && setEncima(false)}
    >
      {/* Todas las diapositivas ocupan el mismo lugar; solo la actual se ve y se puede usar. */}
      <div className="grid">
        {diapositivas.map((diapositiva, indice) => (
          <div
            key={indice}
            role="group"
            aria-roledescription={textos.diapositiva}
            aria-label={textos.posiciones[indice]}
            aria-hidden={indice !== actual}
            inert={indice !== actual}
            className={cn(
              "[grid-area:1/1] transition-opacity duration-700",
              indice === actual ? "opacity-100" : "pointer-events-none opacity-0",
            )}
          >
            {diapositiva}
          </div>
        ))}
      </div>

      {total > 1 && (
        <div className="flex justify-center px-4 pt-3">
          <div className="flex flex-wrap items-center justify-center gap-1 rounded-full bg-white p-1 border border-hilo">
            <button type="button" onClick={() => ir(actual - 1)} className={estiloBoton}>
              <ChevronLeftIcon aria-hidden className="size-5" />
              <span className="sr-only">{textos.anterior}</span>
            </button>
            {diapositivas.map((_, indice) => (
              <button
                key={indice}
                type="button"
                aria-current={indice === actual ? "true" : undefined}
                onClick={() => ir(indice)}
                className="flex size-9 items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span
                  aria-hidden
                  className={cn("rounded-full transition-all", indice === actual ? "h-2 w-5 bg-acento-fondo" : "size-2 bg-salvia")}
                />
                <span className="sr-only">{textos.irA[indice]}</span>
              </button>
            ))}
            <button type="button" onClick={() => ir(actual + 1)} className={estiloBoton}>
              <ChevronRightIcon aria-hidden className="size-5" />
              <span className="sr-only">{textos.siguiente}</span>
            </button>
            <button type="button" onClick={() => setPausado((valor) => !valor)} className={estiloBoton}>
              {pausado ? <PlayIcon aria-hidden className="size-4" /> : <PauseIcon aria-hidden className="size-4" />}
              <span className="sr-only">{pausado ? textos.reanudar : textos.pausar}</span>
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

const estiloBoton =
  "flex size-9 items-center justify-center rounded-full text-pino outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring";
