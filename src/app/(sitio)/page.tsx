import Image from "next/image";
import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import { ArrowRightIcon, FlaskConicalIcon, QuoteIcon } from "lucide-react";
import { CarruselPortada } from "@/components/sitio/carrusel-portada";
import { AvatarTestimonio } from "@/components/sitio/avatar-testimonio";
import { CONTENEDOR } from "@/components/sitio/encabezado";
import { TarjetaCatalogo } from "@/components/sitio/tarjeta-catalogo";
import { RejillaPlantas } from "@/components/sitio/tarjeta-planta";
import { urlImagen } from "@/lib/archivos/claves";
import {
  anunciosDeHoySitio,
  catalogosVisibles,
  mostrarDisponibilidad,
  novedadesVisibles,
  plantasVisibles,
  temporadaDelSitio,
  testimoniosVisibles,
} from "@/lib/sitio/datos";
import { metadatosPagina } from "@/lib/sitio/metadatos";
import { cn } from "@/lib/utils";

export async function generateMetadata() {
  const [t, { vigente }] = await Promise.all([getTranslations("metadatos"), temporadaDelSitio()]);
  return metadatosPagina({
    titulo: t("titulo"),
    descripcion: t("descripcion"),
    ruta: "/",
    imagen: vigente?.fotoPortada,
    tituloCompleto: true,
  });
}

const BOTON =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-6 font-semibold outline-none transition-opacity hover:opacity-90 focus-visible:ring-4 focus-visible:ring-ring/50";

