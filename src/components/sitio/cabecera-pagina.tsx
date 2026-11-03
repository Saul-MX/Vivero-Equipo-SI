import Image from "next/image";
import type { ReactNode } from "react";
import { urlImagen } from "@/lib/archivos/claves";
import { cn } from "@/lib/utils";
import { CONTENEDOR } from "./encabezado";
import { Migas, type Miga } from "./migas";

/** Cabecera de cada página del sitio: título, texto breve y, si hay, una foto grande. */
export function CabeceraPagina({
  migas,
  antetitulo,
  titulo,
  children,
  foto,
}: {
  /** Ruta hasta esta página, sin «Inicio» (se agrega sola); la última es la página actual. */
  migas?: Miga[];
  /** Texto pequeño sobre el título (por ejemplo, «Temporada»). */
  antetitulo?: string;
  titulo: string;
  children?: ReactNode;
  foto?: string | null;
}) {
  return (
    <section className={cn(CONTENEDOR, "grid items-center gap-8 pt-10 pb-8 sm:pt-14", foto && "md:grid-cols-2")}>
      <div className="flex flex-col gap-4">
        {migas && <Migas migas={migas} />}
        {antetitulo && (
          <p className="dato flex items-center gap-2 text-texto-suave">
            <span aria-hidden className="size-2.5 rounded-full bg-acento" />
            {antetitulo}
          </p>
        )}
        <h1 className="titulo-etiqueta text-5xl text-pino sm:text-6xl">{titulo}</h1>
        {children && <div className="flex max-w-[62ch] flex-col gap-4 text-lg text-pretty text-texto-suave">{children}</div>}
      </div>
      {foto && (
        <Image
          src={urlImagen(foto)}
          alt=""
          width={1200}
          height={900}
          unoptimized
          preload
          className="aspect-4/3 h-auto w-full rounded-md object-cover"
        />
      )}
    </section>
  );
}
