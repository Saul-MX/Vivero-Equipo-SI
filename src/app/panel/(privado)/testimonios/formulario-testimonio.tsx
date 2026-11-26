"use client";

import { useTranslations } from "next-intl";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { CampoInterruptor } from "@/components/formularios/campo-interruptor";
import { CampoAreaTexto, CampoTexto } from "@/components/formularios/campo-texto";
import { SubirImagen } from "@/components/formularios/subir-imagen";
import { useTraductorErrores } from "@/components/formularios/use-traductor-errores";
import { Button } from "@/components/ui/button";
import {
  esquemaTestimonio,
  type EntradaTestimonio,
  type TestimonioValidado,
} from "@/lib/validacion/testimonio";
import { guardarTestimonioAccion } from "./acciones";

const VALORES_NUEVO: EntradaTestimonio = { avatar: null, nombre: "", texto: "", visible: true };

/** Agregar o editar un testimonio, dentro de la misma lista. */
export function FormularioTestimonio({
  testimonio,
  alTerminar,
}: {
  /** null = testimonio nuevo. */
  testimonio: { id: number; valores: EntradaTestimonio } | null;
  alTerminar: () => void;
}) {
  const t = useTranslations("panel.testimonios");
  const tFormulario = useTranslations("panel.formulario");
  const traducir = useTraductorErrores();
  const inicial = testimonio?.valores ?? VALORES_NUEVO;

  const {
    control,
    register,
    handleSubmit,
    getValues,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<EntradaTestimonio, unknown, TestimonioValidado>({
    resolver: zodResolver(esquemaTestimonio),
    defaultValues: inicial,
  });

  const guardar = handleSubmit(
    async () => {
      try {
        const resultado = await guardarTestimonioAccion(getValues(), testimonio?.id ?? null);
        if (!resultado.ok) {
          for (const [campo, clave] of Object.entries(resultado.campos ?? {})) {
            setError(campo as keyof EntradaTestimonio, { message: clave });
          }
          toast.error(traducir(resultado.error ?? "revisaCampos"));
          return;
        }
        toast.success(testimonio ? tFormulario("guardado") : t("agregado"));
        alTerminar();
      } catch {
        toast.error(traducir("inesperado"));
      }
    },
    () => toast.error(traducir("revisaCampos")),
  );

  return (
    <form method="post"
      onSubmit={guardar}
      noValidate
      aria-label={testimonio ? t("tituloEditar") : t("tituloNuevo")}
      className="flex flex-col gap-5 rounded-2xl bg-muted/50 p-4 ring-1 ring-border sm:p-5"
    >
      <Controller
        control={control}
        name="avatar"
        render={({ field }) => (
          <SubirImagen
            etiqueta={t("avatar")}
            ayuda={t("avatarAyuda")}
            valor={field.value}
            alCambiar={field.onChange}
            redonda
          />
        )}
      />
      <CampoTexto
        id="nombre"
        etiqueta={t("nombre")}
        ayuda={t("nombreAyuda")}
        error={traducir(errors.nombre?.message)}
        {...register("nombre")}
        defaultValue={inicial.nombre}
      />
      <CampoAreaTexto
        id="texto"
        etiqueta={t("texto")}
        error={traducir(errors.texto?.message)}
        rows={4}
        {...register("texto")}
        defaultValue={inicial.texto}
      />
      <Controller
        control={control}
        name="visible"
        render={({ field }) => (
          <CampoInterruptor
            etiqueta={tFormulario("visible")}
            ayuda={tFormulario("visibleAyuda")}
            activo={field.value}
            alCambiar={field.onChange}
          />
        )}
      />
      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? tFormulario("guardando") : testimonio ? tFormulario("guardar") : t("agregarBoton")}
        </Button>
        <Button type="button" variant="outline" disabled={isSubmitting} onClick={alTerminar}>
          {tFormulario("cancelar")}
        </Button>
      </div>
    </form>
  );
}
