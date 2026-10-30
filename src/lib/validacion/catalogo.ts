import { z } from "zod";
import { esquemaArchivo, esquemaMes, esquemaTono, requerido, texto } from "./comunes";

// Ficha de un catálogo. El slug no está aquí: se crea al dar de alta y no cambia.

export const esquemaCatalogo = z.object({
  nombre: requerido("nombreRequerido", 80),
  color: esquemaTono,
  visible: z.boolean(),
  permanente: z.boolean(),
  fotoPortada: esquemaArchivo,
  presentacion: texto(5000),
  destacados: texto(2000), // un punto destacado por renglón
  folletoPdf: esquemaArchivo,
  tieneTemporada: z.boolean(),
  mesInicio: esquemaMes,
  mesFin: esquemaMes,
});

export type EntradaCatalogo = z.input<typeof esquemaCatalogo>;
export type CatalogoValidado = z.output<typeof esquemaCatalogo>;
