import Image from "next/image";
import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { CabeceraPagina } from "@/components/sitio/cabecera-pagina";
import { CONTENEDOR } from "@/components/sitio/encabezado";
import { urlImagen } from "@/lib/archivos/claves";
import { contenidoNosotros } from "@/lib/sitio/datos";
import { metadatosPagina, resumen } from "@/lib/sitio/metadatos";
import { cn } from "@/lib/utils";

export async function generateMetadata() {
  const [t, contenido] = await Promise.all([getTranslations("sitio.nosotros"), contenidoNosotros()]);
  return metadatosPagina({
    titulo: t("titulo"),
    descripcion: resumen(contenido.historia.parrafos[0], t("descripcion")),
    ruta: "/nosotros",
    imagen: contenido.historia.fotoSuperior,
  });
}

type Foto = { archivo: string; ancho: number; alto: number };

/** Mosaico de fotos (columnas que respetan la forma de cada foto). */
/** `primera`: es la galería de la primera sección; sus primeras fotos se ven al abrir la página. */
function Galeria({ fotos, titulo, primera = false }: { fotos: Foto[]; titulo: string; primera?: boolean }) {
  if (fotos.length === 0) return null;
  return (
    <ul aria-label={titulo} className="mt-8 columns-2 gap-3 sm:columns-3 [&>li]:mb-3">
      {fotos.map((foto, indice) => (
        <li key={foto.archivo} className="break-inside-avoid">
          <Image
            src={urlImagen(foto.archivo, "tarjeta")}
            alt={`${titulo} ${indice + 1}`}
            width={foto.ancho}
            height={foto.alto}
            unoptimized
            loading={primera && indice < 2 ? "eager" : "lazy"}
            className="h-auto w-full rounded-2xl bg-muted"
          />
        </li>
      ))}
    </ul>
  );
}

function Seccion({
  id,
  titulo,
  fotoSuperior,
  primera = false,
  children,
}: {
  id: string;
  titulo: string;
  fotoSuperior: string | null;
  /** La primera sección de la página: su foto de arriba se ve al abrirla y se carga sin esperar. */
  primera?: boolean;
  children: ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={`titulo-${id}`} className={cn(CONTENEDOR, "mt-16 scroll-mt-24")}>
      <h2 id={`titulo-${id}`} className="flex items-center gap-3 text-3xl font-semibold text-pino sm:text-4xl">
        <span aria-hidden className="h-8 w-1.5 rounded-full bg-acento" />
        {titulo}
      </h2>
      {fotoSuperior && (
        <Image
          src={urlImagen(fotoSuperior)}
          alt=""
          width={1600}
          height={900}
          unoptimized
          loading={primera ? "eager" : "lazy"}
          className="mt-6 aspect-video h-auto w-full rounded-md object-cover"
        />
      )}
      {children}
    </section>
  );
}

const Parrafos = ({ parrafos }: { parrafos: string[] }) =>
  parrafos.length > 0 ? (
    <div className="mt-6 flex max-w-3xl flex-col gap-4 text-lg text-pretty text-foreground">
      {parrafos.map((parrafo) => (
        <p key={parrafo}>{parrafo}</p>
      ))}
    </div>
  ) : null;

