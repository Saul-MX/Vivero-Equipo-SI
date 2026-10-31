import type { ReactNode } from "react";
import { urlImagen, urlVideo } from "@/lib/archivos/claves";
import { enlaceDeDestino } from "@/lib/carrusel/destino";
import { cn } from "@/lib/utils";

// Un anuncio del carrusel de portada. Lo usan la vista previa del panel y la portada del sitio,
// así que lo que se ve en el panel es exactamente lo que sale en el sitio.
//
// Se adapta al ANCHO DE SU RECUADRO (no al de la pantalla): por eso la vista previa «Celular»
// del panel, que es un recuadro angosto, se ve igual que en un teléfono.

export type DatosDiapositiva = {
  tipoMedio: "IMAGEN" | "VIDEO";
  archivo: string | null;
  archivoMovil: string | null;
  imagenEspera: string | null;
  imagenConTexto: boolean;
  textoPequeno: string;
  titulo: string;
  texto: string;
  boton1Texto: string;
  boton1Destino: string;
  boton2Texto: string;
  boton2Destino: string;
  posicionTexto: "IZQUIERDA" | "CENTRO" | "DERECHA";
  oscurecido: number;
};

const POSICION = {
  IZQUIERDA: "items-start text-left",
  CENTRO: "items-center text-center",
  DERECHA: "items-end text-right",
} as const;

type Props = {
  anuncio: DatosDiapositiva;
  enlaceWhatsapp: string | null;
  /** En la vista previa se elige a mano qué foto mostrar y los botones no navegan. */
  vistaPrevia?: "computadora" | "celular";
  /** El primer anuncio de la portada se carga sin esperar (el resto, al acercarse). */
  prioritario?: boolean;
};

export function DiapositivaAnuncio({ anuncio, enlaceWhatsapp, vistaPrevia, prioritario = false }: Props) {
  const fotoCelular = anuncio.tipoMedio === "IMAGEN" ? anuncio.archivoMovil : null;
  const principal = enlaceDeDestino(anuncio.boton1Destino, enlaceWhatsapp);

  let medio: ReactNode;
  if (!anuncio.archivo) {
    medio = <div aria-hidden className="absolute inset-0 bg-linear-to-br from-pino to-hoja" />;
  } else if (anuncio.tipoMedio === "VIDEO") {
    // El video es de fondo: siempre sin sonido, en bucle; mientras carga se ve la imagen de espera.
    medio = (
      <video
        key={anuncio.archivo}
        src={urlVideo(anuncio.archivo)}
        poster={anuncio.imagenEspera ? urlImagen(anuncio.imagenEspera) : undefined}
        autoPlay
        muted
        loop
        playsInline
        aria-hidden
        className="absolute inset-0 size-full object-cover"
      />
    );
  } else {
    const clase = cn("absolute inset-0 size-full", anuncio.imagenConTexto ? "object-contain" : "object-cover");
    // Si la imagen ya trae su texto, la imagen ES el contenido: su descripción es el título.
    const alt = anuncio.imagenConTexto ? anuncio.titulo : "";
    const carga = prioritario ? "eager" : "lazy";
    medio = vistaPrevia ? (
      // eslint-disable-next-line @next/next/no-img-element -- los archivos ya se sirven en WebP y reducidos
      <img
        src={urlImagen(vistaPrevia === "celular" && fotoCelular ? fotoCelular : anuncio.archivo)}
        alt={alt}
        className={clase}
      />
    ) : (
      <picture>
        {fotoCelular && <source media="(max-width: 767px)" srcSet={urlImagen(fotoCelular)} />}
        {/* <picture> elige la foto según el ancho del teléfono */}
        <img
          src={urlImagen(anuncio.archivo)}
          alt={alt}
          loading={carga}
          fetchPriority={prioritario ? "high" : "auto"}
          className={clase}
        />
      </picture>
    );
  }

  const boton = (textoBoton: string, destino: string, primario: boolean) => {
    if (!textoBoton) return null;
    const clase = cn(
      "inline-flex min-h-11 items-center justify-center rounded-full px-6 text-sm font-semibold @2xl:text-base",
      primario ? "bg-white text-pino" : "border-2 border-white text-white",
    );
    // En la vista previa se ve siempre (el panel avisa si falta el número de WhatsApp).
    if (vistaPrevia) return <span className={clase}>{textoBoton}</span>;
    // En el sitio, un botón a WhatsApp sin número en «Datos y redes» no se muestra.
    const enlace = enlaceDeDestino(destino, enlaceWhatsapp);
    if (!enlace) return null;
    return (
      <a
        href={enlace.href}
        className={cn(clase, "transition-opacity hover:opacity-90")}
        {...(enlace.externo ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      >
        {textoBoton}
      </a>
    );
  };

  return (
    <div className="@container">
      <div className="relative isolate aspect-4/5 w-full overflow-hidden bg-bosque @md:aspect-4/3 @2xl:aspect-21/9">
        {anuncio.imagenConTexto ? (
          // Toda la imagen lleva al botón principal; no se oscurece ni lleva texto encima.
          principal && !vistaPrevia ? (
            <a
              href={principal.href}
              aria-label={anuncio.titulo}
              className="absolute inset-0"
              {...(principal.externo ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            >
              {medio}
            </a>
          ) : (
            medio
          )
        ) : (
          <>
            {medio}
            <div
              aria-hidden
              className="absolute inset-0"
              style={{ backgroundColor: `rgb(0 0 0 / ${anuncio.oscurecido / 100})` }}
            />
            <div
              className={cn(
                "relative flex h-full flex-col justify-end gap-3 p-6 text-white @md:justify-center @md:p-10 @2xl:px-16",
                POSICION[anuncio.posicionTexto],
              )}
            >
              <div className={cn("flex max-w-xl flex-col gap-3", POSICION[anuncio.posicionTexto])}>
                {anuncio.textoPequeno && (
                  <p className="text-xs font-semibold tracking-[0.2em] uppercase @2xl:text-sm">{anuncio.textoPequeno}</p>
                )}
                <p className="font-serif text-3xl leading-tight font-semibold text-balance @md:text-4xl @2xl:text-5xl">
                  {anuncio.titulo}
                </p>
                {anuncio.texto && <p className="text-base text-pretty @2xl:text-lg">{anuncio.texto}</p>}
                <div className="mt-2 flex flex-wrap gap-3">
                  {boton(anuncio.boton1Texto, anuncio.boton1Destino, true)}
                  {boton(anuncio.boton2Texto, anuncio.boton2Destino, false)}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
