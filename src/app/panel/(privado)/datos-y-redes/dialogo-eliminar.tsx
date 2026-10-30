"use client";

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

export type PorEliminar = { indice: number; id: number; nombre: string; plantas: number };

/** Confirmación para eliminar un color o un tamaño: avisa cuántas plantas lo usan. */
export function DialogoEliminar({
  elemento,
  alCerrar,
  alConfirmar,
}: {
  elemento: PorEliminar | null;
  alCerrar: () => void;
  alConfirmar: (elemento: PorEliminar) => void;
}) {
  const t = useTranslations("panel.datos.eliminar");
  const tComun = useTranslations("comun");

  return (
    <AlertDialog open={elemento !== null} onOpenChange={(abierto) => !abierto && alCerrar()}>
      <AlertDialogContent>
        {elemento && (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("titulo", { nombre: elemento.nombre })}</AlertDialogTitle>
              <AlertDialogDescription>
                {elemento.plantas > 0 ? t("enUso", { n: elemento.plantas }) : t("sinUso")}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{tComun("cancelar")}</AlertDialogCancel>
              <AlertDialogAction variant="destructive" onClick={() => alConfirmar(elemento)}>
                {t("confirmar")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
}
