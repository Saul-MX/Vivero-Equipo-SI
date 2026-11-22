"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { BotonGoogle, SeparadorOpciones } from "@/components/formularios/boton-google";
import { useTraductorErrores } from "@/components/formularios/use-traductor-errores";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { entrarConGoogle } from "../acciones";

export function BotonEntrarGoogle() {
  const t = useTranslations("acceso.google");
  const traducir = useTraductorErrores();
  const [error, setError] = useState<string>();
  const [abriendo, iniciar] = useTransition();

  const continuar = () =>
    iniciar(async () => {
      setError(undefined);
      try {
        // Si todo sale bien, la acción manda a Google y esta pantalla se cierra.
        const resultado = await entrarConGoogle();
        if (!resultado.ok) setError(traducir(resultado.error ?? "inesperado"));
      } catch {
        setError(traducir("inesperado"));
      }
    });

  return (
    <div className="mb-6 flex flex-col gap-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <BotonGoogle onClick={continuar} disabled={abriendo}>
        {abriendo ? t("enviando") : t("boton")}
      </BotonGoogle>
      <SeparadorOpciones texto={t("separador")} />
    </div>
  );
}
