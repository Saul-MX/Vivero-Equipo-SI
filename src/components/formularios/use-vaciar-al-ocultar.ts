"use client";

import { useEffect, useLayoutEffect, useRef } from "react";

/**
 * Vacía un formulario cuando su pantalla deja de verse. Next conserva ocultas las pantallas ya
 * visitadas (para volver al instante): sin esto, una contraseña escrita se quedaría en la página y
 * reaparecería, por ejemplo, después de «Salir».
 *
 * En desarrollo, React monta, desmonta y vuelve a montar cada componente una vez para encontrar
 * errores (modo estricto). Ese ensayo NO debe vaciar lo que la persona ya escribió (en un celular
 * lento se puede escribir antes de que la página termine de cargar): por eso se espera un momento
 * y solo se vacía si la pantalla de verdad no volvió a verse.
 */
export function useVaciarAlOcultar(vaciar: () => void) {
  const vaciarActual = useRef(vaciar);
  const visible = useRef(false);

  useEffect(() => {
    vaciarActual.current = vaciar;
  });

  useLayoutEffect(() => {
    visible.current = true;
    return () => {
      visible.current = false;
      setTimeout(() => {
        if (!visible.current) vaciarActual.current();
      }, 0);
    };
  }, []);
}
