import { Suspense } from "react";
import { useTranslations } from "next-intl";
import { EncabezadoPagina } from "@/components/panel/encabezado-pagina";
import { EsqueletoContenido } from "@/components/panel/esqueleto";
import { metadatosDeSeccion } from "@/components/panel/metadatos-seccion";
import { requerirUsuario } from "@/lib/auth/sesion";
import { obtenerDatosNegocio } from "@/lib/datos-negocio/datos";
import { listarColoresConUso, listarMacetasConUso } from "@/lib/datos-negocio/opciones-planta";
import { FormularioDatos } from "./formulario-datos";
import { ListaColores } from "./lista-colores";
import { ListaMacetas } from "./lista-macetas";

export const generateMetadata = metadatosDeSeccion("datos");

export default function PaginaDatosYRedes() {
  const t = useTranslations("panel.secciones.datos");

  return (
    <>
      <EncabezadoPagina titulo={t("titulo")} subtitulo={t("subtitulo")} />
      <Suspense fallback={<EsqueletoContenido />}>
        <ContenidoDatosYRedes />
      </Suspense>
    </>
  );
}

async function ContenidoDatosYRedes() {
  await requerirUsuario();
  const [datos, colores, macetas] = await Promise.all([
    obtenerDatosNegocio(),
    listarColoresConUso(),
    listarMacetasConUso(),
  ]);

  return (
    <div className="flex flex-col gap-10">
      <FormularioDatos
        inicial={{
          whatsapp: datos.whatsapp ?? "",
          telefonos: datos.telefonos ?? "",
          correo: datos.correo ?? "",
          horario: datos.horario ?? "",
          horarioEspecial: datos.horarioEspecial ?? "",
          direccion: datos.direccion ?? "",
          enlaceMaps: datos.enlaceMaps ?? "",
          mapa: datos.mapaSrc ?? "",
          facebook: datos.facebook ?? "",
          instagram: datos.instagram ?? "",
        }}
      />
      <div className="grid items-start gap-6 xl:grid-cols-2">
        <ListaColores inicial={colores} />
        <ListaMacetas inicial={macetas} />
      </div>
    </div>
  );
}
