"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { toast } from "sonner";
import { FilmIcon, Trash2Icon } from "lucide-react";
import { useTraductorErrores } from "@/components/formularios/use-traductor-errores";
import { ConfirmarEliminar } from "@/components/panel/confirmar-eliminar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { urlImagen } from "@/lib/archivos/claves";
import type { ArchivoDelCarrusel } from "@/lib/carrusel/anuncios";
import { eliminarArchivoCarruselAccion } from "./acciones";

/**
 * Pestaña «Otros archivos»: las fotos y videos guardados del carrusel, qué anuncio usa cada uno
 * y cuánto pesan. Los que ya no usa ningún anuncio se pueden borrar para ahorrar espacio.
 */
export function ArchivosCarrusel({ archivos }: { archivos: ArchivoDelCarrusel[] }) {
  const t = useTranslations("panel.carrusel.archivos");
  const formato = useFormatter();
  const traducir = useTraductorErrores();
  const [porBorrar, setPorBorrar] = useState<ArchivoDelCarrusel | null>(null);

  // Menos de 1 MB se muestra en KB (si no, una foto ligera diría «0 MB»).
  const peso = (bytes: number) =>
    bytes < 1024 * 1024
      ? t("pesoKb", { n: formato.number(Math.max(1, Math.round(bytes / 1024))) })
      : t("pesoMb", { n: formato.number(bytes / (1024 * 1024), { maximumFractionDigits: 1 }) });
  const total = archivos.reduce((suma, archivo) => suma + archivo.bytes, 0);
  const sinUso = archivos.filter((archivo) => archivo.usos.length === 0);
  const nombre = (archivo: ArchivoDelCarrusel) =>
    t(archivo.tipo === "video" ? "nombreVideo" : "nombreFoto", {
      fecha: formato.dateTime(archivo.modificado, { day: "numeric", month: "short", year: "numeric" }),
    });

  const borrar = async (archivo: ArchivoDelCarrusel) => {
    try {
      const resultado = await eliminarArchivoCarruselAccion(archivo.clave);
      if (resultado === "ok") toast.success(t("borrado"));
      else toast.error(traducir(resultado === "enUso" ? "archivoEnUso" : "noEncontrado"));
    } catch {
      toast.error(traducir("inesperado"));
    }
  };

  if (archivos.length === 0) return <p className="py-6 text-center text-texto-suave">{t("vacio")}</p>;

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-texto-suave">
        {t("resumen", { n: archivos.length, total: peso(total), sinUso: sinUso.length })}
      </p>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {archivos.map((archivo) => (
          <li key={archivo.clave} className="flex flex-col overflow-hidden rounded-2xl bg-card ring-1 ring-border">
            {archivo.tipo === "imagen" ? (
              <Image
                src={urlImagen(archivo.clave, "tarjeta")}
                alt={nombre(archivo)}
                width={320}
                height={180}
                unoptimized
                className="aspect-video h-auto w-full object-cover"
              />
            ) : (
              <span className="flex aspect-video w-full items-center justify-center bg-pino text-white">
                <FilmIcon aria-hidden className="size-8" />
              </span>
            )}
            <div className="flex flex-1 flex-col gap-2 p-3 text-sm">
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium">{nombre(archivo)}</p>
                <span className="shrink-0 text-texto-suave tabular-nums">{peso(archivo.bytes)}</span>
              </div>
              {archivo.usos.length > 0 ? (
                <ul className="flex flex-col gap-1">
                  {archivo.usos.map((uso) => (
                    <li key={`${uso.id}-${uso.campo}`} className="text-texto-suave">
                      {t(`uso.${uso.campo}`)}{" "}
                      <Link href={`/panel/carrusel/${uso.id}`} className="text-pino underline underline-offset-4">
                        {uso.titulo}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="mt-auto flex items-center justify-between gap-2">
                  <Badge variant="outline">{t("sinUsar")}</Badge>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setPorBorrar(archivo)}
                  >
                    <Trash2Icon aria-hidden />
                    {t("borrar")}
                    <span className="sr-only">{nombre(archivo)}</span>
                  </Button>
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
      <ConfirmarEliminar
        abierto={porBorrar !== null}
        titulo={porBorrar ? t("borrarTitulo", { nombre: nombre(porBorrar) }) : ""}
        texto={t("borrarTexto")}
        alCerrar={() => setPorBorrar(null)}
        alConfirmar={() => borrar(porBorrar!)}
      />
    </div>
  );
}
