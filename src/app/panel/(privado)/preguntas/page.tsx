import { metadatosDeSeccion, PaginaPendiente } from "@/components/panel/pagina-pendiente";

export const generateMetadata = metadatosDeSeccion("preguntas");

export default function PaginaPreguntas() {
  return <PaginaPendiente seccion="preguntas" fase={4} />;
}
