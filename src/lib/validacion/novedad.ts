import { z } from "zod";
import { esquemaArchivo, requerido } from "./comunes";

// «Publicar novedad»: entradas cortas (título, texto e imagen) que se muestran en Inicio del sitio.

export const esquemaNovedad = z.object({
  titulo: requerido("tituloNovedadRequerido", 160),
  texto: requerido("textoNovedadRequerido", 2000),
  imagen: esquemaArchivo, // opcional
  visible: z.boolean(),
});

export type EntradaNovedad = z.input<typeof esquemaNovedad>;
export type NovedadValidada = z.output<typeof esquemaNovedad>;
