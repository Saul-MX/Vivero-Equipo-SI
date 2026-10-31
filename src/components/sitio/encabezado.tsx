import Link from "next/link";
import { Suspense } from "react";
import { useTranslations } from "next-intl";
import { Logo } from "@/components/marca/logo";
import { MenuSitio, NavegacionSitio, type ItemCatalogo } from "./menu-sitio";

/** Ancho y márgenes comunes del contenido del sitio (16 px a los lados en celular). */
export const CONTENEDOR = "mx-auto w-full max-w-6xl px-4 sm:px-6";

/** Encabezado fijo: franja del color de la temporada, nombre del vivero y los 6 apartados. */
export function EncabezadoSitio({ catalogos }: { catalogos: ItemCatalogo[] }) {
  const t = useTranslations("sitio");

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85">
      <div aria-hidden className="h-1 bg-acento" />
      <div className={`${CONTENEDOR} flex h-16 items-center justify-between gap-4`}>
        <Link href="/" className="rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
          <Logo tamano="sm" />
          <span className="sr-only">{t("menu.irInicio")}</span>
        </Link>
        {/* La ruta actual solo se conoce en el navegador: mientras tanto se ve el menú sin marcar. */}
        <Suspense fallback={<MenuSitio catalogos={catalogos} rutaActual={null} />}>
          <NavegacionSitio catalogos={catalogos} />
        </Suspense>
      </div>
    </header>
  );
}
