"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { CampoTexto } from "@/components/formularios/campo-texto";
import { useTraductorErrores } from "@/components/formularios/use-traductor-errores";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { esquemaRegistro, type DatosRegistro } from "@/lib/validacion/cuenta";
import { registrarse } from "../acciones";

export function FormularioRegistro() {
  const t = useTranslations("acceso.registro");
  const traducir = useTraductorErrores();
  const [errorGeneral, setErrorGeneral] = useState<string>();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<DatosRegistro>({
    resolver: zodResolver(esquemaRegistro),
    defaultValues: { codigo: "", usuario: "", contrasena: "", repetirContrasena: "" },
  });

  const enviar = handleSubmit(async (datos) => {
    setErrorGeneral(undefined);
    try {
      // Si todo sale bien, la acción crea la sesión y redirige al panel.
      const resultado = await registrarse(datos);
      if (resultado.ok) return;
      for (const [campo, clave] of Object.entries(resultado.campos ?? {})) {
        setError(campo as keyof DatosRegistro, { message: clave });
      }
      if (resultado.error) setErrorGeneral(traducir(resultado.error, { minutos: resultado.minutos ?? 0 }));
    } catch {
      setErrorGeneral(traducir("inesperado"));
    }
  });

  return (
    <form onSubmit={enviar} noValidate>
      <FieldGroup>
        {errorGeneral && (
          <Alert variant="destructive">
            <AlertDescription>{errorGeneral}</AlertDescription>
          </Alert>
        )}
        <CampoTexto
          id="codigo"
          etiqueta={t("codigo")}
          ayuda={t("codigoAyuda")}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          error={traducir(errors.codigo?.message)}
          {...register("codigo")}
        />
        <CampoTexto
          id="usuario"
          etiqueta={t("usuario")}
          ayuda={t("usuarioAyuda")}
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          error={traducir(errors.usuario?.message)}
          {...register("usuario")}
        />
        <CampoTexto
          id="contrasena"
          type="password"
          etiqueta={t("contrasena")}
          ayuda={t("contrasenaAyuda")}
          autoComplete="new-password"
          error={traducir(errors.contrasena?.message)}
          {...register("contrasena")}
        />
        <CampoTexto
          id="repetirContrasena"
          type="password"
          etiqueta={t("repetir")}
          autoComplete="new-password"
          error={traducir(errors.repetirContrasena?.message)}
          {...register("repetirContrasena")}
        />
        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? t("enviando") : t("boton")}
        </Button>
      </FieldGroup>
    </form>
  );
}
