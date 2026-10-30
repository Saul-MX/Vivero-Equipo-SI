import { metadatosDeSeccion, PaginaPendiente } from "@/components/panel/pagina-pendiente";

export const generateMetadata = metadatosDeSeccion("nosotros");

export default function PaginaNosotros() {
  return <PaginaPendiente seccion="nosotros" fase={4} />;
}
