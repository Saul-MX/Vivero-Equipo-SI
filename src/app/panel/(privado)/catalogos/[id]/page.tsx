import { notFound } from "next/navigation";
import { Suspense } from "react";
import { EsqueletoContenido, EsqueletoEncabezado } from "@/components/panel/esqueleto";
import { metadatosDeSeccion } from "@/components/panel/metadatos-seccion";
import { requerirUsuario } from "@/lib/auth/sesion";
import { obtenerCatalogo } from "@/lib/catalogo/catalogos";
import { FormularioCatalogo } from "../formulario-catalogo";
import { VisitaNueva } from "@/components/panel/visita-nueva";

export const generateMetadata = metadatosDeSeccion("catalogos");

function PaginaFichaCatalogoContenido({ params }: PageProps<"/panel/catalogos/[id]">) {
  return (
    <Suspense
      fallback={
        <>
          <EsqueletoEncabezado />
          <EsqueletoContenido />
        </>
      }
    >
      <FichaCatalogo params={params} />
    </Suspense>
  );
}

async function FichaCatalogo({ params }: { params: Promise<{ id: string }> }) {
  await requerirUsuario();
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) notFound();
  const catalogo = await obtenerCatalogo(id);
  if (!catalogo) notFound();

  const temporada = catalogo.temporada;
  return (
    <FormularioCatalogo
      catalogo={{
        id: catalogo.id,
        slug: catalogo.slug,
        plantas: catalogo._count.plantas,
        esBase: Boolean(temporada?.todoElAnio),
        valores: {
          nombre: catalogo.nombre,
          color: catalogo.color,
          visible: catalogo.visible,
          permanente: catalogo.permanente,
          fotoPortada: catalogo.fotoPortada,
          presentacion: catalogo.presentacion ?? "",
          destacados: catalogo.destacados ?? "",
          folletoPdf: catalogo.folletoPdf,
          tieneTemporada: Boolean(temporada),
          mesInicio: String(temporada?.mesInicio ?? 1),
          mesFin: String(temporada?.mesFin ?? 1),
        },
      }}
    />
  );
}

export default function PaginaFichaCatalogo(props: Parameters<typeof PaginaFichaCatalogoContenido>[0]) {
  return (
    <VisitaNueva>
      <PaginaFichaCatalogoContenido {...props} />
    </VisitaNueva>
  );
}
