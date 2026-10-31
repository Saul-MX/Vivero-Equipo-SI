import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import {
  CircleCheckIcon,
  EyeOffIcon,
  ExternalLinkIcon,
  FilmIcon,
  ImageOffIcon,
  MailIcon,
  MegaphoneIcon,
  NewspaperIcon,
  PhoneOffIcon,
  PlusIcon,
} from "lucide-react";
import { EncabezadoPagina } from "@/components/panel/encabezado-pagina";
import { EsqueletoContenido, EsqueletoEncabezado } from "@/components/panel/esqueleto";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { urlImagen } from "@/lib/archivos/claves";
import { requerirUsuario } from "@/lib/auth/sesion";
import { listarAnunciosPanel } from "@/lib/carrusel/anuncios";
import { leerPendientes } from "@/lib/panel/pendientes";
import { degradadoTemporada } from "@/lib/sitio/color";
import { textoTemporadaActual } from "@/lib/temporadas/texto-actual";
import { leerEstadoTemporadas } from "@/lib/temporadas/temporadas";
import { cn } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("panel");
  return { title: t("tituloPagina") };
}

// Inicio del panel (sección 4.1): lo que se ve hoy en el sitio y lo que falta por hacer.
export default function PaginaInicioPanel() {
  return (
    <Suspense
      fallback={
        <>
          <EsqueletoEncabezado />
          <EsqueletoContenido />
        </>
      }
    >
      <Inicio />
    </Suspense>
  );
}

