import { notFound } from "next/navigation";
import { Suspense } from "react";
import { EsqueletoContenido, EsqueletoEncabezado } from "@/components/panel/esqueleto";
import { metadatosDeSeccion } from "@/components/panel/metadatos-seccion";
import { requerirUsuario } from "@/lib/auth/sesion";
import { listarCatalogosParaElegir } from "@/lib/catalogo/catalogos";
import { obtenerFertilizante } from "@/lib/catalogo/fertilizantes";
import { TIPOS_FERTILIZANTE, type EntradaFertilizante } from "@/lib/validacion/fertilizante";
import { FormularioFertilizante } from "../formulario-fertilizante";
import { VisitaNueva } from "@/components/panel/visita-nueva";

export const generateMetadata = metadatosDeSeccion("fertilizantes");

function PaginaEditarFertilizanteContenido({ params }: PageProps<"/panel/fertilizantes/[id]">) {
  return (
    <Suspense
      fallback={
        <>
          <EsqueletoEncabezado />
          <EsqueletoContenido />
        </>
      }
    >
      <EditarFertilizante params={params} />
    </Suspense>
  );
}

async function EditarFertilizante({ params }: { params: Promise<{ id: string }> }) {
  await requerirUsuario();
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) notFound();
  const [fertilizante, catalogos] = await Promise.all([obtenerFertilizante(id), listarCatalogosParaElegir()]);
  if (!fertilizante) notFound();

  const tipo = (TIPOS_FERTILIZANTE as readonly string[]).includes(fertilizante.tipo ?? "")
    ? (fertilizante.tipo as EntradaFertilizante["tipo"])
    : "";
  return (
    <FormularioFertilizante
      catalogos={catalogos}
      fertilizante={{
        id: fertilizante.id,
        plantas: fertilizante._count.plantas,
        valores: {
          nombre: fertilizante.nombre,
          tipo,
          paraQueSirve: fertilizante.paraQueSirve ?? "",
          catalogos: fertilizante.catalogosRecomendados.map((fila) => String(fila.catalogoId)),
          dosis: fertilizante.dosis ?? "",
          frecuencia: fertilizante.frecuencia ?? "",
          pasosAplicacion: fertilizante.pasosAplicacion ?? "",
          precauciones: fertilizante.precauciones ?? "",
          presentacion: fertilizante.presentacion ?? "",
          visible: fertilizante.visible,
          foto: fertilizante.foto,
        },
      }}
    />
  );
}

export default function PaginaEditarFertilizante(props: Parameters<typeof PaginaEditarFertilizanteContenido>[0]) {
  return (
    <VisitaNueva>
      <PaginaEditarFertilizanteContenido {...props} />
    </VisitaNueva>
  );
}
