"use client";

import { useOptimistic, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { useTraductorErrores } from "@/components/formularios/use-traductor-errores";
import { BotonesOrden } from "@/components/panel/botones-orden";
import { ConfirmarEliminar } from "@/components/panel/confirmar-eliminar";
import { AvatarTestimonio } from "@/components/sitio/avatar-testimonio";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import type { TestimonioEnLista } from "@/lib/apartados/testimonios";
import { cambiarVisibleTestimonioAccion, eliminarTestimonioAccion, moverTestimonioAccion } from "./acciones";
import { FormularioTestimonio } from "./formulario-testimonio";

/** Lista de testimonios, con el mismo manejo que Preguntas frecuentes, más foto y «Visible». */
export function ListaTestimonios({ testimonios }: { testimonios: TestimonioEnLista[] }) {
  const t = useTranslations("panel.testimonios");
  const traducir = useTraductorErrores();
  const [pendiente, iniciar] = useTransition();
  const [editando, setEditando] = useState<number | "nuevo" | null>(null);
  const [porEliminar, setPorEliminar] = useState<TestimonioEnLista | null>(null);
  const [visibles, cambiarOptimista] = useOptimistic(
    new Map(testimonios.map((testimonio) => [testimonio.id, testimonio.visible])),
    (actual, [id, visible]: [number, boolean]) => new Map(actual).set(id, visible),
  );

  const mover = (id: number, direccion: "subir" | "bajar") =>
    iniciar(async () => {
      try {
        await moverTestimonioAccion(id, direccion);
      } catch {
        toast.error(traducir("inesperado"));
      }
    });

  const cambiarVisible = (testimonio: TestimonioEnLista, visible: boolean) =>
    iniciar(async () => {
      cambiarOptimista([testimonio.id, visible]);
      try {
        await cambiarVisibleTestimonioAccion(testimonio.id, visible);
        toast.success(t("visibleCambiado", { nombre: testimonio.nombre, visible: String(visible) }));
      } catch {
        toast.error(traducir("inesperado"));
      }
    });

  const eliminar = async (testimonio: TestimonioEnLista) => {
    try {
      await eliminarTestimonioAccion(testimonio.id);
      toast.success(t("eliminado", { nombre: testimonio.nombre }));
    } catch {
      toast.error(traducir("inesperado"));
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-texto-suave">{t("total", { n: testimonios.length })}</p>
        {editando !== "nuevo" && (
          <Button type="button" onClick={() => setEditando("nuevo")}>
            <PlusIcon aria-hidden />
            {t("agregar")}
          </Button>
        )}
      </div>

      {editando === "nuevo" && <FormularioTestimonio testimonio={null} alTerminar={() => setEditando(null)} />}

      {testimonios.length === 0 && editando !== "nuevo" ? (
        <p className="py-6 text-center text-texto-suave">{t("vacio")}</p>
      ) : (
        <ul className="divide-y divide-border">
          {testimonios.map((testimonio, indice) => (
            <li key={testimonio.id} className="py-4">
              {editando === testimonio.id ? (
                <FormularioTestimonio
                  testimonio={{
                    id: testimonio.id,
                    valores: {
                      avatar: testimonio.avatar,
                      nombre: testimonio.nombre,
                      texto: testimonio.texto,
                      visible: testimonio.visible,
                    },
                  }}
                  alTerminar={() => setEditando(null)}
                />
              ) : (
                <div className="flex flex-wrap items-start gap-3 sm:flex-nowrap">
                  <BotonesOrden
                    esPrimero={indice === 0}
                    esUltimo={indice === testimonios.length - 1}
                    deshabilitado={pendiente}
                    etiquetaSubir={t("subir", { nombre: testimonio.nombre })}
                    etiquetaBajar={t("bajar", { nombre: testimonio.nombre })}
                    alMover={(direccion) => mover(testimonio.id, direccion)}
                  />
                  <AvatarTestimonio avatar={testimonio.avatar} nombre={testimonio.nombre} />
                  <div className="min-w-0 flex-1 basis-48">
                    <h3 className="font-medium text-foreground">{testimonio.nombre}</h3>
                    <p className="mt-1 line-clamp-2 text-sm text-texto-suave">{testimonio.texto}</p>
                  </div>
                  <div className="ml-auto flex shrink-0 items-center gap-1">
                    <Switch
                      aria-label={t("visibleDe", { nombre: testimonio.nombre })}
                      checked={visibles.get(testimonio.id) ?? testimonio.visible}
                      onCheckedChange={(visible) => cambiarVisible(testimonio, visible)}
                      className="mr-2"
                    />
                    <Button type="button" variant="ghost" size="icon" onClick={() => setEditando(testimonio.id)}>
                      <PencilIcon aria-hidden />
                      <span className="sr-only">{t("editarDe", { nombre: testimonio.nombre })}</span>
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setPorEliminar(testimonio)}
                    >
                      <Trash2Icon aria-hidden />
                      <span className="sr-only">{t("eliminarDe", { nombre: testimonio.nombre })}</span>
                    </Button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <ConfirmarEliminar
        abierto={porEliminar !== null}
        titulo={porEliminar ? t("eliminarTitulo", { nombre: porEliminar.nombre }) : ""}
        texto={t("eliminarTexto")}
        alCerrar={() => setPorEliminar(null)}
        alConfirmar={() => eliminar(porEliminar!)}
      />
    </div>
  );
}
