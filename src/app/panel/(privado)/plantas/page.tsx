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
import {
  contarPlantas,
  leerMostrarDisponibilidad,
  listarPlantasPanel,
  opcionesFormularioPlanta,
} from "@/lib/catalogo/plantas";
import { esquemaFiltrosPlantas } from "@/lib/validacion/planta";
import { FiltrosPlantas } from "./filtros-plantas";
import { InterruptorDisponibilidad } from "./interruptor-disponibilidad";
import { TablaPlantas } from "./tabla-plantas";

export const generateMetadata = metadatosDeSeccion("plantas");

export default function PaginaPlantas({ searchParams }: PageProps<"/panel/plantas">) {
  const t = useTranslations("panel");

  return (
    <>
      <EncabezadoPagina
        titulo={t("secciones.plantas.titulo")}
        subtitulo={t("secciones.plantas.subtitulo")}
        acciones={
          <Button asChild>
            <Link href="/panel/plantas/nueva">
              <PlusIcon aria-hidden />
              {t("plantas.agregar")}
            </Link>
          </Button>
        }
      />
      <Suspense fallback={<EsqueletoContenido />}>
        <ContenidoPlantas searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function ContenidoPlantas({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requerirUsuario();
  const filtros = esquemaFiltrosPlantas.parse(await searchParams);
  const [t, plantas, total, mostrarDisponibilidad, { catalogos, colores }] = await Promise.all([
    getTranslations("panel.plantas"),
    listarPlantasPanel(filtros),
    contarPlantas(),
    leerMostrarDisponibilidad(),
    opcionesFormularioPlanta(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <p className="-mt-4 text-base font-medium text-pino">{t("total", { n: total })}</p>
      <InterruptorDisponibilidad activo={mostrarDisponibilidad} />
      <Card>
        <CardContent className="flex flex-col gap-6">
          <FiltrosPlantas filtros={filtros} catalogos={catalogos} colores={colores} />
          {plantas.length > 0 ? (
            <TablaPlantas plantas={plantas} />
          ) : total === 0 ? (
            <div className="flex flex-col items-center gap-4 py-8 text-center">
              <p className="text-texto-suave">{t("vacio")}</p>
              <Button asChild>
                <Link href="/panel/plantas/nueva">
                  <PlusIcon aria-hidden />
                  {t("agregar")}
                </Link>
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <p className="text-texto-suave">{t("sinResultados")}</p>
              <Button variant="outline" asChild>
                <Link href="/panel/plantas">{t("quitarFiltros")}</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
