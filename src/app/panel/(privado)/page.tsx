import type { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { ExternalLinkIcon } from "lucide-react";
import { EncabezadoPagina } from "@/components/panel/encabezado-pagina";
import { EsqueletoContenido, EsqueletoEncabezado } from "@/components/panel/esqueleto";
import { AvisoFase } from "@/components/panel/pagina-pendiente";
import { Button } from "@/components/ui/button";
import { requerirUsuario } from "@/lib/auth/sesion";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("panel");
  return { title: t("tituloPagina") };
}

// Inicio del panel. La tarjeta de temporada, accesos rápidos, pendientes y anuncios llegan en la fase 6.
export default function PaginaInicioPanel() {
  return (
    <Suspense
      fallback={
        <>
          <EsqueletoEncabezado />
          <EsqueletoContenido />
        </>
      }
    >
      <Bienvenida />
    </Suspense>
  );
}

async function Bienvenida() {
  const usuario = await requerirUsuario();
  const t = await getTranslations("panel");

  return (
    <>
      <EncabezadoPagina
        titulo={t("inicio.saludo", { usuario: usuario.usuario })}
        subtitulo={t("inicio.subtitulo")}
        acciones={
          <Button asChild>
            <a href="/" target="_blank" rel="noopener noreferrer">
              {t("inicio.verSitio")}
              <ExternalLinkIcon aria-hidden />
              <span className="sr-only">{t("menu.pestanaNueva")}</span>
            </a>
          </Button>
        }
      />
      <AvisoFase fase={6} />
    </>
  );
}
