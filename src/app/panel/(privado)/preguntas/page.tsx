import { Suspense } from "react";
import { useTranslations } from "next-intl";
import { EncabezadoPagina } from "@/components/panel/encabezado-pagina";
import { EsqueletoContenido } from "@/components/panel/esqueleto";
import { metadatosDeSeccion } from "@/components/panel/pagina-pendiente";
import { Card, CardContent } from "@/components/ui/card";
import { listarPreguntas } from "@/lib/apartados/preguntas";
import { requerirUsuario } from "@/lib/auth/sesion";
import { ListaPreguntas } from "./lista-preguntas";

export const generateMetadata = metadatosDeSeccion("preguntas");

export default function PaginaPreguntas() {
  const t = useTranslations("panel.secciones.preguntas");

  return (
    <>
      <EncabezadoPagina titulo={t("titulo")} subtitulo={t("subtitulo")} />
      <Suspense fallback={<EsqueletoContenido />}>
        <ContenidoPreguntas />
      </Suspense>
    </>
  );
}

async function ContenidoPreguntas() {
  await requerirUsuario();
  const preguntas = await listarPreguntas();

  return (
    <Card>
      <CardContent>
        <ListaPreguntas preguntas={preguntas} />
      </CardContent>
    </Card>
  );
}
