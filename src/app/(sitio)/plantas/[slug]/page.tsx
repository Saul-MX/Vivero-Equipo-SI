import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { CloudIcon, CloudSunIcon, DropletsIcon, FlaskConicalIcon, SunIcon } from "lucide-react";
import { WhatsappDePlanta } from "@/components/sitio/boton-whatsapp-planta";
import { CONTENEDOR } from "@/components/sitio/encabezado";
import { EsqueletoSitio } from "@/components/sitio/esqueleto-sitio";
import { GaleriaPlanta } from "@/components/sitio/galeria-planta";
import { Migas } from "@/components/sitio/migas";
import { EtiquetaDisponibilidad } from "@/components/sitio/tarjeta-planta";
import { mostrarDisponibilidad, plantaPorSlug } from "@/lib/sitio/datos";
import { metadatosPagina, resumen } from "@/lib/sitio/metadatos";
import { cn } from "@/lib/utils";

const ICONO_LUZ = { SOL: SunIcon, MEDIA_SOMBRA: CloudSunIcon, SOMBRA: CloudIcon } as const;

const nombreCompleto = (planta: { nombre: string; variedad: string | null }) =>
  planta.variedad ? `${planta.nombre} ${planta.variedad}` : planta.nombre;

export async function generateMetadata({ params }: PageProps<"/plantas/[slug]">) {
  const { slug } = await params;
  const [t, planta] = await Promise.all([getTranslations("sitio.planta"), plantaPorSlug(slug)]);
  if (!planta) return { title: t("noEncontrada") };
  return metadatosPagina({
    titulo: nombreCompleto(planta),
    descripcion: resumen(planta.descripcionCorta, t("descripcionPorDefecto", { nombre: nombreCompleto(planta) })),
    ruta: `/plantas/${planta.slug}`,
    imagen: planta.fotos[0]?.archivo,
  });
}

export default function PaginaPlanta({ params }: PageProps<"/plantas/[slug]">) {
  return (
    <Suspense fallback={<EsqueletoSitio />}>
      <FichaPlanta params={params} />
    </Suspense>
  );
}

function Bloque({ titulo, icono, children, className }: { titulo: string; icono?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("border-t border-hilo pt-5", className)}>
      <h2 className="mb-4 flex items-center gap-3 text-2xl font-bold tracking-tight text-pino">
        {icono && (
          <span aria-hidden className="text-hoja-viva">
            {icono}
          </span>
        )}
        {titulo}
      </h2>
      {children}
    </section>
  );
}

