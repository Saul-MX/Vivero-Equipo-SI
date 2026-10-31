import { getTranslations } from "next-intl/server";
import { CabeceraPagina } from "@/components/sitio/cabecera-pagina";
import { CONTENEDOR } from "@/components/sitio/encabezado";
import { RejillaPlantas } from "@/components/sitio/tarjeta-planta";
import { mostrarDisponibilidad, plantasVisibles, temporadaDelSitio } from "@/lib/sitio/datos";
import { metadatosPagina } from "@/lib/sitio/metadatos";

export async function generateMetadata() {
  const [t, { vigente }] = await Promise.all([getTranslations("sitio.temporada"), temporadaDelSitio()]);
  return metadatosPagina({
    titulo: vigente ? t("tituloCon", { nombre: vigente.nombre }) : t("titulo"),
    descripcion: vigente?.textoAviso || t("descripcion"),
    ruta: "/temporada",
    imagen: vigente?.fotoPortada,
  });
}

/** Regla 4: solo las plantas visibles del catálogo de la temporada que se ve hoy. Cambia sola. */
export default async function PaginaTemporada() {
  const t = await getTranslations("sitio.temporada");
  const [{ vigente }, conDisponibilidad] = await Promise.all([temporadaDelSitio(), mostrarDisponibilidad()]);
  const plantas = vigente ? await plantasVisibles({ catalogoId: vigente.catalogoId }) : [];

  return (
    <>
      <CabeceraPagina antetitulo={t("titulo")} titulo={vigente?.nombre ?? t("titulo")} foto={vigente?.fotoPortada}>
        <p>{vigente?.textoAviso || t("descripcion")}</p>
      </CabeceraPagina>
      <section aria-label={t("plantas")} className={CONTENEDOR}>
        <RejillaPlantas plantas={plantas} conDisponibilidad={conDisponibilidad} vacio={t("vacio")} />
      </section>
    </>
  );
}
