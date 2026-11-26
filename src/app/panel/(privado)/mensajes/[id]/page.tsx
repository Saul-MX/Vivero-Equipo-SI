import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getFormatter } from "next-intl/server";
import { EsqueletoContenido, EsqueletoEncabezado } from "@/components/panel/esqueleto";
import { metadatosDeSeccion } from "@/components/panel/metadatos-seccion";
import { requerirUsuario } from "@/lib/auth/sesion";
import { obtenerMensaje } from "@/lib/mensajes/mensajes";
import { formasDeResponder } from "@/lib/mensajes/respuesta";
import { DetalleMensaje } from "../detalle-mensaje";
import { VisitaNueva } from "@/components/panel/visita-nueva";

export const generateMetadata = metadatosDeSeccion("mensajes");

function PaginaMensajeContenido({ params }: PageProps<"/panel/mensajes/[id]">) {
  return (
    <Suspense
      fallback={
        <>
          <EsqueletoEncabezado />
          <EsqueletoContenido />
        </>
      }
    >
      <Mensaje params={params} />
    </Suspense>
  );
}

async function Mensaje({ params }: { params: Promise<{ id: string }> }) {
  await requerirUsuario();
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) notFound();
  const [mensaje, formato] = await Promise.all([obtenerMensaje(id), getFormatter()]);
  if (!mensaje) notFound();

  return (
    <DetalleMensaje
      mensaje={{
        id: mensaje.id,
        nombre: mensaje.nombre,
        contacto: mensaje.contacto,
        texto: mensaje.texto,
        leido: mensaje.leido,
        fecha: formato.dateTime(mensaje.creadoEn, { dateStyle: "long", timeStyle: "short" }),
      }}
      formas={formasDeResponder(mensaje.contacto)}
    />
  );
}

export default function PaginaMensaje(props: Parameters<typeof PaginaMensajeContenido>[0]) {
  return (
    <VisitaNueva>
      <PaginaMensajeContenido {...props} />
    </VisitaNueva>
  );
}
