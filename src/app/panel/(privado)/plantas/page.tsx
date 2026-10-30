import { metadatosDeSeccion, PaginaPendiente } from "@/components/panel/pagina-pendiente";

export const generateMetadata = metadatosDeSeccion("plantas");

export default function PaginaPlantas() {
  return <PaginaPendiente seccion="plantas" fase={3} />;
}
