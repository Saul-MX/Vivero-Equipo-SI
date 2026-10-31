import Link from "next/link";
import { useTranslations } from "next-intl";
import { CONTENEDOR } from "@/components/sitio/encabezado";

// «No encontrada» dentro del sitio (por ejemplo, una planta oculta o una dirección mal escrita):
// conserva el encabezado, el pie y el botón de WhatsApp.
export default function NoEncontradaSitio() {
  const t = useTranslations();

  return (
    <section className={`${CONTENEDOR} flex flex-col items-start gap-5 py-20`}>
      <p className="text-xs font-semibold tracking-[0.2em] text-texto-suave uppercase">404</p>
      <h1 className="text-4xl font-semibold text-pino sm:text-5xl">{t("noEncontrado.titulo")}</h1>
      <p className="max-w-xl text-lg text-texto-suave">{t("noEncontrado.texto")}</p>
      <div className="flex flex-wrap gap-3">
        <Link
          href="/"
          className="inline-flex min-h-11 items-center rounded-full bg-acento-fondo px-6 font-semibold text-acento-texto outline-none hover:opacity-90 focus-visible:ring-4 focus-visible:ring-ring/50"
        >
          {t("noEncontrado.volver")}
        </Link>
        <Link
          href="/plantas"
          className="inline-flex min-h-11 items-center rounded-full px-6 font-semibold text-pino ring-1 ring-border outline-none hover:bg-muted focus-visible:ring-4 focus-visible:ring-ring/50"
        >
          {t("sitio.menu.todasLasPlantas")}
        </Link>
      </div>
    </section>
  );
}
