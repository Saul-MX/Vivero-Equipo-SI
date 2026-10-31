import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { useTranslations } from "next-intl";
import { InfoIcon } from "lucide-react";
import { EncabezadoPagina } from "@/components/panel/encabezado-pagina";
import { EsqueletoContenido } from "@/components/panel/esqueleto";
import { metadatosDeSeccion } from "@/components/panel/metadatos-seccion";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { requerirUsuario } from "@/lib/auth/sesion";
import { leerEstadoTemporadas } from "@/lib/temporadas/temporadas";
import { textoTemporadaActual } from "@/lib/temporadas/texto-actual";
import { FormularioModo } from "./formulario-modo";
import { TarjetaTemporada } from "./tarjeta-temporada";

export const generateMetadata = metadatosDeSeccion("temporadas");

export default function PaginaTemporadas() {
  const t = useTranslations("panel.secciones.temporadas");

  return (
    <>
      <EncabezadoPagina titulo={t("titulo")} subtitulo={t("subtitulo")} />
      <Suspense fallback={<EsqueletoContenido />}>
        <ContenidoTemporadas />
      </Suspense>
    </>
  );
}

async function ContenidoTemporadas() {
  await requerirUsuario();
  const estado = await leerEstadoTemporadas();
  const t = await getTranslations("panel.temporadas");
  const { temporadas, configuracion, vigente } = estado;

  return (
    <div className="flex flex-col gap-6">
      <FormularioModo
        inicial={{
          modo: configuracion.modo,
          temporadaForzadaId: configuracion.temporadaForzadaId ? String(configuracion.temporadaForzadaId) : "",
        }}
        temporadas={temporadas.map((temporada) => ({ id: temporada.id, nombre: temporada.catalogo.nombre }))}
        textoAhora={await textoTemporadaActual(estado)}
      />

      <Alert variant="aviso">
        <InfoIcon aria-hidden />
        <AlertDescription className="text-[#5c4a0c]">{t("regla")}</AlertDescription>
      </Alert>

      {temporadas.length === 0 ? (
        <p className="py-6 text-center text-texto-suave">{t("vacio")}</p>
      ) : (
        <div className="grid items-start gap-6 xl:grid-cols-2">
          {temporadas.map((temporada) => (
            <TarjetaTemporada key={temporada.id} temporada={temporada} activa={temporada.id === vigente?.id} />
          ))}
        </div>
      )}
    </div>
  );
}
