import { Suspense } from "react";
import { EsqueletoContenido } from "@/components/panel/esqueleto";
import { metadatosDeSeccion } from "@/components/panel/metadatos-seccion";
import { requerirUsuario } from "@/lib/auth/sesion";
import { FormularioNovedad } from "../formulario-novedad";
import { VisitaNueva } from "@/components/panel/visita-nueva";

export const generateMetadata = metadatosDeSeccion("novedades");

function PaginaNuevaNovedadContenido() {
  return (
    <Suspense fallback={<EsqueletoContenido />}>
      <NuevaNovedad />
    </Suspense>
  );
}

async function NuevaNovedad() {
  await requerirUsuario();
  return <FormularioNovedad novedad={null} />;
}

export default function PaginaNuevaNovedad() {
  return (
    <VisitaNueva>
      <PaginaNuevaNovedadContenido />
    </VisitaNueva>
  );
}
