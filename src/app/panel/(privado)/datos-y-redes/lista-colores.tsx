"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useId, useState } from "react";
import { useTranslations } from "next-intl";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { PlusIcon, Trash2Icon } from "lucide-react";
import { useTraductorErrores } from "@/components/formularios/use-traductor-errores";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { claveNombre } from "@/lib/datos-negocio/normalizar";
import type { ColorConUso } from "@/lib/datos-negocio/opciones-planta";
import {
  esquemaColores,
  esquemaNombreColor,
  type ColoresValidados,
  type EntradaColores,
} from "@/lib/validacion/datos-negocio";
import { borrarColor, guardarListaColores } from "./acciones";
import { DialogoEliminar, type PorEliminar } from "./dialogo-eliminar";

const TONO_NUEVO = "#6B7F67";
const estiloTono =
  "h-11 w-12 shrink-0 cursor-pointer rounded-xl border border-input bg-card p-1 outline-none focus-visible:ring-3 focus-visible:ring-ring/30";

const aFilas = (colores: ColorConUso[]) =>
  colores.map((color) => ({ colorId: color.id, nombre: color.nombre, hex: color.hex }));
const aUsos = (colores: ColorConUso[]) => new Map(colores.map((color) => [color.id, color.plantas]));

export function ListaColores({ inicial }: { inicial: ColorConUso[] }) {
  const t = useTranslations("panel.datos");
  const traducir = useTraductorErrores();
  const [usos, setUsos] = useState(() => aUsos(inicial));
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevoTono, setNuevoTono] = useState(TONO_NUEVO);
  const [errorNuevo, setErrorNuevo] = useState<string>();
  const [porEliminar, setPorEliminar] = useState<PorEliminar | null>(null);
  const idLista = useId();

  const {
    control,
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EntradaColores, unknown, ColoresValidados>({
    resolver: zodResolver(esquemaColores),
    defaultValues: { colores: aFilas(inicial) },
  });
  const { fields, append, remove } = useFieldArray({ control, name: "colores" });
  const filas = useWatch({ control, name: "colores" }) ?? [];

  const agregar = () => {
    const validacion = esquemaNombreColor.safeParse(nuevoNombre);
    if (!validacion.success) return setErrorNuevo(traducir(validacion.error.issues[0]?.message));
    if (filas.some((fila) => claveNombre(fila.nombre) === claveNombre(validacion.data))) {
      return setErrorNuevo(traducir("nombreRepetido"));
    }
    append({ colorId: null, nombre: validacion.data, hex: nuevoTono.toUpperCase() });
    setNuevoNombre("");
    setNuevoTono(TONO_NUEVO);
    setErrorNuevo(undefined);
  };

  const guardar = handleSubmit(
    async (datos) => {
      try {
        const resultado = await guardarListaColores(datos);
        if (resultado.ok) {
          reset({ colores: aFilas(resultado.colores) });
          setUsos(aUsos(resultado.colores));
          toast.success(t("colores.guardado"));
          return;
        }
        for (const [campo, clave] of Object.entries(resultado.campos ?? {})) {
          setError(campo as `colores.${number}.nombre`, { message: clave });
        }
        toast.error(traducir(resultado.error ?? "revisaCampos"));
      } catch {
        toast.error(traducir("inesperado"));
      }
    },
    () => toast.error(traducir("revisaCampos")),
  );

  const pedirEliminar = (indice: number) => {
    const fila = filas[indice];
    // Un color que todavía no se guarda solo se quita de la lista.
    if (!fila || fila.colorId === null) return remove(indice);
    setPorEliminar({ indice, id: fila.colorId, nombre: fila.nombre, plantas: usos.get(fila.colorId) ?? 0 });
  };

  const eliminar = async (elemento: PorEliminar) => {
    setPorEliminar(null);
    try {
      const resultado = await borrarColor(elemento.id);
      if (!resultado.ok) return toast.error(traducir(resultado.error));
      remove(elemento.indice);
      toast.success(
        resultado.plantas > 0
          ? t("eliminar.eliminadoEnUso", { nombre: resultado.nombre, n: resultado.plantas })
          : t("eliminar.eliminado", { nombre: resultado.nombre }),
      );
    } catch {
      toast.error(traducir("inesperado"));
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2>{t("colores.titulo")}</h2>
        </CardTitle>
        <CardDescription className="text-base">{t("colores.descripcion")}</CardDescription>
      </CardHeader>
      <form onSubmit={guardar} noValidate>
        <CardContent className="flex flex-col gap-4">
          {fields.length === 0 ? (
            <p className="text-sm text-texto-suave">{t("colores.vacio")}</p>
          ) : (
            <ul className="divide-y divide-border">
              {fields.map((campo, indice) => {
                const fila = filas[indice] ?? campo;
                const errorNombre = traducir(errors.colores?.[indice]?.nombre?.message);
                const idError = `${idLista}-${indice}-error`;
                return (
                  <li key={campo.id} className="flex items-start gap-3 py-3">
                    {/* Controlado a propósito: un selector de color nunca está vacío (el navegador le pone
                        #000000) y React Hook Form lo confundía con un campo ya editado y guardaba negro. */}
                    <Controller
                      control={control}
                      name={`colores.${indice}.hex`}
                      render={({ field }) => (
                        <input
                          type="color"
                          aria-label={t("colores.tono", { n: indice + 1 })}
                          className={estiloTono}
                          name={field.name}
                          ref={field.ref}
                          value={field.value.toLowerCase()}
                          onChange={(evento) => field.onChange(evento.target.value.toUpperCase())}
                          onBlur={field.onBlur}
                        />
                      )}
                    />
                    {/* En celular el contador va debajo del nombre; en pantallas anchas, a su lado. */}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
                        <Input
                          className="sm:flex-1"
                          aria-label={t("colores.nombre", { n: indice + 1 })}
                          aria-invalid={errorNombre ? true : undefined}
                          aria-describedby={errorNombre ? idError : undefined}
                          defaultValue={campo.nombre}
                          {...register(`colores.${indice}.nombre`)}
                        />
                        {fila.colorId === null ? (
                          <Badge variant="secondary" className="w-fit">
                            {t("lista.sinGuardar")}
                          </Badge>
                        ) : (
                          <span className="px-1 text-sm text-texto-suave sm:min-w-24 sm:px-0">
                            {t("lista.plantas", { n: usos.get(fila.colorId) ?? 0 })}
                          </span>
                        )}
                      </div>
                      {errorNombre && (
                        <p id={idError} role="alert" className="mt-1 text-sm text-destructive">
                          {errorNombre}
                        </p>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => pedirEliminar(indice)}
                    >
                      <Trash2Icon aria-hidden />
                      <span className="sr-only">{t("lista.eliminar", { nombre: fila.nombre })}</span>
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="rounded-xl bg-muted/60 p-3">
            <div className="flex flex-wrap items-start gap-3">
              <input
                type="color"
                aria-label={t("colores.nuevoTono")}
                className={estiloTono}
                value={nuevoTono}
                onChange={(evento) => setNuevoTono(evento.target.value)}
              />
              <div className="min-w-40 flex-1">
                <Input
                  aria-label={t("colores.nuevoNombre")}
                  placeholder={t("colores.nuevoNombre")}
                  value={nuevoNombre}
                  aria-invalid={errorNuevo ? true : undefined}
                  aria-describedby={errorNuevo ? `${idLista}-nuevo-error` : undefined}
                  onChange={(evento) => setNuevoNombre(evento.target.value)}
                  onKeyDown={(evento) => {
                    if (evento.key === "Enter") {
                      evento.preventDefault();
                      agregar();
                    }
                  }}
                />
                {errorNuevo && (
                  <p id={`${idLista}-nuevo-error`} role="alert" className="mt-1 text-sm text-destructive">
                    {errorNuevo}
                  </p>
                )}
              </div>
              <Button type="button" variant="outline" onClick={agregar}>
                <PlusIcon aria-hidden />
                {t("lista.agregar")}
              </Button>
            </div>
          </div>
        </CardContent>
        <CardFooter className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-texto-suave">{t("lista.pendientes")}</p>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? t("guardando") : t("colores.guardar")}
          </Button>
        </CardFooter>
      </form>
      <DialogoEliminar elemento={porEliminar} alCerrar={() => setPorEliminar(null)} alConfirmar={eliminar} />
    </Card>
  );
}
