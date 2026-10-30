"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Trash2Icon } from "lucide-react";
import { CampoInterruptor } from "@/components/formularios/campo-interruptor";
import { CampoAreaTexto, CampoSelector, CampoTexto } from "@/components/formularios/campo-texto";
import { SubirImagen } from "@/components/formularios/subir-imagen";
import { SubirPdf } from "@/components/formularios/subir-pdf";
import { useTraductorErrores } from "@/components/formularios/use-traductor-errores";
import { EncabezadoPagina } from "@/components/panel/encabezado-pagina";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MESES, nombreMes } from "@/lib/temporadas/meses";
import { esquemaCatalogo, type CatalogoValidado, type EntradaCatalogo } from "@/lib/validacion/catalogo";
import { guardarCatalogoAccion } from "./acciones";
import { DialogoEliminarCatalogo, type CatalogoPorEliminar } from "./dialogo-eliminar-catalogo";

export type CatalogoEnFormulario = {
  id: number;
  slug: string;
  plantas: number;
  esBase: boolean;
  valores: EntradaCatalogo;
};

const VALORES_NUEVO: EntradaCatalogo = {
  nombre: "",
  color: "#3E5A3F",
  visible: true,
  permanente: false,
  fotoPortada: null,
  presentacion: "",
  destacados: "",
  folletoPdf: null,
  tieneTemporada: false,
  mesInicio: "1",
  mesFin: "1",
};

const RUTA_LISTA = "/panel/catalogos";

