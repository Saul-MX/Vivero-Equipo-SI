import "server-only";
import { headers } from "next/headers";
import { ipDeLaPeticion } from "./ip";

/**
 * IP de quien hace la petición, según el proxy del hosting (ver ip.ts).
 * PROXIES_DE_CONFIANZA (por defecto 1) dice cuántos proxies hay delante de la app.
 * Solo se usa para limitar intentos; no se guarda en ningún otro lado.
 */
export async function obtenerIp(): Promise<string> {
  const encabezados = await headers();
  return ipDeLaPeticion(
    { forwardedFor: encabezados.get("x-forwarded-for"), realIp: encabezados.get("x-real-ip") },
    Number(process.env.PROXIES_DE_CONFIANZA ?? 1),
  );
}
