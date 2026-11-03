import Image from "next/image";
import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import { FlaskConicalIcon } from "lucide-react";
import { CarruselPortada } from "@/components/sitio/carrusel-portada";
import { DiapositivaAnuncio } from "@/components/sitio/diapositiva-anuncio";
import { AvatarTestimonio } from "@/components/sitio/avatar-testimonio";
import { CONTENEDOR } from "@/components/sitio/encabezado";
import { TarjetaCatalogo } from "@/components/sitio/tarjeta-catalogo";
import { RejillaPlantas } from "@/components/sitio/tarjeta-planta";
import { urlImagen } from "@/lib/archivos/claves";
import { obtenerDatosNegocio } from "@/lib/datos-negocio/datos";
import { crearEnlaceWhatsapp } from "@/lib/datos-negocio/normalizar";
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
  // Las diapositivas se arman aquí (en el servidor); el carrusel del navegador solo elige cuál se ve.
  const [tCarrusel, datos] = await Promise.all([getTranslations("sitio.carrusel"), obtenerDatosNegocio()]);
  const enlaceWhatsapp = datos.whatsapp ? crearEnlaceWhatsapp(datos.whatsapp, t("whatsapp.mensajeGeneral")) : null;
  const total = anuncios.length;
  const textosCarrusel = {
    carrusel: tCarrusel("carrusel"),
    nombre: tCarrusel("nombre"),
    diapositiva: tCarrusel("diapositiva"),
    posiciones: anuncios.map((_, indice) => tCarrusel("posicion", { n: indice + 1, total })),
    anterior: tCarrusel("anterior"),
    siguiente: tCarrusel("siguiente"),
    irA: anuncios.map((_, indice) => tCarrusel("irA", { n: indice + 1 })),
    pausar: tCarrusel("pausar"),
    reanudar: tCarrusel("reanudar"),
  };
  const plantasTemporada = vigente ? (await plantasVisibles({ catalogoId: vigente.catalogoId })).slice(0, 4) : [];
  const permanentes = catalogos.filter((catalogo) => catalogo.permanente);

  return (
    <>
      {anuncios.length > 0 ? (
        <>
          <h1 className="sr-only">{t("inicio.tituloOculto")}</h1>
          <div className="mx-auto max-w-[1600px] sm:px-4 sm:pt-4">
            <div className="overflow-hidden sm:rounded-md">
              <CarruselPortada
                textos={textosCarrusel}
                diapositivas={anuncios.map((anuncio, indice) => (
                  <DiapositivaAnuncio
                    key={anuncio.id}
                    anuncio={anuncio}
                    enlaceWhatsapp={enlaceWhatsapp}
                    prioritario={indice === 0}
                  />
                ))}
              />
            </div>
          </div>
        </>
      ) : (
        <section className="bg-pino text-white">
          <div className={cn(CONTENEDOR, "flex flex-col items-start gap-5 py-20 sm:py-28")}>
            <p className="dato entrada text-crema">{t("inicio.lugar")}</p>
            <h1 className="titulo-etiqueta entrada max-w-3xl text-5xl text-white sm:text-7xl">
              {t("inicio.bienvenidaTitulo")}
            </h1>
            <p className="entrada-2 max-w-[56ch] text-lg text-crema">{t("inicio.bienvenidaTexto")}</p>
            <div className="entrada-2 flex flex-wrap gap-3">
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
          <div className="grid overflow-hidden rounded-md bg-acento-fondo text-acento-texto md:grid-cols-2">
            <div className="flex flex-col items-start justify-center gap-4 p-8 sm:p-12">
              <p className="dato">{t("inicio.temporadaActual")}</p>
              <h2 id="titulo-temporada" className="titulo-etiqueta text-5xl text-acento-texto sm:text-7xl">
                {vigente.nombre}
              </h2>
              {vigente.textoAviso && <p className="max-w-[44ch] text-lg">{vigente.textoAviso}</p>}
              <Link href="/temporada" className={cn(BOTON, "mt-2 bg-white text-pino")}>
                {t("inicio.verTemporada")}
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
              <RejillaPlantas plantas={plantasTemporada} conDisponibilidad={conDisponibilidad} vacio="" primerasVisibles={0} filtro={false} />
            </div>
          )}
        </section>
      )}

      <section aria-labelledby="titulo-catalogos" className={cn(CONTENEDOR, "mt-20")}>
        <h2 id="titulo-catalogos" className="titulo-etiqueta text-4xl text-pino sm:text-5xl">
          {t("inicio.catalogos")}
        </h2>
        <p className="mt-3 max-w-[56ch] text-lg text-texto-suave">{t("inicio.catalogosTexto")}</p>
        <ul className="mt-8 border-b border-hilo">
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
              className="group grid grid-cols-[5rem_1fr] items-center gap-4 border-t border-hilo py-4 outline-none focus-visible:ring-3 focus-visible:ring-ring/60 sm:grid-cols-[7rem_1fr] sm:gap-6"
            >
              <span aria-hidden className="flex aspect-4/3 items-center justify-center rounded-md bg-pino text-white">
                <FlaskConicalIcon className="size-6" />
              </span>
              <span>
                <span className="titulo-etiqueta block text-2xl text-pino underline-offset-4 group-hover:underline sm:text-3xl">
                  {t("menu.fertilizantes")}
                </span>
                <span className="dato mt-1 block text-texto-suave">{t("inicio.fertilizantesTexto")}</span>
              </span>
            </Link>
          </li>
        </ul>
        <Link href="/plantas" className="mt-6 inline-flex items-center font-semibold text-pino underline underline-offset-4">
          {t("menu.todasLasPlantas")}
        </Link>
      </section>

      {novedades.length > 0 && (
        <section aria-labelledby="titulo-novedades" className={cn(CONTENEDOR, "mt-20")}>
          <h2 id="titulo-novedades" className="titulo-etiqueta text-4xl text-pino sm:text-5xl">
            {t("inicio.novedades")}
          </h2>
          <ul className="mt-8 grid gap-x-6 gap-y-10 md:grid-cols-2 lg:grid-cols-3">
            {novedades.map((novedad) => (
              <li key={novedad.id}>
                <article className="flex h-full flex-col gap-4">
                  {novedad.imagen && (
                    <Image
                      src={urlImagen(novedad.imagen, "tarjeta")}
                      alt=""
                      width={640}
                      height={400}
                      unoptimized
                      className="aspect-video h-auto w-full rounded-md object-cover"
                    />
                  )}
                  <div className="flex flex-1 flex-col gap-2 border-t border-hilo pt-4">
                    <time dateTime={novedad.creadoEn.toISOString()} className="dato text-texto-suave">
                      {formato.dateTime(novedad.creadoEn, { dateStyle: "long" })}
                    </time>
                    <h3 className="text-2xl leading-snug font-bold tracking-tight text-pino">{novedad.titulo}</h3>
                    <p className="max-w-[62ch] whitespace-pre-line text-foreground">{novedad.texto}</p>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        </section>
      )}

      {testimonios.length > 0 && (
        <section aria-labelledby="titulo-testimonios" className={cn(CONTENEDOR, "mt-20")}>
          <h2 id="titulo-testimonios" className="titulo-etiqueta text-4xl text-pino sm:text-5xl">
            {t("inicio.testimonios")}
          </h2>
          <ul className="mt-8 grid gap-x-8 gap-y-10 md:grid-cols-2 lg:grid-cols-3">
            {testimonios.map((testimonio) => (
              <li key={testimonio.id}>
                <figure className="flex h-full flex-col gap-5 border-l-4 border-acento pl-5">
                  <blockquote className="flex-1 text-xl text-pretty text-foreground">{testimonio.texto}</blockquote>
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
