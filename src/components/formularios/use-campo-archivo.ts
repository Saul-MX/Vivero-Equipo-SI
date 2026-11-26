"use client";

import { useEffect, useEffectEvent, useRef } from "react";

/**
 * Referencia para un campo de archivo que NO pierde lo elegido antes de que la página cargue.
 *
 * El botón «Elegir…» es la etiqueta (<label>) del campo, así que funciona aun sin JavaScript: en un
 * celular con internet lento se puede elegir una foto antes de que React active la página, y ese
 * cambio se perdía (el archivo quedaba en el campo, pero no se subía ni salía ningún aviso).
 * Al activarse, si el campo ya trae archivos, se procesan como si se acabaran de elegir.
 */
export function useCampoArchivo(alElegir: (archivos: File[]) => void) {
  const campo = useRef<HTMLInputElement>(null);
  const procesar = useEffectEvent(alElegir);

  useEffect(() => {
    const entrada = campo.current;
    if (!entrada?.files?.length) return;
    const archivos = [...entrada.files];
    entrada.value = "";
    procesar(archivos);
  }, []);

  return campo;
}
