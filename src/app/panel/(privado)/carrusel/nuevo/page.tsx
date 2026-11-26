import { Suspense } from "react";
import { EsqueletoContenido } from "@/components/panel/esqueleto";
import { metadatosDeSeccion } from "@/components/panel/metadatos-seccion";
import { requerirUsuario } from "@/lib/auth/sesion";
import { opcionesTemporadas } from "@/lib/carrusel/anuncios";
import { obtenerDatosNegocio } from "@/lib/datos-negocio/datos";
import { FormularioAnuncio } from "../formulario-anuncio";
import { VisitaNueva } from "@/components/panel/visita-nueva";

export const generateMetadata = metadatosDeSeccion("carrusel");

function PaginaNuevoAnuncioContenido() {
  return (
    <Suspense fallback={<EsqueletoContenido />}>
      <NuevoAnuncio />
    </Suspense>
  );
}

async function NuevoAnuncio() {
  await requerirUsuario();
  const [temporadas, datos] = await Promise.all([opcionesTemporadas(), obtenerDatosNegocio()]);
  return <FormularioAnuncio anuncio={null} temporadas={temporadas} enlaceWhatsapp={datos.enlaceWhatsapp} />;
}

export default function PaginaNuevoAnuncio() {
  return (
    <VisitaNueva>
      <PaginaNuevoAnuncioContenido />
    </VisitaNueva>
  );
}
