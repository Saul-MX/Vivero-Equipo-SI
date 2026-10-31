"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDownIcon, MenuIcon, XIcon } from "lucide-react";
import { Logo } from "@/components/marca/logo";
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

// Barra de navegación del sitio: exactamente 6 apartados (sección 3 de la especificación).

export type ItemCatalogo = { nombre: string; slug: string };

type Props = {
  catalogos: ItemCatalogo[];
  /** null mientras no se sabe la ruta (primer instante): ningún apartado se marca. */
  rutaActual: string | null;
};

const APARTADOS = ["inicio", "catalogos", "temporada", "fertilizantes", "nosotros", "contacto"] as const;
type Apartado = (typeof APARTADOS)[number];
const RUTAS: Record<Exclude<Apartado, "catalogos">, string> = {
  inicio: "/",
  temporada: "/temporada",
  fertilizantes: "/fertilizantes",
  nosotros: "/nosotros",
  contacto: "/contacto",
};

function apartadoActual(ruta: string | null): Apartado | null {
  if (ruta === null) return null;
  if (ruta === "/") return "inicio";
  if (ruta.startsWith("/catalogos") || ruta.startsWith("/plantas")) return "catalogos";
  return (APARTADOS.find((apartado) => apartado !== "inicio" && apartado !== "catalogos" && ruta.startsWith(RUTAS[apartado])) ??
    null) as Apartado | null;
}

/** Enlaces del desplegable «Catálogos» (regla 5): permanentes, Fertilizantes y, al final, todas las plantas. */
function enlacesCatalogos(catalogos: ItemCatalogo[], t: (clave: "fertilizantes" | "todasLasPlantas") => string) {
  return [
    ...catalogos.map((catalogo) => ({ href: `/catalogos/${catalogo.slug}`, texto: catalogo.nombre })),
    { href: "/fertilizantes", texto: t("fertilizantes") },
    { href: "/plantas", texto: t("todasLasPlantas") },
  ];
}

