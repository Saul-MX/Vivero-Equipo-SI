"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
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
} from "@/components/ui/alert-dialog";
import { eliminarCatalogoAccion } from "./acciones";

export type CatalogoPorEliminar = { id: number; nombre: string; plantas: number; esBase: boolean };

/**
 * Confirmación para eliminar un catálogo. Si tiene plantas o es el de la temporada base, explica
 * por qué no se puede y no ofrece el botón de eliminar (el servidor también lo impide).
 */
export function DialogoEliminarCatalogo({
  catalogo,
  alCerrar,
  alEliminar,
}: {
  catalogo: CatalogoPorEliminar | null;
  alCerrar: () => void;
  alEliminar?: () => void;
}) {
  const t = useTranslations("panel.catalogos");
  const tFormulario = useTranslations("panel.formulario");
  const tComun = useTranslations("comun");
  const traducir = useTraductorErrores();
  const [eliminando, setEliminando] = useState(false);

  const impedimento = catalogo
    ? catalogo.plantas > 0
      ? traducir("catalogoConPlantas", { plantas: catalogo.plantas })
      : catalogo.esBase
        ? traducir("catalogoBase")
        : null
    : null;

  const eliminar = async () => {
    if (!catalogo) return;
    setEliminando(true);
    try {
      const resultado = await eliminarCatalogoAccion(catalogo.id);
      if (resultado.ok) {
        toast.success(t("eliminado", { nombre: resultado.nombre }));
        alCerrar();
        alEliminar?.();
      } else {
        toast.error(
          traducir(resultado.error, resultado.error === "catalogoConPlantas" ? { plantas: resultado.plantas } : {}),
        );
      }
    } catch {
      toast.error(traducir("inesperado"));
    } finally {
      setEliminando(false);
    }
  };

  return (
    <AlertDialog open={catalogo !== null} onOpenChange={(abierto) => !abierto && alCerrar()}>
      <AlertDialogContent>
        {catalogo && (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("eliminarTitulo", { nombre: catalogo.nombre })}</AlertDialogTitle>
              <AlertDialogDescription>
                {impedimento ?? `${t("eliminarTexto")} ${tFormulario("noSePuedeDeshacer")}`}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{tComun(impedimento ? "cerrar" : "cancelar")}</AlertDialogCancel>
              {!impedimento && (
                <AlertDialogAction
                  variant="destructive"
                  disabled={eliminando}
                  onClick={(evento) => {
                    evento.preventDefault();
                    void eliminar();
                  }}
                >
                  {eliminando ? tFormulario("eliminando") : tFormulario("eliminar")}
                </AlertDialogAction>
              )}
            </AlertDialogFooter>
          </>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
}
