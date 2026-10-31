import { notFound } from "next/navigation";
import { Suspense } from "react";
import { EsqueletoContenido, EsqueletoEncabezado } from "@/components/panel/esqueleto";
import { metadatosDeSeccion } from "@/components/panel/metadatos-seccion";
import { obtenerNovedad } from "@/lib/apartados/novedades";
import { requerirUsuario } from "@/lib/auth/sesion";
import { FormularioNovedad } from "../formulario-novedad";

export const generateMetadata = metadatosDeSeccion("novedades");

export default function PaginaEditarNovedad({ params }: PageProps<"/panel/novedades/[id]">) {
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
