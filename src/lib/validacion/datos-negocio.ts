import { z } from "zod";
import {
  esWhatsappValido,
  extraerSrcMapa,
  indicesRepetidos,
  normalizarEnlaceMaps,
  normalizarFacebook,
  normalizarInstagram,
  normalizarTelefonos,
  normalizarWhatsapp,
  sonTelefonosValidos,
} from "@/lib/datos-negocio/normalizar";
import type { ClaveError } from "@/lib/resultado";
import { esquemaTono, requerido, texto } from "./comunes";

// Reglas de «Datos y redes». Se usan en el navegador y otra vez en el servidor (el que manda).
// Además de validar, dejan los datos limpios: el WhatsApp sin espacios, el mapa solo con su dirección, etc.
// Los mensajes son claves de traducción de la sección «errores» de messages/es-MX.json.

/** Campo opcional que, si trae algo, se limpia con `normalizar` (que devuelve null si no es válido). */
const enlaceOpcional = (maximo: number, normalizar: (v: string) => string | null, clave: ClaveError) =>
  texto(maximo)
    .refine((valor) => valor === "" || normalizar(valor) !== null, clave)
    .transform((valor) => (valor === "" ? "" : normalizar(valor)!));

export const esquemaDatosNegocio = z.object({
  // Contacto
  whatsapp: requerido("whatsappRequerido", 30)
    .transform(normalizarWhatsapp)
    .refine(esWhatsappValido, "whatsappInvalido"),
  // (El formato solo se revisa si hay algo escrito: vacío ya tiene su propio mensaje.)
  telefonos: requerido("telefonosRequeridos", 255)
    .refine((valor) => valor === "" || sonTelefonosValidos(valor), "telefonosInvalidos")
    .transform(normalizarTelefonos),
  correo: texto(191).refine((valor) => valor === "" || z.email().safeParse(valor).success, "correoInvalido"),
  horario: requerido("horarioRequerido", 191),
  horarioEspecial: texto(255),

  // Ubicación y mapa
  direccion: requerido("direccionRequerida", 255),
  enlaceMaps: requerido("enlaceMapsRequerido", 500)
    .refine((valor) => valor === "" || normalizarEnlaceMaps(valor) !== null, "enlaceMapsInvalido")
    .transform((valor) => normalizarEnlaceMaps(valor)!),
  // Se puede pegar el <iframe> completo; solo se guarda la dirección (src) del mapa.
  mapa: texto(5000)
    .refine((valor) => {
      if (valor === "") return true;
      const src = extraerSrcMapa(valor);
      return src !== null && src.length <= 1000;
    }, "mapaInvalido")
    .transform((valor) => (valor === "" ? "" : extraerSrcMapa(valor)!)),

  // Redes sociales
  facebook: enlaceOpcional(255, normalizarFacebook, "facebookInvalido"),
  instagram: enlaceOpcional(255, normalizarInstagram, "instagramInvalido"),
});

export type EntradaDatosNegocio = z.input<typeof esquemaDatosNegocio>;
export type DatosNegocioValidados = z.output<typeof esquemaDatosNegocio>;

// ── Listas de colores y tamaños de maceta ──

const MAXIMO_OPCIONES = 100;

/** Marca como error cada nombre que repite otro de la lista (sin importar mayúsculas ni acentos). */
function sinRepetidos(lista: "colores" | "macetas") {
  return (filas: { nombre: string }[], ctx: z.RefinementCtx) => {
    for (const indice of indicesRepetidos(filas.map((fila) => fila.nombre))) {
      ctx.addIssue({ code: "custom", message: "nombreRepetido", path: [lista, indice, "nombre"] });
    }
  };
}

export const esquemaNombreColor = requerido("colorNombreRequerido", 40);
export const esquemaNombreMaceta = requerido("macetaNombreRequerido", 40);

export const esquemaColores = z
  .object({
    colores: z
      .array(
        z.object({
          colorId: z.number().int().positive().nullable(), // null = color nuevo, aún sin guardar
          nombre: esquemaNombreColor,
          hex: esquemaTono,
        }),
      )
      .max(MAXIMO_OPCIONES, "listaLarga"),
  })
  .superRefine((datos, ctx) => sinRepetidos("colores")(datos.colores, ctx));

export const esquemaMacetas = z
  .object({
    macetas: z
      .array(
        z.object({
          macetaId: z.number().int().positive().nullable(), // null = tamaño nuevo, aún sin guardar
          nombre: esquemaNombreMaceta,
        }),
      )
      .max(MAXIMO_OPCIONES, "listaLarga"),
  })
  .superRefine((datos, ctx) => sinRepetidos("macetas")(datos.macetas, ctx));

export type EntradaColores = z.input<typeof esquemaColores>;
export type ColoresValidados = z.output<typeof esquemaColores>;
export type EntradaMacetas = z.input<typeof esquemaMacetas>;
export type MacetasValidadas = z.output<typeof esquemaMacetas>;
