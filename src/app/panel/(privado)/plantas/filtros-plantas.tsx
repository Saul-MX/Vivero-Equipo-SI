"use client";

import Form from "next/form";
import Link from "next/link";
import { useLayoutEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { SearchIcon } from "lucide-react";
import { CampoSelector, CampoTexto } from "@/components/formularios/campo-texto";
import { Button } from "@/components/ui/button";
import type { FiltrosPlantas as Filtros } from "@/lib/validacion/planta";

type Opcion = { id: number; nombre: string };

/** El valor de un campo tal como quedaría en la dirección (la búsqueda se limpia y se recorta). */
const comoFiltro = (nombre: string, valor: string) => (nombre === "q" ? valor.trim().slice(0, 120) : valor);

/**
 * Búsqueda por nombre y filtros. Es un formulario GET: los filtros quedan en la dirección
 * (/panel/plantas?catalogo=3), así se pueden compartir y el botón «atrás» funciona.
 */
export function FiltrosPlantas({
  filtros,
  catalogos,
  colores,
}: {
  filtros: Filtros;
  catalogos: Opcion[];
  colores: Opcion[];
}) {
  const t = useTranslations("panel.plantas");
  const hayFiltros = Boolean(filtros.q || filtros.catalogo || filtros.color || filtros.disponible);

  // Los campos muestran los filtros de la dirección. Son «no controlados» (defaultValue) y,
  // cuando solo cambian los filtros (p. ej. con «Quitar filtros»), React no toca lo que ya estaba
  // escrito o elegido: el buscador seguía diciendo «helecho» y la siguiente búsqueda salía vacía.
  // Por eso, cuando cambian los filtros de la dirección, se copian a los campos, pero SOLO a los que
  // la persona no tocó mientras se actualizaba la lista (si eligió otro color en ese momento, se
  // respeta). Al cargar no se toca nada: en un celular lento se puede escribir antes de que la
  // página termine de cargar (y en desarrollo React repite cada efecto una vez a modo de ensayo).
  // No se usa form.reset(): en las listas, React no actualiza la opción inicial.
  const formulario = useRef<HTMLFormElement>(null);
  const valores: Record<string, string> = {
    q: filtros.q,
    catalogo: String(filtros.catalogo ?? ""),
    color: String(filtros.color ?? ""),
    disponible: filtros.disponible ?? "",
  };
  const llave = JSON.stringify(valores);
  const llaveAplicada = useRef(llave);
  const aplicados = useRef(valores);
  useLayoutEffect(() => {
    if (llaveAplicada.current === llave) return;
    llaveAplicada.current = llave;
    const nuevos = JSON.parse(llave) as Record<string, string>;
    for (const [nombre, valor] of Object.entries(nuevos)) {
      const campo = formulario.current?.elements.namedItem(nombre);
      if (!(campo instanceof HTMLInputElement || campo instanceof HTMLSelectElement)) continue;
      if (comoFiltro(nombre, campo.value) === aplicados.current[nombre]) campo.value = valor;
    }
    aplicados.current = nuevos;
  }, [llave]);

  // «Quitar filtros» vacía los campos al instante, sin esperar a que llegue la lista.
  const vaciarCampos = () => {
    for (const nombre of Object.keys(valores)) {
      const campo = formulario.current?.elements.namedItem(nombre);
      if (campo instanceof HTMLInputElement || campo instanceof HTMLSelectElement) campo.value = "";
    }
    aplicados.current = { q: "", catalogo: "", color: "", disponible: "" };
  };

  return (
    <Form ref={formulario} action="/panel/plantas" role="search" aria-label={t("filtros.titulo")}>
      <div className="grid items-end gap-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))_auto]">
        <CampoTexto
          id="q"
          name="q"
          type="search"
          etiqueta={t("filtros.buscar")}
          defaultValue={filtros.q}
          claseCampo="sm:col-span-2 lg:col-span-1"
        />
        <CampoSelector id="filtro-catalogo" name="catalogo" etiqueta={t("filtros.catalogo")} defaultValue={filtros.catalogo ?? ""}>
          <option value="">{t("filtros.todos")}</option>
          {catalogos.map((catalogo) => (
            <option key={catalogo.id} value={catalogo.id}>
              {catalogo.nombre}
            </option>
          ))}
        </CampoSelector>
        <CampoSelector id="filtro-color" name="color" etiqueta={t("filtros.color")} defaultValue={filtros.color ?? ""}>
          <option value="">{t("filtros.todos")}</option>
          {colores.map((color) => (
            <option key={color.id} value={color.id}>
              {color.nombre}
            </option>
          ))}
        </CampoSelector>
        <CampoSelector
          id="filtro-disponible"
          name="disponible"
          etiqueta={t("filtros.disponibilidad")}
          defaultValue={filtros.disponible ?? ""}
        >
          <option value="">{t("filtros.todas")}</option>
          <option value="si">{t("filtros.disponibles")}</option>
          <option value="no">{t("filtros.agotadas")}</option>
        </CampoSelector>
        <div className="flex gap-2">
          <Button type="submit">
            <SearchIcon aria-hidden />
            {t("filtros.boton")}
          </Button>
          {hayFiltros && (
            <Button variant="ghost" asChild>
              <Link href="/panel/plantas" onClick={vaciarCampos}>
                {t("quitarFiltros")}
              </Link>
            </Button>
          )}
        </div>
      </div>
    </Form>
  );
}