export default async function PaginaInicio() {
  const t = await getTranslations("sitio");
  const [formato, anuncios, { vigente }, catalogos, novedades, testimonios, conDisponibilidad] = await Promise.all([
    getFormatter(),
    anunciosDeHoySitio(),
    temporadaDelSitio(),
    catalogosVisibles(),
    novedadesVisibles(),
    testimoniosVisibles(),
    mostrarDisponibilidad(),
  ]);
  const plantasTemporada = vigente ? (await plantasVisibles({ catalogoId: vigente.catalogoId })).slice(0, 4) : [];
  const permanentes = catalogos.filter((catalogo) => catalogo.permanente);

  return (
    <>
      {anuncios.length > 0 ? (
        <>
          <h1 className="sr-only">{t("inicio.tituloOculto")}</h1>
          <div className="mx-auto max-w-[1600px] sm:px-4 sm:pt-4">
            <div className="overflow-hidden sm:rounded-3xl">
              <CarruselPortada anuncios={anuncios} />
            </div>
          </div>
        </>
      ) : (
        <section className="bg-bosque text-white">
          <div className={cn(CONTENEDOR, "flex flex-col items-start gap-5 py-20 sm:py-28")}>
            <p className="text-xs font-semibold tracking-[0.2em] text-crema uppercase">{t("inicio.lugar")}</p>
            <h1 className="max-w-2xl text-4xl leading-tight font-semibold text-balance text-white sm:text-6xl">
              {t("inicio.bienvenidaTitulo")}
            </h1>
            <p className="max-w-xl text-lg text-crema">{t("inicio.bienvenidaTexto")}</p>
            <div className="flex flex-wrap gap-3">
              <Link href="/temporada" className={cn(BOTON, "bg-acento-fondo text-acento-texto")}>
                {t("inicio.verTemporada")}
              </Link>
              <Link href="/contacto" className={cn(BOTON, "border-2 border-white text-white")}>
                {t("menu.contacto")}
              </Link>
            </div>
          </div>
        </section>
      )}

      {vigente && (
        <section aria-labelledby="titulo-temporada" className={cn(CONTENEDOR, "mt-14")}>
          <div className="grid overflow-hidden rounded-3xl bg-acento-fondo text-acento-texto md:grid-cols-2">
            <div className="flex flex-col items-start justify-center gap-4 p-8 sm:p-12">
              <p className="text-xs font-semibold tracking-[0.2em] uppercase opacity-90">{t("inicio.temporadaActual")}</p>
              <h2 id="titulo-temporada" className="text-4xl leading-tight font-semibold text-acento-texto sm:text-5xl">
                {vigente.nombre}
              </h2>
              {vigente.textoAviso && <p className="text-lg">{vigente.textoAviso}</p>}
              <Link href="/temporada" className={cn(BOTON, "mt-2 bg-white text-pino")}>
                {t("inicio.verTemporada")}
                <ArrowRightIcon aria-hidden className="size-4" />
              </Link>
            </div>
            {vigente.fotoPortada && (
              <Image
                src={urlImagen(vigente.fotoPortada)}
                alt=""
                width={1200}
                height={900}
                unoptimized
                className="aspect-4/3 h-full w-full object-cover md:aspect-auto"
              />
            )}
          </div>
          {plantasTemporada.length > 0 && (
            <div className="mt-8">
              <RejillaPlantas plantas={plantasTemporada} conDisponibilidad={conDisponibilidad} vacio="" primerasVisibles={0} />
            </div>
          )}
        </section>
      )}

      <section aria-labelledby="titulo-catalogos" className={cn(CONTENEDOR, "mt-20")}>
        <h2 id="titulo-catalogos" className="text-3xl font-semibold text-pino sm:text-4xl">
          {t("inicio.catalogos")}
        </h2>
        <p className="mt-2 text-lg text-texto-suave">{t("inicio.catalogosTexto")}</p>
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {permanentes.map((catalogo) => (
            <li key={catalogo.slug}>
              <TarjetaCatalogo
                href={`/catalogos/${catalogo.slug}`}
                nombre={catalogo.nombre}
                fotoPortada={catalogo.fotoPortada}
                plantas={catalogo.plantas}
              />
            </li>
          ))}
          <li>
            <Link
              href="/fertilizantes"
              className="flex aspect-4/3 flex-col justify-between rounded-3xl bg-white p-5 ring-1 ring-border outline-none hover:shadow-lg focus-visible:ring-4 focus-visible:ring-ring/60"
            >
              <span aria-hidden className="flex size-12 items-center justify-center rounded-full bg-acento-fondo text-acento-texto">
                <FlaskConicalIcon className="size-6" />
              </span>
              <span>
                <span className="block font-serif text-2xl font-semibold text-pino">{t("menu.fertilizantes")}</span>
                <span className="text-sm text-texto-suave">{t("inicio.fertilizantesTexto")}</span>
              </span>
            </Link>
          </li>
        </ul>
        <Link href="/plantas" className="mt-6 inline-flex items-center gap-2 font-semibold text-pino underline underline-offset-4">
          {t("menu.todasLasPlantas")}
          <ArrowRightIcon aria-hidden className="size-4" />
        </Link>
      </section>

      {novedades.length > 0 && (
        <section aria-labelledby="titulo-novedades" className={cn(CONTENEDOR, "mt-20")}>
          <h2 id="titulo-novedades" className="text-3xl font-semibold text-pino sm:text-4xl">
            {t("inicio.novedades")}
          </h2>
          <ul className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {novedades.map((novedad) => (
              <li key={novedad.id}>
                <article className="flex h-full flex-col overflow-hidden rounded-3xl bg-white ring-1 ring-border">
                  {novedad.imagen && (
                    <Image
                      src={urlImagen(novedad.imagen, "tarjeta")}
                      alt=""
                      width={640}
                      height={400}
                      unoptimized
                      className="aspect-video h-auto w-full object-cover"
                    />
                  )}
                  <div className="flex flex-1 flex-col gap-2 p-6">
                    <time dateTime={novedad.creadoEn.toISOString()} className="text-sm font-medium text-texto-suave">
                      {formato.dateTime(novedad.creadoEn, { dateStyle: "long" })}
                    </time>
                    <h3 className="font-serif text-2xl leading-snug font-semibold text-pino">{novedad.titulo}</h3>
                    <p className="whitespace-pre-line text-foreground">{novedad.texto}</p>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        </section>
      )}

      {testimonios.length > 0 && (
        <section aria-labelledby="titulo-testimonios" className={cn(CONTENEDOR, "mt-20")}>
          <h2 id="titulo-testimonios" className="text-3xl font-semibold text-pino sm:text-4xl">
            {t("inicio.testimonios")}
          </h2>
          <ul className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {testimonios.map((testimonio) => (
              <li key={testimonio.id}>
                <figure className="flex h-full flex-col gap-5 rounded-3xl bg-white p-6 ring-1 ring-border">
                  <QuoteIcon aria-hidden className="size-8 text-acento" />
                  <blockquote className="flex-1 text-lg text-pretty text-foreground">{testimonio.texto}</blockquote>
                  <figcaption className="flex items-center gap-3">
                    <AvatarTestimonio avatar={testimonio.avatar} nombre={testimonio.nombre} />
                    <span className="font-semibold text-pino">{testimonio.nombre}</span>
                  </figcaption>
                </figure>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
