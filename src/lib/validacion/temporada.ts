import { z } from "zod";
import { esquemaMes, esquemaTono, texto } from "./comunes";

// «¿Qué temporada se muestra?»: el modo y, si se fuerza, cuál.
export const esquemaModoTemporada = z
  .object({
    modo: z.enum(["AUTOMATICA", "FORZADA", "FIJA_TODO_EL_ANIO"]),
    temporadaForzadaId: z.string(), // viene de una lista desplegable («» si no se eligió)
  })
  .refine((datos) => datos.modo !== "FORZADA" || /^\d+$/.test(datos.temporadaForzadaId), {
    error: "temporadaForzadaRequerida",
    path: ["temporadaForzadaId"],
  })
  .transform((datos) => ({
    modo: datos.modo,
    temporadaForzadaId: datos.modo === "FORZADA" ? Number(datos.temporadaForzadaId) : null,
  }));

// Tarjeta de una temporada.
export const esquemaTemporada = z.object({
  mesInicio: esquemaMes,
  mesFin: esquemaMes,
  textoAviso: texto(160),
  color: esquemaTono,
  prioridad: z
    .string()
    .trim()
    .regex(/^\d{1,3}$/, "prioridadInvalida")
    .transform(Number)
    .refine((numero) => numero <= 100, "prioridadInvalida"),
  visible: z.boolean(),
});

export type EntradaModoTemporada = z.input<typeof esquemaModoTemporada>;
export type ModoTemporadaValidado = z.output<typeof esquemaModoTemporada>;
export type EntradaTemporada = z.input<typeof esquemaTemporada>;
export type TemporadaValidada = z.output<typeof esquemaTemporada>;
