import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { urlImagen } from "@/lib/archivos/claves";

/** Acceso a un catálogo: una fila del índice con su foto pequeña, el nombre y cuántas plantas tiene. */
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
      className="group grid grid-cols-[5rem_1fr_auto] items-center gap-4 border-t border-hilo py-4 outline-none focus-visible:ring-3 focus-visible:ring-ring/60 sm:grid-cols-[7rem_1fr_auto] sm:gap-6"
    >
      <span className="relative block aspect-4/3 overflow-hidden rounded-md bg-pino">
        {fotoPortada && (
          <Image
            src={urlImagen(fotoPortada, "tarjeta")}
            alt=""
            width={640}
            height={480}
            unoptimized
            className="absolute inset-0 size-full object-cover"
          />
        )}
      </span>
      <span className="titulo-etiqueta text-2xl text-pino underline-offset-4 group-hover:underline sm:text-3xl">{nombre}</span>
      <span className="dato text-texto-suave">{t("plantas", { n: plantas })}</span>
    </Link>
  );
}
