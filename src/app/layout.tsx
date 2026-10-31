import type { Metadata } from "next";
import { Fraunces } from "next/font/google";
import { getLocale, getTranslations } from "next-intl/server";
import { OPEN_GRAPH_COMUN, urlDelSitio } from "@/lib/sitio/metadatos";
import "./globals.css";

// Los títulos solo usan el grosor «semibold» (600): se carga ese único archivo, no la fuente
// variable completa, y los títulos aparecen antes en el celular.
const fraunces = Fraunces({
  subsets: ["latin"],
  weight: "600",
  variable: "--font-fraunces",
  display: "swap",
});

// El texto normal usa la fuente del propio teléfono o computadora (Roboto, San Francisco, Segoe…):
// no se descarga nada y se ve limpia y legible. Solo los títulos usan Fraunces.

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
    <html lang={locale} className={`${fraunces.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
