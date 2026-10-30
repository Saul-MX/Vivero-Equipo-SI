"use server";

import { redirect } from "next/navigation";
import { RUTA_INGRESO } from "@/lib/auth/constantes";
import { cerrarSesion } from "@/lib/auth/sesion";

/** «Salir»: cierra la sesión y regresa a la pantalla de inicio de sesión. */
export async function salir() {
  await cerrarSesion();
  redirect(RUTA_INGRESO);
}
