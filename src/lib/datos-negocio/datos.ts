import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { prisma } from "@/lib/db";
import type { DatosNegocioValidados } from "@/lib/validacion/datos-negocio";
import { crearEnlaceWhatsapp, separarTelefonos } from "./normalizar";

// Datos del negocio (una sola fila, id = 1): contacto, ubicación, mapa y redes.

/** Etiqueta de la caché: al guardar desde el panel se invalida con updateTag(ETIQUETA_DATOS_NEGOCIO). */
export const ETIQUETA_DATOS_NEGOCIO = "datos-negocio";

const CAMPOS = {
  whatsapp: true,
  telefonos: true,
  correo: true,
  horario: true,
  horarioEspecial: true,
  direccion: true,
  enlaceMaps: true,
  mapaSrc: true,
  facebook: true,
  instagram: true,
} as const;

export type DatosNegocioGuardados = {
  whatsapp: string | null;
  telefonos: string | null;
  correo: string | null;
  horario: string | null;
  horarioEspecial: string | null;
  direccion: string | null;
  enlaceMaps: string | null;
  mapaSrc: string | null;
  facebook: string | null;
  instagram: string | null;
};

export type DatosNegocio = DatosNegocioGuardados & {
  /** Los teléfonos ya separados: ["244 761 52 53", "244 122 83 37"]. */
  listaTelefonos: string[];
  /** https://wa.me/52… o null si todavía no hay número (pendiente «Falta número de WhatsApp»). */
  enlaceWhatsapp: string | null;
};

const SIN_DATOS: DatosNegocioGuardados = {
  whatsapp: null,
  telefonos: null,
  correo: null,
  horario: null,
  horarioEspecial: null,
  direccion: null,
  enlaceMaps: null,
  mapaSrc: null,
  facebook: null,
  instagram: null,
};

/**
 * PUNTO ÚNICO DE LECTURA de los datos del negocio: lo usan el panel y lo usará el sitio público
 * (pie de página, Contacto, mapa y botones de WhatsApp).
 * Se guarda en caché; cuando se guardan cambios en «Datos y redes» la caché se renueva al momento.
 */
export async function obtenerDatosNegocio(): Promise<DatosNegocio> {
  "use cache";
  cacheTag(ETIQUETA_DATOS_NEGOCIO);
  cacheLife("hours");

  const fila = await prisma.datosNegocio.findUnique({ where: { id: 1 }, select: CAMPOS });
  const datos = fila ?? SIN_DATOS;
  return {
    ...datos,
    listaTelefonos: separarTelefonos(datos.telefonos),
    enlaceWhatsapp: datos.whatsapp ? crearEnlaceWhatsapp(datos.whatsapp) : null,
  };
}

/** Guarda los datos ya validados con esquemaDatosNegocio. Los campos vacíos se guardan como «sin dato». */
export async function guardarDatosNegocio(datos: DatosNegocioValidados): Promise<void> {
  const valores = {
    whatsapp: datos.whatsapp || null,
    telefonos: datos.telefonos || null,
    correo: datos.correo || null,
    horario: datos.horario || null,
    horarioEspecial: datos.horarioEspecial || null,
    direccion: datos.direccion || null,
    enlaceMaps: datos.enlaceMaps || null,
    mapaSrc: datos.mapa || null,
    facebook: datos.facebook || null,
    instagram: datos.instagram || null,
  };
  await prisma.datosNegocio.upsert({
    where: { id: 1 },
    create: { id: 1, ...valores },
    update: valores,
  });
}
