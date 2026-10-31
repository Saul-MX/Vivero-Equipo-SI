import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { EncabezadoSitio } from "@/components/sitio/encabezado";
import { PieSitio } from "@/components/sitio/pie";
import { BotonWhatsappFlotante, ProveedorWhatsapp } from "@/components/sitio/whatsapp";
import { obtenerDatosNegocio } from "@/lib/datos-negocio/datos";
import { variablesAcento } from "@/lib/sitio/color";
import { catalogosDelMenu, temporadaDelSitio } from "@/lib/sitio/datos";

// Marco de todas las páginas públicas. El color de la temporada que se ve hoy se aplica como
// acento (--acento) sobre la paleta verde: franjas, botones, insignias y detalles.
export default async function LayoutSitio({ children }: { children: ReactNode }) {
  const [{ vigente, anio }, catalogos, datos, t] = await Promise.all([
    temporadaDelSitio(),
    catalogosDelMenu(),
    obtenerDatosNegocio(),
    getTranslations("sitio.whatsapp"),
  ]);

  // El sitio no manda la librería de idiomas al navegador: cada parte interactiva recibe sus
  // textos ya traducidos desde el servidor. Así el celular descarga y ejecuta mucho menos.
  return (
    <ProveedorWhatsapp numero={datos.whatsapp} mensajeGeneral={t("mensajeGeneral")} textoBoton={t("boton")}>
      <div
        data-testid="sitio"
        data-temporada={vigente?.slug ?? ""}
        style={variablesAcento(vigente?.color)}
        className="flex min-h-dvh flex-col bg-[#f7f8f4]"
      >
        <SaltarAlContenido />
        <EncabezadoSitio catalogos={catalogos} />
        <main id="contenido" className="flex-1">
          {children}
        </main>
        <PieSitio datos={datos} catalogos={catalogos} anio={anio} />
        <BotonWhatsappFlotante />
      </div>
    </ProveedorWhatsapp>
  );
}

function SaltarAlContenido() {
  const t = useTranslations("sitio.menu");
  return (
    <a
      href="#contenido"
      className="sr-only z-50 rounded-full bg-pino px-4 py-2 text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
    >
      {t("saltar")}
    </a>
  );
}
