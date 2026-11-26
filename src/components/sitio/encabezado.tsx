import Link from "next/link";
import { useTranslations } from "next-intl";
import { Logo } from "@/components/marca/logo";
import { NavegacionSitio, type ItemCatalogo, type TextosMenu } from "./menu-sitio";

/** Ancho y márgenes comunes del contenido del sitio (16 px a los lados en celular). */
export const CONTENEDOR = "mx-auto w-full max-w-6xl px-4 sm:px-6";

/** Encabezado fijo: franja del color de la temporada, nombre del vivero y los 6 apartados. */
export function EncabezadoSitio({ catalogos }: { catalogos: ItemCatalogo[] }) {
  const t = useTranslations("sitio.menu");
  // Los textos del menú se traducen aquí (en el servidor) y llegan listos al navegador.
  const textos: TextosMenu = {
    nombre: t("nombre"),
    abrir: t("abrir"),
    cerrar: t("cerrar"),
    inicio: t("inicio"),
    catalogos: t("catalogos"),
    temporada: t("temporada"),
    fertilizantes: t("fertilizantes"),
    nosotros: t("nosotros"),
    contacto: t("contacto"),
    todasLasPlantas: t("todasLasPlantas"),
  };

  return (
    <header className="sticky top-0 z-40 border-b border-hilo bg-papel">
      <div aria-hidden className="trazo h-1 bg-acento" />
      <div className={`${CONTENEDOR} flex h-16 items-center justify-between gap-4`}>
        <Link href="/" className="rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
          <Logo tamano="sm" />
          <span className="sr-only">{t("irInicio")}</span>
        </Link>
        {/* La ruta actual solo se conoce en el navegador: mientras tanto se ve el menú sin marcar. */}
        <NavegacionSitio catalogos={catalogos} textos={textos} />
      </div>
    </header>
  );
}
