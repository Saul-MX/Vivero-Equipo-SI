"use client";

import { useRouter } from "next/navigation";
import { Fragment, type ReactNode } from "react";

/**
 * Cada visita nueva a una pantalla del panel empieza de cero.
 *
 * Con Cache Components, Next conserva ocultas las pantallas ya visitadas (React <Activity>) y, al volver
 * a ellas con un enlace, las muestra con su estado anterior. Sin esto:
 * - «Agregar planta» reaparecía con la planta recién guardada y sus fotos temporales (ya movidas a su
 *   carpeta definitiva), y la siguiente planta no se podía guardar;
 * - después de «Salir», la pantalla de entrar conservaba el usuario y la contraseña escritos.
 *
 * `bfcacheId` cambia con cada navegación nueva (enlace, menú, router.push/replace) y se mantiene con
 * «Atrás» y «Adelante» del navegador, que siguen recuperando lo que se estaba escribiendo.
 * (Ver node_modules/next/dist/docs/01-app/02-guides/preserving-ui-state.md.)
 */
export function VisitaNueva({ children }: { children: ReactNode }) {
  const { bfcacheId } = useRouter();
  return <Fragment key={bfcacheId}>{children}</Fragment>;
}
