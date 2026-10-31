"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { useTraductorErrores } from "@/components/formularios/use-traductor-errores";
import { BotonesOrden } from "@/components/panel/botones-orden";
import { ConfirmarEliminar } from "@/components/panel/confirmar-eliminar";
import { Button } from "@/components/ui/button";
import type { PreguntaEnLista } from "@/lib/apartados/preguntas";
import { eliminarPreguntaAccion, moverPreguntaAccion } from "./acciones";
import { FormularioPregunta } from "./formulario-pregunta";

/** Lista de preguntas: agregar, editar en su lugar, ordenar y eliminar (con confirmación). */
export function ListaPreguntas({ preguntas }: { preguntas: PreguntaEnLista[] }) {
  const t = useTranslations("panel.preguntas");
  const traducir = useTraductorErrores();
  const [pendiente, iniciar] = useTransition();
  const [editando, setEditando] = useState<number | "nueva" | null>(null);
  const [porEliminar, setPorEliminar] = useState<PreguntaEnLista | null>(null);

  const mover = (id: number, direccion: "subir" | "bajar") =>
    iniciar(async () => {
      try {
        await moverPreguntaAccion(id, direccion);
      } catch {
        toast.error(traducir("inesperado"));
      }
    });

  const eliminar = async (pregunta: PreguntaEnLista) => {
    try {
      await eliminarPreguntaAccion(pregunta.id);
      toast.success(t("eliminada"));
    } catch {
      toast.error(traducir("inesperado"));
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-texto-suave">{preguntas.length > 0 && t("total", { n: preguntas.length })}</p>
        {editando !== "nueva" && (
          <Button type="button" onClick={() => setEditando("nueva")}>
            <PlusIcon aria-hidden />
            {t("agregar")}
          </Button>
        )}
      </div>

      {editando === "nueva" && <FormularioPregunta pregunta={null} alTerminar={() => setEditando(null)} />}

      {preguntas.length === 0 && editando !== "nueva" ? (
        <p className="py-6 text-center text-texto-suave">{t("vacio")}</p>
      ) : (
        <ul className="divide-y divide-border">
          {preguntas.map((pregunta, indice) => (
            <li key={pregunta.id} className="py-4">
              {editando === pregunta.id ? (
                <FormularioPregunta
                  pregunta={{ id: pregunta.id, valores: { pregunta: pregunta.pregunta, respuesta: pregunta.respuesta } }}
                  alTerminar={() => setEditando(null)}
                />
              ) : (
                <div className="flex items-start gap-3">
                  <BotonesOrden
                    esPrimero={indice === 0}
                    esUltimo={indice === preguntas.length - 1}
                    deshabilitado={pendiente}
                    etiquetaSubir={t("subir", { pregunta: pregunta.pregunta })}
                    etiquetaBajar={t("bajar", { pregunta: pregunta.pregunta })}
                    alMover={(direccion) => mover(pregunta.id, direccion)}
                  />
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium text-foreground">{pregunta.pregunta}</h3>
                    <p className="mt-1 line-clamp-2 text-sm whitespace-pre-line text-texto-suave">{pregunta.respuesta}</p>
                  </div>
                  <div className="flex shrink-0">
                    <Button type="button" variant="ghost" size="icon" onClick={() => setEditando(pregunta.id)}>
                      <PencilIcon aria-hidden />
                      <span className="sr-only">{t("editarDe", { pregunta: pregunta.pregunta })}</span>
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setPorEliminar(pregunta)}
                    >
                      <Trash2Icon aria-hidden />
                      <span className="sr-only">{t("eliminarDe", { pregunta: pregunta.pregunta })}</span>
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
        titulo={t("eliminarTitulo")}
        texto={porEliminar ? t("eliminarTexto", { pregunta: porEliminar.pregunta }) : ""}
        alCerrar={() => setPorEliminar(null)}
        alConfirmar={() => eliminar(porEliminar!)}
      />
    </div>
  );
}
