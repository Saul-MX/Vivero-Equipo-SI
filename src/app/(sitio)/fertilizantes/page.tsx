import Image from "next/image";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { FlaskConicalIcon, TriangleAlertIcon } from "lucide-react";
import { CabeceraPagina } from "@/components/sitio/cabecera-pagina";
import { CONTENEDOR } from "@/components/sitio/encabezado";
import { urlImagen } from "@/lib/archivos/claves";
import { fertilizantesVisibles } from "@/lib/sitio/datos";
import { metadatosPagina } from "@/lib/sitio/metadatos";
import { TIPOS_FERTILIZANTE } from "@/lib/validacion/fertilizante";

export async function generateMetadata() {
  const t = await getTranslations("sitio.fertilizantes");
  return metadatosPagina({ titulo: t("titulo"), descripcion: t("descripcion"), ruta: "/fertilizantes" });
}

type Tipo = (typeof TIPOS_FERTILIZANTE)[number];

/** Los fertilizantes visibles, con todas sus indicaciones (sección 3, apartado 4). */
export default async function PaginaFertilizantes() {
  const [t, tTipos, fertilizantes] = await Promise.all([
    getTranslations("sitio.fertilizantes"),
    getTranslations("panel.fertilizantes.tipos"),
    fertilizantesVisibles(),
  ]);

  return (
    <>
      <CabeceraPagina migas={[{ texto: t("titulo") }]} titulo={t("titulo")}>
        <p>{t("descripcion")}</p>
      </CabeceraPagina>
      <div className={CONTENEDOR}>
        {fertilizantes.length === 0 ? (
          <p className="rounded-md border border-dashed border-hilo p-10 text-center text-texto-suave">{t("vacio")}</p>
        ) : (
          <ul className="flex flex-col gap-6">
            {fertilizantes.map((fertilizante, indice) => (
              <li key={fertilizante.id} id={`fertilizante-${fertilizante.id}`} className="scroll-mt-24">
                <article className="grid overflow-hidden rounded-md border border-hilo bg-white md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
                  {fertilizante.foto ? (
                    <Image
                      src={urlImagen(fertilizante.foto)}
                      alt={t("fotoDe", { nombre: fertilizante.nombre })}
                      width={800}
                      height={800}
                      unoptimized
                      loading={indice === 0 ? "eager" : "lazy"}
                      className="aspect-square h-auto w-full bg-muted object-cover md:h-full"
                    />
                  ) : (
                    <span aria-hidden className="flex aspect-square items-center justify-center bg-muted text-salvia md:aspect-auto">
                      <FlaskConicalIcon className="size-16" />
                    </span>
                  )}
                  <div className="flex flex-col gap-5 p-6 sm:p-8">
                    <div>
                      {fertilizante.tipo && (
                        <p className="dato text-texto-suave">
                          {(TIPOS_FERTILIZANTE as readonly string[]).includes(fertilizante.tipo)
                            ? tTipos(fertilizante.tipo as Tipo)
                            : fertilizante.tipo}
                        </p>
                      )}
                      <h2 className="mt-1 text-3xl font-semibold text-pino">{fertilizante.nombre}</h2>
                      {fertilizante.paraQueSirve && <p className="mt-2 text-lg text-foreground">{fertilizante.paraQueSirve}</p>}
                    </div>
                    <dl className="grid gap-4 sm:grid-cols-3">
                      {[
                        [t("dosis"), fertilizante.dosis],
                        [t("frecuencia"), fertilizante.frecuencia],
                        [t("presentacion"), fertilizante.presentacion],
                      ]
                        .filter(([, valor]) => valor)
                        .map(([etiqueta, valor]) => (
                          <div key={etiqueta} className="rounded-2xl bg-muted p-4">
                            <dt className="text-sm font-semibold text-texto-suave">{etiqueta}</dt>
                            <dd className="mt-1 text-foreground">{valor}</dd>
                          </div>
                        ))}
                    </dl>
                    {fertilizante.pasos.length > 0 && (
                      <div>
                        <h3 className="mb-2 font-sans text-base font-semibold text-pino">{t("comoSeAplica")}</h3>
                        <ol className="flex list-decimal flex-col gap-1 pl-5 text-foreground marker:font-semibold marker:text-hoja">
                          {fertilizante.pasos.map((paso) => (
                            <li key={paso}>{paso}</li>
                          ))}
                        </ol>
                      </div>
                    )}
                    {fertilizante.precauciones && (
                      <p className="flex gap-2 rounded-2xl bg-[#fdf6e3] p-4 text-[#5c4a0c]">
                        <TriangleAlertIcon aria-hidden className="mt-0.5 size-5 shrink-0" />
                        <span>
                          <strong>{t("precauciones")}</strong> {fertilizante.precauciones}
                        </span>
                      </p>
                    )}
                    {fertilizante.catalogos.length > 0 && (
                      <p className="text-sm text-texto-suave">
                        {t("recomendadoPara")}{" "}
                        {fertilizante.catalogos.map((catalogo, indice) => (
                          <span key={catalogo.slug}>
                            {indice > 0 && ", "}
                            <Link href={`/catalogos/${catalogo.slug}`} className="font-semibold text-pino underline underline-offset-4">
                              {catalogo.nombre}
                            </Link>
                          </span>
                        ))}
                      </p>
                    )}
                  </div>
                </article>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
