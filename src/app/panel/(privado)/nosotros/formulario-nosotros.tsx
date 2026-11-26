"use client";

import { useId, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Controller, get, useFieldArray, useForm, type FieldPath } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { PlusIcon, Trash2Icon } from "lucide-react";
import { CampoAreaTexto, CampoTexto } from "@/components/formularios/campo-texto";
import { GaleriaFotos } from "@/components/formularios/galeria-fotos";
import { SubirImagen } from "@/components/formularios/subir-imagen";
import { useTraductorErrores } from "@/components/formularios/use-traductor-errores";
import { BotonesOrden } from "@/components/panel/botones-orden";
import { EncabezadoPagina } from "@/components/panel/encabezado-pagina";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  esquemaNosotros,
  MAXIMO_MOMENTOS,
  MAXIMO_VALORES,
  type EntradaNosotros,
  type NosotrosValidado,
} from "@/lib/validacion/nosotros";
import { guardarNosotrosAccion } from "./acciones";

type Ruta = FieldPath<EntradaNosotros>;

/** Una tarjeta por sección, con su título como nombre de la región (para lectores de pantalla). */
function Seccion({ titulo, ayuda, children }: { titulo: string; ayuda?: string; children: ReactNode }) {
  const id = useId();
  return (
    <Card role="region" aria-labelledby={id}>
      <CardHeader>
        <CardTitle>
          <h2 id={id}>{titulo}</h2>
        </CardTitle>
        {ayuda && <CardDescription>{ayuda}</CardDescription>}
      </CardHeader>
      <CardContent className="flex flex-col gap-6">{children}</CardContent>
    </Card>
  );
}

