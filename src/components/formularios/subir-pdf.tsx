"use client";

import { useId, useState } from "react";
import { useTranslations } from "next-intl";
import { FileTextIcon, Loader2Icon, Trash2Icon, UploadIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { urlPdf } from "@/lib/archivos/claves";
import { useTraductorErrores } from "./use-traductor-errores";
import { subirArchivo } from "./subir-archivo";

type Props = {
  etiqueta: string;
  valor: string | null;
  alCambiar: (clave: string | null) => void;
};

/** Un archivo PDF opcional (folleto del catálogo). */
export function SubirPdf({ etiqueta, valor, alCambiar }: Props) {
  const t = useTranslations("panel.archivos");
  const traducir = useTraductorErrores();
  const id = useId();
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState<string>();

  const subir = async (archivo: File | undefined) => {
    if (!archivo) return;
    setError(undefined);
    setSubiendo(true);
    const resultado = await subirArchivo(archivo, "pdf");
    setSubiendo(false);
    if (resultado.ok) alCambiar(resultado.clave);
    else setError(traducir(resultado.error));
  };

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {etiqueta}
      </label>
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-muted/40 p-3">
        {valor ? (
          <a
            href={urlPdf(valor)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-medium text-pino underline underline-offset-4"
          >
            <FileTextIcon aria-hidden className="size-4" />
            {t("verFolleto")}
          </a>
        ) : (
          <span className="text-sm text-texto-suave">{t("sinFolleto")}</span>
        )}
        <div className="ml-auto flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" asChild disabled={subiendo}>
            <label htmlFor={id} className="cursor-pointer">
              {subiendo ? <Loader2Icon aria-hidden className="animate-spin" /> : <UploadIcon aria-hidden />}
              {subiendo ? t("subiendo") : valor ? t("cambiarPdf") : t("elegirPdf")}
            </label>
          </Button>
          {valor && !subiendo && (
            <Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={() => alCambiar(null)}>
              <Trash2Icon aria-hidden />
              {t("quitarPdf")}
            </Button>
          )}
        </div>
        <input
          id={id}
          type="file"
          accept="application/pdf"
          className="sr-only"
          disabled={subiendo}
          aria-describedby={`${id}-ayuda${error ? ` ${id}-error` : ""}`}
          onChange={(evento) => {
            void subir(evento.target.files?.[0]);
            evento.target.value = "";
          }}
        />
      </div>
      <p id={`${id}-ayuda`} className="text-sm text-texto-suave">
        {t("ayudaPdf")}
      </p>
      {error && (
        <p id={`${id}-error`} role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
