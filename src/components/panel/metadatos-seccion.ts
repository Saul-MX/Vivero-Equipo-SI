import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

// Título de la pestaña del navegador para cada sección del panel («Plantas · Vivero El Encanto»).

type Seccion =
  | "plantas"
  | "catalogos"
  | "temporadas"
  | "fertilizantes"
  | "carrusel"
  | "nosotros"
  | "preguntas"
  | "testimonios"
  | "datos"
  | "mensajes"
  | "novedades";

export function metadatosDeSeccion(seccion: Seccion) {
  return async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations("panel.secciones");
    return { title: t(`${seccion}.titulo`) };
  };
}
