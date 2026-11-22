"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { createContext, useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { CampoTexto } from "@/components/formularios/campo-texto";
import { useTraductorErrores } from "@/components/formularios/use-traductor-errores";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import type { ResultadoAccion } from "@/lib/resultado";
import { esquemaRegistro, type DatosRegistro } from "@/lib/validacion/cuenta";
import { registrarse } from "../acciones";

/** Lo que el botón de Google necesita del formulario: el código ya revisado y dónde mostrar errores. */
export const ContextoRegistro = createContext<{
  leerCodigo: () => Promise<string | null>;
  mostrarResultado: (resultado: ResultadoAccion<keyof DatosRegistro>) => void;
} | null>(null);

/** `opcionGoogle`: el botón «Continuar con Google» (solo llega si Google está configurado). */
export function FormularioRegistro({ opcionGoogle }: { opcionGoogle?: ReactNode }) {
  const t = useTranslations("acceso.registro");
  const traducir = useTraductorErrores();
  const [errorGeneral, setErrorGeneral] = useState<string>();
  const {
    register,
    handleSubmit,
    setError,
    trigger,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<DatosRegistro>({
    resolver: zodResolver(esquemaRegistro),
    defaultValues: { codigo: "", usuario: "", contrasena: "", repetirContrasena: "" },
  });

  const mostrarResultado = (resultado: ResultadoAccion<keyof DatosRegistro>) => {
    if (resultado.ok) return;
    for (const [campo, clave] of Object.entries(resultado.campos ?? {})) {
      setError(campo as keyof DatosRegistro, { message: clave });
    }
    if (resultado.error) setErrorGeneral(traducir(resultado.error, { minutos: resultado.minutos ?? 0 }));
  };

  const contexto = {
    leerCodigo: async () => {
      setErrorGeneral(undefined);
      return (await trigger("codigo")) ? getValues("codigo") : null;
    },
    mostrarResultado,
  };

  const enviar = handleSubmit(async (datos) => {
    setErrorGeneral(undefined);
    try {
      // Si todo sale bien, la acción crea la sesión y redirige al panel.
      mostrarResultado(await registrarse(datos));
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
        <ContextoRegistro.Provider value={contexto}>{opcionGoogle}</ContextoRegistro.Provider>
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
