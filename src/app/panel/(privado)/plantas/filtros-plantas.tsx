import Form from "next/form";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { SearchIcon } from "lucide-react";
import { CampoSelector, CampoTexto } from "@/components/formularios/campo-texto";
import { Button } from "@/components/ui/button";
import type { FiltrosPlantas as Filtros } from "@/lib/validacion/planta";

type Opcion = { id: number; nombre: string };

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

  return (
    <Form action="/panel/plantas" role="search" aria-label={t("filtros.titulo")}>
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
              <Link href="/panel/plantas">{t("quitarFiltros")}</Link>
            </Button>
          )}
        </div>
      </div>
    </Form>
  );
}
