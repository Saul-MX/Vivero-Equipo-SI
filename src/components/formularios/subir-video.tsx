"use client";

import { useId, useState, type DragEvent } from "react";
import { useTranslations } from "next-intl";
import { FilmIcon, Loader2Icon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { urlVideo } from "@/lib/archivos/claves";
import { cn } from "@/lib/utils";
import { useCampoArchivo } from "./use-campo-archivo";
import { useTraductorErrores } from "./use-traductor-errores";
import { ACEPTA_VIDEO, subirArchivo } from "./subir-archivo";

type Props = {
  etiqueta: string;
  /** Clave del video (guardado o recién subido), o null si no hay. */
  valor: string | null;
  alCambiar: (clave: string | null) => void;
};

/** Un video MP4 o WebM de hasta 40 MB (anuncios del carrusel): elegir o arrastrar, ver, cambiar y quitar. */
export function SubirVideo({ etiqueta, valor, alCambiar }: Props) {
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
    const resultado = await subirArchivo(archivo, "video");
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
          <video
            key={valor}
            src={urlVideo(valor)}
            muted
            controls
            playsInline
            preload="metadata"
            aria-label={t("vistaPreviaVideo")}
            className="h-28 w-40 shrink-0 rounded-xl bg-bosque object-cover"
          />
        ) : (
          <span aria-hidden className="flex h-28 w-40 shrink-0 items-center justify-center rounded-xl bg-card text-salvia">
            <FilmIcon className="size-8" />
          </span>
        )}
        <div className="flex flex-1 flex-col items-center gap-2 sm:items-start">
          <p className="text-center text-sm text-texto-suave sm:text-left">{t("arrastraVideo")}</p>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" asChild disabled={subiendo}>
              <label htmlFor={id} className="cursor-pointer">
                {subiendo ? <Loader2Icon aria-hidden className="animate-spin" /> : <FilmIcon aria-hidden />}
                {subiendo ? t("subiendo") : valor ? t("cambiarVideo") : t("elegirVideo")}
              </label>
            </Button>
            {valor && !subiendo && (
              <Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={() => alCambiar(null)}>
                <Trash2Icon aria-hidden />
                {t("quitarVideo")}
              </Button>
            )}
          </div>
          <input
            ref={campo}
            id={id}
            type="file"
            accept={ACEPTA_VIDEO}
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
        {t("ayudaVideo")}
      </p>
      {error && (
        <p id={`${id}-error`} role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