/** Historia (con línea del tiempo y galería), Misión, Visión y Valores. */
export default async function PaginaNosotros() {
  const [t, { historia, momentos, mision, vision, valores }] = await Promise.all([
    getTranslations("sitio.nosotros"),
    contenidoNosotros(),
  ]);
  const secciones = [
    { id: "historia", titulo: t("historia"), hay: historia.parrafos.length + momentos.length + historia.galeria.length > 0 },
    { id: "mision", titulo: t("mision"), hay: mision.parrafos.length + mision.galeria.length > 0 || !!mision.fotoSuperior },
    { id: "vision", titulo: t("vision"), hay: vision.parrafos.length + vision.galeria.length > 0 || !!vision.fotoSuperior },
    { id: "valores", titulo: t("valores"), hay: valores.lista.length + valores.galeria.length > 0 || !!valores.fotoSuperior },
  ].filter((seccion) => seccion.hay);
  // Lo primero que se ve al abrir la página se carga sin esperar (mejora el LCP).
  const primera = secciones[0]?.id;

  return (
    <>
      <CabeceraPagina migas={[{ texto: t("titulo") }]} titulo={t("titulo")}>
        <p>{t("descripcion")}</p>
        {secciones.length > 1 && (
          <nav aria-label={t("enEstaPagina")}>
            <ul className="flex flex-wrap gap-2 text-base">
              {secciones.map((seccion) => (
                <li key={seccion.id}>
                  <a
                    href={`#${seccion.id}`}
                    className="inline-flex min-h-10 items-center rounded-full bg-white px-4 font-medium text-pino border border-hilo hover:bg-muted"
                  >
                    {seccion.titulo}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </CabeceraPagina>

      {secciones.length === 0 && (
        <p className={cn(CONTENEDOR, "text-texto-suave")}>{t("vacio")}</p>
      )}

      {secciones.some((seccion) => seccion.id === "historia") && (
        <Seccion id="historia" titulo={t("historia")} fotoSuperior={historia.fotoSuperior} primera={primera === "historia"}>
          <Parrafos parrafos={historia.parrafos} />
          {momentos.length > 0 && (
            <div className="mt-12">
              <h3 className="text-2xl font-semibold text-pino">{t("momentos")}</h3>
              <ol className="relative mt-6 flex flex-col gap-8 border-l-2 border-acento pl-8">
                {momentos.map((momento) => (
                  <li key={momento.id} className="relative">
                    <span aria-hidden className="absolute top-1.5 -left-[2.6rem] size-4 rounded-full border-4 border-white bg-acento-fondo ring-2 ring-acento" />
                    <p className="text-2xl font-semibold text-pino">{momento.titulo}</p>
                    {momento.texto && <p className="mt-1 max-w-2xl text-lg text-foreground">{momento.texto}</p>}
                    {momento.foto && (
                      <Image
                        src={urlImagen(momento.foto, "tarjeta")}
                        alt={momento.titulo}
                        width={640}
                        height={480}
                        unoptimized
                        className="mt-3 aspect-4/3 h-auto w-full max-w-sm rounded-2xl object-cover"
                      />
                    )}
                  </li>
                ))}
              </ol>
            </div>
          )}
          <Galeria fotos={historia.galeria} titulo={t("galeriaDe", { seccion: t("historia") })} primera={primera === "historia"} />
        </Seccion>
      )}

      {secciones.some((seccion) => seccion.id === "mision") && (
        <Seccion id="mision" titulo={t("mision")} fotoSuperior={mision.fotoSuperior} primera={primera === "mision"}>
          <Parrafos parrafos={mision.parrafos} />
          <Galeria fotos={mision.galeria} titulo={t("galeriaDe", { seccion: t("mision") })} primera={primera === "mision"} />
        </Seccion>
      )}

      {secciones.some((seccion) => seccion.id === "vision") && (
        <Seccion id="vision" titulo={t("vision")} fotoSuperior={vision.fotoSuperior} primera={primera === "vision"}>
          <Parrafos parrafos={vision.parrafos} />
          <Galeria fotos={vision.galeria} titulo={t("galeriaDe", { seccion: t("vision") })} primera={primera === "vision"} />
        </Seccion>
      )}

      {secciones.some((seccion) => seccion.id === "valores") && (
        <Seccion id="valores" titulo={t("valores")} fotoSuperior={valores.fotoSuperior} primera={primera === "valores"}>
          {valores.lista.length > 0 && (
            <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {valores.lista.map((valor) => (
                <li key={valor.id} className="rounded-md border border-hilo bg-white p-6">
                  <h3 className="text-xl font-semibold text-pino">{valor.titulo}</h3>
                  {valor.descripcion && <p className="mt-2 text-foreground">{valor.descripcion}</p>}
                </li>
              ))}
            </ul>
          )}
          <Galeria fotos={valores.galeria} titulo={t("galeriaDe", { seccion: t("valores") })} primera={primera === "valores"} />
        </Seccion>
      )}
    </>
  );
}
