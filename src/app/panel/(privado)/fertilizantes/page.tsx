import Link from "next/link";
import { Suspense } from "react";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { PlusIcon } from "lucide-react";
import { EncabezadoPagina } from "@/components/panel/encabezado-pagina";
import { EsqueletoContenido } from "@/components/panel/esqueleto";
import { metadatosDeSeccion } from "@/components/panel/pagina-pendiente";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { requerirUsuario } from "@/lib/auth/sesion";
import { listarFertilizantesPanel } from "@/lib/catalogo/fertilizantes";
import { TablaFertilizantes } from "./tabla-fertilizantes";

export const generateMetadata = metadatosDeSeccion("fertilizantes");

export default function PaginaFertilizantes() {
  const t = useTranslations("panel");

  return (
    <>
      <EncabezadoPagina
        titulo={t("secciones.fertilizantes.titulo")}
        subtitulo={t("secciones.fertilizantes.subtitulo")}
        acciones={
          <Button asChild>
            <Link href="/panel/fertilizantes/nuevo">
              <PlusIcon aria-hidden />
              {t("fertilizantes.agregar")}
            </Link>
          </Button>
        }
      />
      <Suspense fallback={<EsqueletoContenido />}>
        <ContenidoFertilizantes />
      </Suspense>
    </>
  );
}

async function ContenidoFertilizantes() {
  await requerirUsuario();
  const [t, fertilizantes] = await Promise.all([getTranslations("panel.fertilizantes"), listarFertilizantesPanel()]);

  return (
    <Card>
      <CardContent>
        {fertilizantes.length > 0 ? (
          <TablaFertilizantes fertilizantes={fertilizantes} />
        ) : (
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            <p className="text-texto-suave">{t("vacio")}</p>
            <Button asChild>
              <Link href="/panel/fertilizantes/nuevo">
                <PlusIcon aria-hidden />
                {t("agregar")}
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
