"use client";

import Image from "next/image";
import Link from "next/link";
import { useOptimistic, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { FlaskConicalIcon, PencilIcon } from "lucide-react";
import { useTraductorErrores } from "@/components/formularios/use-traductor-errores";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { urlImagen } from "@/lib/archivos/claves";
import type { FertilizanteEnLista } from "@/lib/catalogo/fertilizantes";
import { TIPOS_FERTILIZANTE } from "@/lib/validacion/fertilizante";
import { cambiarVisibleFertilizanteAccion } from "./acciones";

type Tipo = (typeof TIPOS_FERTILIZANTE)[number];

function Foto({ fertilizante }: { fertilizante: FertilizanteEnLista }) {
  return fertilizante.foto ? (
    <Image
      src={urlImagen(fertilizante.foto, "tarjeta")}
      alt=""
      width={48}
      height={48}
      unoptimized
      className="size-12 shrink-0 rounded-xl object-cover"
    />
  ) : (
    <span aria-hidden className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-muted text-salvia">
      <FlaskConicalIcon className="size-5" />
    </span>
  );
}

/** Lista de fertilizantes: tabla en computadora, tarjetas en celular. «Visible» se guarda al momento. */
export function TablaFertilizantes({ fertilizantes }: { fertilizantes: FertilizanteEnLista[] }) {
  const t = useTranslations("panel.fertilizantes");
  const tFormulario = useTranslations("panel.formulario");
  const traducir = useTraductorErrores();
  const [, iniciar] = useTransition();
  const [visibles, cambiarOptimista] = useOptimistic(
    new Map(fertilizantes.map((fertilizante) => [fertilizante.id, fertilizante.visible])),
    (actual, [id, visible]: [number, boolean]) => new Map(actual).set(id, visible),
  );

  const cambiarVisible = (fertilizante: FertilizanteEnLista, visible: boolean) =>
    iniciar(async () => {
      cambiarOptimista([fertilizante.id, visible]);
      try {
        await cambiarVisibleFertilizanteAccion(fertilizante.id, visible);
        toast.success(t("visibleCambiado", { nombre: fertilizante.nombre, visible: String(visible) }));
      } catch {
        toast.error(traducir("inesperado"));
      }
    });

  const nombre = (fertilizante: FertilizanteEnLista) => (
    <div className="min-w-0">
      <Link
        href={`/panel/fertilizantes/${fertilizante.id}`}
        className="font-medium text-foreground underline-offset-4 hover:underline"
      >
        {fertilizante.nombre}
      </Link>
      {fertilizante.tipo && (
        <p className="text-sm text-texto-suave">
          {(TIPOS_FERTILIZANTE as readonly string[]).includes(fertilizante.tipo)
            ? t(`tipos.${fertilizante.tipo as Tipo}`)
            : fertilizante.tipo}
        </p>
      )}
    </div>
  );
  const interruptor = (fertilizante: FertilizanteEnLista) => (
    <Switch
      aria-label={t("visibleDe", { nombre: fertilizante.nombre })}
      checked={visibles.get(fertilizante.id) ?? fertilizante.visible}
      onCheckedChange={(visible) => cambiarVisible(fertilizante, visible)}
    />
  );
  const editar = (fertilizante: FertilizanteEnLista) => (
    <Button variant="ghost" size="icon" asChild>
      <Link href={`/panel/fertilizantes/${fertilizante.id}`}>
        <PencilIcon aria-hidden />
        <span className="sr-only">{tFormulario("editar", { nombre: fertilizante.nombre })}</span>
      </Link>
    </Button>
  );
  const recomendado = (fertilizante: FertilizanteEnLista) =>
    fertilizante.catalogos.length > 0 ? fertilizante.catalogos.join(", ") : t("ninguno");

  return (
    <>
      <table className="hidden w-full text-left text-sm md:table">
        <thead className="border-b border-border text-xs tracking-wide text-texto-suave uppercase">
          <tr>
            <th scope="col" className="py-3 pr-4 font-semibold">{t("columnas.fertilizante")}</th>
            <th scope="col" className="py-3 pr-4 font-semibold">{t("columnas.recomendado")}</th>
            <th scope="col" className="py-3 pr-4 font-semibold">{t("columnas.presentacion")}</th>
            <th scope="col" className="py-3 pr-4 font-semibold">{t("columnas.visible")}</th>
            <th scope="col" className="py-3 font-semibold">
              <span className="sr-only">{t("columnas.acciones")}</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {fertilizantes.map((fertilizante) => (
            <tr key={fertilizante.id}>
              <td className="py-3 pr-4">
                <div className="flex items-center gap-3">
                  <Foto fertilizante={fertilizante} />
                  {nombre(fertilizante)}
                </div>
              </td>
              <td className="py-3 pr-4">{recomendado(fertilizante)}</td>
              <td className="py-3 pr-4 text-texto-suave">{fertilizante.presentacion}</td>
              <td className="py-3 pr-4">{interruptor(fertilizante)}</td>
              <td className="py-3 text-right">{editar(fertilizante)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <ul className="divide-y divide-border md:hidden">
        {fertilizantes.map((fertilizante) => (
          <li key={fertilizante.id} className="flex flex-col gap-3 py-4">
            <div className="flex items-center gap-3">
              <Foto fertilizante={fertilizante} />
              <div className="min-w-0 flex-1">{nombre(fertilizante)}</div>
              {editar(fertilizante)}
            </div>
            <p className="text-sm text-texto-suave">
              {t("columnas.recomendado")}: {recomendado(fertilizante)}
            </p>
            <span className="flex items-center gap-2 text-sm">
              {interruptor(fertilizante)}
              {t("columnas.visible")}
            </span>
          </li>
        ))}
      </ul>
    </>
  );
}
