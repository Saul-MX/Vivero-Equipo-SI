import { Suspense } from "react";
import { EsqueletoContenido } from "@/components/panel/esqueleto";
import { metadatosDeSeccion } from "@/components/panel/pagina-pendiente";
import { requerirUsuario } from "@/lib/auth/sesion";
import { opcionesFormularioPlanta } from "@/lib/catalogo/plantas";
import { FormularioPlanta, VALORES_PLANTA_NUEVA } from "../formulario-planta";

export const generateMetadata = metadatosDeSeccion("plantas");

export default function PaginaNuevaPlanta() {
  return (
    <Suspense fallback={<EsqueletoContenido />}>
      <NuevaPlanta />
    </Suspense>
  );
}

async function NuevaPlanta() {
  await requerirUsuario();
  const opciones = await opcionesFormularioPlanta();
  return <FormularioPlanta planta={null} opciones={opciones} valoresNueva={VALORES_PLANTA_NUEVA} />;
}
