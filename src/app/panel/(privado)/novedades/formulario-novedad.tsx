"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { CampoInterruptor } from "@/components/formularios/campo-interruptor";
import { CampoAreaTexto, CampoTexto } from "@/components/formularios/campo-texto";
import { SubirImagen } from "@/components/formularios/subir-imagen";
import { useTraductorErrores } from "@/components/formularios/use-traductor-errores";
import { EncabezadoPagina } from "@/components/panel/encabezado-pagina";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { esquemaNovedad, type EntradaNovedad, type NovedadValidada } from "@/lib/validacion/novedad";
import { guardarNovedadAccion } from "./acciones";

const RUTA_LISTA = "/panel/novedades";
const VALORES_NUEVA: EntradaNovedad = { titulo: "", texto: "", imagen: null, visible: true };

/** «Publicar novedad» / editar novedad. */
export function FormularioNovedad({ novedad }: { novedad: { id: number; valores: EntradaNovedad } | null }) {
  const t = useTranslations("panel.novedades.formulario");
  const tFormulario = useTranslations("panel.formulario");
  const traducir = useTraductorErrores();
  const router = useRouter();
  const inicial = novedad?.valores ?? VALORES_NUEVA;

  const {
    control,
    register,
    handleSubmit,
    getValues,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<EntradaNovedad, unknown, NovedadValidada>({
    resolver: zodResolver(esquemaNovedad),
    defaultValues: inicial,
  });
  const titulo = useWatch({ control, name: "titulo" });

  const guardar = (seguirEditando: boolean) =>
    handleSubmit(
      async () => {
        try {
          const resultado = await guardarNovedadAccion(getValues(), novedad?.id ?? null);
          if (!resultado.ok) {
            for (const [campo, clave] of Object.entries(resultado.campos ?? {})) {
              setError(campo as keyof EntradaNovedad, { message: clave });
            }
            toast.error(traducir(resultado.error ?? "revisaCampos"));
            return;
          }
          toast.success(novedad ? tFormulario("guardado") : t("publicada"));
          if (!seguirEditando) router.push(RUTA_LISTA);
          else if (!novedad) router.replace(`${RUTA_LISTA}/${resultado.id}`);
          else router.refresh();
        } catch {
          toast.error(traducir("inesperado"));
        }
      },
      () => toast.error(traducir("revisaCampos")),
    );

  const botonGuardar = (
    <Button type="submit" disabled={isSubmitting}>
      {isSubmitting ? tFormulario("guardando") : novedad ? tFormulario("guardar") : t("publicar")}
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
        titulo={novedad ? titulo || inicial.titulo : t("tituloNueva")}
        subtitulo={t("subtitulo")}
        acciones={
          <>
            {botonCancelar}
            {botonGuardar}
          </>
        }
      />
      <Card>
        <CardContent className="flex flex-col gap-5">
          <CampoTexto
            id="titulo"
            etiqueta={t("titulo")}
            ayuda={t("tituloAyuda")}
            error={traducir(errors.titulo?.message)}
            {...register("titulo")}
            defaultValue={inicial.titulo}
          />
          <CampoAreaTexto
            id="texto"
            etiqueta={t("texto")}
            ayuda={t("textoAyuda")}
            rows={5}
            error={traducir(errors.texto?.message)}
            {...register("texto")}
            defaultValue={inicial.texto}
          />
          <Controller
            control={control}
            name="imagen"
            render={({ field }) => <SubirImagen etiqueta={t("imagen")} valor={field.value} alCambiar={field.onChange} />}
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
      </div>
    </form>
  );
}
