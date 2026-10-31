import Link from "next/link";
import { Suspense } from "react";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { PlusIcon } from "lucide-react";
import { EncabezadoPagina } from "@/components/panel/encabezado-pagina";
import { EsqueletoContenido } from "@/components/panel/esqueleto";
import { metadatosDeSeccion } from "@/components/panel/metadatos-seccion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { listarNovedadesPanel } from "@/lib/apartados/novedades";
import { requerirUsuario } from "@/lib/auth/sesion";
import { ListaNovedades } from "./lista-novedades";

export const generateMetadata = metadatosDeSeccion("novedades");

export default function PaginaNovedades() {
  const t = useTranslations("panel");

  return (
    <>
      <EncabezadoPagina
        titulo={t("secciones.novedades.titulo")}
        subtitulo={t("secciones.novedades.subtitulo")}
        acciones={
          <Button asChild>
            <Link href="/panel/novedades/nueva">
              <PlusIcon aria-hidden />
              {t("novedades.publicar")}
            </Link>
          </Button>
        }
      />
      <Suspense fallback={<EsqueletoContenido />}>
        <ContenidoNovedades />
      </Suspense>
    </>
  );
}

async function ContenidoNovedades() {
  await requerirUsuario();
  const [t, novedades] = await Promise.all([getTranslations("panel.novedades"), listarNovedadesPanel()]);

  return (
    <Card>
      <CardContent>
        {novedades.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            <p className="text-texto-suave">{t("vacio")}</p>
            <Button asChild>
              <Link href="/panel/novedades/nueva">
                <PlusIcon aria-hidden />
                {t("publicar")}
              </Link>
            </Button>
          </div>
        ) : (
          <ListaNovedades novedades={novedades} />
        )}
      </CardContent>
    </Card>
  );
}
