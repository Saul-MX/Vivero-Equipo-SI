import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import { Toaster } from "@/components/ui/sonner";
import { OPEN_GRAPH_COMUN, urlDelSitio } from "@/lib/sitio/metadatos";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  axes: ["SOFT", "opsz"],
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("metadatos");
  return {
    metadataBase: urlDelSitio(),
    title: { default: t("titulo"), template: t("plantillaTitulo") },
    description: t("descripcion"),
    openGraph: { ...OPEN_GRAPH_COMUN, title: t("titulo"), description: t("descripcion") },
  };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const locale = await getLocale();
  const t = await getTranslations("comun");

  return (
    <html lang={locale} className={`${fraunces.variable} ${inter.variable} h-full antialiased`}>
      <body className="min-h-full">
        <NextIntlClientProvider>
          {children}
          <Toaster position="top-center" containerAriaLabel={t("notificaciones")} />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
