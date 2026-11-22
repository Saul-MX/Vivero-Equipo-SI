"use client";

import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Alert, AlertDescription } from "@/components/ui/alert";

const CONOCIDOS = [
  "signup_disabled",
  "account_not_linked",
  "invitacion_invalida",
  "correo_sin_verificar",
  "access_denied",
] as const;

type ErrorConocido = (typeof CONOCIDOS)[number];

function esConocido(codigo: string): codigo is ErrorConocido {
  return (CONOCIDOS as readonly string[]).includes(codigo);
}

/** Si se volvió de Google con un error (?error=… en la dirección), lo explica en español. */
export function AvisoErrorGoogle() {
  const t = useTranslations("acceso.google.errores");
  const codigo = useSearchParams().get("error");
  if (!codigo) return null;

  return (
    <Alert variant="destructive" className="mb-6">
      <AlertDescription>{esConocido(codigo) ? t(codigo) : t("generico")}</AlertDescription>
    </Alert>
  );
}
