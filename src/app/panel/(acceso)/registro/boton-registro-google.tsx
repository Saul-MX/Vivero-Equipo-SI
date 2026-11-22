"use client";

import { useTranslations } from "next-intl";
import { useContext, useTransition } from "react";
import { BotonGoogle, SeparadorOpciones } from "@/components/formularios/boton-google";
import { registrarseConGoogle } from "../acciones";
import { ContextoRegistro } from "./formulario-registro";

/** Crea la cuenta con Google usando el código escrito arriba (va dentro de FormularioRegistro). */
export function BotonRegistroGoogle() {
  const t = useTranslations("acceso.google");
  const formulario = useContext(ContextoRegistro);
  const [abriendo, iniciar] = useTransition();
  if (!formulario) return null;

  const continuar = () =>
    iniciar(async () => {
      const codigo = await formulario.leerCodigo();
      if (codigo === null) return;
      try {
        // Si el código sirve, la acción manda a Google y esta pantalla se cierra.
        formulario.mostrarResultado(await registrarseConGoogle({ codigo }));
      } catch {
        formulario.mostrarResultado({ ok: false, error: "inesperado" });
      }
    });

  return (
    <div className="flex flex-col gap-6">
      <BotonGoogle onClick={continuar} disabled={abriendo}>
        {abriendo ? t("enviando") : t("boton")}
      </BotonGoogle>
      <SeparadorOpciones texto={t("separadorRegistro")} />
    </div>
  );
}
