import { getTranslations } from "next-intl/server";
import { ChevronDownIcon, ClockIcon, MailIcon, MapPinIcon, PhoneIcon } from "lucide-react";
import { CabeceraPagina } from "@/components/sitio/cabecera-pagina";
import { CONTENEDOR } from "@/components/sitio/encabezado";
import { enlaceTelefono } from "@/components/sitio/pie";
import { MapaNegocio } from "@/components/sitio/mapa-negocio";
import { IconoWhatsapp } from "@/components/sitio/whatsapp";
import { crearEnlaceWhatsapp } from "@/lib/datos-negocio/normalizar";
import { obtenerDatosNegocio } from "@/lib/datos-negocio/datos";
import { preguntasFrecuentes } from "@/lib/sitio/datos";
import { metadatosPagina } from "@/lib/sitio/metadatos";
import { cn } from "@/lib/utils";
import { FormularioContacto } from "./formulario-contacto";

export async function generateMetadata() {
  const t = await getTranslations("sitio.contacto");
  return metadatosPagina({ titulo: t("titulo"), descripcion: t("descripcion"), ruta: "/contacto" });
}

/** Mapa, dirección, teléfonos, horarios, WhatsApp, redes, formulario y preguntas frecuentes al final. */
export default async function PaginaContacto() {
  const [t, datos, preguntas] = await Promise.all([
    getTranslations("sitio"),
    obtenerDatosNegocio(),
    preguntasFrecuentes(),
  ]);
  const enlace = "font-semibold text-pino underline-offset-4 hover:underline";

  return (
    <>
      <CabeceraPagina migas={[{ texto: t("contacto.titulo") }]} titulo={t("contacto.titulo")}>
        <p>{t("contacto.descripcion")}</p>
      </CabeceraPagina>

      <div className={cn(CONTENEDOR, "grid gap-6 lg:grid-cols-2")}>
        <section aria-labelledby="titulo-datos" className="flex flex-col gap-6 rounded-md border border-hilo bg-white p-6 sm:p-8">
          <h2 id="titulo-datos" className="text-2xl font-semibold text-pino">
            {t("contacto.visitanos")}
          </h2>
          <dl className="flex flex-col gap-5">
            {datos.direccion && (
              <div>
                <dt className="flex items-center gap-2 text-sm font-semibold text-texto-suave">
                  <MapPinIcon aria-hidden className="size-5 shrink-0 text-hoja" />
                  {t("contacto.direccion")}
                </dt>
                  <dd className="pl-7">
                    {datos.direccion}
                    {datos.enlaceMaps && (
                      <a href={datos.enlaceMaps} target="_blank" rel="noopener noreferrer" className={cn(enlace, "mt-1 block")}>
                        {t("contacto.comoLlegar")}
                      </a>
                    )}
                  </dd>
                </div>
            )}
            {datos.listaTelefonos.length > 0 && (
              <div>
                <dt className="flex items-center gap-2 text-sm font-semibold text-texto-suave">
                  <PhoneIcon aria-hidden className="size-5 shrink-0 text-hoja" />
                  {t("contacto.telefonos")}
                </dt>
                  <dd className="pl-7 flex flex-wrap gap-x-4">
                    {datos.listaTelefonos.map((telefono) => (
                      <a key={telefono} href={enlaceTelefono(telefono)} className={enlace}>
                        {telefono}
                      </a>
                    ))}
                  </dd>
                </div>
            )}
            {datos.correo && (
              <div>
                <dt className="flex items-center gap-2 text-sm font-semibold text-texto-suave">
                  <MailIcon aria-hidden className="size-5 shrink-0 text-hoja" />
                  {t("contacto.correo")}
                </dt>
                  <dd className="pl-7">
                    <a href={`mailto:${datos.correo}`} className={enlace}>
                      {datos.correo}
                    </a>
                  </dd>
                </div>
            )}
            {datos.horario && (
              <div>
                <dt className="flex items-center gap-2 text-sm font-semibold text-texto-suave">
                  <ClockIcon aria-hidden className="size-5 shrink-0 text-hoja" />
                  {t("contacto.horario")}
                </dt>
                  <dd className="pl-7">{datos.horario}</dd>
                  {datos.horarioEspecial && <dd className="pl-7 mt-1 font-medium text-pino">{datos.horarioEspecial}</dd>}
                </div>
            )}
          </dl>
          <div className="flex flex-wrap items-center gap-3">
            {datos.whatsapp && (
              <a
                href={crearEnlaceWhatsapp(datos.whatsapp, t("whatsapp.mensajeGeneral"))}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-12 items-center gap-2 rounded-full bg-[#0b6b3a] px-6 font-semibold text-white outline-none hover:opacity-90 focus-visible:ring-4 focus-visible:ring-[#0b6b3a]/40"
              >
                <IconoWhatsapp />
                {t("contacto.escribirWhatsapp")}
              </a>
            )}
            {datos.facebook && (
              <a href={datos.facebook} target="_blank" rel="noopener noreferrer" className={enlace}>
                Facebook
              </a>
            )}
            {datos.instagram && (
              <a href={datos.instagram} target="_blank" rel="noopener noreferrer" className={enlace}>
                Instagram
              </a>
            )}
          </div>
        </section>

        <FormularioContacto
          textos={{
            titulo: t("contacto.formulario.titulo"),
            nombre: t("contacto.formulario.nombre"),
            contacto: t("contacto.formulario.contacto"),
            contactoAyuda: t("contacto.formulario.contactoAyuda"),
            mensaje: t("contacto.formulario.mensaje"),
            trampa: t("contacto.formulario.trampa"),
            enviar: t("contacto.formulario.enviar"),
            enviando: t("contacto.formulario.enviando"),
            privacidad: t("contacto.formulario.privacidad"),
            graciasTitulo: t("contacto.formulario.graciasTitulo"),
            graciasTexto: t("contacto.formulario.graciasTexto"),
            otro: t("contacto.formulario.otro"),
          }}
        />
      </div>

      {datos.mapaSrc && (
        <section aria-label={t("contacto.mapa")} className={cn(CONTENEDOR, "mt-6")}>
          {/* La dirección del mapa se guardó ya revisada (solo mapas de Google con https). */}
          <MapaNegocio
            src={datos.mapaSrc}
            titulo={t("contacto.mapa")}
            className="aspect-4/3 w-full rounded-md border border-hilo bg-muted sm:aspect-21/9"
          />
        </section>
      )}

      {preguntas.length > 0 && (
        <section aria-labelledby="titulo-preguntas" className={cn(CONTENEDOR, "mt-16")}>
          <h2 id="titulo-preguntas" className="text-3xl font-semibold text-pino sm:text-4xl">
            {t("contacto.preguntas")}
          </h2>
          <div className="mt-6 divide-y divide-border rounded-md border border-hilo bg-white">
            {preguntas.map((pregunta) => (
              <details key={pregunta.id} className="group px-6 py-1">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-lg font-semibold text-pino outline-none focus-visible:ring-3 focus-visible:ring-ring/50 [&::-webkit-details-marker]:hidden">
                  {pregunta.pregunta}
                  <ChevronDownIcon aria-hidden className="size-5 shrink-0 transition-transform group-open:rotate-180" />
                </summary>
                <div className="flex flex-col gap-3 pb-5 text-foreground">
                  {pregunta.respuesta
                    .split(/\n\s*\n/)
                    .filter(Boolean)
                    .map((parrafo) => (
                      <p key={parrafo} className="whitespace-pre-line">
                        {parrafo}
                      </p>
                    ))}
                </div>
              </details>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
