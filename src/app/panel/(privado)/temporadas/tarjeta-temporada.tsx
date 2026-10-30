"use client";

import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { ImageIcon } from "lucide-react";
import { CampoInterruptor } from "@/components/formularios/campo-interruptor";
import { CampoSelector, CampoTexto } from "@/components/formularios/campo-texto";
import { useTraductorErrores } from "@/components/formularios/use-traductor-errores";
import { useTextoTemporada } from "@/components/panel/pildora-temporada";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { TemporadaConCatalogo } from "@/lib/temporadas/temporadas";
import { MESES, nombreMes } from "@/lib/temporadas/meses";
import { cn } from "@/lib/utils";
import { esquemaTemporada, type EntradaTemporada, type TemporadaValidada } from "@/lib/validacion/temporada";
import { guardarTemporadaAccion } from "./acciones";

/** Tarjeta de una temporada: borde superior de su color y, si es la de hoy, borde verde e insignia. */
export function TarjetaTemporada({ temporada, activa }: { temporada: TemporadaConCatalogo; activa: boolean }) {
  const t = useTranslations("panel.temporadas.tarjeta");
  const tCatalogos = useTranslations("panel.catalogos");
  const tFicha = useTranslations("panel.catalogos.ficha");
  const tFormulario = useTranslations("panel.formulario");
  const traducir = useTraductorErrores();
  const textoTemporada = useTextoTemporada();
  const idioma = useLocale();
  const { catalogo } = temporada;
  const id = (campo: string) => `temporada-${temporada.id}-${campo}`;

  const inicial: EntradaTemporada = {
    mesInicio: String(temporada.mesInicio),
    mesFin: String(temporada.mesFin),
    textoAviso: temporada.textoAviso ?? "",
    color: catalogo.color,
    prioridad: String(temporada.prioridad),
    visible: temporada.visible,
  };
  const {
    control,
    register,
    handleSubmit,
    getValues,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<EntradaTemporada, unknown, TemporadaValidada>({
    resolver: zodResolver(esquemaTemporada),
    defaultValues: inicial,
  });
  const registrar = (campo: "mesInicio" | "mesFin" | "textoAviso" | "prioridad") => ({
    ...register(campo),
    defaultValue: inicial[campo],
  });

  const guardar = handleSubmit(
    async () => {
      try {
        const resultado = await guardarTemporadaAccion(temporada.id, getValues());
        if (resultado.ok) return void toast.success(t("guardado", { nombre: catalogo.nombre }));
        for (const [campo, clave] of Object.entries(resultado.campos ?? {})) {
          setError(campo as keyof EntradaTemporada, { message: clave });
        }
        toast.error(traducir(resultado.error ?? "revisaCampos"));
      } catch {
        toast.error(traducir("inesperado"));
      }
    },
    () => toast.error(traducir("revisaCampos")),
  );

  return (
    <Card
      role="region"
      aria-labelledby={id("titulo")}
      className={cn("border-t-[6px]", activa && "ring-2 ring-hoja")}
      style={{ borderTopColor: catalogo.color }}
    >
      <form onSubmit={guardar} noValidate className="flex flex-1 flex-col">
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle>
              <h2 id={id("titulo")}>{catalogo.nombre}</h2>
            </CardTitle>
            {activa && <Badge className="bg-hoja text-white">{tCatalogos("seVeHoy")}</Badge>}
          </div>
          <p className="text-sm text-texto-suave">
            {textoTemporada(temporada)}
            {!temporada.visible && ` ${tCatalogos("oculta")}`}
          </p>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col gap-4">
          {temporada.todoElAnio ? (
            <p className="rounded-xl bg-muted/60 p-3 text-sm text-texto-suave">{t("base")}</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {(["mesInicio", "mesFin"] as const).map((campo) => (
                <CampoSelector
                  key={campo}
                  id={id(campo)}
                  etiqueta={tFicha(campo === "mesInicio" ? "empieza" : "termina")}
                  error={traducir(errors[campo]?.message)}
                  {...registrar(campo)}
                >
                  {MESES.map((mes) => (
                    <option key={mes} value={String(mes)}>
                      {nombreMes(mes, idioma)}
                    </option>
                  ))}
                </CampoSelector>
              ))}
            </div>
          )}
          <CampoTexto
            id={id("aviso")}
            etiqueta={t("aviso")}
            ayuda={t("avisoAyuda")}
            error={traducir(errors.textoAviso?.message)}
            {...registrar("textoAviso")}
          />
          <div className="grid gap-4 sm:grid-cols-[auto_1fr]">
            <div className="flex flex-col gap-2">
              <label htmlFor={id("color")} className="text-sm font-medium text-foreground">
                {t("color")}
              </label>
              {/* Controlado: un selector de color nunca está vacío y no debe leerse del navegador. */}
              <Controller
                control={control}
                name="color"
                render={({ field }) => (
                  <input
                    id={id("color")}
                    type="color"
                    className="h-11 w-20 cursor-pointer rounded-xl border border-input bg-card p-1"
                    name={field.name}
                    ref={field.ref}
                    value={field.value.toLowerCase()}
                    onChange={(evento) => field.onChange(evento.target.value.toUpperCase())}
                    onBlur={field.onBlur}
                  />
                )}
              />
            </div>
            {!temporada.todoElAnio && (
              <CampoTexto
                id={id("prioridad")}
                type="number"
                inputMode="numeric"
                min={0}
                max={100}
                etiqueta={t("prioridad")}
                ayuda={t("prioridadAyuda")}
                error={traducir(errors.prioridad?.message)}
                {...registrar("prioridad")}
              />
            )}
          </div>
          {!temporada.todoElAnio && (
            <Controller
              control={control}
              name="visible"
              render={({ field }) => (
                <CampoInterruptor
                  etiqueta={t("visible")}
                  ayuda={t("visibleAyuda")}
                  activo={field.value}
                  alCambiar={field.onChange}
                />
              )}
            />
          )}
        </CardContent>
        <CardFooter className="mt-6 flex flex-wrap justify-between gap-3">
          <Button variant="outline" asChild>
            <Link href={`/panel/catalogos/${catalogo.id}`}>
              <ImageIcon aria-hidden />
              {t("portadaYTextos")}
              <span className="sr-only"> · {catalogo.nombre}</span>
            </Link>
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? tFormulario("guardando") : tFormulario("guardar")}
            <span className="sr-only"> · {catalogo.nombre}</span>
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
