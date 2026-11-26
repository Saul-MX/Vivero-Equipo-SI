import { Suspense } from "react";
import { EsqueletoContenido } from "@/components/panel/esqueleto";
import { metadatosDeSeccion } from "@/components/panel/metadatos-seccion";
import { requerirUsuario } from "@/lib/auth/sesion";
import { listarCatalogosParaElegir } from "@/lib/catalogo/catalogos";
import { FormularioFertilizante } from "../formulario-fertilizante";
import { VisitaNueva } from "@/components/panel/visita-nueva";

export const generateMetadata = metadatosDeSeccion("fertilizantes");

function PaginaNuevoFertilizanteContenido() {
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

export default function PaginaNuevoFertilizante() {
  return (
    <VisitaNueva>
      <PaginaNuevoFertilizanteContenido />
    </VisitaNueva>
  );
}
