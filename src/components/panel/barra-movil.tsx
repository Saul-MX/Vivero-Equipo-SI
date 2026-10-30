"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { MenuIcon, XIcon } from "lucide-react";
import { Logo } from "@/components/marca/logo";
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { NavegacionPanel } from "./navegacion-panel";

const estiloBotonIcono =
  "inline-flex size-11 items-center justify-center rounded-full text-white outline-none hover:bg-sidebar-accent focus-visible:ring-3 focus-visible:ring-sidebar-ring/70";

/** Barra superior del panel en celular: nombre del vivero y botón para abrir el menú. */
export function BarraMovil() {
  const t = useTranslations("panel.menu");
  const [abierto, setAbierto] = useState(false);

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between bg-sidebar px-4 lg:hidden">
      <Logo tono="claro" tamano="sm" />
      <Sheet open={abierto} onOpenChange={setAbierto}>
        <SheetTrigger className={estiloBotonIcono}>
          <MenuIcon aria-hidden className="size-6" />
          <span className="sr-only">{t("abrir")}</span>
        </SheetTrigger>
        <SheetContent
          side="left"
          showCloseButton={false}
          aria-describedby={undefined}
          className="w-[85%] max-w-xs gap-0 overflow-y-auto border-none bg-sidebar px-3 pt-4 pb-8 text-sidebar-foreground"
        >
          <div className="mb-6 flex items-center justify-between pl-4">
            <SheetTitle className="text-white">
              <Logo tono="claro" tamano="sm" />
            </SheetTitle>
            <SheetClose className={estiloBotonIcono}>
              <XIcon aria-hidden className="size-6" />
              <span className="sr-only">{t("cerrar")}</span>
            </SheetClose>
          </div>
          <NavegacionPanel alNavegar={() => setAbierto(false)} />
        </SheetContent>
      </Sheet>
    </header>
  );
}
