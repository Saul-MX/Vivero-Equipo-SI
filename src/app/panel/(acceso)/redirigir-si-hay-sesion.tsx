import { redirect } from "next/navigation";
import { RUTA_PANEL } from "@/lib/auth/constantes";
import { obtenerSesion } from "@/lib/auth/sesion";

/** Si ya hay una sesión válida, no tiene caso mostrar «Entrar» o «Crear cuenta»: va directo al panel. */
export async function RedirigirSiHaySesion() {
  if (await obtenerSesion()) redirect(RUTA_PANEL);
  return null;
}
