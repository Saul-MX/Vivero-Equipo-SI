import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { CheckIcon, FileDownIcon } from "lucide-react";
import { CabeceraPagina } from "@/components/sitio/cabecera-pagina";
import { CONTENEDOR } from "@/components/sitio/encabezado";
import { EsqueletoSitio } from "@/components/sitio/esqueleto-sitio";
import { RejillaPlantas } from "@/components/sitio/tarjeta-planta";
import { urlPdf } from "@/lib/archivos/claves";
import { catalogoPorSlug, mostrarDisponibilidad } from "@/lib/sitio/datos";
import { metadatosPagina, resumen } from "@/lib/sitio/metadatos";

export async function generateMetadata({ params }: PageProps<"/catalogos/[slug]">) {
  const { slug } = await params;
  const [t, catalogo] = await Promise.all([getTranslations("sitio.catalogos"), catalogoPorSlug(slug)]);
  if (!catalogo) return { title: t("noEncontrado") };
  return metadatosPagina({
    titulo: catalogo.nombre,
    descripcion: resumen(catalogo.presentacion, t("descripcionCatalogo", { nombre: catalogo.nombre })),
    ruta: `/catalogos/${catalogo.slug}`,
    imagen: catalogo.fotoPortada,
  });
}

export default function PaginaCatalogo({ params }: PageProps<"/catalogos/[slug]">) {
  return (
    <Suspense fallback={<EsqueletoSitio />}>
      <Catalogo params={params} />
    </Suspense>
  );
}

async function Catalogo({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [t, catalogo, conDisponibilidad] = await Promise.all([
    getTranslations("sitio"),
    catalogoPorSlug(slug),
    mostrarDisponibilidad(),
  ]);
  if (!catalogo) notFound();

  return (
    <>
      <CabeceraPagina
        migas={[{ texto: t("catalogos.titulo"), href: "/catalogos" }, { texto: catalogo.nombre }]}
        antetitulo={t("catalogos.antetitulo")}
        titulo={catalogo.nombre}
        foto={catalogo.fotoPortada}
      >
        {catalogo.presentacion
          ?.split(/\n\s*\n/)
          .filter(Boolean)
          .map((parrafo) => <p key={parrafo}>{parrafo}</p>)}
        {catalogo.destacados.length > 0 && (
          <ul className="flex flex-col gap-2 text-base text-foreground">
            {catalogo.destacados.map((destacado) => (
              <li key={destacado} className="flex gap-2">
                <CheckIcon aria-hidden className="mt-1 size-4 shrink-0 text-hoja" />
                {destacado}
              </li>
            ))}
          </ul>
        )}
        {catalogo.folletoPdf && (
          <a
            href={urlPdf(catalogo.folletoPdf)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center gap-2 self-start rounded-full bg-acento-fondo px-6 text-base font-semibold text-acento-texto outline-none hover:opacity-90 focus-visible:ring-4 focus-visible:ring-ring/50"
          >
            <FileDownIcon aria-hidden className="size-5" />
            {t("catalogos.folleto")}
          </a>
        )}
      </CabeceraPagina>
      <section aria-labelledby="titulo-plantas" className={CONTENEDOR}>
        <h2 id="titulo-plantas" className="sr-only">
          {t("catalogos.plantasDe", { nombre: catalogo.nombre })}
        </h2>
        <RejillaPlantas plantas={catalogo.plantas} conDisponibilidad={conDisponibilidad} vacio={t("catalogos.vacio")} />
      </section>
    </>
  );
}
