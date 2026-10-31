import { z } from "zod";
import { requerido, texto } from "./comunes";

// Formulario de Contacto del sitio. Se usa en el navegador y otra vez en el servidor.

const pareceCorreo = (valor: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(valor);
const pareceTelefono = (valor: string) => /^[\d\s()+.-]+$/.test(valor) && valor.replace(/\D/g, "").length >= 7;

export const esquemaMensaje = z.object({
  nombre: requerido("nombreContactoRequerido", 120),
  contacto: requerido("contactoRequerido", 191).refine(
    (valor) => valor === "" || pareceCorreo(valor) || pareceTelefono(valor),
    "contactoInvalido",
  ),
  texto: requerido("mensajeRequerido", 2000).refine((valor) => valor === "" || valor.length >= 10, "mensajeCorto"),
  // Protección contra spam: campo trampa (las personas no lo ven) y tiempo que tardó en llenarse.
  sitioWeb: texto(200),
  tiempoMs: z.number().int().nonnegative(),
});

export type EntradaMensaje = z.input<typeof esquemaMensaje>;
export type MensajeValidado = z.output<typeof esquemaMensaje>;

/** Menos de esto no lo escribe una persona: se descarta en silencio. */
export const TIEMPO_MINIMO_MS = 3000;
