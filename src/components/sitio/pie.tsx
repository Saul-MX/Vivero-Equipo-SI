import Link from "next/link";
import { useTranslations } from "next-intl";
import { ClockIcon, MailIcon, MapPinIcon, PhoneIcon } from "lucide-react";
import { Logo } from "@/components/marca/logo";
import type { DatosNegocio } from "@/lib/datos-negocio/datos";
import { CONTENEDOR } from "./encabezado";
import type { ItemCatalogo } from "./menu-sitio";

/** Teléfono para el enlace «tel:» (solo números). */
export const enlaceTelefono = (telefono: string) => `tel:${telefono.replace(/\D/g, "")}`;

/** Pie de página: datos de contacto, redes y los apartados del sitio. Todo sale de «Datos y redes». */
export function PieSitio({ datos, catalogos, anio }: { datos: DatosNegocio; catalogos: ItemCatalogo[]; anio: number }) {
  const t = useTranslations("sitio");
  const enlace = "rounded underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-crema";

  return (
    <footer className="mt-20 bg-bosque text-crema">
      <div aria-hidden className="h-1 bg-acento" />
      <div className={`${CONTENEDOR} grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr]`}>
        <div className="flex flex-col gap-5">
          <Logo tono="claro" tamano="md" conLugar />
          <ul className="flex flex-col gap-3 text-sm">
            {datos.direccion && (
              <li className="flex gap-2">
                <MapPinIcon aria-hidden className="mt-0.5 size-4 shrink-0" />
                {datos.direccion}
              </li>
            )}
            {datos.horario && (
              <li className="flex gap-2">
                <ClockIcon aria-hidden className="mt-0.5 size-4 shrink-0" />
                <span>
                  {datos.horario}
                  {datos.horarioEspecial && <span className="block text-crema/90">{datos.horarioEspecial}</span>}
                </span>
              </li>
            )}
            {datos.listaTelefonos.length > 0 && (
              <li className="flex gap-2">
                <PhoneIcon aria-hidden className="mt-0.5 size-4 shrink-0" />
                <span className="flex flex-wrap gap-x-3">
                  {datos.listaTelefonos.map((telefono) => (
                    <a key={telefono} href={enlaceTelefono(telefono)} className={enlace}>
                      {telefono}
                    </a>
                  ))}
                </span>
              </li>
            )}
            {datos.correo && (
              <li className="flex gap-2">
                <MailIcon aria-hidden className="mt-0.5 size-4 shrink-0" />
                <a href={`mailto:${datos.correo}`} className={enlace}>
                  {datos.correo}
                </a>
              </li>
            )}
          </ul>
        </div>

        <nav aria-label={t("pie.catalogos")}>
          <h2 className="mb-4 dato text-white">
            {t("pie.catalogos")}
          </h2>
          <ul className="flex flex-col gap-2 text-sm">
            {catalogos.map((catalogo) => (
              <li key={catalogo.slug}>
                <Link href={`/catalogos/${catalogo.slug}`} className={enlace}>
                  {catalogo.nombre}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/temporada" className={enlace}>
                {t("menu.temporada")}
              </Link>
            </li>
            <li>
              <Link href="/fertilizantes" className={enlace}>
                {t("menu.fertilizantes")}
              </Link>
            </li>
            <li>
              <Link href="/plantas" className={enlace}>
                {t("menu.todasLasPlantas")}
              </Link>
            </li>
          </ul>
        </nav>

        <div>
          <h2 className="mb-4 dato text-white">{t("pie.vivero")}</h2>
          <ul className="flex flex-col gap-2 text-sm">
            <li>
              <Link href="/nosotros" className={enlace}>
                {t("menu.nosotros")}
              </Link>
            </li>
            <li>
              <Link href="/contacto" className={enlace}>
                {t("menu.contacto")}
              </Link>
            </li>
            {datos.facebook && (
              <li>
                <a href={datos.facebook} target="_blank" rel="noopener noreferrer" className={enlace}>
                  Facebook
                </a>
              </li>
            )}
            {datos.instagram && (
              <li>
                <a href={datos.instagram} target="_blank" rel="noopener noreferrer" className={enlace}>
                  Instagram
                </a>
              </li>
            )}
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <p className={`${CONTENEDOR} py-6 text-xs text-crema/90`}>{t("pie.derechos", { anio })}</p>
      </div>
    </footer>
  );
}
