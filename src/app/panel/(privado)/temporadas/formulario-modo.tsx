"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { CampoSelector } from "@/components/formularios/campo-texto";
import { useTraductorErrores } from "@/components/formularios/use-traductor-errores";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  esquemaModoTemporada,
  type EntradaModoTemporada,
  type ModoTemporadaValidado,
} from "@/lib/validacion/temporada";
import { guardarModoAccion } from "./acciones";

const MODOS = [
  { valor: "AUTOMATICA", titulo: "automatica", ayuda: "automaticaAyuda" },
  { valor: "FORZADA", titulo: "forzada", ayuda: "forzadaAyuda" },
  { valor: "FIJA_TODO_EL_ANIO", titulo: "fija", ayuda: "fijaAyuda" },
] as const;

/** Tarjeta «¿Qué temporada se muestra?» con los tres modos. */
export function FormularioModo({
  inicial,
  temporadas,
  textoAhora,
}: {
  inicial: EntradaModoTemporada;
  temporadas: { id: number; nombre: string }[];
  textoAhora: string;
}) {
  const t = useTranslations("panel.temporadas.modo");
  const tFormulario = useTranslations("panel.formulario");
  const traducir = useTraductorErrores();
  const {
    control,
    register,
    handleSubmit,
    getValues,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<EntradaModoTemporada, unknown, ModoTemporadaValidado>({
    resolver: zodResolver(esquemaModoTemporada),
    defaultValues: inicial,
  });
  const modo = useWatch({ control, name: "modo" });

  const guardar = handleSubmit(
    async () => {
      try {
        const resultado = await guardarModoAccion(getValues());
        if (resultado.ok) return void toast.success(t("guardado"));
        for (const [campo, clave] of Object.entries(resultado.campos ?? {})) {
          setError(campo as keyof EntradaModoTemporada, { message: clave });
        }
        toast.error(traducir(resultado.error ?? "revisaCampos"));
      } catch {
        toast.error(traducir("inesperado"));
      }
    },
    () => toast.error(traducir("revisaCampos")),
  );

  return (
    <Card>
      <form method="post" onSubmit={guardar} noValidate>
        <CardHeader>
          <CardTitle>
            <h2>{t("titulo")}</h2>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <fieldset className="grid gap-3 lg:grid-cols-3">
            <legend className="sr-only">{t("titulo")}</legend>
            {MODOS.map(({ valor, titulo, ayuda }) => (
              <label
                key={valor}
                className={cn(
                  "flex cursor-pointer gap-3 rounded-xl border border-border bg-card p-4 transition-colors has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50",
                  modo === valor && "border-hoja bg-muted/60",
                )}
              >
                <input
                  type="radio"
                  value={valor}
                  defaultChecked={inicial.modo === valor}
                  className="mt-1 size-4 accent-[var(--hoja)]"
                  {...register("modo")}
                />
                <span>
                  <span className="block text-sm font-medium text-foreground">{t(titulo)}</span>
                  <span className="mt-0.5 block text-sm text-texto-suave">{t(ayuda)}</span>
                </span>
              </label>
            ))}
          </fieldset>

          {modo === "FORZADA" && (
            <CampoSelector
              id="temporadaForzadaId"
              etiqueta={t("cual")}
              claseCampo="max-w-sm"
              defaultValue={inicial.temporadaForzadaId}
              error={traducir(errors.temporadaForzadaId?.message)}
              {...register("temporadaForzadaId")}
            >
              <option value="">{t("elige")}</option>
              {temporadas.map((temporada) => (
                <option key={temporada.id} value={String(temporada.id)}>
                  {temporada.nombre}
                </option>
              ))}
            </CampoSelector>
          )}
        </CardContent>
        <CardFooter className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <p className="font-medium text-pino" aria-live="polite">
            {textoAhora}
          </p>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? tFormulario("guardando") : tFormulario("guardar")}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
