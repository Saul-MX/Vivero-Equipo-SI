"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { CircleCheckIcon } from "lucide-react";
import { CampoTexto } from "@/components/formularios/campo-texto";
import { useTraductorErrores } from "@/components/formularios/use-traductor-errores";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { esquemaCambioContrasena, type DatosCambioContrasena } from "@/lib/validacion/cuenta";
import { cambiarContrasena } from "./acciones";

type Aviso = { tipo: "exito" | "error"; texto: string };

export function FormularioContrasena({ usuario }: { usuario: string }) {
  const t = useTranslations("panel.cuenta");
  const traducir = useTraductorErrores();
  const [aviso, setAviso] = useState<Aviso>();
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DatosCambioContrasena>({
    resolver: zodResolver(esquemaCambioContrasena),
    defaultValues: { actual: "", nueva: "", repetir: "" },
  });

  const enviar = handleSubmit(async (datos) => {
    setAviso(undefined);
    try {
      const resultado = await cambiarContrasena(datos);
      if (resultado.ok) {
        reset();
        setAviso({ tipo: "exito", texto: t("exito") });
        return;
      }
      for (const [campo, clave] of Object.entries(resultado.campos ?? {})) {
        setError(campo as keyof DatosCambioContrasena, { message: clave });
      }
      if (resultado.error) {
        setAviso({ tipo: "error", texto: traducir(resultado.error, { minutos: resultado.minutos ?? 0 })! });
      }
    } catch {
      setAviso({ tipo: "error", texto: traducir("inesperado")! });
    }
  });

  return (
    <form onSubmit={enviar} noValidate>
      <FieldGroup>
        {aviso && (
          <Alert variant={aviso.tipo === "exito" ? "exito" : "destructive"}>
            {aviso.tipo === "exito" && <CircleCheckIcon aria-hidden />}
            <AlertDescription>{aviso.texto}</AlertDescription>
          </Alert>
        )}
        <CampoTexto
          id="usuario"
          etiqueta={t("usuario")}
          ayuda={t("usuarioAyuda")}
          value={usuario}
          readOnly
          autoComplete="username"
        />
        <CampoTexto
          id="actual"
          type="password"
          etiqueta={t("actual")}
          autoComplete="current-password"
          error={traducir(errors.actual?.message)}
          {...register("actual")}
        />
        <CampoTexto
          id="nueva"
          type="password"
          etiqueta={t("nueva")}
          ayuda={t("nuevaAyuda")}
          autoComplete="new-password"
          error={traducir(errors.nueva?.message)}
          {...register("nueva")}
        />
        <CampoTexto
          id="repetir"
          type="password"
          etiqueta={t("repetir")}
          autoComplete="new-password"
          error={traducir(errors.repetir?.message)}
          {...register("repetir")}
        />
        <div>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? t("enviando") : t("boton")}
          </Button>
        </div>
      </FieldGroup>
    </form>
  );
}
