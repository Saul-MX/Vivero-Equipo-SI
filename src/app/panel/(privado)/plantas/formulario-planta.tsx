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
import type { OpcionesFormularioPlanta } from "@/lib/catalogo/plantas";
import {
  CANTIDADES_AGUA,
  DIAS_RIEGO,
  ETIQUETAS_PLANTA,
  LUCES,
  esquemaPlanta,
  type EntradaPlanta,
  type PlantaValidada,
} from "@/lib/validacion/planta";
import { eliminarPlantaAccion, guardarPlantaAccion } from "./acciones";
import { GaleriaFotos } from "@/components/formularios/galeria-fotos";
import { VistaPreviaRiego } from "./vista-previa-riego";

const RUTA_LISTA = "/panel/plantas";

export const VALORES_PLANTA_NUEVA: EntradaPlanta = {
  nombre: "",
  variedad: "",
  catalogoId: "",
  etiqueta: "",
  luces: [],
  colores: [],
  macetas: [],
  riegoDias: "",
  cantidadAgua: "",
  fertilizanteId: "",
  notaRiego: "",
  descripcionCorta: "",
  cuidados: "",
  disponible: true,
  visible: true,
  fotos: [],
};

type Props = {
  /** null = planta nueva. */
  planta: { id: number; slug: string; valores: EntradaPlanta } | null;
  opciones: OpcionesFormularioPlanta;
  /** Valores iniciales de una planta nueva (por ejemplo, el catálogo si se llegó desde un filtro). */
  valoresNueva?: EntradaPlanta;
};

