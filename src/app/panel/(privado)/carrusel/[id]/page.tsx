import { notFound } from "next/navigation";
import { Suspense } from "react";
import { EsqueletoContenido, EsqueletoEncabezado } from "@/components/panel/esqueleto";
import { metadatosDeSeccion } from "@/components/panel/metadatos-seccion";
import { requerirUsuario } from "@/lib/auth/sesion";
import { obtenerAnuncio, opcionesTemporadas } from "@/lib/carrusel/anuncios";
import { obtenerDatosNegocio } from "@/lib/datos-negocio/datos";
import { FormularioAnuncio } from "../formulario-anuncio";

export const generateMetadata = metadatosDeSeccion("carrusel");

export default function PaginaEditarAnuncio({ params }: PageProps<"/panel/carrusel/[id]">) {
  return (
    <Suspense
      fallback={
        <>
          <EsqueletoEncabezado />
          <EsqueletoContenido />
        </>
      }
    >
      <EditarAnuncio params={params} />
    </Suspense>
  );
}

async function EditarAnuncio({ params }: { params: Promise<{ id: string }> }) {
  await requerirUsuario();
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) notFound();
  const [valores, temporadas, datos] = await Promise.all([
    obtenerAnuncio(id),
    opcionesTemporadas(),
    obtenerDatosNegocio(),
  ]);
  if (!valores) notFound();
  return <FormularioAnuncio anuncio={{ id, valores }} temporadas={temporadas} enlaceWhatsapp={datos.enlaceWhatsapp} />;
}
