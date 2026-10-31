import Link from "next/link";
import { Suspense } from "react";
import { useTranslations } from "next-intl";
import { getFormatter, getTranslations } from "next-intl/server";
import { EncabezadoPagina } from "@/components/panel/encabezado-pagina";
import { EsqueletoContenido } from "@/components/panel/esqueleto";
import { metadatosDeSeccion } from "@/components/panel/metadatos-seccion";
import { Card, CardContent } from "@/components/ui/card";
import { requerirUsuario } from "@/lib/auth/sesion";
import { contarMensajes, listarMensajes } from "@/lib/mensajes/mensajes";
import { cn } from "@/lib/utils";

export const generateMetadata = metadatosDeSeccion("mensajes");

export default function PaginaMensajes({ searchParams }: PageProps<"/panel/mensajes">) {
  const t = useTranslations("panel.secciones.mensajes");

  return (
    <>
      <EncabezadoPagina titulo={t("titulo")} subtitulo={t("subtitulo")} />
      <Suspense fallback={<EsqueletoContenido />}>
        <Bandeja searchParams={searchParams} />
      </Suspense>
    </>
  );
}

/** Bandeja: todos los mensajes o solo los sin leer, del más nuevo al más viejo. */
async function Bandeja({ searchParams }: { searchParams: PageProps<"/panel/mensajes">["searchParams"] }) {
  await requerirUsuario();
  const soloSinLeer = (await searchParams).ver === "sin-leer";
  const [t, formato, mensajes, cuenta] = await Promise.all([
    getTranslations("panel.mensajes"),
    getFormatter(),
    listarMensajes(soloSinLeer),
    contarMensajes(),
  ]);

  return (
    <>
      <nav aria-label={t("filtros")} className="mb-6 flex gap-1 overflow-x-auto border-b border-border">
        {[
          { href: "/panel/mensajes", activo: !soloSinLeer, texto: t("todos", { n: cuenta.total }) },
          { href: "/panel/mensajes?ver=sin-leer", activo: soloSinLeer, texto: t("sinLeer", { n: cuenta.sinLeer }) },
        ].map((pestana) => (
          <Link
            key={pestana.href}
            href={pestana.href}
            aria-current={pestana.activo ? "page" : undefined}
            className={cn(
              "-mb-px border-b-2 px-4 py-3 text-sm font-medium whitespace-nowrap",
              pestana.activo ? "border-pino text-pino" : "border-transparent text-texto-suave hover:text-foreground",
            )}
          >
            {pestana.texto}
          </Link>
        ))}
      </nav>
      <Card>
        <CardContent>
          {mensajes.length === 0 ? (
            <p className="py-8 text-center text-texto-suave">{soloSinLeer ? t("vacioSinLeer") : t("vacio")}</p>
          ) : (
            <ul className="divide-y divide-border">
              {mensajes.map((mensaje) => (
                <li key={mensaje.id}>
                  <Link
                    href={`/panel/mensajes/${mensaje.id}`}
                    className="-mx-2 flex gap-3 rounded-xl px-2 py-4 outline-none hover:bg-muted/60 focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    <span
                      aria-hidden
                      className={cn("mt-2 size-2.5 shrink-0 rounded-full", mensaje.leido ? "bg-transparent" : "bg-hoja")}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-baseline justify-between gap-x-3">
                        <span className={cn("text-foreground", !mensaje.leido && "font-semibold")}>
                          {mensaje.nombre}
                          {!mensaje.leido && <span className="sr-only"> ({t("nuevo")})</span>}
                        </span>
                        <span className="text-sm text-texto-suave">
                          {formato.dateTime(mensaje.creadoEn, { dateStyle: "medium", timeStyle: "short" })}
                        </span>
                      </span>
                      <span className="block text-sm text-texto-suave">{mensaje.contacto}</span>
                      <span className="mt-1 line-clamp-2 block text-sm text-foreground">{mensaje.texto}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </>
  );
}
