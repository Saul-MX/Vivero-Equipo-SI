"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

/**
 * Confirmación «¿Eliminar…?». Mientras `alConfirmar` trabaja, el botón dice «Eliminando…»;
 * el diálogo se cierra solo al terminar.
 */
export function ConfirmarEliminar({
  abierto,
  titulo,
  texto,
  alCerrar,
  alConfirmar,
}: {
  abierto: boolean;
  titulo: string;
  texto: string;
  alCerrar: () => void;
  alConfirmar: () => Promise<void>;
}) {
  const tFormulario = useTranslations("panel.formulario");
  const tComun = useTranslations("comun");
  const [eliminando, setEliminando] = useState(false);

  return (
    <AlertDialog open={abierto} onOpenChange={(valor) => !valor && !eliminando && alCerrar()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{titulo}</AlertDialogTitle>
          <AlertDialogDescription>
            {texto} {tFormulario("noSePuedeDeshacer")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={eliminando}>{tComun("cancelar")}</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={eliminando}
            onClick={async (evento) => {
              evento.preventDefault();
              setEliminando(true);
              try {
                await alConfirmar();
              } finally {
                setEliminando(false);
                alCerrar();
              }
            }}
          >
            {eliminando ? tFormulario("eliminando") : tFormulario("eliminar")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
