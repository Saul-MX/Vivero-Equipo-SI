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
import { esquemaIngreso, type DatosIngreso } from "@/lib/validacion/cuenta";
import { ingresar } from "../acciones";

export function FormularioIngreso() {
  const t = useTranslations("acceso.ingresar");
  const traducir = useTraductorErrores();
  const [errorGeneral, setErrorGeneral] = useState<string>();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<DatosIngreso>({
    resolver: zodResolver(esquemaIngreso),
    defaultValues: { usuario: "", contrasena: "" },
  });

  const enviar = handleSubmit(async (datos) => {
    setErrorGeneral(undefined);
    try {
      // Si todo sale bien, la acción redirige al panel y esta pantalla se cierra.
      const resultado = await ingresar(datos);
      if (resultado.ok) return;
      for (const [campo, clave] of Object.entries(resultado.campos ?? {})) {
        setError(campo as keyof DatosIngreso, { message: clave });
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
          id="usuario"
          etiqueta={t("usuario")}
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
          autoComplete="current-password"
          error={traducir(errors.contrasena?.message)}
          {...register("contrasena")}
        />
        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? t("enviando") : t("boton")}
        </Button>
      </FieldGroup>
    </form>
  );
}