/** Formulario «Nueva planta» / editar planta (sección 4.2). */
export function FormularioPlanta({ planta, opciones, valoresNueva = VALORES_PLANTA_NUEVA }: Props) {
  const t = useTranslations("panel.plantas.formulario");
  const tPlantas = useTranslations("panel.plantas");
  const tGaleria = useTranslations("panel.plantas.galeria");
  const tFormulario = useTranslations("panel.formulario");
  const tComun = useTranslations("comun");
  const traducir = useTraductorErrores();
  const router = useRouter();
  const [confirmarEliminar, setConfirmarEliminar] = useState(false);
  const inicial = planta?.valores ?? valoresNueva;

  const {
    control,
    register,
    handleSubmit,
    getValues,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<EntradaPlanta, unknown, PlantaValidada>({
    resolver: zodResolver(esquemaPlanta),
    defaultValues: inicial,
  });
  const [nombre, riegoDias, cantidadAgua, fertilizanteId, notaRiego, disponible] = useWatch({
    control,
    name: ["nombre", "riegoDias", "cantidadAgua", "fertilizanteId", "notaRiego", "disponible"],
  });

  type CampoTexto = "nombre" | "variedad" | "catalogoId" | "etiqueta" | "riegoDias" | "cantidadAgua"
    | "fertilizanteId" | "notaRiego" | "descripcionCorta" | "cuidados";
  // defaultValue: los campos llegan llenos desde el servidor, sin parpadear vacíos al cargar.
  const registrar = (campo: CampoTexto) => ({ ...register(campo), defaultValue: inicial[campo] });
  const error = (campo: keyof EntradaPlanta) => traducir(errors[campo]?.message as string | undefined);

  const guardar = (seguirEditando: boolean) =>
    handleSubmit(
      async () => {
        try {
          const resultado = await guardarPlantaAccion(getValues(), planta?.id ?? null);
          if (!resultado.ok) {
            for (const [campo, clave] of Object.entries(resultado.campos ?? {})) {
              setError(campo as keyof EntradaPlanta, { message: clave });
            }
            toast.error(traducir(resultado.error ?? "revisaCampos"));
            return;
          }
          toast.success(tFormulario("guardado"));
          if (!seguirEditando) router.push(RUTA_LISTA);
          else if (!planta) router.replace(`${RUTA_LISTA}/${resultado.id}`);
          else router.refresh();
        } catch {
          toast.error(traducir("inesperado"));
        }
      },
      () => toast.error(traducir("revisaCampos")),
    );

  const eliminar = async () => {
    if (!planta) return;
    try {
      const resultado = await eliminarPlantaAccion(planta.id);
      if (!resultado.ok) return void toast.error(traducir("noEncontrado"));
      toast.success(tPlantas("eliminada", { nombre: resultado.nombre }));
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
  const nombreFertilizante =
    opciones.fertilizantes.find((fertilizante) => String(fertilizante.id) === fertilizanteId)?.nombre ?? null;

  return (
    <form method="post" onSubmit={guardar(false)} noValidate className="flex flex-col gap-6">
      <EncabezadoPagina
        titulo={planta ? nombre || inicial.nombre : t("tituloNueva")}
        subtitulo={planta ? `/plantas/${planta.slug}` : undefined}
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
          <CampoTexto
            id="variedad"
            etiqueta={tFormulario("opcional", { campo: t("variedad") })}
            ayuda={t("variedadAyuda")}
            error={error("variedad")}
            {...registrar("variedad")}
          />
          <CampoSelector id="catalogoId" etiqueta={t("catalogo")} error={error("catalogoId")} {...registrar("catalogoId")}>
            <option value="">{t("eligeCatalogo")}</option>
            {opciones.catalogos.map((catalogo) => (
              <option key={catalogo.id} value={String(catalogo.id)}>
                {catalogo.nombre}
              </option>
            ))}
          </CampoSelector>
          <CampoSelector id="etiqueta" etiqueta={t("etiqueta")} {...registrar("etiqueta")}>
            <option value="">{t("sinEtiqueta")}</option>
            {ETIQUETAS_PLANTA.map((etiqueta) => (
              <option key={etiqueta} value={etiqueta}>
                {t(`etiquetas.${etiqueta}`)}
              </option>
            ))}
          </CampoSelector>
          <p className="text-sm md:col-span-2">
            <span className="font-medium text-foreground">{t("direccion")}: </span>
            <span className="text-texto-suave">{planta ? `/plantas/${planta.slug}` : t("direccionNueva")}</span>
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            <h2>{t("caracteristicas")}</h2>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <Controller
            control={control}
            name="luces"
            render={({ field }) => (
              <ChipsSeleccion
                leyenda={t("luz")}
                opciones={LUCES.map((luz) => ({ valor: luz, etiqueta: t(`luces.${luz}`) }))}
                valor={field.value}
                alCambiar={(valor) => field.onChange(valor)}
              />
            )}
          />
          <Controller
            control={control}
            name="colores"
            render={({ field }) => (
              <ChipsSeleccion
                leyenda={t("colores")}
                opciones={opciones.colores.map((color) => ({ valor: String(color.id), etiqueta: color.nombre, color: color.hex }))}
                valor={field.value}
                alCambiar={field.onChange}
                vacio={t("sinColores")}
              />
            )}
          />
          <Controller
            control={control}
            name="macetas"
            render={({ field }) => (
              <ChipsSeleccion
                leyenda={t("macetas")}
                opciones={opciones.macetas.map((maceta) => ({ valor: String(maceta.id), etiqueta: maceta.nombre }))}
                valor={field.value}
                alCambiar={field.onChange}
                vacio={t("sinMacetas")}
              />
            )}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            <h2>{t("riego")}</h2>
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 lg:grid-cols-[1fr_minmax(0,22rem)]">
          <div className="grid content-start gap-5 sm:grid-cols-2">
            <CampoSelector id="riegoDias" etiqueta={t("dias")} {...registrar("riegoDias")}>
              <option value="">{t("sinDato")}</option>
              {DIAS_RIEGO.map((dias) => (
                <option key={dias} value={dias}>
                  {dias === "7" ? t("diario") : t("vecesPorSemana", { n: Number(dias) })}
                </option>
              ))}
            </CampoSelector>
            <CampoSelector id="cantidadAgua" etiqueta={t("cantidadAgua")} {...registrar("cantidadAgua")}>
              <option value="">{t("sinDato")}</option>
              {CANTIDADES_AGUA.map((cantidad) => (
                <option key={cantidad} value={cantidad}>
                  {t(`cantidades.${cantidad}`)}
                </option>
              ))}
            </CampoSelector>
            <CampoSelector
              id="fertilizanteId"
              etiqueta={t("fertilizante")}
              ayuda={opciones.fertilizantes.length === 0 ? t("sinFertilizantes") : undefined}
              claseCampo="sm:col-span-2"
              {...registrar("fertilizanteId")}
            >
              <option value="">{t("ninguno")}</option>
              {opciones.fertilizantes.map((fertilizante) => (
                <option key={fertilizante.id} value={String(fertilizante.id)}>
                  {fertilizante.nombre}
                </option>
              ))}
            </CampoSelector>
            <CampoTexto
              id="notaRiego"
              etiqueta={t("notaRiego")}
              ayuda={t("notaRiegoAyuda")}
              claseCampo="sm:col-span-2"
              error={error("notaRiego")}
              {...registrar("notaRiego")}
            />
          </div>
          <VistaPreviaRiego dias={riegoDias} cantidad={cantidadAgua} fertilizante={nombreFertilizante} nota={notaRiego} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            <h2>{t("textos")}</h2>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <CampoAreaTexto
            id="descripcionCorta"
            etiqueta={t("descripcionCorta")}
            ayuda={t("descripcionCortaAyuda")}
            error={error("descripcionCorta")}
            {...registrar("descripcionCorta")}
          />
          <CampoAreaTexto
            id="cuidados"
            etiqueta={t("cuidados")}
            ayuda={t("cuidadosAyuda")}
            error={error("cuidados")}
            {...registrar("cuidados")}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            <h2>{tGaleria("titulo")}</h2>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Controller
            control={control}
            name="fotos"
            render={({ field }) => <GaleriaFotos valor={field.value} alCambiar={field.onChange} />}
          />
          {error("fotos") && (
            <p role="alert" className="mt-2 text-sm text-destructive">
              {error("fotos")}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            <h2>{t("enElSitio")}</h2>
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 lg:grid-cols-2">
          <Controller
            control={control}
            name="disponible"
            render={({ field }) => (
              <CampoInterruptor
                etiqueta={t("disponible")}
                ayuda={`${t(disponible ? "estadoDisponible" : "estadoAgotado")} ${t("disponibleAyuda")}`}
                activo={field.value}
                alCambiar={field.onChange}
              />
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
        {planta && (
          <Button
            type="button"
            variant="ghost"
            className="text-destructive hover:text-destructive sm:ml-auto"
            onClick={() => setConfirmarEliminar(true)}
          >
            <Trash2Icon aria-hidden />
            {t("eliminarPlanta")}
          </Button>
        )}
      </div>

      <AlertDialog open={confirmarEliminar} onOpenChange={setConfirmarEliminar}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{tPlantas("eliminarTitulo", { nombre: inicial.nombre })}</AlertDialogTitle>
            <AlertDialogDescription>
              {tPlantas("eliminarTexto")} {tFormulario("noSePuedeDeshacer")}
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
