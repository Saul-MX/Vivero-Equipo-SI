import { z } from "zod";
import { requerido } from "./comunes";

// Reglas de «Preguntas frecuentes» (sección 5.3). Se usan en el navegador y otra vez en el servidor.

export const esquemaPregunta = z.object({
  pregunta: requerido("preguntaRequerida", 255),
  respuesta: requerido("respuestaRequerida", 5000),
});

export type EntradaPregunta = z.input<typeof esquemaPregunta>;
export type PreguntaValidada = z.output<typeof esquemaPregunta>;
