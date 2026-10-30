import { metadatosDeSeccion, PaginaPendiente } from "@/components/panel/pagina-pendiente";

export const generateMetadata = metadatosDeSeccion("fertilizantes");

export default function PaginaFertilizantes() {
  return <PaginaPendiente seccion="fertilizantes" fase={3} />;
}
