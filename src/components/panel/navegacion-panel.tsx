"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { ExternalLinkIcon, LogOutIcon, UserRoundIcon, type LucideIcon } from "lucide-react";
import { salir } from "@/app/panel/(privado)/acciones";
import { cn } from "@/lib/utils";
import { GRUPOS_MENU, RUTA_MI_CUENTA } from "./menu";

const estiloElemento =
  "flex min-h-11 w-full items-center gap-3 rounded-full px-4 text-[0.9375rem] font-medium text-sidebar-foreground transition-colors outline-none hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-3 focus-visible:ring-sidebar-ring/70";
const estiloActivo = "bg-sidebar-accent text-sidebar-accent-foreground";

function esRutaActiva(ruta: string, actual: string) {
  return ruta === "/panel" ? actual === "/panel" : actual === ruta || actual.startsWith(`${ruta}/`);
}

function TituloGrupo({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-1 px-4 text-xs font-semibold tracking-[0.12em] text-sidebar-titulo uppercase">
      {children}
    </p>
  );
}

function Icono({ icono: Componente }: { icono: LucideIcon }) {
  return <Componente aria-hidden className="size-[1.125rem] shrink-0" />;
}

/**
 * Menú lateral del panel que resalta la pantalla actual. Se usa igual en computadora (barra fija)
 * y en celular (panel deslizable). `alNavegar` permite cerrar el panel del celular al elegir una opción.
 *
 * Leer la dirección actual (usePathname) en páginas con partes variables (/panel/catalogos/7) solo
 * es posible al visitar la página; por eso el layout lo envuelve en <Suspense> y, mientras tanto,
 * muestra <MenuPanel rutaActual={null} /> (el mismo menú sin resaltar).
 */
export function NavegacionPanel({ alNavegar }: { alNavegar?: () => void }) {
  return <MenuPanel rutaActual={usePathname()} alNavegar={alNavegar} />;
}

export function MenuPanel({ rutaActual, alNavegar }: { rutaActual: string | null; alNavegar?: () => void }) {
  const t = useTranslations("panel.menu");

  const enlace = (ruta: string, icono: LucideIcon, texto: string) => {
    const activo = rutaActual !== null && esRutaActiva(ruta, rutaActual);
    return (
      <Link
        href={ruta}
        onClick={alNavegar}
        aria-current={activo ? "page" : undefined}
        className={cn(estiloElemento, activo && estiloActivo)}
      >
        <Icono icono={icono} />
        {texto}
      </Link>
    );
  };

  return (
    <nav aria-label={t("etiqueta")} className="flex flex-col gap-6">
      {GRUPOS_MENU.map((grupo, indice) => (
        <div key={grupo.titulo ?? indice}>
          {grupo.titulo && <TituloGrupo>{t(grupo.titulo)}</TituloGrupo>}
          <ul className="flex flex-col gap-0.5">
            {grupo.elementos.map((elemento) => (
              <li key={elemento.clave}>{enlace(elemento.ruta, elemento.icono, t(elemento.clave))}</li>
            ))}
          </ul>
        </div>
      ))}

      <div>
        <TituloGrupo>{t("grupoOtros")}</TituloGrupo>
        <ul className="flex flex-col gap-0.5">
          <li>
            <a href="/" target="_blank" rel="noopener noreferrer" onClick={alNavegar} className={estiloElemento}>
              <Icono icono={ExternalLinkIcon} />
              {t("verSitio")}
              <span className="sr-only"> {t("pestanaNueva")}</span>
            </a>
          </li>
          <li>{enlace(RUTA_MI_CUENTA, UserRoundIcon, t("miCuenta"))}</li>
          <li>
            <form action={salir}>
              <button type="submit" className={estiloElemento}>
                <Icono icono={LogOutIcon} />
                {t("salir")}
              </button>
            </form>
          </li>
        </ul>
      </div>
    </nav>
  );
}
