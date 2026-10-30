import { useTranslations } from "next-intl";
import { Logo } from "@/components/marca/logo";

// Portada provisional del sitio público. La portada real (carrusel, temporada, catálogos)
// se construye en la fase 5.
export default function PaginaInicio() {
  const t = useTranslations("sitio.construccion");

  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-bosque px-4 py-16 text-center">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgb(62_90_63/0.55),transparent_60%),radial-gradient(ellipse_at_bottom,rgb(30_58_46/0.8),transparent_55%)]"
      />
      <div className="relative max-w-xl">
        <Logo tono="claro" tamano="lg" conLugar />
        <h1 className="mt-12 text-3xl text-crema sm:text-4xl">{t("titulo")}</h1>
        <p className="mt-4 text-base leading-relaxed text-crema">{t("texto")}</p>
      </div>
    </main>
  );
}
