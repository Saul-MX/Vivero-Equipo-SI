import type { Metadata } from "next";
import { Suspense } from "react";
import { useTranslations } from "next-intl";
import { getFormatter, getTranslations } from "next-intl/server";
import { EncabezadoPagina } from "@/components/panel/encabezado-pagina";
import { EsqueletoContenido } from "@/components/panel/esqueleto";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DIAS_INVITACION } from "@/lib/auth/constantes";
import { listarInvitacionesVigentes } from "@/lib/auth/invitaciones";
import { requerirUsuario } from "@/lib/auth/sesion";
import { FormularioContrasena } from "./formulario-contrasena";
import { TarjetaInvitaciones } from "./tarjeta-invitaciones";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("panel.cuenta");
  return { title: t("titulo") };
}

export default function PaginaMiCuenta() {
  const t = useTranslations("panel.cuenta");

  return (
    <>
      <EncabezadoPagina titulo={t("titulo")} subtitulo={t("subtitulo")} />
      <Suspense fallback={<EsqueletoContenido />}>
        <ContenidoMiCuenta />
      </Suspense>
    </>
  );
}

async function ContenidoMiCuenta() {
  const usuario = await requerirUsuario();
  const [t, formato, invitaciones] = await Promise.all([
    getTranslations("panel.cuenta"),
    getFormatter(),
    listarInvitacionesVigentes(),
  ]);

  return (
    <div className="grid items-start gap-6 xl:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>
            <h2>{t("tarjeta")}</h2>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <FormularioContrasena usuario={usuario.usuario} />
        </CardContent>
      </Card>
      <TarjetaInvitaciones
        diasVigencia={DIAS_INVITACION}
        vigentes={invitaciones.map((invitacion) => ({
          id: invitacion.id,
          terminacion: invitacion.terminacion,
          vence: formato.dateTime(invitacion.expiraEn, { dateStyle: "long" }),
        }))}
      />
    </div>
  );
}
