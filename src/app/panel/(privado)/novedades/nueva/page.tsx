import { Suspense } from "react";
import { EsqueletoContenido } from "@/components/panel/esqueleto";
import { metadatosDeSeccion } from "@/components/panel/metadatos-seccion";
import { requerirUsuario } from "@/lib/auth/sesion";
import { FormularioNovedad } from "../formulario-novedad";

export const generateMetadata = metadatosDeSeccion("novedades");

export default function PaginaNuevaNovedad() {
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
