import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowRightIcon } from "lucide-react";
import { urlImagen } from "@/lib/archivos/claves";

/** Acceso a un catálogo: su foto de portada con el nombre y cuántas plantas tiene. */
export function TarjetaCatalogo({
  href,
  nombre,
  fotoPortada,
  plantas,
}: {
  href: string;
  nombre: string;
  fotoPortada: string | null;
  plantas: number;
}) {
  const t = useTranslations("sitio.inicio");

  return (
    <Link
      href={href}
      className="group relative flex aspect-4/3 items-end overflow-hidden rounded-3xl bg-pino outline-none focus-visible:ring-4 focus-visible:ring-ring/60"
    >
      {fotoPortada && (
        <Image
          src={urlImagen(fotoPortada, "tarjeta")}
          alt=""
          width={640}
          height={480}
          unoptimized
          className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      )}
      <span aria-hidden className="absolute inset-0 bg-linear-to-t from-black/75 via-black/20 to-transparent" />
      <span className="relative flex w-full items-end justify-between gap-3 p-5 text-white">
        <span>
          <span className="block font-serif text-2xl font-semibold">{nombre}</span>
          <span className="text-sm">{t("plantas", { n: plantas })}</span>
        </span>
        <ArrowRightIcon aria-hidden className="size-5 shrink-0" />
      </span>
    </Link>
  );
}
