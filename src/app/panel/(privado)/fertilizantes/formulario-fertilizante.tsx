"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Trash2Icon } from "lucide-react";
import { CampoInterruptor } from "@/components/formularios/campo-interruptor";
import { ChipsSeleccion } from "@/components/formularios/chips-seleccion";
import { CampoAreaTexto, CampoSelector, CampoTexto } from "@/components/formularios/campo-texto";
import { SubirImagen } from "@/components/formularios/subir-imagen";
import { useTraductorErrores } from "@/components/formularios/use-traductor-errores";
import { EncabezadoPagina } from "@/components/panel/encabezado-pagina";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  esquemaFertilizante,
  TIPOS_FERTILIZANTE,
  type EntradaFertilizante,
  type FertilizanteValidado,
} from "@/lib/validacion/fertilizante";
import { eliminarFertilizanteAccion, guardarFertilizanteAccion } from "./acciones";

const RUTA_LISTA = "/panel/fertilizantes";

const VALORES_NUEVO: EntradaFertilizante = {
  nombre: "",
  tipo: "",
  paraQueSirve: "",
  catalogos: [],
  dosis: "",
  frecuencia: "",
  pasosAplicacion: "",
  precauciones: "",
  presentacion: "",
  visible: true,
  foto: null,
};

type Props = {
  /** null = fertilizante nuevo. */
  fertilizante: { id: number; plantas: number; valores: EntradaFertilizante } | null;
  catalogos: { id: number; nombre: string }[];
};