/** Pantalla «Nosotros»: una sola pantalla con Guardar arriba y abajo (sección 5.2). */
export function FormularioNosotros({ inicial }: { inicial: EntradaNosotros }) {
  const t = useTranslations("panel.nosotros");
  const tSecciones = useTranslations("panel.secciones.nosotros");
  const tFormulario = useTranslations("panel.formulario");
  const traducir = useTraductorErrores();

  const {
    control,
    register,
    handleSubmit,
    getValues,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EntradaNosotros, unknown, NosotrosValidado>({
    resolver: zodResolver(esquemaNosotros),
    defaultValues: inicial,
  });
  const momentos = useFieldArray({ control, name: "momentos" });
  const valores = useFieldArray({ control, name: "valores.lista" });
  const error = (ruta: Ruta) => traducir((get(errors, ruta) as { message?: string } | undefined)?.message);

  const guardar = handleSubmit(
    async () => {
      try {
        const resultado = await guardarNosotrosAccion(getValues());
        if (!resultado.ok) {
          for (const [campo, clave] of Object.entries(resultado.campos ?? {})) {
            setError(campo as Ruta, { message: clave });
          }
          toast.error(traducir(resultado.error ?? "revisaCampos"));
          return;
        }
        // Las fotos nuevas ya tienen su nombre definitivo: el formulario se actualiza con lo guardado.
        reset(resultado.nosotros);
        toast.success(tFormulario("guardado"));
      } catch {
        toast.error(traducir("inesperado"));
      }
    },
    () => toast.error(traducir("revisaCampos")),
  );

  const botonGuardar = (
    <Button type="submit" disabled={isSubmitting}>
      {isSubmitting ? tFormulario("guardando") : tFormulario("guardar")}
    </Button>
  );

  const fotoSuperior = (seccion: "historia" | "mision" | "vision" | "valores") => (
    <Controller
      control={control}
      name={`${seccion}.fotoSuperior`}
      render={({ field }) => (
        <SubirImagen
          etiqueta={t("fotoSuperior")}
          ayuda={t("fotoSuperiorAyuda")}
          valor={field.value}
          alCambiar={field.onChange}
        />
      )}
    />
  );
  const galeria = (seccion: "historia" | "mision" | "vision" | "valores", ayuda: string) => (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium text-foreground">{t("galeria")}</p>
      <Controller
        control={control}
        name={`${seccion}.galeria`}
        render={({ field }) => (
          <GaleriaFotos valor={field.value} alCambiar={field.onChange} conPortada={false} ayuda={ayuda} />
        )}
      />
      {error(`${seccion}.galeria`) && <p className="text-sm text-destructive">{error(`${seccion}.galeria`)}</p>}
    </div>
  );
  const textoSeccion = (seccion: "historia" | "mision" | "vision", etiqueta: string) => (
    <CampoAreaTexto
      id={`${seccion}-texto`}
      etiqueta={etiqueta}
      ayuda={t("textoAyuda")}
      rows={8}
      error={error(`${seccion}.texto`)}
      {...register(`${seccion}.texto`)}
      defaultValue={inicial[seccion].texto}
    />
  );

  return (
    <form method="post" onSubmit={guardar} noValidate className="flex flex-col gap-6">
      <EncabezadoPagina titulo={tSecciones("titulo")} subtitulo={tSecciones("subtitulo")} acciones={botonGuardar} />

      <Seccion titulo={t("historia")}>
        {textoSeccion("historia", t("historiaTexto"))}
        {fotoSuperior("historia")}
        {galeria("historia", t("galeriaHistoriaAyuda"))}
      </Seccion>

      <Seccion titulo={t("momentos")} ayuda={t("momentosAyuda")}>
        {momentos.fields.length === 0 && <p className="text-texto-suave">{t("sinMomentos")}</p>}
        <ol className="flex flex-col gap-4">
          {momentos.fields.map((momento, indice) => (
            <li key={momento.id} className="flex flex-col gap-4 rounded-2xl p-4 ring-1 ring-border">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-medium">{t("momento", { n: indice + 1 })}</h3>
                <div className="flex items-center">
                  <BotonesOrden
                    esPrimero={indice === 0}
                    esUltimo={indice === momentos.fields.length - 1}
                    etiquetaSubir={t("subirMomento", { n: indice + 1 })}
                    etiquetaBajar={t("bajarMomento", { n: indice + 1 })}
                    alMover={(direccion) => momentos.move(indice, direccion === "subir" ? indice - 1 : indice + 1)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => momentos.remove(indice)}
                  >
                    <Trash2Icon aria-hidden />
                    <span className="sr-only">{t("quitarMomento", { n: indice + 1 })}</span>
                  </Button>
                </div>
              </div>
              <CampoTexto
                id={`momento-titulo-${indice}`}
                etiqueta={t("momentoTitulo")}
                ayuda={t("momentoTituloAyuda")}
                error={error(`momentos.${indice}.titulo`)}
                {...register(`momentos.${indice}.titulo`)}
                defaultValue={momento.titulo}
              />
              <CampoAreaTexto
                id={`momento-texto-${indice}`}
                etiqueta={t("momentoTexto")}
                rows={3}
                error={error(`momentos.${indice}.texto`)}
                {...register(`momentos.${indice}.texto`)}
                defaultValue={momento.texto}
              />
              <Controller
                control={control}
                name={`momentos.${indice}.foto`}
                render={({ field }) => (
                  <SubirImagen etiqueta={t("momentoFoto")} valor={field.value} alCambiar={field.onChange} />
                )}
              />
            </li>
          ))}
        </ol>
        {momentos.fields.length < MAXIMO_MOMENTOS && (
          <Button
            type="button"
            variant="outline"
            className="self-start"
            onClick={() => momentos.append({ id: null, titulo: "", texto: "", foto: null })}
          >
            <PlusIcon aria-hidden />
            {t("agregarMomento")}
          </Button>
        )}
      </Seccion>

      <Seccion titulo={t("mision")}>
        {textoSeccion("mision", t("misionTexto"))}
        {fotoSuperior("mision")}
        {galeria("mision", t("galeriaAyuda"))}
      </Seccion>

      <Seccion titulo={t("vision")}>
        {textoSeccion("vision", t("visionTexto"))}
        {fotoSuperior("vision")}
        {galeria("vision", t("galeriaAyuda"))}
      </Seccion>

      <Seccion titulo={t("valores")}>
        {valores.fields.length === 0 && <p className="text-texto-suave">{t("sinValores")}</p>}
        <ol className="flex flex-col gap-4">
          {valores.fields.map((valor, indice) => (
            <li key={valor.id} className="flex flex-col gap-4 rounded-2xl p-4 ring-1 ring-border">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-medium">{t("valor", { n: indice + 1 })}</h3>
                <div className="flex items-center">
                  <BotonesOrden
                    esPrimero={indice === 0}
                    esUltimo={indice === valores.fields.length - 1}
                    etiquetaSubir={t("subirValor", { n: indice + 1 })}
                    etiquetaBajar={t("bajarValor", { n: indice + 1 })}
                    alMover={(direccion) => valores.move(indice, direccion === "subir" ? indice - 1 : indice + 1)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => valores.remove(indice)}
                  >
                    <Trash2Icon aria-hidden />
                    <span className="sr-only">{t("quitarValor", { n: indice + 1 })}</span>
                  </Button>
                </div>
              </div>
              <CampoTexto
                id={`valor-titulo-${indice}`}
                etiqueta={t("valorTitulo")}
                ayuda={t("valorTituloAyuda")}
                error={error(`valores.lista.${indice}.titulo`)}
                {...register(`valores.lista.${indice}.titulo`)}
                defaultValue={valor.titulo}
              />
              <CampoAreaTexto
                id={`valor-descripcion-${indice}`}
                etiqueta={t("valorDescripcion")}
                rows={2}
                error={error(`valores.lista.${indice}.descripcion`)}
                {...register(`valores.lista.${indice}.descripcion`)}
                defaultValue={valor.descripcion}
              />
            </li>
          ))}
        </ol>
        {valores.fields.length < MAXIMO_VALORES && (
          <Button
            type="button"
            variant="outline"
            className="self-start"
            onClick={() => valores.append({ titulo: "", descripcion: "" })}
          >
            <PlusIcon aria-hidden />
            {t("agregarValor")}
          </Button>
        )}
        {fotoSuperior("valores")}
        {galeria("valores", t("galeriaAyuda"))}
      </Seccion>

      <div className="flex justify-end">{botonGuardar}</div>
    </form>
  );
}
