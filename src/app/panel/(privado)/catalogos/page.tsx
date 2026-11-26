import Link from "next/link";
import { Suspense } from "react";
import { useTranslations } from "next-intl";
import { PlusIcon } from "lucide-react";
import { EncabezadoPagina } from "@/components/panel/encabezado-pagina";
import { EsqueletoContenido } from "@/components/panel/esqueleto";
import { metadatosDeSeccion } from "@/components/panel/metadatos-seccion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { requerirUsuario } from "@/lib/auth/sesion";
import { listarCatalogosPanel } from "@/lib/catalogo/catalogos";
import { leerEstadoTemporadas } from "@/lib/temporadas/temporadas";
import { ListaCatalogos } from "./lista-catalogos";
import { VisitaNueva } from "@/components/panel/visita-nueva";

export const generateMetadata = metadatosDeSeccion("catalogos");

function PaginaCatalogosContenido() {
  const t = useTranslations("panel");

  return (
    <>
      <EncabezadoPagina
        titulo={t("secciones.catalogos.titulo")}
        subtitulo={t("secciones.catalogos.subtitulo")}
        acciones={
          <Button asChild>
            <Link href="/panel/catalogos/nuevo">
              <PlusIcon aria-hidden />
              {t("catalogos.nuevo")}
            </Link>
          </Button>
        }
      />
      <Suspense fallback={<EsqueletoContenido />}>
        <ContenidoCatalogos />
      </Suspense>
    </>
  );
}

async function ContenidoCatalogos() {
  await requerirUsuario();
  const [catalogos, { vigente }] = await Promise.all([listarCatalogosPanel(), leerEstadoTemporadas()]);

  return (
    <Card>
      <CardContent>
        <ListaCatalogos catalogos={catalogos} idCatalogoVigente={vigente?.catalogo.id ?? null} />
      </CardContent>
    </Card>
  );
}

export default function PaginaCatalogos() {
  return (
    <VisitaNueva>
      <PaginaCatalogosContenido />
    </VisitaNueva>
  );
}
