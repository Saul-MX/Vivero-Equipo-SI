"use client";

import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { CircleCheckIcon } from "lucide-react";
import { BotonGoogle } from "@/components/formularios/boton-google";
import { useTraductorErrores } from "@/components/formularios/use-traductor-errores";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { desvincularGoogle, vincularGoogle } from "./acciones";

const ERRORES_CONOCIDOS = ["account_already_linked_to_different_user", "correo_sin_verificar", "access_denied"] as const;

type Props = {
  configurado: boolean;
  /** null: no está vinculada. */
  vinculada: { correo: string | null } | null;
  /** Solo se puede quitar Google si queda la contraseña para entrar. */
  puedeQuitar: boolean;
};

/** Aviso al volver de Google: ?google=vinculada (salió bien) o ?error=… (no se pudo). */
function useAvisoDeVuelta() {
  const t = useTranslations("panel.cuenta.google");
  const parametros = useSearchParams();
  if (parametros.get("google") === "vinculada") return { tipo: "exito" as const, texto: t("exitoVincular") };
  const error = parametros.get("error");
  if (!error) return null;
  const conocido = (ERRORES_CONOCIDOS as readonly string[]).includes(error);
  return {
    tipo: "error" as const,
    texto: conocido ? t(`errores.${error as (typeof ERRORES_CONOCIDOS)[number]}`) : t("errores.generico"),
  };
}

export function TarjetaGoogle({ configurado, vinculada, puedeQuitar }: Props) {
  const t = useTranslations("panel.cuenta.google");
  const tComun = useTranslations("comun");
  const traducir = useTraductorErrores();
  const avisoDeVuelta = useAvisoDeVuelta();
  const [error, setError] = useState<string>();
  const [trabajando, iniciar] = useTransition();

  const vincular = () =>
    iniciar(async () => {
      setError(undefined);
      try {
        // Si todo sale bien, la acción manda a Google y al volver regresa a esta pantalla.
        const resultado = await vincularGoogle();
        if (!resultado.ok) setError(traducir(resultado.error ?? "inesperado"));
      } catch {
        setError(traducir("inesperado"));
      }
    });

  const quitar = () =>
    iniciar(async () => {
      setError(undefined);
      try {
        const resultado = await desvincularGoogle();
        if (resultado.ok) toast.success(t("exitoQuitar"));
        else setError(traducir(resultado.error ?? "inesperado"));
      } catch {
        setError(traducir("inesperado"));
      }
    });

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2>{t("titulo")}</h2>
        </CardTitle>
        <CardDescription className="text-base">{t("descripcion")}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {avisoDeVuelta && !error && (
          <Alert variant={avisoDeVuelta.tipo === "exito" ? "exito" : "destructive"}>
            {avisoDeVuelta.tipo === "exito" && <CircleCheckIcon aria-hidden />}
            <AlertDescription>{avisoDeVuelta.texto}</AlertDescription>
          </Alert>
        )}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {vinculada ? (
          <>
            <p className="text-sm">
              {vinculada.correo ? t("vinculada", { correo: vinculada.correo }) : t("vinculadaSinCorreo")}
            </p>
            {puedeQuitar ? (
              <div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button type="button" variant="ghost" className="text-destructive" disabled={trabajando}>
                      {trabajando ? t("quitando") : t("desvincular")}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{t("confirmarTitulo")}</AlertDialogTitle>
                      <AlertDialogDescription>{t("confirmarTexto")}</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{tComun("cancelar")}</AlertDialogCancel>
                      <AlertDialogAction variant="destructive" onClick={quitar}>
                        {t("confirmar")}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ) : (
              <p className="text-sm text-texto-suave">{t("unicoAcceso")}</p>
            )}
          </>
        ) : configurado ? (
          <>
            <p className="text-sm text-texto-suave">{t("noVinculada")}</p>
            <div>
              <BotonGoogle className="w-auto" onClick={vincular} disabled={trabajando}>
                {trabajando ? t("abriendo") : t("vincular")}
              </BotonGoogle>
            </div>
          </>
        ) : (
          <p className="text-sm text-texto-suave">{t("noDisponible")}</p>
        )}
      </CardContent>
    </Card>
  );
}
