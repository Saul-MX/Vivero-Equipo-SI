"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Dibuja su contenido a un ancho fijo (por ejemplo, 1280 px de una computadora) y lo reduce
 * a escala para que quepa en el espacio disponible: una miniatura exacta de cómo se verá.
 */
export function MarcoEscalado({ anchoVirtual, children }: { anchoVirtual: number; children: ReactNode }) {
  const exterior = useRef<HTMLDivElement>(null);
  const interior = useRef<HTMLDivElement>(null);
  const [escala, setEscala] = useState(1);
  const [alto, setAlto] = useState<number>();

  useEffect(() => {
    const medir = () => {
      if (!exterior.current || !interior.current) return;
      const nuevaEscala = Math.min(1, exterior.current.clientWidth / anchoVirtual);
      setEscala(nuevaEscala);
      setAlto(interior.current.offsetHeight * nuevaEscala);
    };
    medir();
    const observador = new ResizeObserver(medir);
    if (exterior.current) observador.observe(exterior.current);
    if (interior.current) observador.observe(interior.current);
    return () => observador.disconnect();
  }, [anchoVirtual]);

  return (
    <div ref={exterior} className="w-full overflow-hidden" style={{ height: alto }}>
      <div
        ref={interior}
        style={{ width: anchoVirtual, transform: `scale(${escala})`, transformOrigin: "top left" }}
      >
        {children}
      </div>
    </div>
  );
}
