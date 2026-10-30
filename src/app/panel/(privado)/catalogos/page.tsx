import { metadatosDeSeccion, PaginaPendiente } from "@/components/panel/pagina-pendiente";

export const generateMetadata = metadatosDeSeccion("catalogos");

export default function PaginaCatalogos() {
  return <PaginaPendiente seccion="catalogos" fase={3} />;
}
