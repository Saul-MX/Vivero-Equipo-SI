import type { ReactNode } from "react";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { Toaster } from "@/components/ui/sonner";

// Todo el panel (acceso y pantallas privadas): sus textos para el navegador y los avisos
// emergentes («Listo, se guardó»). Los textos del sitio público no se envían aquí.
export default async function LayoutRaizPanel({ children }: { children: ReactNode }) {
  const [todos, t] = await Promise.all([getMessages(), getTranslations("comun")]);
  const mensajes = Object.fromEntries(Object.entries(todos).filter(([seccion]) => seccion !== "sitio"));

  return (
    <NextIntlClientProvider messages={mensajes}>
      {children}
      <Toaster position="top-center" containerAriaLabel={t("notificaciones")} />
    </NextIntlClientProvider>
  );
}
