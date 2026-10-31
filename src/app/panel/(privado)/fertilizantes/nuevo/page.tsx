import { Suspense } from "react";
import { EsqueletoContenido } from "@/components/panel/esqueleto";
import { metadatosDeSeccion } from "@/components/panel/metadatos-seccion";
import { requerirUsuario } from "@/lib/auth/sesion";
import { listarCatalogosParaElegir } from "@/lib/catalogo/catalogos";
import { FormularioFertilizante } from "../formulario-fertilizante";

export const generateMetadata = metadatosDeSeccion("fertilizantes");

export default function PaginaNuevoFertilizante() {
  return (
    <Suspense fallback={<EsqueletoContenido />}>
      <NuevoFertilizante />
    </Suspense>
  );
}

async function NuevoFertilizante() {
  await requerirUsuario();
  return <FormularioFertilizante fertilizante={null} catalogos={await listarCatalogosParaElegir()} />;
}