/** Ficha de un catálogo: nuevo (catalogo = null) o existente. */
export function FormularioCatalogo({ catalogo }: { catalogo: CatalogoEnFormulario | null }) {
  const t = useTranslations("panel.catalogos.ficha");
  const tFormulario = useTranslations("panel.formulario");
  const traducir = useTraductorErrores();
  const idioma = useLocale();
  const router = useRouter();
  const [porEliminar, setPorEliminar] = useState<CatalogoPorEliminar | null>(null);
  const inicial = catalogo?.valores ?? VALORES_NUEVO;

  const {
    control,
    register,
    handleSubmit,
    getValues,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<EntradaCatalogo, unknown, CatalogoValidado>({
    resolver: zodResolver(esquemaCatalogo),
    defaultValues: inicial,
  });
  const [nombre, tieneTemporada] = useWatch({ control, name: ["nombre", "tieneTemporada"] });

  const error = (campo: keyof EntradaCatalogo) => traducir(errors[campo]?.message);
  // defaultValue: los campos llegan llenos desde el servidor, sin parpadear vacíos al cargar.
  const registrar = (campo: "nombre" | "presentacion" | "destacados" | "mesInicio" | "mesFin") => ({
    ...register(campo),
    defaultValue: inicial[campo],
  });

  const guardar = (seguirEditando: boolean) =>
    handleSubmit(
      async () => {
        try {
          // Al servidor van los valores tal como están en el formulario: él vuelve a validarlos.
          const resultado = await guardarCatalogoAccion(getValues(), catalogo?.id ?? null);
          if (!resultado.ok) {
            for (const [campo, clave] of Object.entries(resultado.campos ?? {})) {
              setError(campo as keyof EntradaCatalogo, { message: clave });
            }
            toast.error(traducir(resultado.error ?? "revisaCampos"));
            return;
          }
          toast.success(tFormulario("guardado"));
          if (!seguirEditando) router.push(RUTA_LISTA);
          else if (!catalogo) router.replace(`${RUTA_LISTA}/${resultado.id}`);
          else router.refresh();
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
  const botonCancelar = (
    <Button variant="outline" asChild>
      <Link href={RUTA_LISTA}>{tFormulario("cancelar")}</Link>
    </Button>
  );

  return (
    <form onSubmit={guardar(false)} noValidate className="flex flex-col gap-6">
      <EncabezadoPagina
        titulo={catalogo ? nombre || inicial.nombre : t("tituloNuevo")}
        subtitulo={catalogo ? `/${catalogo.slug}` : undefined}
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
        <CardContent className="grid gap-5 md:grid-cols-[1fr_auto]">
          <CampoTexto
            id="nombre"
            etiqueta={t("nombre")}
            ayuda={t("nombreAyuda")}
            error={error("nombre")}
            {...registrar("nombre")}
          />
          <div className="flex flex-col gap-2">
            <label htmlFor="color" className="text-sm font-medium text-foreground">
              {t("color")}
            </label>
            {/* Controlado: un selector de color nunca está vacío y no debe leerse del navegador. */}
            <Controller
              control={control}
              name="color"
              render={({ field }) => (
                <input
                  id="color"
                  type="color"
                  aria-describedby="color-ayuda"
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
          <p id="color-ayuda" className="text-sm text-texto-suave md:col-span-2">
            {t("colorAyuda")}
          </p>
          <div className="text-sm md:col-span-2">
            <span className="font-medium text-foreground">{t("direccion")}: </span>
            <span className="text-texto-suave">
              {catalogo ? `/catalogos/${catalogo.slug}` : t("direccionNueva")}
            </span>
          </div>
          <div className="grid gap-3 md:col-span-2 lg:grid-cols-2">
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
            <Controller
              control={control}
              name="permanente"
              render={({ field }) => (
                <CampoInterruptor
                  etiqueta={t("permanente")}
                  ayuda={t("permanenteAyuda")}
                  activo={field.value}
                  alCambiar={field.onChange}
                />
              )}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            <h2>{t("portadaYTextos")}</h2>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <Controller
            control={control}
            name="fotoPortada"
            render={({ field }) => (
              <SubirImagen
                etiqueta={t("portada")}
                ayuda={t("portadaAyuda")}
                valor={field.value}
                alCambiar={field.onChange}
              />
            )}
          />
          <CampoAreaTexto
            id="presentacion"
            etiqueta={t("presentacion")}
            ayuda={t("presentacionAyuda")}
            error={error("presentacion")}
            {...registrar("presentacion")}
          />
          <CampoAreaTexto
            id="destacados"
            etiqueta={t("destacados")}
            ayuda={t("destacadosAyuda")}
            error={error("destacados")}
            {...registrar("destacados")}
          />
          <Controller
            control={control}
            name="folletoPdf"
            render={({ field }) => (
              <SubirPdf etiqueta={t("folleto")} valor={field.value} alCambiar={field.onChange} />
            )}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            <h2>{t("temporada")}</h2>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          {catalogo?.esBase ? (
            <Alert variant="aviso">
              <AlertDescription>{t("base")}</AlertDescription>
            </Alert>
          ) : (
            <>
              <Controller
                control={control}
                name="tieneTemporada"
                render={({ field }) => (
                  <CampoInterruptor
                    etiqueta={t("tieneTemporada")}
                    ayuda={t("tieneTemporadaAyuda")}
                    activo={field.value}
                    alCambiar={field.onChange}
                  />
                )}
              />
              {tieneTemporada && (
                <div className="grid gap-5 sm:grid-cols-2">
                  {(["mesInicio", "mesFin"] as const).map((campo) => (
                    <CampoSelector
                      key={campo}
                      id={campo}
                      etiqueta={t(campo === "mesInicio" ? "empieza" : "termina")}
                      error={error(campo)}
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
            </>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-3">
        {botonGuardar}
        <Button type="button" variant="outline" disabled={isSubmitting} onClick={guardar(true)}>
          {tFormulario("guardarYSeguir")}
        </Button>
        {botonCancelar}
        {catalogo && (
          <Button
            type="button"
            variant="ghost"
            className="text-destructive hover:text-destructive sm:ml-auto"
            onClick={() =>
              setPorEliminar({
                id: catalogo.id,
                nombre: inicial.nombre,
                plantas: catalogo.plantas,
                esBase: catalogo.esBase,
              })
            }
          >
            <Trash2Icon aria-hidden />
            {t("eliminarCatalogo")}
          </Button>
        )}
      </div>

      <DialogoEliminarCatalogo
        catalogo={porEliminar}
        alCerrar={() => setPorEliminar(null)}
        alEliminar={() => router.push(RUTA_LISTA)}
      />
    </form>
  );
}
