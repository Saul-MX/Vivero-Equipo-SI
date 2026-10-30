import "server-only";
import { headers } from "next/headers";

/**
 * IP de quien hace la petición, según el proxy del hosting (x-forwarded-for).
 * Solo se usa para limitar intentos fallidos; no se guarda en ningún otro lado.
 */
export async function obtenerIp(): Promise<string> {
  const encabezados = await headers();
  const reenviada = encabezados.get("x-forwarded-for")?.split(",")[0]?.trim();
  return (reenviada || encabezados.get("x-real-ip") || "desconocida").slice(0, 64);
}
