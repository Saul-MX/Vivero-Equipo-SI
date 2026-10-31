import { Suspense } from "react";
import { EsqueletoContenido } from "@/components/panel/esqueleto";
import { metadatosDeSeccion } from "@/components/panel/metadatos-seccion";
import { requerirUsuario } from "@/lib/auth/sesion";
import { FormularioCatalogo } from "../formulario-catalogo";

export const generateMetadata = metadatosDeSeccion("catalogos");

export default function PaginaNuevoCatalogo() {
  return (
    <Suspense fallback={<EsqueletoContenido />}>
      <NuevoCatalogo />
    </Suspense>
  );
}

async function NuevoCatalogo() {
  await requerirUsuario();
  return <FormularioCatalogo catalogo={null} />;
}
