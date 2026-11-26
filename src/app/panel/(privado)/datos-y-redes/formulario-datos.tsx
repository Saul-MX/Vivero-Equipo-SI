"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { SaveIcon } from "lucide-react";
import { CampoAreaTexto, CampoTexto } from "@/components/formularios/campo-texto";
import { useTraductorErrores } from "@/components/formularios/use-traductor-errores";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  esquemaDatosNegocio,
  type DatosNegocioValidados,
  type EntradaDatosNegocio,
} from "@/lib/validacion/datos-negocio";
import { guardarDatos } from "./acciones";

/** Bloques Contacto, Ubicación y mapa, y Redes sociales, con «Guardar datos» arriba y abajo. */
export function FormularioDatos({ inicial }: { inicial: EntradaDatosNegocio }) {
  const t = useTranslations("panel.datos");
  const traducir = useTraductorErrores();
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EntradaDatosNegocio, unknown, DatosNegocioValidados>({
    resolver: zodResolver(esquemaDatosNegocio),
    defaultValues: inicial,
  });

  const opcional = (campo: string) => t("opcional", { campo });
  const error = (campo: keyof EntradaDatosNegocio) => traducir(errors[campo]?.message);
  // defaultValue hace que los campos lleguen ya llenos desde el servidor (sin parpadear vacíos
  // mientras carga la página); después React Hook Form toma el control.
  const registrar = (campo: keyof EntradaDatosNegocio) => ({
    ...register(campo),
    defaultValue: inicial[campo],
  });

  const enviar = handleSubmit(
    async (datos) => {
      try {
        const resultado = await guardarDatos(datos);
        if (resultado.ok) {
          // Se muestran los datos tal como quedaron guardados (ya limpios).
          reset(resultado.datos);
          toast.success(t("guardado"));
          return;
        }
        for (const [campo, clave] of Object.entries(resultado.campos ?? {})) {
          setError(campo as keyof EntradaDatosNegocio, { message: clave });
        }
        toast.error(traducir(resultado.error ?? "revisaCampos"));
      } catch {
        toast.error(traducir("inesperado"));
      }
    },
    () => toast.error(traducir("revisaCampos")),
  );

  const botonGuardar = (
    <div className="flex justify-end">
      <Button type="submit" disabled={isSubmitting}>
        <SaveIcon aria-hidden />
        {isSubmitting ? t("guardando") : t("guardar")}
      </Button>
    </div>
  );

  return (
    <form method="post" onSubmit={enviar} noValidate className="flex flex-col gap-6">
      {botonGuardar}

      <Card>
        <CardHeader>
          <CardTitle>
            <h2>{t("contacto.titulo")}</h2>
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 md:grid-cols-2">
          <CampoTexto
            id="whatsapp"
            etiqueta={t("contacto.whatsapp")}
            ayuda={t("contacto.whatsappAyuda")}
            inputMode="tel"
            autoComplete="tel-national"
            error={error("whatsapp")}
            {...registrar("whatsapp")}
          />
          <CampoTexto
            id="correo"
            type="email"
            etiqueta={opcional(t("contacto.correo"))}
            autoComplete="email"
            error={error("correo")}
            {...registrar("correo")}
          />
          <CampoTexto
            id="telefonos"
            etiqueta={t("contacto.telefonos")}
            ayuda={t("contacto.telefonosAyuda")}
            inputMode="tel"
            claseCampo="md:col-span-2"
            error={error("telefonos")}
            {...registrar("telefonos")}
          />
          <CampoTexto
            id="horario"
            etiqueta={t("contacto.horario")}
            ayuda={t("contacto.horarioAyuda")}
            error={error("horario")}
            {...registrar("horario")}
          />
          <CampoTexto
            id="horarioEspecial"
            etiqueta={opcional(t("contacto.horarioEspecial"))}
            ayuda={t("contacto.horarioEspecialAyuda")}
            error={error("horarioEspecial")}
            {...registrar("horarioEspecial")}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            <h2>{t("ubicacion.titulo")}</h2>
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5">
          <CampoTexto
            id="direccion"
            etiqueta={t("ubicacion.direccion")}
            autoComplete="street-address"
            error={error("direccion")}
            {...registrar("direccion")}
          />
          <CampoTexto
            id="enlaceMaps"
            type="url"
            etiqueta={t("ubicacion.enlaceMaps")}
            ayuda={t("ubicacion.enlaceMapsAyuda")}
            error={error("enlaceMaps")}
            {...registrar("enlaceMaps")}
          />
          <CampoAreaTexto
            id="mapa"
            etiqueta={opcional(t("ubicacion.mapa"))}
            ayuda={t("ubicacion.mapaAyuda")}
            spellCheck={false}
            className="font-mono text-sm"
            error={error("mapa")}
            {...registrar("mapa")}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            <h2>{t("redes.titulo")}</h2>
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 md:grid-cols-2">
          <CampoTexto
            id="facebook"
            etiqueta={opcional(t("redes.facebook"))}
            ayuda={t("redes.facebookAyuda")}
            error={error("facebook")}
            {...registrar("facebook")}
          />
          <CampoTexto
            id="instagram"
            etiqueta={opcional(t("redes.instagram"))}
            ayuda={t("redes.instagramAyuda")}
            error={error("instagram")}
            {...registrar("instagram")}
          />
        </CardContent>
      </Card>

      {botonGuardar}
    </form>
  );
}
