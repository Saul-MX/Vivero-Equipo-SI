import { metadatosDeSeccion, PaginaPendiente } from "@/components/panel/pagina-pendiente";

export const generateMetadata = metadatosDeSeccion("carrusel");

export default function PaginaCarrusel() {
  return <PaginaPendiente seccion="carrusel" fase={4} />;
}
