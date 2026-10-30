import { z } from "zod";
import { esClaveValida } from "@/lib/archivos/claves";
import { esquemaArchivo, requerido, texto } from "./comunes";
import { MAXIMO_FOTOS } from "./planta";

// Reglas de «Nosotros» (sección 5.2). Todo es opcional para poder llenarlo poco a poco,
// pero cada valor y cada momento necesitan su título.

export const MAXIMO_VALORES = 20;
export const MAXIMO_MOMENTOS = 40;

const esquemaGaleria = z
  .array(
    z.object({
      id: z.number().int().positive().nullable(),
      clave: z.string().refine(esClaveValida, "archivoNoEncontrado"),
      esPortada: z.boolean(), // la galería es compartida con Plantas; aquí siempre es false
    }),
  )
  .max(MAXIMO_FOTOS, "demasiadasFotos");

/** Historia, Misión y Visión: texto, foto de arriba y galería. */
const esquemaSeccion = z.object({
  texto: texto(10000),
  fotoSuperior: esquemaArchivo,
  galeria: esquemaGaleria,
});

export const esquemaNosotros = z.object({
  historia: esquemaSeccion,
  momentos: z
    .array(
      z.object({
        id: z.number().int().positive().nullable(),
        titulo: requerido("momentoTituloRequerido", 60),
        texto: texto(2000),
        foto: esquemaArchivo,
      }),
    )
    .max(MAXIMO_MOMENTOS, "listaLarga"),
  mision: esquemaSeccion,
  vision: esquemaSeccion,
  valores: z.object({
    fotoSuperior: esquemaArchivo,
    galeria: esquemaGaleria,
    lista: z
      .array(
        z.object({
          titulo: requerido("valorTituloRequerido", 120),
          descripcion: texto(1000),
        }),
      )
      .max(MAXIMO_VALORES, "listaLarga"),
  }),
});

export type EntradaNosotros = z.input<typeof esquemaNosotros>;
export type NosotrosValidado = z.output<typeof esquemaNosotros>;
export type SeccionConGaleria = "historia" | "mision" | "vision" | "valores";
