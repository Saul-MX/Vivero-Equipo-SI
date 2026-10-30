import { metadatosDeSeccion, PaginaPendiente } from "@/components/panel/pagina-pendiente";

export const generateMetadata = metadatosDeSeccion("datos");

export default function PaginaDatosYRedes() {
  return <PaginaPendiente seccion="datos" fase={2} />;
}
