import type { ReactNode } from "react";

type Props = {
  titulo: string;
  subtitulo?: string;
  /** Botones de la esquina superior derecha (por ejemplo, «Ver el sitio» o «Agregar planta»). */
  acciones?: ReactNode;
};

export function EncabezadoPagina({ titulo, subtitulo, acciones }: Props) {
  return (
    <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="text-3xl font-semibold sm:text-4xl">{titulo}</h1>
        {subtitulo && <p className="mt-2 max-w-2xl text-base text-texto-suave">{subtitulo}</p>}
      </div>
      {acciones && <div className="flex shrink-0 flex-wrap gap-2">{acciones}</div>}
    </header>
  );
}
