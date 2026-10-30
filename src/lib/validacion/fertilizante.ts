import { z } from "zod";
import { esquemaArchivo, requerido, texto } from "./comunes";

// Formulario «Nuevo fertilizante» (sección 4.5). Solo «Precauciones» y la foto son opcionales.

export const TIPOS_FERTILIZANTE = ["GRANULADO", "LIQUIDO", "POLVO", "ORGANICO", "OTRO"] as const;

export const esquemaFertilizante = z.object({
  nombre: requerido("nombreRequerido", 120),
  tipo: z.enum(["", ...TIPOS_FERTILIZANTE]).refine((tipo) => tipo !== "", "tipoRequerido"),
  paraQueSirve: requerido("paraQueSirveRequerido", 2000),
  catalogos: z.array(z.string().regex(/^\d+$/).transform(Number)).max(100),
  dosis: requerido("dosisRequerida", 191),
  frecuencia: requerido("frecuenciaRequerida", 191),
  pasosAplicacion: requerido("pasosRequeridos", 3000), // un paso por renglón
  precauciones: texto(2000),
  presentacion: requerido("presentacionRequerida", 191),
  visible: z.boolean(),
  foto: esquemaArchivo,
});

export type EntradaFertilizante = z.input<typeof esquemaFertilizante>;
export type FertilizanteValidado = z.output<typeof esquemaFertilizante>;
