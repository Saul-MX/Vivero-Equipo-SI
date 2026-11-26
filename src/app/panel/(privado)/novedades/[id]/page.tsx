import { notFound } from "next/navigation";
import { Suspense } from "react";
import { EsqueletoContenido, EsqueletoEncabezado } from "@/components/panel/esqueleto";
import { metadatosDeSeccion } from "@/components/panel/metadatos-seccion";
import { obtenerNovedad } from "@/lib/apartados/novedades";
import { requerirUsuario } from "@/lib/auth/sesion";
import { FormularioNovedad } from "../formulario-novedad";
import { VisitaNueva } from "@/components/panel/visita-nueva";

export const generateMetadata = metadatosDeSeccion("novedades");

function PaginaEditarNovedadContenido({ params }: PageProps<"/panel/novedades/[id]">) {
  return (
    <Suspense
      fallback={
        <>
          <EsqueletoEncabezado />
          <EsqueletoContenido />
        </>
      }
    >
      <EditarNovedad params={params} />
    </Suspense>
  );
}

async function EditarNovedad({ params }: { params: Promise<{ id: string }> }) {
  await requerirUsuario();
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) notFound();
  const valores = await obtenerNovedad(id);
  if (!valores) notFound();
  return <FormularioNovedad novedad={{ id, valores }} />;
}

export default function PaginaEditarNovedad(props: Parameters<typeof PaginaEditarNovedadContenido>[0]) {
  return (
    <VisitaNueva>
      <PaginaEditarNovedadContenido {...props} />
    </VisitaNueva>
  );
}
