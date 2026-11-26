"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { useTranslations } from "next-intl";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { InfoIcon, Trash2Icon } from "lucide-react";
import { CampoInterruptor } from "@/components/formularios/campo-interruptor";
import { CampoAreaTexto, CampoSelector, CampoTexto } from "@/components/formularios/campo-texto";
import { OpcionesRadio } from "@/components/formularios/opciones-radio";
import { SubirImagen } from "@/components/formularios/subir-imagen";
import { SubirVideo } from "@/components/formularios/subir-video";
import { useTraductorErrores } from "@/components/formularios/use-traductor-errores";
import { ConfirmarEliminar } from "@/components/panel/confirmar-eliminar";
import { EncabezadoPagina } from "@/components/panel/encabezado-pagina";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  esquemaAnuncio,
  POSICIONES_TEXTO,
  type AnuncioValidado,
  type EntradaAnuncio,
} from "@/lib/validacion/anuncio";
import { eliminarAnuncioAccion, guardarAnuncioAccion } from "./acciones";
import { VistaPreviaAnuncio } from "./vista-previa-anuncio";

const RUTA_LISTA = "/panel/carrusel";

const VALORES_NUEVO: EntradaAnuncio = {
  tipoMedio: "IMAGEN",
  archivo: null,
  archivoMovil: null,
  imagenEspera: null,
  imagenConTexto: false,
  textoPequeno: "",
  titulo: "",
  texto: "",
  boton1Texto: "",
  boton1Destino: "",
  boton2Texto: "",
  boton2Destino: "",
  posicionTexto: "IZQUIERDA",
  oscurecido: 50,
  temporadaId: "",
  desde: "",
  hasta: "",
  visible: true,
};

type Props = {
  /** null = anuncio nuevo. */
  anuncio: { id: number; valores: EntradaAnuncio } | null;
  temporadas: { id: number; nombre: string; visible: boolean }[];
  enlaceWhatsapp: string | null;
};

