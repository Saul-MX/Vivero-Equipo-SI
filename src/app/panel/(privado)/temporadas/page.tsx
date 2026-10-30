import { metadatosDeSeccion, PaginaPendiente } from "@/components/panel/pagina-pendiente";

export const generateMetadata = metadatosDeSeccion("temporadas");

export default function PaginaTemporadas() {
  return <PaginaPendiente seccion="temporadas" fase={3} />;
}
