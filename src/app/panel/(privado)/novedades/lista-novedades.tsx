"use client";

import Image from "next/image";
import Link from "next/link";
import { useOptimistic, useTransition } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { toast } from "sonner";
import { NewspaperIcon, PencilIcon } from "lucide-react";
import { useTraductorErrores } from "@/components/formularios/use-traductor-errores";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import type { NovedadEnLista } from "@/lib/apartados/novedades";
import { urlImagen } from "@/lib/archivos/claves";
import { cambiarVisibleNovedadAccion } from "./acciones";

/** Novedades de la más nueva a la más vieja; «Visible» se guarda al momento (ocultar no es borrar). */
export function ListaNovedades({ novedades }: { novedades: NovedadEnLista[] }) {
  const t = useTranslations("panel.novedades");
  const tFormulario = useTranslations("panel.formulario");
  const formato = useFormatter();
  const traducir = useTraductorErrores();
  const [, iniciar] = useTransition();
  const [visibles, cambiarOptimista] = useOptimistic(
    new Map(novedades.map((novedad) => [novedad.id, novedad.visible])),
    (actual, [id, visible]: [number, boolean]) => new Map(actual).set(id, visible),
  );

  const cambiarVisible = (novedad: NovedadEnLista, visible: boolean) =>
    iniciar(async () => {
      cambiarOptimista([novedad.id, visible]);
      try {
        await cambiarVisibleNovedadAccion(novedad.id, visible);
        toast.success(t("visibleCambiado", { titulo: novedad.titulo, visible: String(visible) }));
      } catch {
        toast.error(traducir("inesperado"));
      }
    });

  return (
    <ul className="divide-y divide-border">
      {novedades.map((novedad) => (
        <li key={novedad.id} className="flex flex-wrap items-center gap-x-4 gap-y-3 py-4 sm:flex-nowrap">
          {novedad.imagen ? (
            <Image
              src={urlImagen(novedad.imagen, "tarjeta")}
              alt=""
              width={96}
              height={64}
              unoptimized
              className="h-14 w-20 shrink-0 rounded-lg object-cover"
            />
          ) : (
            <span aria-hidden className="flex h-14 w-20 shrink-0 items-center justify-center rounded-lg bg-muted text-salvia">
              <NewspaperIcon className="size-5" />
            </span>
          )}
          <div className="min-w-0 flex-1 basis-48">
            <Link
              href={`/panel/novedades/${novedad.id}`}
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              {novedad.titulo}
            </Link>
            <p className="text-sm text-texto-suave">
              {formato.dateTime(novedad.creadoEn, { dateStyle: "medium" })}
            </p>
            <p className="mt-1 line-clamp-1 text-sm text-foreground">{novedad.texto}</p>
          </div>
          <div className="ml-auto flex shrink-0 items-center gap-1">
            <Switch
              aria-label={t("visibleDe", { titulo: novedad.titulo })}
              checked={visibles.get(novedad.id) ?? novedad.visible}
              onCheckedChange={(visible) => cambiarVisible(novedad, visible)}
              className="mr-2"
            />
            <Button variant="ghost" size="icon" asChild>
              <Link href={`/panel/novedades/${novedad.id}`}>
                <PencilIcon aria-hidden />
                <span className="sr-only">{tFormulario("editar", { nombre: novedad.titulo })}</span>
              </Link>
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}
