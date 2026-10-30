import { z } from "zod";
import { esquemaArchivo, requerido } from "./comunes";

// Reglas de «Testimonios» (sección 5.4). Se usan en el navegador y otra vez en el servidor.

export const esquemaTestimonio = z.object({
  avatar: esquemaArchivo, // vacío = avatar por defecto
  nombre: requerido("nombreClienteRequerido", 120),
  texto: requerido("testimonioRequerido", 1000),
  visible: z.boolean(),
});

export type EntradaTestimonio = z.input<typeof esquemaTestimonio>;
export type TestimonioValidado = z.output<typeof esquemaTestimonio>;