/** Formulario «Nuevo fertilizante» / editar fertilizante (sección 4.5). */
export function FormularioFertilizante({ fertilizante, catalogos }: Props) {
  const t = useTranslations("panel.fertilizantes.formulario");
  const tFertilizantes = useTranslations("panel.fertilizantes");
  const tFormulario = useTranslations("panel.formulario");
  const tComun = useTranslations("comun");
  const traducir = useTraductorErrores();
  const router = useRouter();
  const [confirmarEliminar, setConfirmarEliminar] = useState(false);
  const inicial = fertilizante?.valores ?? VALORES_NUEVO;

  const {
    control,
    register,
    handleSubmit,
    getValues,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<EntradaFertilizante, unknown, FertilizanteValidado>({
    resolver: zodResolver(esquemaFertilizante),
    defaultValues: inicial,
  });
  const nombre = useWatch({ control, name: "nombre" });

  type CampoTexto = "nombre" | "tipo" | "paraQueSirve" | "dosis" | "frecuencia" | "pasosAplicacion"
    | "precauciones" | "presentacion";
  const registrar = (campo: CampoTexto) => ({ ...register(campo), defaultValue: inicial[campo] });
  const error = (campo: keyof EntradaFertilizante) => traducir(errors[campo]?.message as string | undefined);

  const guardar = (seguirEditando: boolean) =>
    handleSubmit(
      async () => {
        try {
          const resultado = await guardarFertilizanteAccion(getValues(), fertilizante?.id ?? null);
          if (!resultado.ok) {
            for (const [campo, clave] of Object.entries(resultado.campos ?? {})) {
              setError(campo as keyof EntradaFertilizante, { message: clave });
            }
            toast.error(traducir(resultado.error ?? "revisaCampos"));
            return;
          }
          toast.success(tFormulario("guardado"));
          if (!seguirEditando) router.push(RUTA_LISTA);
          else if (!fertilizante) router.replace(`${RUTA_LISTA}/${resultado.id}`);
          else router.refresh();
        } catch {
          toast.error(traducir("inesperado"));
        }
      },
      () => toast.error(traducir("revisaCampos")),
    );

  const eliminar = async () => {
    if (!fertilizante) return;
    try {
      const resultado = await eliminarFertilizanteAccion(fertilizante.id);
      if (!resultado.ok) return void toast.error(traducir("noEncontrado"));
      toast.success(tFertilizantes("eliminado", { nombre: resultado.nombre }));
      router.push(RUTA_LISTA);
    } catch {
      toast.error(traducir("inesperado"));
    }
  };

  const botonGuardar = (
    <Button type="submit" disabled={isSubmitting}>
      {isSubmitting ? tFormulario("guardando") : tFormulario("guardar")}
    </Button>
  );
  const botonCancelar = (
    <Button variant="outline" asChild>
      <Link href={RUTA_LISTA}>{tFormulario("cancelar")}</Link>
    </Button>
  );

  return (
    <form onSubmit={guardar(false)} noValidate className="flex flex-col gap-6">
      <EncabezadoPagina
        titulo={fertilizante ? nombre || inicial.nombre : t("tituloNuevo")}
        acciones={
          <>
            {botonCancelar}
            {botonGuardar}
          </>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>
            <h2>{t("datos")}</h2>
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 md:grid-cols-2">
          <CampoTexto id="nombre" etiqueta={t("nombre")} ayuda={t("nombreAyuda")} error={error("nombre")} {...registrar("nombre")} />
          <CampoSelector id="tipo" etiqueta={t("tipo")} error={error("tipo")} {...registrar("tipo")}>
            <option value="">{t("eligeTipo")}</option>
            {TIPOS_FERTILIZANTE.map((tipo) => (
              <option key={tipo} value={tipo}>
                {tFertilizantes(`tipos.${tipo}`)}
              </option>
            ))}
          </CampoSelector>
          <CampoAreaTexto
            id="paraQueSirve"
            etiqueta={t("paraQueSirve")}
            ayuda={t("paraQueSirveAyuda")}
            claseCampo="md:col-span-2"
            error={error("paraQueSirve")}
            {...registrar("paraQueSirve")}
          />
          <div className="md:col-span-2">
            <Controller
              control={control}
              name="catalogos"
              render={({ field }) => (
                <ChipsSeleccion
                  leyenda={t("recomendado")}
                  opciones={catalogos.map((catalogo) => ({ valor: String(catalogo.id), etiqueta: catalogo.nombre }))}
                  valor={field.value}
                  alCambiar={field.onChange}
                  vacio={t("sinCatalogos")}
                />
              )}
            />
          </div>
          <CampoTexto
            id="presentacion"
            etiqueta={t("presentacion")}
            ayuda={t("presentacionAyuda")}
            error={error("presentacion")}
            {...registrar("presentacion")}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            <h2>{t("uso")}</h2>
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 md:grid-cols-2">
          <CampoTexto id="dosis" etiqueta={t("dosis")} ayuda={t("dosisAyuda")} error={error("dosis")} {...registrar("dosis")} />
          <CampoTexto
            id="frecuencia"
            etiqueta={t("frecuencia")}
            ayuda={t("frecuenciaAyuda")}
            error={error("frecuencia")}
            {...registrar("frecuencia")}
          />
          <CampoAreaTexto
            id="pasosAplicacion"
            etiqueta={t("pasos")}
            ayuda={t("pasosAyuda")}
            claseCampo="md:col-span-2"
            error={error("pasosAplicacion")}
            {...registrar("pasosAplicacion")}
          />
          <CampoAreaTexto
            id="precauciones"
            etiqueta={tFormulario("opcional", { campo: t("precauciones") })}
            claseCampo="md:col-span-2"
            error={error("precauciones")}
            {...registrar("precauciones")}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            <h2>{t("enElSitio")}</h2>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <Controller
            control={control}
            name="foto"
            render={({ field }) => (
              <SubirImagen etiqueta={t("foto")} valor={field.value} alCambiar={field.onChange} />
            )}
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
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-3">
        {botonGuardar}
        <Button type="button" variant="outline" disabled={isSubmitting} onClick={guardar(true)}>
          {tFormulario("guardarYSeguir")}
        </Button>
        {botonCancelar}
        {fertilizante && (
          <Button
            type="button"
            variant="ghost"
            className="text-destructive hover:text-destructive sm:ml-auto"
            onClick={() => setConfirmarEliminar(true)}
          >
            <Trash2Icon aria-hidden />
            {t("eliminar")}
          </Button>
        )}
      </div>

      <AlertDialog open={confirmarEliminar} onOpenChange={setConfirmarEliminar}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{tFertilizantes("eliminarTitulo", { nombre: inicial.nombre })}</AlertDialogTitle>
            <AlertDialogDescription>
              {fertilizante && fertilizante.plantas > 0 && `${tFertilizantes("eliminarEnUso", { n: fertilizante.plantas })} `}
              {tFertilizantes("eliminarTexto")} {tFormulario("noSePuedeDeshacer")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tComun("cancelar")}</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={() => void eliminar()}>
              {tFormulario("eliminar")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </form>
  );
}
