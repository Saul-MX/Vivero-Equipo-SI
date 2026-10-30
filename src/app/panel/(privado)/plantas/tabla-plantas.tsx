"use client";

import Image from "next/image";
import Link from "next/link";
import { useOptimistic, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { PencilIcon, SproutIcon } from "lucide-react";
import { useTraductorErrores } from "@/components/formularios/use-traductor-errores";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { urlImagen } from "@/lib/archivos/claves";
import type { PlantaEnLista } from "@/lib/catalogo/plantas";
import { cambiarDisponiblePlantaAccion, cambiarVisiblePlantaAccion } from "./acciones";

type Cambio = { id: number; campo: "disponible" | "visible"; valor: boolean };

function Miniatura({ planta }: { planta: PlantaEnLista }) {
  return planta.portada ? (
    <Image
      src={urlImagen(planta.portada, "tarjeta")}
      alt=""
      width={48}
      height={48}
      unoptimized
      className="size-12 shrink-0 rounded-xl object-cover"
    />
  ) : (
    <span aria-hidden className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-muted text-salvia">
      <SproutIcon className="size-5" />
    </span>
  );
}

/**
 * Tabla de plantas (Planta, Catálogo, Fotos, Disponible, Visible). En celular se muestra como lista.
 * Los interruptores se guardan al momento.
 */
export function TablaPlantas({ plantas }: { plantas: PlantaEnLista[] }) {
  const t = useTranslations("panel.plantas");
  const tFormulario = useTranslations("panel.formulario");
  const traducir = useTraductorErrores();
  const [, iniciar] = useTransition();
  const [estado, aplicarCambio] = useOptimistic(
    new Map(plantas.map((planta) => [planta.id, { disponible: planta.disponible, visible: planta.visible }])),
    (actual, { id, campo, valor }: Cambio) => {
      const copia = new Map(actual);
      copia.set(id, { ...copia.get(id)!, [campo]: valor });
      return copia;
    },
  );

  const cambiar = (planta: PlantaEnLista, campo: Cambio["campo"], valor: boolean) =>
    iniciar(async () => {
      aplicarCambio({ id: planta.id, campo, valor });
      try {
        if (campo === "disponible") {
          await cambiarDisponiblePlantaAccion(planta.id, valor);
          toast.success(t("disponibleCambiado", { nombre: planta.nombre, disponible: String(valor) }));
        } else {
          await cambiarVisiblePlantaAccion(planta.id, valor);
          toast.success(t("visibleCambiado", { nombre: planta.nombre, visible: String(valor) }));
        }
      } catch {
        toast.error(traducir("inesperado"));
      }
    });

  const interruptores = (planta: PlantaEnLista) => {
    const actual = estado.get(planta.id)!;
    return {
      disponible: (
        <Switch
          aria-label={t("disponibleDe", { nombre: planta.nombre })}
          checked={actual.disponible}
          onCheckedChange={(valor) => cambiar(planta, "disponible", valor)}
        />
      ),
      visible: (
        <Switch
          aria-label={t("visibleDe", { nombre: planta.nombre })}
          checked={actual.visible}
          onCheckedChange={(valor) => cambiar(planta, "visible", valor)}
        />
      ),
    };
  };

  const enlaceEditar = (planta: PlantaEnLista) => (
    <Button variant="ghost" size="icon" asChild>
      <Link href={`/panel/plantas/${planta.id}`}>
        <PencilIcon aria-hidden />
        <span className="sr-only">{tFormulario("editar", { nombre: planta.nombre })}</span>
      </Link>
    </Button>
  );

  const nombre = (planta: PlantaEnLista) => (
    <div className="min-w-0">
      <Link href={`/panel/plantas/${planta.id}`} className="font-medium text-foreground underline-offset-4 hover:underline">
        {planta.nombre}
      </Link>
      {planta.variedad && <p className="text-sm text-texto-suave">{planta.variedad}</p>}
    </div>
  );

  return (
    <>
      {/* Computadora: tabla */}
      <table className="hidden w-full text-left text-sm md:table">
        <thead className="border-b border-border text-xs tracking-wide text-texto-suave uppercase">
          <tr>
            <th scope="col" className="py-3 pr-4 font-semibold">{t("columnas.planta")}</th>
            <th scope="col" className="py-3 pr-4 font-semibold">{t("columnas.catalogo")}</th>
            <th scope="col" className="py-3 pr-4 font-semibold">{t("columnas.fotos")}</th>
            <th scope="col" className="py-3 pr-4 font-semibold">{t("columnas.disponible")}</th>
            <th scope="col" className="py-3 pr-4 font-semibold">{t("columnas.visible")}</th>
            <th scope="col" className="py-3 font-semibold">
              <span className="sr-only">{t("columnas.acciones")}</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {plantas.map((planta) => {
            const { disponible, visible } = interruptores(planta);
            return (
              <tr key={planta.id}>
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-3">
                    <Miniatura planta={planta} />
                    {nombre(planta)}
                  </div>
                </td>
                <td className="py-3 pr-4">{planta.catalogo}</td>
                <td className="py-3 pr-4 text-texto-suave">{t("fotos", { n: planta.fotos })}</td>
                <td className="py-3 pr-4">{disponible}</td>
                <td className="py-3 pr-4">{visible}</td>
                <td className="py-3 text-right">{enlaceEditar(planta)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Celular: lista */}
      <ul className="divide-y divide-border md:hidden">
        {plantas.map((planta) => {
          const { disponible, visible } = interruptores(planta);
          return (
            <li key={planta.id} className="flex flex-col gap-3 py-4">
              <div className="flex items-center gap-3">
                <Miniatura planta={planta} />
                <div className="min-w-0 flex-1">{nombre(planta)}</div>
                {enlaceEditar(planta)}
              </div>
              <p className="text-sm text-texto-suave">
                {planta.catalogo} · {t("fotos", { n: planta.fotos })}
              </p>
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                <span className="flex items-center gap-2">
                  {disponible}
                  {t("columnas.disponible")}
                </span>
                <span className="flex items-center gap-2">
                  {visible}
                  {t("columnas.visible")}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}
