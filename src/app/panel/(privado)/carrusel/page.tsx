import Link from "next/link";
import { Suspense } from "react";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { InfoIcon, PlusIcon } from "lucide-react";
import { EncabezadoPagina } from "@/components/panel/encabezado-pagina";
import { EsqueletoContenido } from "@/components/panel/esqueleto";
import { metadatosDeSeccion } from "@/components/panel/pagina-pendiente";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { requerirUsuario } from "@/lib/auth/sesion";
import { archivosDelCarrusel, listarAnunciosPanel } from "@/lib/carrusel/anuncios";
import { cn } from "@/lib/utils";
import { ArchivosCarrusel } from "./archivos-carrusel";
import { TablaAnuncios } from "./tabla-anuncios";

export const generateMetadata = metadatosDeSeccion("carrusel");

export default function PaginaCarrusel({ searchParams }: PageProps<"/panel/carrusel">) {
  const t = useTranslations("panel");

  return (
    <>
      <EncabezadoPagina
        titulo={t("secciones.carrusel.titulo")}
        subtitulo={t("secciones.carrusel.subtitulo")}
        acciones={
          <Button asChild>
            <Link href="/panel/carrusel/nuevo">
              <PlusIcon aria-hidden />
              {t("carrusel.nuevo")}
            </Link>
          </Button>
        }
      />
      <Suspense fallback={<EsqueletoContenido />}>
        <ContenidoCarrusel searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function ContenidoCarrusel({ searchParams }: { searchParams: PageProps<"/panel/carrusel">["searchParams"] }) {
  await requerirUsuario();
  const t = await getTranslations("panel.carrusel");
  const pestana = (await searchParams).pestana === "archivos" ? "archivos" : "anuncios";

  const pestanas = (
    <nav aria-label={t("pestanas.nombre")} className="mb-6 flex gap-1 overflow-x-auto border-b border-border">
      {(["anuncios", "archivos"] as const).map((clave) => (
        <Link
          key={clave}
          href={clave === "anuncios" ? "/panel/carrusel" : "/panel/carrusel?pestana=archivos"}
          aria-current={pestana === clave ? "page" : undefined}
          className={cn(
            "-mb-px border-b-2 px-4 py-3 text-sm font-medium whitespace-nowrap",
            pestana === clave ? "border-pino text-pino" : "border-transparent text-texto-suave hover:text-foreground",
          )}
        >
          {t(`pestanas.${clave}`)}
        </Link>
      ))}
    </nav>
  );

  if (pestana === "archivos") {
    return (
      <>
        {pestanas}
        <Card>
          <CardContent>
            <ArchivosCarrusel archivos={await archivosDelCarrusel()} />
          </CardContent>
        </Card>
      </>
    );
  }

  const anuncios = await listarAnunciosPanel();
  return (
    <>
      {pestanas}
      <Alert variant="aviso" className="mb-6">
        <InfoIcon aria-hidden />
        <AlertDescription className="text-[#5c4a0c]">{t("regla")}</AlertDescription>
      </Alert>
      <Card>
        <CardContent>
          {anuncios.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-8 text-center">
              <p className="text-texto-suave">{t("vacio")}</p>
              <Button asChild>
                <Link href="/panel/carrusel/nuevo">
                  <PlusIcon aria-hidden />
                  {t("nuevo")}
                </Link>
              </Button>
            </div>
          ) : (
            <TablaAnuncios anuncios={anuncios} />
          )}
        </CardContent>
      </Card>
    </>
  );
}
