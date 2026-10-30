import type { Metadata } from "next";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RUTA_INGRESO } from "@/lib/auth/constantes";
import { RedirigirSiHaySesion } from "../redirigir-si-hay-sesion";
import { FormularioRegistro } from "./formulario-registro";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("acceso.registro");
  return { title: t("tituloPagina") };
}

export default function PaginaRegistro() {
  const t = useTranslations("acceso.registro");

  return (
    <>
      <Suspense fallback={null}>
        <RedirigirSiHaySesion />
      </Suspense>
      <Card>
        <CardHeader>
          <CardTitle>
            <h1 className="text-3xl">{t("titulo")}</h1>
          </CardTitle>
          <CardDescription className="text-base">{t("subtitulo")}</CardDescription>
        </CardHeader>
        <CardContent>
          <FormularioRegistro />
        </CardContent>
      </Card>
      <p className="mt-6 text-center text-sm text-texto-suave">
        {t("pregunta")}{" "}
        <Link href={RUTA_INGRESO} className="font-medium text-pino underline underline-offset-4 hover:text-hoja">
          {t("enlace")}
        </Link>
      </p>
    </>
  );
}
