import { connection } from "next/server";
import { googleConfigurado } from "@/lib/auth/auth";

/**
 * Muestra su contenido solo si Google está configurado en el servidor (GOOGLE_CLIENT_ID y
 * GOOGLE_CLIENT_SECRET). Se revisa en cada visita, no al compilar, por si se agregan después.
 * Va dentro de un <Suspense>.
 */
export async function SiHayGoogle({ children }: { children: React.ReactNode }) {
  await connection();
  return googleConfigurado ? children : null;
}
