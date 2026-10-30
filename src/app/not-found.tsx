import Link from "next/link";
import { useTranslations } from "next-intl";
import { Logo } from "@/components/marca/logo";
import { Button } from "@/components/ui/button";

// Página «no encontrada» (404) en español, para todo el sitio y el panel.
export default function NoEncontrado() {
  const t = useTranslations("noEncontrado");

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 px-4 py-16 text-center">
      <Logo conLugar />
      <h1 className="text-3xl font-semibold sm:text-4xl">{t("titulo")}</h1>
      <p className="max-w-md text-texto-suave">{t("texto")}</p>
      <Button asChild>
        <Link href="/">{t("volver")}</Link>
      </Button>
    </main>
  );
}
