import { getTranslations } from "next-intl/server";
import { CabeceraPagina } from "@/components/sitio/cabecera-pagina";
import { CONTENEDOR } from "@/components/sitio/encabezado";
import { TarjetaCatalogo } from "@/components/sitio/tarjeta-catalogo";
import { catalogosVisibles, temporadaDelSitio } from "@/lib/sitio/datos";
import { metadatosPagina } from "@/lib/sitio/metadatos";

export async function generateMetadata() {
  const t = await getTranslations("sitio.catalogos");
  return metadatosPagina({ titulo: t("titulo"), descripcion: t("descripcion"), ruta: "/catalogos" });
}

/** Todos los catálogos del menú, más la temporada que se ve hoy. */
export default async function PaginaCatalogos() {
  const t = await getTranslations("sitio");
  const [catalogos, { vigente }] = await Promise.all([catalogosVisibles(), temporadaDelSitio()]);
  const temporada = vigente && catalogos.find((catalogo) => catalogo.id === vigente.catalogoId && !catalogo.permanente);

  return (
    <>
      <CabeceraPagina migas={[{ texto: t("catalogos.titulo") }]} titulo={t("catalogos.titulo")}>
        <p>{t("catalogos.descripcion")}</p>
      </CabeceraPagina>
      <ul className={`${CONTENEDOR} border-b border-hilo`}>
        {temporada && (
          <li>
            <TarjetaCatalogo
              href="/temporada"
              nombre={t("catalogos.temporada", { nombre: temporada.nombre })}
              fotoPortada={temporada.fotoPortada}
              plantas={temporada.plantas}
            />
          </li>
        )}
        {catalogos
          .filter((catalogo) => catalogo.permanente)
          .map((catalogo) => (
            <li key={catalogo.slug}>
              <TarjetaCatalogo
                href={`/catalogos/${catalogo.slug}`}
                nombre={catalogo.nombre}
                fotoPortada={catalogo.fotoPortada}
                plantas={catalogo.plantas}
              />
            </li>
          ))}
      </ul>
    </>
  );
}
