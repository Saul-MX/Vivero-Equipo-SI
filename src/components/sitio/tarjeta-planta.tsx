import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { SproutIcon } from "lucide-react";
import { urlImagen } from "@/lib/archivos/claves";
import type { TarjetaPlanta as DatosTarjeta } from "@/lib/sitio/datos";
import { cn } from "@/lib/utils";

/** Etiqueta «Disponible» / «Agotada»: solo si el interruptor general está encendido. */
export function EtiquetaDisponibilidad({ disponible, className }: { disponible: boolean; className?: string }) {
  const t = useTranslations("sitio.planta");
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
        disponible ? "bg-[#e3efe0] text-[#1f4d22]" : "bg-[#f3e3e1] text-[#8a2018]",
        className,
      )}
    >
      <span aria-hidden className={cn("size-1.5 rounded-full", disponible ? "bg-[#2e7d32]" : "bg-[#b3261e]")} />
      {disponible ? t("disponible") : t("agotada")}
    </span>
  );
}

export function TarjetaPlanta({ planta, conDisponibilidad }: { planta: DatosTarjeta; conDisponibilidad: boolean }) {
  const t = useTranslations("sitio.planta");

  return (
    <Link
      href={`/plantas/${planta.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-border outline-none transition-shadow hover:shadow-lg focus-visible:ring-3 focus-visible:ring-ring/60"
    >
      <div className="relative aspect-4/5 overflow-hidden bg-muted">
        {planta.portada ? (
          <Image
            src={urlImagen(planta.portada.archivo, "tarjeta")}
            alt=""
            width={planta.portada.ancho}
            height={planta.portada.alto}
            unoptimized
            className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <span aria-hidden className="flex size-full items-center justify-center text-salvia">
            <SproutIcon className="size-12" />
          </span>
        )}
        {planta.etiqueta && (
          <span className="absolute top-3 left-3 rounded-full bg-acento-fondo px-3 py-1 text-xs font-semibold text-acento-texto">
            {t(`etiquetas.${planta.etiqueta}`)}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <h3 className="font-serif text-xl leading-snug font-semibold text-pino">{planta.nombre}</h3>
        {planta.variedad && <p className="text-sm text-texto-suave">{planta.variedad}</p>}
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
}: {
  plantas: DatosTarjeta[];
  conDisponibilidad: boolean;
  vacio: string;
}) {
  if (plantas.length === 0) {
    return <p className="rounded-3xl bg-white p-10 text-center text-texto-suave ring-1 ring-border">{vacio}</p>;
  }
  return (
    <ul className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
      {plantas.map((planta) => (
        <li key={planta.slug}>
          <TarjetaPlanta planta={planta} conDisponibilidad={conDisponibilidad} />
        </li>
      ))}
    </ul>
  );
}
