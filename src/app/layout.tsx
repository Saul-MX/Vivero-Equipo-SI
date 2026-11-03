import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { OPEN_GRAPH_COMUN, urlDelSitio } from "@/lib/sitio/metadatos";
import "./globals.css";

// Todo el sitio usa la fuente del propio teléfono o computadora (Roboto, San Francisco, Segoe…):
// no se descarga ninguna fuente y se ve limpia y legible.

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("metadatos");
  return {
    metadataBase: urlDelSitio(),
    title: { default: t("titulo"), template: t("plantillaTitulo") },
    description: t("descripcion"),
    openGraph: { ...OPEN_GRAPH_COMUN, title: t("titulo"), description: t("descripcion") },
  };
}

// Los textos para el navegador (NextIntlClientProvider) los pone cada zona en su layout:
// el sitio público solo los suyos y el panel los del panel. Así un visitante no descarga
// los textos del panel.
export default async function RootLayout({ children }: LayoutProps<"/">) {
  const locale = await getLocale();

  return (
    <html lang={locale} className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