/** Ficha de una planta (URL estable /plantas/<slug>, la misma del QR). */
async function FichaPlanta({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [t, tMenu, tWhatsapp, planta, conDisponibilidad] = await Promise.all([
    getTranslations("sitio.planta"),
    getTranslations("sitio.menu"),
    getTranslations("sitio.whatsapp"),
    plantaPorSlug(slug),
    mostrarDisponibilidad(),
  ]);
  if (!planta) notFound();

  const riego = [
    planta.riegoDiasSemana === 7
      ? t("riegoDiario")
      : planta.riegoDiasSemana
        ? t("riegoVeces", { n: planta.riegoDiasSemana })
        : null,
    planta.cantidadAgua ? t("cantidadAgua", { cantidad: t(`cantidades.${planta.cantidadAgua}`) }) : null,
    planta.notaRiego,
  ].filter((linea): linea is string => Boolean(linea));
  const caracteristicas = planta.luces.length + planta.colores.length + planta.macetas.length > 0;

  return (
    <article className={cn(CONTENEDOR, "pt-8 sm:pt-12")}>
      <Migas
        className="mb-6"
        migas={[
          { texto: tMenu("catalogos"), href: "/catalogos" },
          ...(planta.catalogo.visible ? [{ texto: planta.catalogo.nombre, href: `/catalogos/${planta.catalogo.slug}` }] : []),
          { texto: nombreCompleto(planta) },
        ]}
      />
      <div className="grid gap-8 md:grid-cols-2 md:gap-12">
        <GaleriaPlanta
          fotos={planta.fotos}
          textos={{
            fotos: planta.fotos.map((_, indice) =>
              t("fotoDe", { nombre: nombreCompleto(planta), n: indice + 1, total: planta.fotos.length }),
            ),
            verFoto: planta.fotos.map((_, indice) => t("verFoto", { n: indice + 1 })),
          }}
        />

        <div className="flex flex-col gap-5">
          {planta.catalogo.visible && (
            <Link
              href={`/catalogos/${planta.catalogo.slug}`}
              className="dato flex items-center gap-2 self-start text-texto-suave underline-offset-4 hover:underline"
            >
              <span aria-hidden className="size-2.5 rounded-full bg-acento" />
              {planta.catalogo.nombre}
            </Link>
          )}
          <div>
            <h1 className="titulo-etiqueta text-5xl text-pino sm:text-6xl">{planta.nombre}</h1>
            {planta.variedad && <p className="dato mt-2 text-base text-texto-suave">{planta.variedad}</p>}
          </div>
          {(planta.etiqueta || conDisponibilidad) && (
            <div className="flex flex-wrap items-center gap-3">
              {planta.etiqueta && (
                <span className="dato rounded-sm bg-acento-fondo px-2 py-0.5 text-acento-texto">
                  {t(`etiquetas.${planta.etiqueta}`)}
                </span>
              )}
              {conDisponibilidad && <EtiquetaDisponibilidad disponible={planta.disponible} />}
            </div>
          )}
          {planta.descripcionCorta && <p className="max-w-[56ch] text-lg text-pretty text-foreground">{planta.descripcionCorta}</p>}
          <WhatsappDePlanta
            mensaje={tWhatsapp("mensajePlanta", { nombre: nombreCompleto(planta) })}
            texto={tWhatsapp("preguntarPlanta")}
          />

          {caracteristicas && (
            <dl className="border-b border-hilo">
              {planta.luces.length > 0 && (
                <div className="grid grid-cols-[9rem_1fr] gap-4 border-t border-hilo py-3">
                  <dt className="dato pt-0.5 text-texto-suave">{t("luz")}</dt>
                  <dd className="dato flex flex-wrap gap-x-4 gap-y-1 text-[0.9375rem]">
                    {planta.luces.map((luz) => {
                      const Icono = ICONO_LUZ[luz];
                      return (
                        <span key={luz} className="inline-flex items-center gap-1.5">
                          <Icono aria-hidden className="size-4 text-hoja-viva" />
                          {t(`luces.${luz}`)}
                        </span>
                      );
                    })}
                  </dd>
                </div>
              )}
              {planta.colores.length > 0 && (
                <div className="grid grid-cols-[9rem_1fr] gap-4 border-t border-hilo py-3">
                  <dt className="dato pt-0.5 text-texto-suave">{t("colores")}</dt>
                  <dd className="dato flex flex-wrap gap-x-4 gap-y-1 text-[0.9375rem]">
                    {planta.colores.map((color) => (
                      <span key={color.nombre} className="inline-flex items-center gap-1.5">
                        <span aria-hidden className="size-3.5 rounded-full ring-1 ring-black/20" style={{ backgroundColor: color.hex }} />
                        {color.nombre}
                      </span>
                    ))}
                  </dd>
                </div>
              )}
              {planta.macetas.length > 0 && (
                <div className="grid grid-cols-[9rem_1fr] gap-4 border-t border-hilo py-3">
                  <dt className="dato pt-0.5 text-texto-suave">{t("macetas")}</dt>
                  <dd className="dato flex flex-wrap gap-x-4 gap-y-1 text-[0.9375rem]">
                    {planta.macetas.map((maceta) => (
                      <span key={maceta.nombre}>{maceta.nombre}</span>
                    ))}
                  </dd>
                </div>
              )}
            </dl>
          )}
        </div>
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        {(riego.length > 0 || planta.fertilizante) && (
          <Bloque titulo={t("riego")} icono={<DropletsIcon className="size-5" />}>
            <ul className="dato flex flex-col gap-2 text-[0.9375rem] text-foreground">
              {riego.map((linea) => (
                <li key={linea}>{linea}</li>
              ))}
            </ul>
            {planta.fertilizante && (
              <p className="mt-4 flex items-center gap-2 border-t border-border pt-4">
                <FlaskConicalIcon aria-hidden className="size-5 shrink-0 text-hoja" />
                <span>
                  {t("fertilizante")}{" "}
                  <Link
                    href={`/fertilizantes#fertilizante-${planta.fertilizante.id}`}
                    className="font-semibold text-pino underline underline-offset-4"
                  >
                    {planta.fertilizante.nombre}
                  </Link>
                </span>
              </p>
            )}
          </Bloque>
        )}
        {planta.cuidados && (
          <Bloque titulo={t("cuidados")}>
            <div className="flex flex-col gap-3 text-foreground">
              {planta.cuidados
                .split(/\n\s*\n|\n/)
                .filter(Boolean)
                .map((parrafo) => (
                  <p key={parrafo}>{parrafo}</p>
                ))}
            </div>
          </Bloque>
        )}
      </div>
    </article>
  );
}
