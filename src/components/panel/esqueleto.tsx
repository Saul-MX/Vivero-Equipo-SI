import { useTranslations } from "next-intl";

// Marcadores grises que se ven por un instante mientras una pantalla revisa la sesión y carga sus datos.

export function EsqueletoEncabezado() {
  return (
    <div aria-hidden className="mb-8 flex flex-col gap-3">
      <div className="h-10 w-64 max-w-full animate-pulse rounded-full bg-crema/50" />
      <div className="h-5 w-96 max-w-full animate-pulse rounded-full bg-crema/40" />
    </div>
  );
}

export function EsqueletoContenido() {
  const t = useTranslations("comun");

  return (
    <div role="status">
      <span className="sr-only">{t("cargando")}</span>
      <div aria-hidden className="h-40 animate-pulse rounded-2xl bg-card" />
    </div>
  );
}
