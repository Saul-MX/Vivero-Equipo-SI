import { metadatosDeSeccion, PaginaPendiente } from "@/components/panel/pagina-pendiente";

export const generateMetadata = metadatosDeSeccion("testimonios");

export default function PaginaTestimonios() {
  return <PaginaPendiente seccion="testimonios" fase={4} />;
}
