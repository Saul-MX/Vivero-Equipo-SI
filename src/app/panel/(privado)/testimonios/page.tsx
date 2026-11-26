import { Suspense } from "react";
import { useTranslations } from "next-intl";
import { EncabezadoPagina } from "@/components/panel/encabezado-pagina";
import { EsqueletoContenido } from "@/components/panel/esqueleto";
import { metadatosDeSeccion } from "@/components/panel/metadatos-seccion";
import { Card, CardContent } from "@/components/ui/card";
import { listarTestimonios } from "@/lib/apartados/testimonios";
import { requerirUsuario } from "@/lib/auth/sesion";
import { ListaTestimonios } from "./lista-testimonios";
import { VisitaNueva } from "@/components/panel/visita-nueva";

export const generateMetadata = metadatosDeSeccion("testimonios");

function PaginaTestimoniosContenido() {
  const t = useTranslations("panel.secciones.testimonios");

  return (
    <>
      <EncabezadoPagina titulo={t("titulo")} subtitulo={t("subtitulo")} />
      <Suspense fallback={<EsqueletoContenido />}>
        <ContenidoTestimonios />
      </Suspense>
    </>
  );
}

async function ContenidoTestimonios() {
  await requerirUsuario();
  const testimonios = await listarTestimonios();

  return (
    <Card>
      <CardContent>
        <ListaTestimonios testimonios={testimonios} />
      </CardContent>
    </Card>
  );
}

export default function PaginaTestimonios() {
  return (
    <VisitaNueva>
      <PaginaTestimoniosContenido />
    </VisitaNueva>
  );
}
