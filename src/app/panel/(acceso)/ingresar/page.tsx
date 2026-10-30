import type { Metadata } from "next";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RUTA_REGISTRO } from "@/lib/auth/constantes";
import { RedirigirSiHaySesion } from "../redirigir-si-hay-sesion";
import { FormularioIngreso } from "./formulario-ingreso";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("acceso.ingresar");
  return { title: t("tituloPagina") };
}

export default function PaginaIngreso() {
  const t = useTranslations("acceso.ingresar");

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
          <FormularioIngreso />
        </CardContent>
      </Card>
      <p className="mt-6 text-center text-sm text-texto-suave">
        {t("pregunta")}{" "}
        <Link href={RUTA_REGISTRO} className="font-medium text-pino underline underline-offset-4 hover:text-hoja">
          {t("enlace")}
        </Link>
      </p>
    </>
  );
}
