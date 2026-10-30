import { useTranslations } from "next-intl";

// Se muestra mientras cada página del panel revisa la sesión y carga sus datos.
export default function Cargando() {
  const t = useTranslations("comun");

  return (
    <div role="status" className="flex flex-col gap-4">
      <span className="sr-only">{t("cargando")}</span>
      <div aria-hidden className="h-10 w-64 animate-pulse rounded-full bg-crema/50" />
      <div aria-hidden className="h-5 w-96 max-w-full animate-pulse rounded-full bg-crema/40" />
      <div aria-hidden className="mt-4 h-40 animate-pulse rounded-2xl bg-card" />
    </div>
  );
}
