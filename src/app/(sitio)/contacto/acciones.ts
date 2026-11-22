"use server";

import { getTranslations } from "next-intl/server";
import { MINUTO_MS } from "@/lib/auth/constantes";
import { consumirIntento, type ReglaIntentos } from "@/lib/auth/limite-intentos";
import { prisma } from "@/lib/db";
import { obtenerIp } from "@/lib/peticion";
import { erroresDeCampos } from "@/lib/resultado";
import { esquemaMensaje, TIEMPO_MINIMO_MS } from "@/lib/validacion/mensaje";

const MENSAJES_POR_HORA = 5;

type Campo = "nombre" | "contacto" | "texto";
export type EstadoContacto =
  | { estado: "inicial" }
  | { estado: "enviado" }
  | {
      estado: "error";
      general: string;
      campos: Partial<Record<Campo, string>>;
      valores: Record<Campo, string>;
    };

/**
 * Guarda un mensaje del formulario de Contacto (lo verá el panel en «Mensajes»). Toda la validación
 * se hace aquí; el formulario del navegador solo muestra lo que se devuelve (ya traducido).
 * Lo que parece de un programa (campo trampa lleno o enviado en menos de 3 segundos) se descarta
 * sin avisar, para no darle pistas; además hay un límite de mensajes por hora por conexión.
 */
export async function enviarMensaje(_previo: EstadoContacto, datos: FormData): Promise<EstadoContacto> {
  const texto = (campo: string) => {
    const valor = datos.get(campo);
    return typeof valor === "string" ? valor : "";
  };
  const entrada = {
    nombre: texto("nombre"),
    contacto: texto("contacto"),
    texto: texto("texto"),
    sitioWeb: texto("sitioWeb"),
    tiempoMs: Math.max(0, Math.round(Number(texto("tiempoMs")) || 0)),
  };
  const t = await getTranslations("errores");
  const valores = { nombre: entrada.nombre, contacto: entrada.contacto, texto: entrada.texto };

  const validacion = esquemaMensaje.safeParse(entrada);
  if (!validacion.success) {
    const campos: Partial<Record<Campo, string>> = {};
    for (const [campo, clave] of Object.entries(erroresDeCampos<Campo>(validacion.error))) {
      if (campo === "nombre" || campo === "contacto" || campo === "texto") campos[campo] = t(clave);
    }
    return { estado: "error", general: t("revisaCampos"), campos, valores };
  }

  const { nombre, contacto, texto: mensaje, sitioWeb, tiempoMs } = validacion.data;
  if (sitioWeb !== "" || tiempoMs < TIEMPO_MINIMO_MS) return { estado: "enviado" };

  const regla: ReglaIntentos = {
    clave: `mensaje:ip:${await obtenerIp()}`,
    maximo: MENSAJES_POR_HORA,
    ventanaMs: 60 * MINUTO_MS,
  };
  // Se cuenta antes de guardar: varios envíos al mismo tiempo no pueden pasar del límite.
  const minutos = await consumirIntento([regla]);
  if (minutos !== null) {
    return { estado: "error", general: t("demasiadosMensajes", { minutos }), campos: {}, valores };
  }

  await prisma.mensaje.create({ data: { nombre, contacto, texto: mensaje } });
  return { estado: "enviado" };
}
