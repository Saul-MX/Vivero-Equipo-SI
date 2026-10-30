"use client";

import Image from "next/image";
import Link from "next/link";
import { useOptimistic, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { ArrowDownIcon, ArrowUpIcon, PencilIcon, Trash2Icon } from "lucide-react";
import { useTraductorErrores } from "@/components/formularios/use-traductor-errores";
import { PildoraTemporada } from "@/components/panel/pildora-temporada";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { urlImagen } from "@/lib/archivos/claves";
import type { CatalogoEnLista } from "@/lib/catalogo/catalogos";
import { cambiarVisibleCatalogoAccion, moverCatalogoAccion } from "./acciones";
import { DialogoEliminarCatalogo, type CatalogoPorEliminar } from "./dialogo-eliminar-catalogo";

/**
 * Lista ordenable de catálogos. Subir/bajar y el interruptor de visible se guardan al momento.
 * `idCatalogoVigente` marca con «Se ve hoy» el catálogo cuya temporada se muestra en el sitio.
 */
export function ListaCatalogos({
  catalogos,
  idCatalogoVigente = null,
}: {
  catalogos: CatalogoEnLista[];
  idCatalogoVigente?: number | null;
}) {
  const t = useTranslations("panel.catalogos");
  const tFormulario = useTranslations("panel.formulario");
  const traducir = useTraductorErrores();
  const [pendiente, iniciar] = useTransition();
  const [porEliminar, setPorEliminar] = useState<CatalogoPorEliminar | null>(null);
  // El interruptor cambia al instante en pantalla mientras el servidor guarda.
  const [visibles, cambiarVisibleOptimista] = useOptimistic(
    new Map(catalogos.map((catalogo) => [catalogo.id, catalogo.visible])),
    (actual, [id, visible]: [number, boolean]) => new Map(actual).set(id, visible),
  );

  const mover = (id: number, direccion: "subir" | "bajar") =>
    iniciar(async () => {
      try {
        await moverCatalogoAccion(id, direccion);
      } catch {
        toast.error(traducir("inesperado"));
      }
    });

  const cambiarVisible = (catalogo: CatalogoEnLista, visible: boolean) =>
    iniciar(async () => {
      cambiarVisibleOptimista([catalogo.id, visible]);
      try {
        await cambiarVisibleCatalogoAccion(catalogo.id, visible);
        toast.success(t("visibleCambiado", { nombre: catalogo.nombre, visible: String(visible) }));
      } catch {
        toast.error(traducir("inesperado"));
      }
    });

  if (catalogos.length === 0) {
    return <p className="py-6 text-center text-texto-suave">{t("vacio")}</p>;
  }

  return (
    <>
      <ul className="divide-y divide-border">
        {catalogos.map((catalogo, indice) => (
          <li key={catalogo.id} className="flex flex-wrap items-center gap-x-4 gap-y-3 py-4">
            <div className="flex shrink-0">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                disabled={pendiente || indice === 0}
                onClick={() => mover(catalogo.id, "subir")}
              >
                <ArrowUpIcon aria-hidden />
                <span className="sr-only">{t("subir", { nombre: catalogo.nombre })}</span>
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                disabled={pendiente || indice === catalogos.length - 1}
                onClick={() => mover(catalogo.id, "bajar")}
              >
                <ArrowDownIcon aria-hidden />
                <span className="sr-only">{t("bajar", { nombre: catalogo.nombre })}</span>
              </Button>
            </div>

            {catalogo.fotoPortada ? (
              <Image
                src={urlImagen(catalogo.fotoPortada, "tarjeta")}
                alt=""
                width={48}
                height={48}
                unoptimized
                className="size-12 shrink-0 rounded-xl object-cover"
              />
            ) : (
              <span
                aria-hidden
                className="size-12 shrink-0 rounded-xl opacity-80"
                style={{ backgroundColor: catalogo.color }}
              />
            )}

            <div className="min-w-0 flex-1 basis-40">
              <div className="flex flex-wrap items-center gap-2">
                <span aria-hidden className="size-3 shrink-0 rounded-full" style={{ backgroundColor: catalogo.color }} />
                <Link
                  href={`/panel/catalogos/${catalogo.id}`}
                  className="font-medium text-foreground underline-offset-4 hover:underline"
                >
                  {catalogo.nombre}
                </Link>
                {catalogo.id === idCatalogoVigente && <Badge className="bg-hoja text-white">{t("seVeHoy")}</Badge>}
                {catalogo.permanente && <Badge variant="outline">{t("enMenu")}</Badge>}
              </div>
              <p className="mt-0.5 text-sm text-texto-suave">/{catalogo.slug}</p>
            </div>

            <PildoraTemporada temporada={catalogo.temporada} />

            <Link
              href={`/panel/plantas?catalogo=${catalogo.id}`}
              className="min-w-24 text-sm text-pino underline underline-offset-4"
            >
              {t("plantas", { n: catalogo.plantas })}
            </Link>

            <div className="ml-auto flex items-center gap-1">
              <Switch
                aria-label={t("visibleDe", { nombre: catalogo.nombre })}
                checked={visibles.get(catalogo.id) ?? catalogo.visible}
                onCheckedChange={(visible) => cambiarVisible(catalogo, visible)}
                className="mr-2"
              />
              <Button variant="ghost" size="icon" asChild>
                <Link href={`/panel/catalogos/${catalogo.id}`}>
                  <PencilIcon aria-hidden />
                  <span className="sr-only">{tFormulario("editar", { nombre: catalogo.nombre })}</span>
                </Link>
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-destructive hover:text-destructive"
                onClick={() =>
                  setPorEliminar({
                    id: catalogo.id,
                    nombre: catalogo.nombre,
                    plantas: catalogo.plantas,
                    esBase: Boolean(catalogo.temporada?.todoElAnio),
                  })
                }
              >
                <Trash2Icon aria-hidden />
                <span className="sr-only">{t("eliminarDe", { nombre: catalogo.nombre })}</span>
              </Button>
            </div>
          </li>
        ))}
      </ul>
      <DialogoEliminarCatalogo catalogo={porEliminar} alCerrar={() => setPorEliminar(null)} />
    </>
  );
}
