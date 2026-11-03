import Link from "next/link";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

export type Miga = {
  texto: string;
  /** Sin enlace en la página actual (siempre la última). */
  href?: string;
};

/** Migas de pan: dónde está el visitante y cómo volver. «Inicio» se agrega sola al principio. */
export function Migas({ migas, className }: { migas: Miga[]; className?: string }) {
  const t = useTranslations("sitio.menu");
  const todas: Miga[] = [{ texto: t("inicio"), href: "/" }, ...migas];

  return (
    <nav aria-label={t("migas")} className={className}>
      <ol className="dato flex flex-wrap items-center gap-x-2 text-texto-suave">
        {todas.map((miga, indice) => {
          const actual = indice === todas.length - 1;
          return (
            <li key={`${indice}-${miga.texto}`} className="flex items-center gap-2">
              {actual || !miga.href ? (
                <span aria-current={actual ? "page" : undefined} className="py-1 text-tinta">
                  {miga.texto}
                </span>
              ) : (
                <Link
                  href={miga.href}
                  className={cn(
                    "rounded-sm py-1 underline decoration-hilo underline-offset-4 outline-none",
                    "hover:text-pino hover:decoration-pino focus-visible:ring-3 focus-visible:ring-ring/60",
                  )}
                >
                  {miga.texto}
                </Link>
              )}
              {!actual && <span aria-hidden>/</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
