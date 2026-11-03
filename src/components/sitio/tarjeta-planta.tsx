import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { SproutIcon } from "lucide-react";
import { urlImagen } from "@/lib/archivos/claves";
import type { TarjetaPlanta as DatosTarjeta } from "@/lib/sitio/datos";
import { FiltroDisponibles } from "./filtro-disponibles";
import { cn } from "@/lib/utils";

/** Etiqueta «Disponible» / «Agotada»: solo si el interruptor general está encendido. */
export function EtiquetaDisponibilidad({ disponible, className }: { disponible: boolean; className?: string }) {
  const t = useTranslations("sitio.planta");
  return (
    <span
      className={cn(
        "dato inline-flex items-center gap-1.5",
        disponible ? "text-[#1f4d22]" : "text-[#8a2018]",
        className,
      )}
    >
      <span aria-hidden className={cn("size-1.5 rounded-full", disponible ? "bg-[#2e7d32]" : "bg-[#b3261e]")} />
      {disponible ? t("disponible") : t("agotada")}
    </span>
  );
}

export function TarjetaPlanta({
  planta,
  conDisponibilidad,
  prioritaria = false,
}: {
  planta: DatosTarjeta;
  conDisponibilidad: boolean;
  /** Las primeras tarjetas se ven sin bajar: su foto se carga de inmediato (las demás, al acercarse). */
  prioritaria?: boolean;
}) {
  const t = useTranslations("sitio.planta");

  return (
    <Link
      href={`/plantas/${planta.slug}`}
      className="group flex h-full flex-col gap-3 rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/60"
    >
      <div className="relative aspect-4/5 overflow-hidden rounded-md bg-muted">
        {planta.portada ? (
          <Image
            src={urlImagen(planta.portada.archivo, "tarjeta")}
            alt=""
            width={planta.portada.ancho}
            height={planta.portada.alto}
            unoptimized
            loading={prioritaria ? "eager" : "lazy"}
            className="size-full object-cover"
          />
        ) : (
          <span aria-hidden className="flex size-full items-center justify-center text-salvia">
            <SproutIcon className="size-12" />
          </span>
        )}
        {planta.etiqueta && (
          <span className="dato absolute top-3 left-3 rounded-sm bg-acento-fondo px-2 py-0.5 text-acento-texto">
            {t(`etiquetas.${planta.etiqueta}`)}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-0.5 border-t border-hilo pt-3">
        <h3 className="text-lg leading-snug font-bold tracking-tight text-pino underline-offset-4 group-hover:underline">
          {planta.nombre}
        </h3>
        {planta.variedad && <p className="dato text-texto-suave">{planta.variedad}</p>}
        {conDisponibilidad && <EtiquetaDisponibilidad disponible={planta.disponible} className="mt-auto self-start pt-1" />}
      </div>
    </Link>
  );
}

/** Rejilla de tarjetas (2 columnas en celular, hasta 4 en computadora) con su aviso si está vacía. */
export function RejillaPlantas({
  plantas,
  conDisponibilidad,
  vacio,
  primerasVisibles = 4,
  filtro = true,
}: {
  plantas: DatosTarjeta[];
  conDisponibilidad: boolean;
  vacio: string;
  /** Cuántas tarjetas se ven al abrir la página sin bajar (0 si la rejilla está más abajo). */
  primerasVisibles?: number;
  /** false para una muestra corta (Inicio), donde no hace falta filtrar. */
  filtro?: boolean;
}) {
  const t = useTranslations("sitio.planta");
  if (plantas.length === 0) {
    return <p className="rounded-md border border-dashed border-hilo p-10 text-center text-texto-suave">{vacio}</p>;
  }
  const rejilla = (
    <ul className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 md:grid-cols-3 lg:grid-cols-4">
      {plantas.map((planta, indice) => (
        <li key={planta.slug} data-disponible={planta.disponible}>
          <TarjetaPlanta planta={planta} conDisponibilidad={conDisponibilidad} prioritaria={indice < primerasVisibles} />
        </li>
      ))}
    </ul>
  );
  // Con la disponibilidad encendida (y alguna agotada) se puede filtrar «Solo disponibles».
  const disponibles = plantas.filter((planta) => planta.disponible).length;
  return conDisponibilidad && filtro && disponibles < plantas.length ? (
    <FiltroDisponibles texto={t("soloDisponibles", { n: disponibles })}>{rejilla}</FiltroDisponibles>
  ) : (
    rejilla
  );
}
