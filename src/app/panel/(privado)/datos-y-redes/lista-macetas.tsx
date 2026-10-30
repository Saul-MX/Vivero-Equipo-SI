"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useId, useState } from "react";
import { useTranslations } from "next-intl";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { ArrowDownIcon, ArrowUpIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { useTraductorErrores } from "@/components/formularios/use-traductor-errores";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { claveNombre } from "@/lib/datos-negocio/normalizar";
import type { MacetaConUso } from "@/lib/datos-negocio/opciones-planta";
import {
  esquemaMacetas,
  esquemaNombreMaceta,
  type EntradaMacetas,
  type MacetasValidadas,
} from "@/lib/validacion/datos-negocio";
import { borrarMaceta, guardarListaMacetas } from "./acciones";
import { DialogoEliminar, type PorEliminar } from "./dialogo-eliminar";

const aFilas = (macetas: MacetaConUso[]) =>
  macetas.map((maceta) => ({ macetaId: maceta.id, nombre: maceta.nombre }));
const aUsos = (macetas: MacetaConUso[]) => new Map(macetas.map((maceta) => [maceta.id, maceta.plantas]));

/** Lista ordenable (subir/bajar) de tamaños de maceta. */
export function ListaMacetas({ inicial }: { inicial: MacetaConUso[] }) {
  const t = useTranslations("panel.datos");
  const traducir = useTraductorErrores();
  const [usos, setUsos] = useState(() => aUsos(inicial));
  const [nuevoNombre, setNuevoNombre] = useState("");
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
  } = useForm<EntradaMacetas, unknown, MacetasValidadas>({
    resolver: zodResolver(esquemaMacetas),
    defaultValues: { macetas: aFilas(inicial) },
  });
  const { fields, append, remove, move } = useFieldArray({ control, name: "macetas" });
  const filas = useWatch({ control, name: "macetas" }) ?? [];

  const agregar = () => {
    const validacion = esquemaNombreMaceta.safeParse(nuevoNombre);
    if (!validacion.success) return setErrorNuevo(traducir(validacion.error.issues[0]?.message));
    if (filas.some((fila) => claveNombre(fila.nombre) === claveNombre(validacion.data))) {
      return setErrorNuevo(traducir("nombreRepetido"));
    }
    append({ macetaId: null, nombre: validacion.data });
    setNuevoNombre("");
    setErrorNuevo(undefined);
  };

  const guardar = handleSubmit(
    async (datos) => {
      try {
        const resultado = await guardarListaMacetas(datos);
        if (resultado.ok) {
          reset({ macetas: aFilas(resultado.macetas) });
          setUsos(aUsos(resultado.macetas));
          toast.success(t("macetas.guardado"));
          return;
        }
        for (const [campo, clave] of Object.entries(resultado.campos ?? {})) {
          setError(campo as `macetas.${number}.nombre`, { message: clave });
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
    if (!fila || fila.macetaId === null) return remove(indice);
    setPorEliminar({ indice, id: fila.macetaId, nombre: fila.nombre, plantas: usos.get(fila.macetaId) ?? 0 });
  };

  const eliminar = async (elemento: PorEliminar) => {
    setPorEliminar(null);
    try {
      const resultado = await borrarMaceta(elemento.id);
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
          <h2>{t("macetas.titulo")}</h2>
        </CardTitle>
        <CardDescription className="text-base">{t("macetas.descripcion")}</CardDescription>
      </CardHeader>
      <form onSubmit={guardar} noValidate>
        <CardContent className="flex flex-col gap-4">
          {fields.length === 0 ? (
            <p className="text-sm text-texto-suave">{t("macetas.vacio")}</p>
          ) : (
            <ul className="divide-y divide-border">
              {fields.map((campo, indice) => {
                const fila = filas[indice] ?? campo;
                const errorNombre = traducir(errors.macetas?.[indice]?.nombre?.message);
                const idError = `${idLista}-${indice}-error`;
                return (
                  <li key={campo.id} className="flex items-start gap-2 py-3 sm:gap-3">
                    <div className="flex h-11 shrink-0 items-center">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        disabled={indice === 0}
                        onClick={() => move(indice, indice - 1)}
                      >
                        <ArrowUpIcon aria-hidden />
                        <span className="sr-only">{t("macetas.subir", { nombre: fila.nombre })}</span>
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        disabled={indice === fields.length - 1}
                        onClick={() => move(indice, indice + 1)}
                      >
                        <ArrowDownIcon aria-hidden />
                        <span className="sr-only">{t("macetas.bajar", { nombre: fila.nombre })}</span>
                      </Button>
                    </div>
                    {/* En celular el contador va debajo del nombre; en pantallas anchas, a su lado. */}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
                        <Input
                          className="sm:flex-1"
                          aria-label={t("macetas.nombre", { n: indice + 1 })}
                          aria-invalid={errorNombre ? true : undefined}
                          aria-describedby={errorNombre ? idError : undefined}
                          defaultValue={campo.nombre}
                          {...register(`macetas.${indice}.nombre`)}
                        />
                        {fila.macetaId === null ? (
                          <Badge variant="secondary" className="w-fit">
                            {t("lista.sinGuardar")}
                          </Badge>
                        ) : (
                          <span className="px-1 text-sm text-texto-suave sm:min-w-24 sm:px-0">
                            {t("lista.plantas", { n: usos.get(fila.macetaId) ?? 0 })}
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
              <div className="min-w-40 flex-1">
                <Input
                  aria-label={t("macetas.nuevoNombre")}
                  placeholder={t("macetas.nuevoNombre")}
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
            {isSubmitting ? t("guardando") : t("macetas.guardar")}
          </Button>
        </CardFooter>
      </form>
      <DialogoEliminar elemento={porEliminar} alCerrar={() => setPorEliminar(null)} alConfirmar={eliminar} />
    </Card>
  );
}
