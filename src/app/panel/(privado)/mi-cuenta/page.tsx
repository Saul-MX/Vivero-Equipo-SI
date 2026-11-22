import type { Metadata } from "next";
import { Suspense } from "react";
import { useTranslations } from "next-intl";
import { getFormatter, getTranslations } from "next-intl/server";
import { CampoTexto } from "@/components/formularios/campo-texto";
import { EncabezadoPagina } from "@/components/panel/encabezado-pagina";
import { EsqueletoContenido } from "@/components/panel/esqueleto";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { googleConfigurado } from "@/lib/auth/auth";
import { DIAS_INVITACION } from "@/lib/auth/constantes";
import { formasDeEntrar } from "@/lib/auth/cuentas";
import { listarInvitacionesVigentes } from "@/lib/auth/invitaciones";
import { requerirUsuario } from "@/lib/auth/sesion";
import { FormularioContrasena } from "./formulario-contrasena";
import { TarjetaGoogle } from "./tarjeta-google";
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
  const [t, formato, invitaciones, formas] = await Promise.all([
    getTranslations("panel.cuenta"),
    getFormatter(),
    listarInvitacionesVigentes(),
    formasDeEntrar(usuario.id),
  ]);

  return (
    <div className="grid items-start gap-6 xl:grid-cols-2">
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>
              <h2>{t("tarjeta")}</h2>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {formas.tieneContrasena && usuario.usuario ? (
              <FormularioContrasena usuario={usuario.usuario} />
            ) : (
              <div className="flex flex-col gap-4">
                {usuario.correo && (
                  <CampoTexto id="correo" etiqueta={t("correo")} value={usuario.correo} readOnly />
                )}
                <p className="text-sm text-texto-suave">{t("sinContrasena")}</p>
              </div>
            )}
          </CardContent>
        </Card>
        <TarjetaGoogle
          configurado={googleConfigurado}
          vinculada={formas.google}
          puedeQuitar={formas.tieneContrasena}
        />
      </div>
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
