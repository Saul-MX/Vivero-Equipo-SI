"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { CheckIcon, CopyIcon, TicketIcon } from "lucide-react";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cancelarCodigoInvitacion, crearCodigoInvitacion } from "./acciones";

type InvitacionVigente = { id: number; terminacion: string; vence: string };

export function TarjetaInvitaciones({
  vigentes,
  diasVigencia,
}: {
  vigentes: InvitacionVigente[];
  diasVigencia: number;
}) {
  const t = useTranslations("panel.invitaciones");
  const tComun = useTranslations("comun");
  const tErrores = useTranslations("errores");
  const [codigoNuevo, setCodigoNuevo] = useState<string>();
  const [copiado, setCopiado] = useState(false);
  const [creando, iniciarCreacion] = useTransition();

  const crear = () =>
    iniciarCreacion(async () => {
      try {
        const { codigo } = await crearCodigoInvitacion();
        setCodigoNuevo(codigo);
        setCopiado(false);
      } catch {
        toast.error(tErrores("inesperado"));
      }
    });

  const copiar = async () => {
    if (!codigoNuevo) return;
    try {
      await navigator.clipboard.writeText(codigoNuevo);
      setCopiado(true);
    } catch {
      // Si el navegador no deja copiar, el código sigue visible para copiarlo a mano.
    }
  };

  const cancelar = async (id: number) => {
    try {
      await cancelarCodigoInvitacion(id);
      toast.success(t("cancelado"));
    } catch {
      toast.error(tErrores("inesperado"));
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2>{t("titulo")}</h2>
        </CardTitle>
        <CardDescription className="text-base">{t("descripcion", { dias: diasVigencia })}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div>
          <Button type="button" variant="outline" onClick={crear} disabled={creando}>
            <TicketIcon aria-hidden />
            {creando ? t("creando") : t("crear")}
          </Button>
        </div>

        {codigoNuevo && (
          <Alert variant="exito" aria-live="polite">
            <AlertTitle className="font-medium">{t("nuevoTitulo")}</AlertTitle>
            <AlertDescription className="flex flex-col gap-3 text-pino">
              <div className="flex flex-wrap items-center gap-3">
                <code
                  data-testid="codigo-invitacion"
                  className="rounded-lg bg-card px-3 py-2 font-mono text-lg font-semibold tracking-widest text-bosque"
                >
                  {codigoNuevo}
                </code>
                <Button type="button" size="sm" variant="outline" onClick={copiar}>
                  {copiado ? <CheckIcon aria-hidden /> : <CopyIcon aria-hidden />}
                  {copiado ? tComun("copiado") : tComun("copiar")}
                </Button>
              </div>
              <p>{t("nuevoAviso")}</p>
            </AlertDescription>
          </Alert>
        )}

        <div>
          <h3 className="font-sans text-sm font-semibold text-foreground">{t("vigentes")}</h3>
          {vigentes.length === 0 ? (
            <p className="mt-2 text-sm text-texto-suave">{t("ninguno")}</p>
          ) : (
            <ul className="mt-2 divide-y divide-border rounded-xl border">
              {vigentes.map((invitacion) => (
                <li key={invitacion.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <span className="flex flex-col text-sm">
                    <span className="font-medium">{t("terminaEn", { terminacion: invitacion.terminacion })}</span>
                    <span className="text-texto-suave">{t("vence", { fecha: invitacion.vence })}</span>
                  </span>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button type="button" size="sm" variant="ghost" className="text-destructive">
                        {t("cancelar")}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{t("cancelarTitulo")}</AlertDialogTitle>
                        <AlertDialogDescription>{t("cancelarTexto")}</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{tComun("cancelar")}</AlertDialogCancel>
                        <AlertDialogAction variant="destructive" onClick={() => cancelar(invitacion.id)}>
                          {t("cancelarConfirmar")}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
