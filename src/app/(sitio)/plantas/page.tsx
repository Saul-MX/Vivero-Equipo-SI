import { getTranslations } from "next-intl/server";
import { CabeceraPagina } from "@/components/sitio/cabecera-pagina";
import { CONTENEDOR } from "@/components/sitio/encabezado";
import { RejillaPlantas } from "@/components/sitio/tarjeta-planta";
import { mostrarDisponibilidad, plantasVisibles } from "@/lib/sitio/datos";
import { metadatosPagina } from "@/lib/sitio/metadatos";

export async function generateMetadata() {
  const t = await getTranslations("sitio.plantas");
  return metadatosPagina({ titulo: t("titulo"), descripcion: t("descripcion"), ruta: "/plantas" });
}

/** «Ver todas las plantas»: todas las plantas visibles, de todos los catálogos. */
export default async function PaginaPlantas() {
  const t = await getTranslations("sitio.plantas");
  const [plantas, conDisponibilidad] = await Promise.all([plantasVisibles(), mostrarDisponibilidad()]);

  return (
    <>
      <CabeceraPagina migas={[{ texto: t("titulo") }]} titulo={t("titulo")}>
        <p>{t("descripcion")}</p>
      </CabeceraPagina>
      <section aria-labelledby="titulo-plantas" className={CONTENEDOR}>
        <h2 id="titulo-plantas" className="sr-only">
          {t("titulo")}
        </h2>
        <RejillaPlantas plantas={plantas} conDisponibilidad={conDisponibilidad} vacio={t("vacio")} />
      </section>
    </>
  );
}
