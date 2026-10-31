"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { ChevronDownIcon, MenuIcon, XIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// Barra de navegación del sitio: exactamente 6 apartados (sección 3 de la especificación).
// Para que el celular cargue rápido, no usa librerías: los textos llegan ya traducidos desde el
// servidor y el menú del celular es el panel nativo del navegador («popover»), que ya se cierra
// con Escape o tocando afuera.

export type ItemCatalogo = { nombre: string; slug: string };

export type TextosMenu = {
  nombre: string;
  abrir: string;
  cerrar: string;
  inicio: string;
  catalogos: string;
  temporada: string;
  fertilizantes: string;
  nosotros: string;
  contacto: string;
  todasLasPlantas: string;
};

type Props = { catalogos: ItemCatalogo[]; textos: TextosMenu; rutaActual: string | null };

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
  for (const apartado of ["temporada", "fertilizantes", "nosotros", "contacto"] as const) {
    if (ruta.startsWith(RUTAS[apartado])) return apartado;
  }
  return null;
}

/** Enlaces del desplegable «Catálogos» (regla 5): permanentes, Fertilizantes y, al final, todas las plantas. */
function enlacesCatalogos(catalogos: ItemCatalogo[], textos: TextosMenu) {
  return [
    ...catalogos.map((catalogo) => ({ href: `/catalogos/${catalogo.slug}`, texto: catalogo.nombre })),
    { href: "/fertilizantes", texto: textos.fertilizantes },
    { href: "/plantas", texto: textos.todasLasPlantas },
  ];
}

function estiloEnlace(activo: boolean) {
  return cn(
    "rounded-full px-3 py-2 text-[0.95rem] font-medium outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50",
    activo ? "bg-acento-fondo text-acento-texto" : "text-foreground hover:bg-muted",
  );
}

function DesplegableCatalogos({ catalogos, textos, activo }: { catalogos: ItemCatalogo[]; textos: TextosMenu; activo: boolean }) {
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
        {textos.catalogos}
        <ChevronDownIcon aria-hidden className={cn("size-4 transition-transform", abierto && "rotate-180")} />
      </button>
      <ul
        id={idLista}
        hidden={!abierto}
        className="absolute top-full left-0 z-50 mt-2 min-w-60 rounded-2xl border border-border bg-white p-2 shadow-xl shadow-black/10"
      >
        {enlacesCatalogos(catalogos, textos).map((enlace, indice, lista) => (
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

export function MenuSitio({ catalogos, textos, rutaActual }: Props) {
  const actual = apartadoActual(rutaActual);
  const idPanel = useId();
  const panel = useRef<HTMLDivElement>(null);
  const cerrarPanel = () => panel.current?.hidePopover();

  return (
    <>
      <nav aria-label={textos.nombre} className="hidden lg:block">
        <ul className="flex items-center gap-1">
          {APARTADOS.map((apartado) => (
            <li key={apartado}>
              {apartado === "catalogos" ? (
                <DesplegableCatalogos catalogos={catalogos} textos={textos} activo={actual === "catalogos"} />
              ) : (
                <Link
                  href={RUTAS[apartado]}
                  aria-current={actual === apartado ? "page" : undefined}
                  className={estiloEnlace(actual === apartado)}
                >
                  {textos[apartado]}
                </Link>
              )}
            </li>
          ))}
        </ul>
      </nav>

      <button
        type="button"
        popoverTarget={idPanel}
        className="inline-flex size-11 items-center justify-center rounded-full text-pino outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 lg:hidden"
      >
        <MenuIcon aria-hidden className="size-6" />
        <span className="sr-only">{textos.abrir}</span>
      </button>
      {/* Panel lateral del celular: el navegador lo abre, lo cierra con Escape o tocando afuera. */}
      <div
        ref={panel}
        id={idPanel}
        popover="auto"
        role="dialog"
        aria-label={textos.nombre}
        className="fixed inset-y-0 right-0 left-auto m-0 h-dvh max-h-dvh w-[85%] max-w-xs overflow-y-auto border-0 bg-white px-4 pt-4 pb-8 shadow-2xl backdrop:bg-black/40"
      >
        <div className="mb-6 flex items-center justify-between">
          <span className="font-serif text-lg font-semibold text-pino">Vivero El Encanto</span>
          <button
            type="button"
            popoverTarget={idPanel}
            popoverTargetAction="hide"
            className="inline-flex size-11 items-center justify-center rounded-full text-pino outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <XIcon aria-hidden className="size-6" />
            <span className="sr-only">{textos.cerrar}</span>
          </button>
        </div>
        <nav aria-label={textos.nombre}>
          <ul className="flex flex-col gap-1">
            {APARTADOS.map((apartado) =>
              apartado === "catalogos" ? (
                <li key={apartado} className="py-1">
                  <p className="px-3 py-2 text-xs font-semibold tracking-[0.15em] text-texto-suave uppercase">
                    {textos.catalogos}
                  </p>
                  <ul className="flex flex-col gap-1 border-l-2 border-acento pl-2">
                    {enlacesCatalogos(catalogos, textos).map((enlace) => (
                      <li key={enlace.href}>
                        <Link
                          href={enlace.href}
                          onClick={cerrarPanel}
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
                    onClick={cerrarPanel}
                    aria-current={actual === apartado ? "page" : undefined}
                    className={cn(estiloEnlace(actual === apartado), "block")}
                  >
                    {textos[apartado]}
                  </Link>
                </li>
              ),
            )}
          </ul>
        </nav>
      </div>
    </>
  );
}

/** Igual que MenuSitio, marcando el apartado de la página actual. */
export function NavegacionSitio(props: Omit<Props, "rutaActual">) {
  return <MenuSitio {...props} rutaActual={usePathname()} />;
}
