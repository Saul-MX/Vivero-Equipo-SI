"use client";

import Image from "next/image";
import { useId, useState, type DragEvent } from "react";
import { useTranslations } from "next-intl";
import { ImageUpIcon, Loader2Icon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { urlImagen } from "@/lib/archivos/claves";
import { cn } from "@/lib/utils";
import { useCampoArchivo } from "./use-campo-archivo";
import { useTraductorErrores } from "./use-traductor-errores";
import { ACEPTA_IMAGEN, ACEPTA_IMAGEN_ANUNCIO, subirArchivo } from "./subir-archivo";

type Props = {
  etiqueta: string;
  ayuda?: string;
  /** Clave del archivo (guardado o recién subido), o null si no hay foto. */
  valor: string | null;
  alCambiar: (clave: string | null) => void;
  /** Foto de perfil (testimonios): vista previa redonda. */
  redonda?: boolean;
  /** «imagenAnuncio» acepta también GIF y la reduce a 2400 px (carrusel). */
  tipo?: "imagen" | "imagenAnuncio";
};

/** Una sola foto (portada de catálogo, foto de fertilizante): elegir o arrastrar, ver, cambiar y quitar. */
export function SubirImagen({ etiqueta, ayuda, valor, alCambiar, redonda = false, tipo = "imagen" }: Props) {
  const marco = redonda ? "size-28 rounded-full" : "h-28 w-40 rounded-xl";
  const t = useTranslations("panel.archivos");
  const traducir = useTraductorErrores();
  const id = useId();
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState<string>();
  const [arrastrando, setArrastrando] = useState(false);

  const subir = async (archivo: File | undefined) => {
    if (!archivo) return;
    setError(undefined);
    setSubiendo(true);
    const resultado = await subirArchivo(archivo, tipo);
    setSubiendo(false);
    if (resultado.ok) alCambiar(resultado.clave);
    else setError(traducir(resultado.error));
  };
  const campo = useCampoArchivo((archivos) => void subir(archivos[0]));

  const soltar = (evento: DragEvent) => {
    evento.preventDefault();
    setArrastrando(false);
    void subir(evento.dataTransfer.files[0]);
  };

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {etiqueta}
      </label>
      <div
        onDragOver={(evento) => {
          evento.preventDefault();
          setArrastrando(true);
        }}
        onDragLeave={() => setArrastrando(false)}
        onDrop={soltar}
        className={cn(
          "flex flex-col items-center gap-4 rounded-2xl border-2 border-dashed border-salvia/60 bg-muted/40 p-4 sm:flex-row",
          arrastrando && "border-hoja bg-muted",
        )}
      >
        {valor ? (
          <Image
            src={urlImagen(valor, "tarjeta")}
            alt={t("vistaPrevia")}
            width={redonda ? 112 : 160}
            height={112}
            unoptimized
            className={cn("shrink-0 bg-card object-cover", marco)}
          />
        ) : (
          <span aria-hidden className={cn("flex shrink-0 items-center justify-center bg-card text-salvia", marco)}>
            <ImageUpIcon className="size-8" />
          </span>
        )}
        <div className="flex flex-1 flex-col items-center gap-2 sm:items-start">
          <p className="text-center text-sm text-texto-suave sm:text-left">{t("arrastra")}</p>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" asChild disabled={subiendo}>
              <label htmlFor={id} className="cursor-pointer">
                {subiendo ? <Loader2Icon aria-hidden className="animate-spin" /> : <ImageUpIcon aria-hidden />}
                {subiendo ? t("subiendo") : valor ? t("cambiarFoto") : t("elegirFoto")}
              </label>
            </Button>
            {valor && !subiendo && (
              <Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={() => alCambiar(null)}>
                <Trash2Icon aria-hidden />
                {t("quitarFoto")}
              </Button>
            )}
          </div>
          <input
            ref={campo}
            id={id}
            type="file"
            accept={tipo === "imagenAnuncio" ? ACEPTA_IMAGEN_ANUNCIO : ACEPTA_IMAGEN}
            className="sr-only"
            disabled={subiendo}
            aria-describedby={`${id}-ayuda${error ? ` ${id}-error` : ""}`}
            onChange={(evento) => {
              void subir(evento.target.files?.[0]);
              evento.target.value = "";
            }}
          />
        </div>
      </div>
      <p id={`${id}-ayuda`} className="text-sm text-texto-suave">
        {ayuda ?? t(tipo === "imagenAnuncio" ? "ayudaImagenAnuncio" : "ayudaImagen")}
      </p>
      {error && (
        <p id={`${id}-error`} role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