async function Inicio() {
  const usuario = await requerirUsuario();
  const [t, estado, pendientes, anuncios] = await Promise.all([
    getTranslations("panel"),
    leerEstadoTemporadas(),
    leerPendientes(),
    listarAnunciosPanel(),
  ]);
  const anunciosHoy = anuncios.filter((anuncio) => anuncio.saleHoy);
  const { vigente } = estado;
  const tarjeta = vigente ? degradadoTemporada(vigente.catalogo.color) : null;

  const accesos = [
    { href: "/panel/plantas/nueva", icono: PlusIcon, texto: t("inicio.accesos.planta") },
    { href: "/panel/carrusel/nuevo", icono: MegaphoneIcon, texto: t("inicio.accesos.anuncio") },
    { href: "/panel/novedades/nueva", icono: NewspaperIcon, texto: t("inicio.accesos.novedad") },
    { href: "/panel/mensajes", icono: MailIcon, texto: t("inicio.accesos.mensajes"), cuenta: pendientes.mensajesSinLeer },
  ];

  const filasPendientes = [
    {
      clave: "mensajes",
      icono: MailIcon,
      texto: t("inicio.pendientes.mensajes", { n: pendientes.mensajesSinLeer }),
      cuenta: pendientes.mensajesSinLeer,
      href: "/panel/mensajes?ver=sin-leer",
      accion: t("inicio.pendientes.abrir"),
    },
    {
      clave: "ocultas",
      icono: EyeOffIcon,
      texto: t("inicio.pendientes.ocultas", { n: pendientes.plantasOcultas }),
      cuenta: pendientes.plantasOcultas,
      href: "/panel/plantas?revisar=ocultas",
      accion: t("inicio.pendientes.revisar"),
    },
    {
      clave: "sinFoto",
      icono: ImageOffIcon,
      texto: t("inicio.pendientes.sinFoto", { n: pendientes.plantasSinFoto }),
      cuenta: pendientes.plantasSinFoto,
      href: "/panel/plantas?revisar=sin-foto",
      accion: t("inicio.pendientes.ver"),
    },
  ];

  return (
    <>
      <EncabezadoPagina
        titulo={t("inicio.saludo", { usuario: usuario.usuario })}
        subtitulo={t("inicio.subtitulo")}
        acciones={
          <Button asChild>
            <a href="/" target="_blank" rel="noopener noreferrer">
              {t("inicio.verSitio")}
              <ExternalLinkIcon aria-hidden />
              <span className="sr-only">{t("menu.pestanaNueva")}</span>
            </a>
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Temporada actual, con su color como fondo degradado. */}
        <section
          aria-labelledby="titulo-temporada-actual"
          data-testid="tarjeta-temporada"
          className="flex flex-col justify-between gap-6 rounded-3xl p-6 shadow-sm sm:p-8 lg:col-span-2"
          style={
            tarjeta
              ? { backgroundImage: `linear-gradient(135deg, ${tarjeta.desde}, ${tarjeta.hasta})`, color: tarjeta.texto }
              : { backgroundColor: "var(--pino)", color: "#ffffff" }
          }
        >
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] uppercase opacity-90">{t("inicio.temporadaActual")}</p>
            <h2 id="titulo-temporada-actual" className="mt-2 text-4xl font-semibold text-current sm:text-5xl">
              {vigente?.catalogo.nombre ?? t("temporadas.ningunaSeVe")}
            </h2>
            {vigente?.textoAviso && <p className="mt-2 text-lg">{vigente.textoAviso}</p>}
            <p className="mt-3 text-sm opacity-90">{await textoTemporadaActual(estado)}</p>
          </div>
          <Link
            href="/panel/temporadas"
            className="inline-flex min-h-11 items-center self-start rounded-full bg-white px-6 font-semibold text-pino outline-none hover:opacity-90 focus-visible:ring-4 focus-visible:ring-white/60"
          >
            {t("inicio.cambiarTemporada")}
          </Link>
        </section>

        <Card>
          <CardHeader>
            <CardTitle>
              <h2>{t("inicio.accesos.titulo")}</h2>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="grid grid-cols-2 gap-3">
              {accesos.map((acceso) => (
                <li key={acceso.href}>
                  <Link
                    href={acceso.href}
                    className="relative flex h-full min-h-24 flex-col justify-between gap-2 rounded-2xl bg-muted/60 p-4 font-medium text-pino outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    <acceso.icono aria-hidden className="size-5 text-hoja" />
                    {acceso.texto}
                    {acceso.cuenta ? (
                      <span className="absolute top-3 right-3 rounded-full bg-hoja px-2 py-0.5 text-xs font-semibold text-white">
                        {acceso.cuenta}
                        <span className="sr-only"> {t("inicio.accesos.sinLeer")}</span>
                      </span>
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              <h2>{t("inicio.pendientes.titulo")}</h2>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col divide-y divide-border">
              {filasPendientes.map((fila) => (
                <li key={fila.clave} data-pendiente={fila.clave} className="flex items-center gap-3 py-3">
                  <span
                    aria-hidden
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-full",
                      fila.cuenta > 0 ? "bg-[#fdf6e3] text-[#5c4a0c]" : "bg-muted text-salvia",
                    )}
                  >
                    {fila.cuenta > 0 ? <fila.icono className="size-4" /> : <CircleCheckIcon className="size-4" />}
                  </span>
                  <span className="flex-1 text-sm text-foreground">{fila.texto}</span>
                  {fila.cuenta > 0 && (
                    <Button variant="outline" size="sm" asChild>
                      <Link href={fila.href}>{fila.accion}</Link>
                    </Button>
                  )}
                </li>
              ))}
              {pendientes.faltaWhatsapp && (
                <li data-pendiente="whatsapp" className="flex items-center gap-3 py-3">
                  <span aria-hidden className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#fdecea] text-[#8a2018]">
                    <PhoneOffIcon className="size-4" />
                  </span>
                  <span className="flex-1 text-sm font-medium text-[#8a2018]">{t("inicio.pendientes.whatsapp")}</span>
                  <Button size="sm" asChild>
                    <Link href="/panel/datos-y-redes">{t("inicio.pendientes.poner")}</Link>
                  </Button>
                </li>
              )}
            </ul>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>
              <h2>{t("inicio.anuncios.titulo")}</h2>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {anunciosHoy.length === 0 ? (
              <p className="flex flex-wrap items-center gap-x-3 gap-y-2 text-texto-suave">
                {t("inicio.anuncios.ninguno")}
                <Link href="/panel/carrusel/nuevo" className="font-semibold text-pino underline underline-offset-4">
                  {t("inicio.anuncios.crear")}
                </Link>
              </p>
            ) : (
              <ul className="grid gap-3 sm:grid-cols-2">
                {anunciosHoy.map((anuncio) => {
                  const imagen = anuncio.tipoMedio === "VIDEO" ? anuncio.imagenEspera : anuncio.archivo;
                  return (
                    <li key={anuncio.id}>
                      <Link
                        href={`/panel/carrusel/${anuncio.id}`}
                        className="flex items-center gap-3 rounded-2xl p-2 outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
                      >
                        {imagen ? (
                          <Image
                            src={urlImagen(imagen, "tarjeta")}
                            alt=""
                            width={96}
                            height={54}
                            unoptimized
                            className="h-12 w-20 shrink-0 rounded-lg object-cover"
                          />
                        ) : (
                          <span aria-hidden className="flex h-12 w-20 shrink-0 items-center justify-center rounded-lg bg-pino text-white">
                            <FilmIcon className="size-5" />
                          </span>
                        )}
                        <span className="min-w-0">
                          <span className="block font-medium text-foreground">{anuncio.titulo}</span>
                          <span className="text-sm text-texto-suave">
                            {anuncio.temporada?.nombre ?? t("carrusel.siempre")}
                          </span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
