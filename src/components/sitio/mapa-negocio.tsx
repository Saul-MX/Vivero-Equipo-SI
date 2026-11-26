"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * El mapa de Google Maps de Contacto.
 *
 * Cuando el foco del teclado (Tab) entra al mapa, ningún navegador permite marcarlo con CSS
 * (`:focus` no aplica al iframe: el foco queda dentro del mapa). Sin marca, quien usa el teclado
 * no ve dónde está. Aquí se revisa después de cada Tab si el foco quedó en el mapa (algunos
 * navegadores, como Firefox, avisan tarde o no avisan cuando el foco entra a un iframe) y, mientras
 * siga ahí, se dibuja un contorno. Con el ratón no se marca.
 */
export function MapaNegocio({ src, titulo, className }: { src: string; titulo: string; className?: string }) {
  const marco = useRef<HTMLIFrameElement>(null);
  const [enfocado, setEnfocado] = useState(false);

  useEffect(() => {
    let vigilancia: ReturnType<typeof setInterval> | undefined;
    const esperas = new Set<ReturnType<typeof setTimeout>>();
    const dejarDeVigilar = () => {
      if (vigilancia) clearInterval(vigilancia);
      vigilancia = undefined;
    };
    const revisar = () => {
      const dentro = document.activeElement === marco.current;
      setEnfocado(dentro);
      if (!dentro) dejarDeVigilar();
      else if (!vigilancia) vigilancia = setInterval(revisar, 250);
    };
    const alTeclear = (evento: KeyboardEvent) => {
      if (evento.key !== "Tab") return;
      // El foco cambia después de la tecla: se revisa varias veces en los siguientes 300 ms.
      for (const ms of [0, 50, 150, 300]) {
        const espera = setTimeout(() => {
          esperas.delete(espera);
          revisar();
        }, ms);
        esperas.add(espera);
      }
    };
    const alVolverALaPagina = (evento: Event) => {
      if (evento.target !== marco.current) revisar();
    };
    window.addEventListener("keydown", alTeclear, true);
    document.addEventListener("focusin", alVolverALaPagina);
    return () => {
      window.removeEventListener("keydown", alTeclear, true);
      document.removeEventListener("focusin", alVolverALaPagina);
      esperas.forEach((espera) => clearTimeout(espera));
      dejarDeVigilar();
    };
  }, []);

  return (
    <iframe
      ref={marco}
      src={src}
      title={titulo}
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
      sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
      allowFullScreen
      className={cn(className, enfocado && "outline-3 outline-offset-2 outline-ring")}
    />
  );
}
