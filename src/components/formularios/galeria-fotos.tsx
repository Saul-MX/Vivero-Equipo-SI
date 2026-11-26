"use client";

import Image from "next/image";
import { useId, useState, type DragEvent } from "react";
import { useTranslations } from "next-intl";
import { ArrowLeftIcon, ArrowRightIcon, ImagePlusIcon, Loader2Icon, StarIcon, Trash2Icon } from "lucide-react";
import { ACEPTA_IMAGEN, subirArchivo } from "@/components/formularios/subir-archivo";
import { useCampoArchivo } from "@/components/formularios/use-campo-archivo";
import { useTraductorErrores } from "@/components/formularios/use-traductor-errores";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { urlImagen } from "@/lib/archivos/claves";
import { cn } from "@/lib/utils";
import { MAXIMO_FOTOS, type FotoEnFormulario } from "@/lib/validacion/planta";

/** Con portada, siempre hay exactamente una mientras haya fotos (si se quitó, pasa a la primera). */
function conPortada(fotos: FotoEnFormulario[]): FotoEnFormulario[] {
  if (fotos.length === 0 || fotos.some((foto) => foto.esPortada)) return fotos;
  return fotos.map((foto, indice) => ({ ...foto, esPortada: indice === 0 }));
}

/**
 * Varias fotos: subir, ordenar y quitar. En plantas además se elige la portada (marcada en verde);
 * en Nosotros (`conPortada={false}`) solo es una galería.
 */
export function GaleriaFotos({
  valor,
  alCambiar,
  conPortada: usaPortada = true,
  ayuda,
}: {
  valor: FotoEnFormulario[];
  alCambiar: (fotos: FotoEnFormulario[]) => void;
  conPortada?: boolean;
  ayuda?: string;
}) {
  const t = useTranslations("panel.plantas.galeria");
  const traducir = useTraductorErrores();
  const id = useId();
  const [progreso, setProgreso] = useState<{ actual: number; total: number } | null>(null);
  const [errores, setErrores] = useState<string[]>([]);
  const [arrastrando, setArrastrando] = useState(false);
  const lleno = valor.length >= MAXIMO_FOTOS;
  const ordenar = (fotos: FotoEnFormulario[]) => (usaPortada ? conPortada(fotos) : fotos);

  // Se suben una por una (cada envío lleva un solo archivo).
  const subir = async (archivos: File[]) => {
    const espacio = MAXIMO_FOTOS - valor.length;
    const porSubir = archivos.slice(0, espacio);
    const nuevosErrores = archivos.length > espacio ? [traducir("demasiadasFotos")!] : [];
    let fotos = valor;
    for (const [indice, archivo] of porSubir.entries()) {
      setProgreso({ actual: indice + 1, total: porSubir.length });
      const resultado = await subirArchivo(archivo, "imagen");
      if (resultado.ok) {
        fotos = ordenar([...fotos, { id: null, clave: resultado.clave, esPortada: false }]);
        alCambiar(fotos);
      } else {
        nuevosErrores.push(t("errorArchivo", { archivo: archivo.name, error: traducir(resultado.error)! }));
      }
    }
    setProgreso(null);
    setErrores(nuevosErrores);
  };
  const campo = useCampoArchivo((archivos) => void subir(archivos));

  const usarPortada = (indice: number) =>
    alCambiar(valor.map((foto, i) => ({ ...foto, esPortada: i === indice })));
  const mover = (indice: number, destino: number) => {
    const fotos = [...valor];
    [fotos[indice], fotos[destino]] = [fotos[destino], fotos[indice]];
    alCambiar(fotos);
  };
  const quitar = (indice: number) => alCambiar(ordenar(valor.filter((_, i) => i !== indice)));

  const soltar = (evento: DragEvent) => {
    evento.preventDefault();
    setArrastrando(false);
    if (!progreso) void subir([...evento.dataTransfer.files]);
  };

  return (
    <div className="flex flex-col gap-4">
      {valor.length > 0 && (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {valor.map((foto, indice) => (
            <li
              key={foto.clave}
              className={cn(
                "overflow-hidden rounded-2xl bg-card ring-1 ring-border",
                foto.esPortada && "ring-4 ring-hoja",
              )}
            >
              <div className="relative">
                <Image
                  src={urlImagen(foto.clave, "tarjeta")}
                  alt={t("foto", { n: indice + 1 })}
                  width={320}
                  height={320}
                  unoptimized
                  className="aspect-square h-auto w-full object-cover"
                />
                {foto.esPortada && (
                  <Badge className="absolute top-2 left-2 bg-hoja text-white">
                    <StarIcon aria-hidden className="size-3" />
                    {t("portada")}
                  </Badge>
                )}
              </div>
              <div className="flex items-center justify-between gap-1 p-1.5">
                <div className="flex">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    disabled={indice === 0}
                    onClick={() => mover(indice, indice - 1)}
                  >
                    <ArrowLeftIcon aria-hidden />
                    <span className="sr-only">{t("izquierda", { n: indice + 1 })}</span>
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    disabled={indice === valor.length - 1}
                    onClick={() => mover(indice, indice + 1)}
                  >
                    <ArrowRightIcon aria-hidden />
                    <span className="sr-only">{t("derecha", { n: indice + 1 })}</span>
                  </Button>
                </div>
                <div className="flex">
                  {usaPortada && !foto.esPortada && (
                    <Button type="button" variant="ghost" size="icon-sm" onClick={() => usarPortada(indice)}>
                      <StarIcon aria-hidden />
                      <span className="sr-only">{t("usarPortada", { n: indice + 1 })}</span>
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => quitar(indice)}
                  >
                    <Trash2Icon aria-hidden />
                    <span className="sr-only">{t("quitar", { n: indice + 1 })}</span>
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {!lleno && (
        <div
          onDragOver={(evento) => {
            evento.preventDefault();
            setArrastrando(true);
          }}
          onDragLeave={() => setArrastrando(false)}
          onDrop={soltar}
          className={cn(
            "flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-salvia/60 bg-muted/40 p-6 text-center",
            arrastrando && "border-hoja bg-muted",
          )}
        >
          <ImagePlusIcon aria-hidden className="size-8 text-salvia" />
          <p className="text-sm text-texto-suave">{t("arrastra")}</p>
          <Button type="button" variant="outline" size="sm" asChild disabled={progreso !== null}>
            <label htmlFor={id} className="cursor-pointer">
              {progreso ? <Loader2Icon aria-hidden className="animate-spin" /> : <ImagePlusIcon aria-hidden />}
              {progreso ? t("subiendo", progreso) : t("elegir")}
            </label>
          </Button>
          <input
            ref={campo}
            id={id}
            type="file"
            multiple
            accept={ACEPTA_IMAGEN}
            className="sr-only"
            disabled={progreso !== null}
            aria-describedby={`${id}-ayuda`}
            onChange={(evento) => {
              void subir([...(evento.target.files ?? [])]);
              evento.target.value = "";
            }}
          />
        </div>
      )}
      <p id={`${id}-ayuda`} className="text-sm text-texto-suave">
        {ayuda ?? t("ayuda")}
      </p>
      {errores.length > 0 && (
        <ul role="alert" className="flex flex-col gap-1 text-sm text-destructive">
          {errores.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