function DesplegableCatalogos({ catalogos, activo }: { catalogos: ItemCatalogo[]; activo: boolean }) {
  const t = useTranslations("sitio.menu");
  const [abierto, setAbierto] = useState(false);
  const contenedor = useRef<HTMLDivElement>(null);
  const boton = useRef<HTMLButtonElement>(null);
  const idLista = useId();

  useEffect(() => {
    if (!abierto) return;
    const alClic = (evento: PointerEvent) => {
      if (!contenedor.current?.contains(evento.target as Node)) setAbierto(false);
    };
    const alTecla = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") {
        setAbierto(false);
        boton.current?.focus();
      }
    };
    document.addEventListener("pointerdown", alClic);
    document.addEventListener("keydown", alTecla);
    contenedor.current?.querySelector("a")?.focus();
    return () => {
      document.removeEventListener("pointerdown", alClic);
      document.removeEventListener("keydown", alTecla);
    };
  }, [abierto]);

  return (
    <div
      ref={contenedor}
      className="relative"
      onBlur={(evento) => {
        if (!contenedor.current?.contains(evento.relatedTarget as Node | null)) setAbierto(false);
      }}
    >
      <button
        ref={boton}
        type="button"
        aria-expanded={abierto}
        aria-controls={idLista}
        onClick={() => setAbierto((valor) => !valor)}
        className={cn(estiloEnlace(activo), "inline-flex items-center gap-1")}
      >
        {t("catalogos")}
        <ChevronDownIcon aria-hidden className={cn("size-4 transition-transform", abierto && "rotate-180")} />
      </button>
      <ul
        id={idLista}
        hidden={!abierto}
        className="absolute top-full left-0 z-50 mt-2 min-w-60 rounded-2xl border border-border bg-white p-2 shadow-xl shadow-black/10"
      >
        {enlacesCatalogos(catalogos, t).map((enlace, indice, lista) => (
          <li key={enlace.href} className={cn(indice === lista.length - 1 && "mt-1 border-t border-border pt-1")}>
            <Link
              href={enlace.href}
              onClick={() => setAbierto(false)}
              className="block rounded-xl px-3 py-2.5 text-sm font-medium text-foreground outline-none hover:bg-muted focus-visible:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
            >
              {enlace.texto}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function estiloEnlace(activo: boolean) {
  return cn(
    "rounded-full px-3 py-2 text-[0.95rem] font-medium outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50",
    activo ? "bg-acento-fondo text-acento-texto" : "text-foreground hover:bg-muted",
  );
}

export function MenuSitio({ catalogos, rutaActual }: Props) {
  const t = useTranslations("sitio.menu");
  const [abierto, setAbierto] = useState(false);
  const actual = apartadoActual(rutaActual);

  return (
    <>
      <nav aria-label={t("nombre")} className="hidden lg:block">
        <ul className="flex items-center gap-1">
          {APARTADOS.map((apartado) => (
            <li key={apartado}>
              {apartado === "catalogos" ? (
                <DesplegableCatalogos catalogos={catalogos} activo={actual === "catalogos"} />
              ) : (
                <Link
                  href={RUTAS[apartado]}
                  aria-current={actual === apartado ? "page" : undefined}
                  className={estiloEnlace(actual === apartado)}
                >
                  {t(apartado)}
                </Link>
              )}
            </li>
          ))}
        </ul>
      </nav>

      <Sheet open={abierto} onOpenChange={setAbierto}>
        <SheetTrigger className="inline-flex size-11 items-center justify-center rounded-full text-pino outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 lg:hidden">
          <MenuIcon aria-hidden className="size-6" />
          <span className="sr-only">{t("abrir")}</span>
        </SheetTrigger>
        <SheetContent
          side="right"
          showCloseButton={false}
          aria-describedby={undefined}
          className="w-[85%] max-w-xs gap-0 overflow-y-auto bg-white px-4 pt-4 pb-8"
        >
          <div className="mb-6 flex items-center justify-between">
            <SheetTitle>
              <Logo tamano="sm" />
            </SheetTitle>
            <SheetClose className="inline-flex size-11 items-center justify-center rounded-full text-pino outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50">
              <XIcon aria-hidden className="size-6" />
              <span className="sr-only">{t("cerrar")}</span>
            </SheetClose>
          </div>
          <nav aria-label={t("nombre")}>
            <ul className="flex flex-col gap-1">
              {APARTADOS.map((apartado) =>
                apartado === "catalogos" ? (
                  <li key={apartado} className="py-1">
                    <p className="px-3 py-2 text-xs font-semibold tracking-[0.15em] text-texto-suave uppercase">
                      {t("catalogos")}
                    </p>
                    <ul className="flex flex-col gap-1 border-l-2 border-acento pl-2">
                      {enlacesCatalogos(catalogos, t).map((enlace) => (
                        <li key={enlace.href}>
                          <Link
                            href={enlace.href}
                            onClick={() => setAbierto(false)}
                            aria-current={rutaActual === enlace.href ? "page" : undefined}
                            className={cn(estiloEnlace(rutaActual === enlace.href), "block")}
                          >
                            {enlace.texto}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </li>
                ) : (
                  <li key={apartado}>
                    <Link
                      href={RUTAS[apartado]}
                      onClick={() => setAbierto(false)}
                      aria-current={actual === apartado ? "page" : undefined}
                      className={cn(estiloEnlace(actual === apartado), "block")}
                    >
                      {t(apartado)}
                    </Link>
                  </li>
                ),
              )}
            </ul>
          </nav>
        </SheetContent>
      </Sheet>
    </>
  );
}

/** Igual que MenuSitio, marcando el apartado de la página actual. */
export function NavegacionSitio({ catalogos }: { catalogos: ItemCatalogo[] }) {
  return <MenuSitio catalogos={catalogos} rutaActual={usePathname()} />;
}
