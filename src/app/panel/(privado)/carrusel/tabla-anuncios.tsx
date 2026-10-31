"use client";

import Image from "next/image";
import Link from "next/link";
import { useOptimistic, useTransition } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { toast } from "sonner";
import { FilmIcon, PencilIcon } from "lucide-react";
import { useTraductorErrores } from "@/components/formularios/use-traductor-errores";
import { BotonesOrden } from "@/components/panel/botones-orden";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { urlImagen } from "@/lib/archivos/claves";
import type { AnuncioEnLista } from "@/lib/carrusel/anuncios";
import { cambiarVisibleAnuncioAccion, moverAnuncioAccion } from "./acciones";

function Miniatura({ anuncio }: { anuncio: AnuncioEnLista }) {
  const imagen = anuncio.tipoMedio === "VIDEO" ? anuncio.imagenEspera : anuncio.archivo;
  return imagen ? (
    <Image
      src={urlImagen(imagen, "tarjeta")}
      alt=""
      width={96}
      height={54}
      unoptimized
      className="h-12 w-20 shrink-0 rounded-lg object-cover"
    />
  ) : (
    <span aria-hidden className="flex h-12 w-20 shrink-0 items-center justify-center rounded-lg bg-pino text-white">
      <FilmIcon className="size-5" />
    </span>
  );
}

/** Lista de anuncios: tabla en computadora, tarjetas en celular. Orden y «Visible» se guardan al momento. */
export function TablaAnuncios({ anuncios }: { anuncios: AnuncioEnLista[] }) {
  const t = useTranslations("panel.carrusel");
  const tFormulario = useTranslations("panel.formulario");
  const formato = useFormatter();
  const traducir = useTraductorErrores();
  const [pendiente, iniciar] = useTransition();
  const [visibles, cambiarOptimista] = useOptimistic(
    new Map(anuncios.map((anuncio) => [anuncio.id, anuncio.visible])),
    (actual, [id, visible]: [number, boolean]) => new Map(actual).set(id, visible),
  );

  const cambiarVisible = (anuncio: AnuncioEnLista, visible: boolean) =>
    iniciar(async () => {
      cambiarOptimista([anuncio.id, visible]);
      try {
        await cambiarVisibleAnuncioAccion(anuncio.id, visible);
        toast.success(t("visibleCambiado", { titulo: anuncio.titulo, visible: String(visible) }));
      } catch {
        toast.error(traducir("inesperado"));
      }
    });
  const mover = (id: number, direccion: "subir" | "bajar") =>
    iniciar(async () => {
      try {
        await moverAnuncioAccion(id, direccion);
      } catch {
        toast.error(traducir("inesperado"));
      }
    });

  const fecha = (texto: string) =>
    formato.dateTime(new Date(`${texto}T12:00:00Z`), { day: "numeric", month: "short", year: "numeric" });
  const fechas = (anuncio: AnuncioEnLista) => {
    if (anuncio.desde && anuncio.hasta) return t("fechasEntre", { desde: fecha(anuncio.desde), hasta: fecha(anuncio.hasta) });
    if (anuncio.desde) return t("fechasDesde", { desde: fecha(anuncio.desde) });
    if (anuncio.hasta) return t("fechasHasta", { hasta: fecha(anuncio.hasta) });
    return t("sinFechas");
  };
  const temporada = (anuncio: AnuncioEnLista) =>
    anuncio.temporada ? (
      <span className="inline-flex items-center gap-2">
        <span aria-hidden className="size-2.5 rounded-full" style={{ backgroundColor: anuncio.temporada.color }} />
        {anuncio.temporada.nombre}
      </span>
    ) : (
      t("siempre")
    );
  const titulo = (anuncio: AnuncioEnLista) => (
    <div className="min-w-0">
      <Link
        href={`/panel/carrusel/${anuncio.id}`}
        className="font-medium text-foreground underline-offset-4 hover:underline"
      >
        {anuncio.titulo}
      </Link>
      <div className="mt-1 flex flex-wrap gap-1.5">
        {anuncio.tipoMedio === "VIDEO" && <Badge variant="outline">{t("video")}</Badge>}
        {anuncio.saleHoy && <Badge className="bg-hoja text-white">{t("saleHoy")}</Badge>}
      </div>
    </div>
  );
  const orden = (anuncio: AnuncioEnLista, indice: number) => (
    <BotonesOrden
      esPrimero={indice === 0}
      esUltimo={indice === anuncios.length - 1}
      deshabilitado={pendiente}
      etiquetaSubir={t("subir", { titulo: anuncio.titulo })}
      etiquetaBajar={t("bajar", { titulo: anuncio.titulo })}
      alMover={(direccion) => mover(anuncio.id, direccion)}
    />
  );
  const interruptor = (anuncio: AnuncioEnLista) => (
    <Switch
      aria-label={t("visibleDe", { titulo: anuncio.titulo })}
      checked={visibles.get(anuncio.id) ?? anuncio.visible}
      onCheckedChange={(visible) => cambiarVisible(anuncio, visible)}
    />
  );
  const editar = (anuncio: AnuncioEnLista) => (
    <Button variant="ghost" size="icon" asChild>
      <Link href={`/panel/carrusel/${anuncio.id}`}>
        <PencilIcon aria-hidden />
        <span className="sr-only">{tFormulario("editar", { nombre: anuncio.titulo })}</span>
      </Link>
    </Button>
  );

  return (
    <>
      <table className="hidden w-full text-left text-sm md:table">
        <thead className="border-b border-border text-xs tracking-wide text-texto-suave uppercase">
          <tr>
            <th scope="col" className="py-3 pr-2 font-semibold">
              <span className="sr-only">{t("columnas.orden")}</span>
            </th>
            <th scope="col" className="py-3 pr-4 font-semibold">{t("columnas.anuncio")}</th>
            <th scope="col" className="py-3 pr-4 font-semibold">{t("columnas.temporada")}</th>
            <th scope="col" className="py-3 pr-4 font-semibold">{t("columnas.fechas")}</th>
            <th scope="col" className="py-3 pr-4 font-semibold">{t("columnas.visible")}</th>
            <th scope="col" className="py-3 font-semibold">
              <span className="sr-only">{t("columnas.acciones")}</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {anuncios.map((anuncio, indice) => (
            <tr key={anuncio.id}>
              <td className="py-3 pr-2">{orden(anuncio, indice)}</td>
              <td className="py-3 pr-4">
                <div className="flex items-center gap-3">
                  <Miniatura anuncio={anuncio} />
                  {titulo(anuncio)}
                </div>
              </td>
              <td className="py-3 pr-4">{temporada(anuncio)}</td>
              <td className="py-3 pr-4 text-texto-suave">{fechas(anuncio)}</td>
              <td className="py-3 pr-4">{interruptor(anuncio)}</td>
              <td className="py-3 text-right">{editar(anuncio)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <ul className="divide-y divide-border md:hidden">
        {anuncios.map((anuncio, indice) => (
          <li key={anuncio.id} className="flex flex-col gap-3 py-4">
            <div className="flex items-center gap-3">
              <Miniatura anuncio={anuncio} />
              <div className="min-w-0 flex-1">{titulo(anuncio)}</div>
              {editar(anuncio)}
            </div>
            <p className="text-sm text-texto-suave">
              {temporada(anuncio)} · {fechas(anuncio)}
            </p>
            <div className="flex items-center justify-between gap-2">
              {orden(anuncio, indice)}
              <span className="flex items-center gap-2 text-sm">
                {interruptor(anuncio)}
                {t("columnas.visible")}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
