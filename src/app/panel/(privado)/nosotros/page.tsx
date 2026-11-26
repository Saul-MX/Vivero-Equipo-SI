import { Suspense } from "react";
import { EsqueletoContenido, EsqueletoEncabezado } from "@/components/panel/esqueleto";
import { metadatosDeSeccion } from "@/components/panel/metadatos-seccion";
import { leerNosotros } from "@/lib/apartados/nosotros";
import { requerirUsuario } from "@/lib/auth/sesion";
import { FormularioNosotros } from "./formulario-nosotros";
import { VisitaNueva } from "@/components/panel/visita-nueva";

export const generateMetadata = metadatosDeSeccion("nosotros");

function PaginaNosotrosContenido() {
  return (
    <Suspense
      fallback={
        <>
          <EsqueletoEncabezado />
          <EsqueletoContenido />
        </>
      }
    >
      <ContenidoNosotros />
    </Suspense>
  );
}

async function ContenidoNosotros() {
  await requerirUsuario();
  return <FormularioNosotros inicial={await leerNosotros()} />;
}

export default function PaginaNosotros() {
  return (
    <VisitaNueva>
      <PaginaNosotrosContenido />
    </VisitaNueva>
  );
}
