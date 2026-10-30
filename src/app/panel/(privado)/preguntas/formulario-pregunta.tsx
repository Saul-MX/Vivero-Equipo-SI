"use client";

import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { CampoAreaTexto, CampoTexto } from "@/components/formularios/campo-texto";
import { useTraductorErrores } from "@/components/formularios/use-traductor-errores";
import { Button } from "@/components/ui/button";
import { esquemaPregunta, type EntradaPregunta, type PreguntaValidada } from "@/lib/validacion/pregunta";
import { guardarPreguntaAccion } from "./acciones";

/** Agregar o editar una pregunta, dentro de la misma lista. */
export function FormularioPregunta({
  pregunta,
  alTerminar,
}: {
  /** null = pregunta nueva. */
  pregunta: { id: number; valores: EntradaPregunta } | null;
  alTerminar: () => void;
}) {
  const t = useTranslations("panel.preguntas");
  const tFormulario = useTranslations("panel.formulario");
  const traducir = useTraductorErrores();
  const inicial = pregunta?.valores ?? { pregunta: "", respuesta: "" };

  const {
    register,
    handleSubmit,
    getValues,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<EntradaPregunta, unknown, PreguntaValidada>({
    resolver: zodResolver(esquemaPregunta),
    defaultValues: inicial,
  });

  const guardar = handleSubmit(
    async () => {
      try {
        const resultado = await guardarPreguntaAccion(getValues(), pregunta?.id ?? null);
        if (!resultado.ok) {
          for (const [campo, clave] of Object.entries(resultado.campos ?? {})) {
            setError(campo as keyof EntradaPregunta, { message: clave });
          }
          toast.error(traducir(resultado.error ?? "revisaCampos"));
          return;
        }
        toast.success(pregunta ? tFormulario("guardado") : t("agregada"));
        alTerminar();
      } catch {
        toast.error(traducir("inesperado"));
      }
    },
    () => toast.error(traducir("revisaCampos")),
  );

  return (
    <form
      onSubmit={guardar}
      noValidate
      aria-label={pregunta ? t("tituloEditar") : t("tituloNueva")}
      className="flex flex-col gap-5 rounded-2xl bg-muted/50 p-4 ring-1 ring-border sm:p-5"
    >
      <CampoTexto
        id="pregunta"
        etiqueta={t("pregunta")}
        ayuda={t("preguntaAyuda")}
        error={traducir(errors.pregunta?.message)}
        autoFocus
        {...register("pregunta")}
        defaultValue={inicial.pregunta}
      />
      <CampoAreaTexto
        id="respuesta"
        etiqueta={t("respuesta")}
        error={traducir(errors.respuesta?.message)}
        rows={4}
        {...register("respuesta")}
        defaultValue={inicial.respuesta}
      />
      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? tFormulario("guardando") : pregunta ? tFormulario("guardar") : t("agregarBoton")}
        </Button>
        <Button type="button" variant="outline" disabled={isSubmitting} onClick={alTerminar}>
          {tFormulario("cancelar")}
        </Button>
      </div>
    </form>
  );
}