/** Formulario «Nuevo anuncio» / editar anuncio, con vista previa en vivo (sección 5.1). */
export function FormularioAnuncio({ anuncio, temporadas, enlaceWhatsapp }: Props) {
  const t = useTranslations("panel.carrusel.formulario");
  const tCarrusel = useTranslations("panel.carrusel");
  const tFormulario = useTranslations("panel.formulario");
  const traducir = useTraductorErrores();
  const router = useRouter();
  const idOscurecer = useId();
  const [confirmarEliminar, setConfirmarEliminar] = useState(false);
  const inicial = anuncio?.valores ?? VALORES_NUEVO;

  const {
    control,
    register,
    handleSubmit,
    getValues,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<EntradaAnuncio, unknown, AnuncioValidado>({
    resolver: zodResolver(esquemaAnuncio),
    defaultValues: inicial,
  });
  const valores = useWatch({ control }) as EntradaAnuncio;
  const { tipoMedio, imagenConTexto, oscurecido } = valores;
  const usaWhatsapp = [valores.boton1Destino, valores.boton2Destino].some(
    (destino) => destino?.trim().toLowerCase() === "whatsapp",
  );

  type CampoTexto = "textoPequeno" | "titulo" | "texto" | "boton1Texto" | "boton1Destino" | "boton2Texto"
    | "boton2Destino" | "temporadaId" | "desde" | "hasta";
  const registrar = (campo: CampoTexto) => ({ ...register(campo), defaultValue: inicial[campo] });
  const error = (campo: keyof EntradaAnuncio) => traducir(errors[campo]?.message as string | undefined);

  const guardar = (seguirEditando: boolean) =>
    handleSubmit(
      async () => {
        try {
          const resultado = await guardarAnuncioAccion(getValues(), anuncio?.id ?? null);
          if (!resultado.ok) {
            for (const [campo, clave] of Object.entries(resultado.campos ?? {})) {
              setError(campo as keyof EntradaAnuncio, { message: clave });
            }
            toast.error(traducir(resultado.error ?? "revisaCampos"));
            return;
          }
          toast.success(tFormulario("guardado"));
          if (!seguirEditando) router.push(RUTA_LISTA);
          else if (!anuncio) router.replace(`${RUTA_LISTA}/${resultado.id}`);
          else router.refresh();
        } catch {
          toast.error(traducir("inesperado"));
        }
      },
      () => toast.error(traducir("revisaCampos")),
    );

  const eliminar = async () => {
    if (!anuncio) return;
    try {
      const resultado = await eliminarAnuncioAccion(anuncio.id);
      if (!resultado.ok) return void toast.error(traducir("noEncontrado"));
      toast.success(tCarrusel("eliminado", { titulo: resultado.titulo }));
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
    <form method="post" onSubmit={guardar(false)} noValidate className="flex flex-col gap-6">
      <EncabezadoPagina
        titulo={anuncio ? valores.titulo || inicial.titulo || t("tituloEditar") : t("tituloNuevo")}
        acciones={
          <>
            {botonCancelar}
            {botonGuardar}
          </>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] xl:items-start">
        <Card className="xl:sticky xl:top-6 xl:order-2">
          <CardContent>
            <VistaPreviaAnuncio
              anuncio={{
                ...valores,
                textoPequeno: valores.textoPequeno ?? "",
                titulo: valores.titulo || t("tituloEjemplo"),
                texto: valores.texto ?? "",
                boton1Texto: valores.boton1Texto ?? "",
                boton1Destino: valores.boton1Destino ?? "",
                boton2Texto: valores.boton2Texto ?? "",
                boton2Destino: valores.boton2Destino ?? "",
                oscurecido: Number(oscurecido ?? 50),
              }}
              enlaceWhatsapp={enlaceWhatsapp}
            />
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6 xl:order-1">
          <Card>
            <CardHeader>
              <CardTitle>
                <h2>{t("medio")}</h2>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              <Controller
                control={control}
                name="tipoMedio"
                render={({ field }) => (
                  <OpcionesRadio
                    leyenda={t("tipoMedio")}
                    opciones={[
                      { valor: "IMAGEN", etiqueta: t("tipoImagen") },
                      { valor: "VIDEO", etiqueta: t("tipoVideo") },
                    ]}
                    valor={field.value}
                    alCambiar={(tipo) => {
                      // Una foto no sirve como video ni al revés: al cambiar, se elige de nuevo.
                      if (tipo !== field.value) setValue("archivo", null);
                      field.onChange(tipo);
                    }}
                  />
                )}
              />
              <Controller
                control={control}
                name="archivo"
                render={({ field }) =>
                  tipoMedio === "VIDEO" ? (
                    <SubirVideo etiqueta={t("video")} valor={field.value} alCambiar={field.onChange} />
                  ) : (
                    <SubirImagen etiqueta={t("foto")} valor={field.value} alCambiar={field.onChange} tipo="imagenAnuncio" />
                  )
                }
              />
              {error("archivo") && (
                <p role="alert" className="text-sm text-destructive">
                  {error("archivo")}
                </p>
              )}
              <details className="group rounded-xl border border-border p-4">
                <summary className="cursor-pointer text-sm font-medium text-pino">{t("masOpciones")}</summary>
                <div className="mt-4">
                  {tipoMedio === "VIDEO" ? (
                    <Controller
                      control={control}
                      name="imagenEspera"
                      render={({ field }) => (
                        <SubirImagen
                          etiqueta={t("imagenEspera")}
                          ayuda={t("imagenEsperaAyuda")}
                          valor={field.value}
                          alCambiar={field.onChange}
                          tipo="imagenAnuncio"
                        />
                      )}
                    />
                  ) : (
                    <Controller
                      control={control}
                      name="archivoMovil"
                      render={({ field }) => (
                        <SubirImagen
                          etiqueta={t("fotoCelular")}
                          ayuda={t("fotoCelularAyuda")}
                          valor={field.value}
                          alCambiar={field.onChange}
                          tipo="imagenAnuncio"
                        />
                      )}
                    />
                  )}
                </div>
              </details>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                <h2>{t("texto")}</h2>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              <Controller
                control={control}
                name="imagenConTexto"
                render={({ field }) => (
                  <CampoInterruptor
                    etiqueta={t("imagenConTexto")}
                    ayuda={t("imagenConTextoAyuda")}
                    activo={field.value}
                    alCambiar={field.onChange}
                  />
                )}
              />
              {/* Con «La imagen ya trae su texto» estos campos se ocultan (sin borrarlos del formulario). */}
              <CampoTexto
                id="textoPequeno"
                etiqueta={t("textoPequeno")}
                ayuda={t("textoPequenoAyuda")}
                claseCampo={cn(imagenConTexto && "hidden")}
                error={error("textoPequeno")}
                {...registrar("textoPequeno")}
              />
              <CampoTexto
                id="titulo"
                etiqueta={t("titulo")}
                ayuda={imagenConTexto ? t("tituloAyudaImagen") : t("tituloAyuda")}
                error={error("titulo")}
                {...registrar("titulo")}
              />
              <CampoAreaTexto
                id="texto"
                etiqueta={t("textoCorto")}
                rows={2}
                claseCampo={cn(imagenConTexto && "hidden")}
                error={error("texto")}
                {...registrar("texto")}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                <h2>{t("botones")}</h2>
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-5 md:grid-cols-2">
              <CampoTexto
                id="boton1Texto"
                etiqueta={t("boton1Texto")}
                ayuda={t("boton1TextoAyuda")}
                error={error("boton1Texto")}
                {...registrar("boton1Texto")}
              />
              <CampoTexto
                id="boton1Destino"
                etiqueta={t("llevaA")}
                ayuda={t("llevaAAyuda")}
                error={error("boton1Destino")}
                {...registrar("boton1Destino")}
              />
              <CampoTexto
                id="boton2Texto"
                etiqueta={t("boton2Texto")}
                error={error("boton2Texto")}
                {...registrar("boton2Texto")}
              />
              <CampoTexto
                id="boton2Destino"
                etiqueta={t("llevaA2")}
                ayuda={t("llevaAAyuda")}
                error={error("boton2Destino")}
                {...registrar("boton2Destino")}
              />
              {!enlaceWhatsapp && usaWhatsapp && (
                <Alert variant="aviso" className="md:col-span-2">
                  <InfoIcon aria-hidden />
                  <AlertDescription className="text-[#5c4a0c]">{t("sinWhatsapp")}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                <h2>{t("comoYCuando")}</h2>
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-5 md:grid-cols-2">
              <div className={cn("contents", imagenConTexto && "hidden")}>
                  <div className="md:col-span-2">
                    <Controller
                      control={control}
                      name="posicionTexto"
                      render={({ field }) => (
                        <OpcionesRadio
                          leyenda={t("posicion")}
                          opciones={POSICIONES_TEXTO.map((posicion) => ({
                            valor: posicion,
                            etiqueta: t(`posiciones.${posicion}`),
                          }))}
                          valor={field.value}
                          alCambiar={field.onChange}
                        />
                      )}
                    />
                  </div>
                  <div className="flex flex-col gap-2 md:col-span-2">
                    <div className="flex items-center justify-between gap-2">
                      <label htmlFor={idOscurecer} className="text-sm font-medium text-foreground">
                        {t("oscurecer")}
                      </label>
                      <output htmlFor={idOscurecer} className="text-sm font-semibold text-pino tabular-nums">
                        {oscurecido} %
                      </output>
                    </div>
                    <input
                      id={idOscurecer}
                      type="range"
                      min={0}
                      max={100}
                      step={5}
                      aria-valuetext={`${oscurecido} %`}
                      className="h-2 w-full cursor-pointer accent-hoja"
                      {...register("oscurecido", { valueAsNumber: true })}
                      defaultValue={inicial.oscurecido}
                    />
                  </div>
              </div>
              <CampoSelector
                id="temporadaId"
                etiqueta={t("temporada")}
                ayuda={t("temporadaAyuda")}
                claseCampo="md:col-span-2"
                error={error("temporadaId")}
                {...registrar("temporadaId")}
              >
                <option value="">{t("siempre")}</option>
                {temporadas.map((temporada) => (
                  <option key={temporada.id} value={String(temporada.id)}>
                    {temporada.visible ? temporada.nombre : t("temporadaOculta", { nombre: temporada.nombre })}
                  </option>
                ))}
              </CampoSelector>
              <CampoTexto id="desde" type="date" etiqueta={t("desde")} ayuda={t("fechaAyuda")} error={error("desde")} {...registrar("desde")} />
              <CampoTexto id="hasta" type="date" etiqueta={t("hasta")} ayuda={t("fechaAyuda")} error={error("hasta")} {...registrar("hasta")} />
              <div className="md:col-span-2">
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
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {botonGuardar}
        <Button type="button" variant="outline" disabled={isSubmitting} onClick={guardar(true)}>
          {tFormulario("guardarYSeguir")}
        </Button>
        {botonCancelar}
        {anuncio && (
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

      <ConfirmarEliminar
        abierto={confirmarEliminar}
        titulo={tCarrusel("eliminarTitulo", { titulo: inicial.titulo })}
        texto={tCarrusel("eliminarTexto")}
        alCerrar={() => setConfirmarEliminar(false)}
        alConfirmar={eliminar}
      />
    </form>
  );
}
