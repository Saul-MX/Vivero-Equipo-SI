import type { Metadata } from "next";
import { Suspense } from "react";
import { useTranslations } from "next-intl";
import { Logo } from "@/components/marca/logo";
import { BarraMovil } from "@/components/panel/barra-movil";
import { MenuPanel, NavegacionPanel } from "@/components/panel/navegacion-panel";

// Las pantallas del panel no deben aparecer en buscadores.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

// El menú no depende del usuario, así que se muestra al instante.
// La sesión se revisa dentro de cada página (requerirUsuario), no aquí: al navegar entre
// pantallas del panel el layout no se vuelve a ejecutar, así que no serviría como única barrera.
export default function LayoutPanel({ children }: { children: React.ReactNode }) {
  const t = useTranslations("panel");

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[17.5rem_minmax(0,1fr)]">
      <aside className="hidden bg-sidebar lg:block">
        <div className="sticky top-0 flex max-h-dvh flex-col overflow-y-auto px-3 py-8">
          <div className="mb-8 px-4">
            <Logo tono="claro" tamano="sm" />
            <p className="mt-2 text-xs text-sidebar-titulo">{t("subtituloMarca")}</p>
          </div>
          <Suspense fallback={<MenuPanel rutaActual={null} />}>
            <NavegacionPanel />
          </Suspense>
        </div>
      </aside>
      <div className="flex min-w-0 flex-col">
        <BarraMovil />
        <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
