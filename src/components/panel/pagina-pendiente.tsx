import type { Metadata } from "next";
import { Suspense } from "react";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { SproutIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { requerirUsuario } from "@/lib/auth/sesion";
import { EncabezadoPagina } from "./encabezado-pagina";
import { EsqueletoContenido } from "./esqueleto";

// Pantallas del panel que todavía no tienen contenido (se construyen en fases siguientes).

type Seccion =
  | "plantas"
  | "catalogos"
  | "temporadas"
  | "fertilizantes"
  | "carrusel"
  | "nosotros"
  | "preguntas"
  | "testimonios"
  | "datos";

export function metadatosDeSeccion(seccion: Seccion) {
  return async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations("panel.secciones");
    return { title: t(`${seccion}.titulo`) };
  };
}

export function AvisoFase({ fase }: { fase: number }) {
  const t = useTranslations("panel.pendiente");

  return (
    <Card className="border border-dashed border-salvia/60 shadow-none">
      <CardContent className="flex items-start gap-4">
        <span aria-hidden className="rounded-full bg-muted p-3 text-hoja">
          <SproutIcon className="size-6" />
        </span>
        <div>
          <h2 className="text-xl font-semibold">{t("titulo", { fase })}</h2>
          <p className="mt-1 text-texto-suave">{t("texto")}</p>
        </div>
      </CardContent>
    </Card>
  );
}

async function ContenidoPendiente({ fase }: { fase: number }) {
  await requerirUsuario();
  return <AvisoFase fase={fase} />;
}

/**
 * Patrón de las pantallas del panel: el encabezado (fijo) se ve al instante y lo que depende
 * de la sesión carga dentro de su propio <Suspense>, así cambiar de pantalla responde enseguida.
 */
export function PaginaPendiente({ seccion, fase }: { seccion: Seccion; fase: number }) {
  const t = useTranslations("panel.secciones");

  return (
    <>
      <EncabezadoPagina titulo={t(`${seccion}.titulo`)} subtitulo={t(`${seccion}.subtitulo`)} />
      <Suspense fallback={<EsqueletoContenido />}>
        <ContenidoPendiente fase={fase} />
      </Suspense>
    </>
  );
}
