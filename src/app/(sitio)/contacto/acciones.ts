"use server";

import { MINUTO_MS } from "@/lib/auth/constantes";
import { minutosDeBloqueo, registrarFallo, type ReglaIntentos } from "@/lib/auth/limite-intentos";
import { prisma } from "@/lib/db";
import { obtenerIp } from "@/lib/peticion";
import { erroresDeCampos, type ResultadoAccion } from "@/lib/resultado";
import { esquemaMensaje, TIEMPO_MINIMO_MS, type EntradaMensaje } from "@/lib/validacion/mensaje";

const MENSAJES_POR_HORA = 5;

/**
 * Guarda un mensaje del formulario de Contacto (lo verá el panel en «Mensajes»).
 * Lo que parece de un programa (campo trampa lleno o enviado en menos de 3 segundos) se descarta
 * sin avisar, para no darle pistas; además hay un límite de mensajes por hora por conexión.
 */
export async function enviarMensaje(entrada: EntradaMensaje): Promise<ResultadoAccion<keyof EntradaMensaje>> {
  const validacion = esquemaMensaje.safeParse(entrada);
  if (!validacion.success) {
    return { ok: false, error: "revisaCampos", campos: erroresDeCampos(validacion.error) };
  }
  const { nombre, contacto, texto, sitioWeb, tiempoMs } = validacion.data;
  if (sitioWeb !== "" || tiempoMs < TIEMPO_MINIMO_MS) return { ok: true };

  const regla: ReglaIntentos = { clave: `mensaje:ip:${await obtenerIp()}`, maximo: MENSAJES_POR_HORA, ventanaMs: 60 * MINUTO_MS };
  const minutos = await minutosDeBloqueo([regla]);
  if (minutos !== null) return { ok: false, error: "demasiadosMensajes", minutos };

  await prisma.mensaje.create({ data: { nombre, contacto, texto } });
  await registrarFallo([regla]); // cuenta este envío dentro de la hora
  return { ok: true };
}
