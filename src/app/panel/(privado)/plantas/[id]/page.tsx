import { notFound } from "next/navigation";
import { Suspense } from "react";
import { EsqueletoContenido, EsqueletoEncabezado } from "@/components/panel/esqueleto";
import { metadatosDeSeccion } from "@/components/panel/pagina-pendiente";
import { requerirUsuario } from "@/lib/auth/sesion";
import { obtenerPlanta, opcionesFormularioPlanta } from "@/lib/catalogo/plantas";
import type { EntradaPlanta } from "@/lib/validacion/planta";
import { FormularioPlanta } from "../formulario-planta";

export const generateMetadata = metadatosDeSeccion("plantas");

export default function PaginaEditarPlanta({ params }: PageProps<"/panel/plantas/[id]">) {
  return (
    <Suspense
      fallback={
        <>
          <EsqueletoEncabezado />
          <EsqueletoContenido />
        </>
      }
    >
      <EditarPlanta params={params} />
    </Suspense>
  );
}

async function EditarPlanta({ params }: { params: Promise<{ id: string }> }) {
  await requerirUsuario();
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) notFound();
  const [planta, opciones] = await Promise.all([obtenerPlanta(id), opcionesFormularioPlanta()]);
  if (!planta) notFound();

  return (
    <FormularioPlanta
      opciones={opciones}
      planta={{
        id: planta.id,
        slug: planta.slug,
        valores: {
          nombre: planta.nombre,
          variedad: planta.variedad ?? "",
          catalogoId: String(planta.catalogoId),
          etiqueta: planta.etiqueta ?? "",
          luces: planta.luces.map((fila) => fila.luz),
          colores: planta.colores.map((fila) => String(fila.colorId)),
          macetas: planta.macetas.map((fila) => String(fila.macetaId)),
          riegoDias: planta.riegoDiasSemana ? (String(planta.riegoDiasSemana) as EntradaPlanta["riegoDias"]) : "",
          cantidadAgua: planta.cantidadAgua ?? "",
          fertilizanteId: planta.fertilizanteId ? String(planta.fertilizanteId) : "",
          notaRiego: planta.notaRiego ?? "",
          descripcionCorta: planta.descripcionCorta ?? "",
          cuidados: planta.cuidados ?? "",
          disponible: planta.disponible,
          visible: planta.visible,
          fotos: planta.fotos.map((foto) => ({ id: foto.id, clave: foto.archivo, esPortada: foto.esPortada })),
        },
      }}
    />
  );
}
