import { Suspense } from "react";
import { EsqueletoContenido, EsqueletoEncabezado } from "@/components/panel/esqueleto";
import { metadatosDeSeccion } from "@/components/panel/pagina-pendiente";
import { leerNosotros } from "@/lib/apartados/nosotros";
import { requerirUsuario } from "@/lib/auth/sesion";
import { FormularioNosotros } from "./formulario-nosotros";

export const generateMetadata = metadatosDeSeccion("nosotros");

export default function PaginaNosotros() {
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
