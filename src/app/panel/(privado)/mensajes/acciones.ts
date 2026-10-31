"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { requerirUsuario } from "@/lib/auth/sesion";
import { eliminarMensaje, marcarMensaje } from "@/lib/mensajes/mensajes";

const esquemaId = z.number().int().positive();

export async function marcarMensajeAccion(id: number, leido: boolean): Promise<boolean> {
  await requerirUsuario();
  const hecho = await marcarMensaje(esquemaId.parse(id), z.boolean().parse(leido));
  refresh();
  return hecho;
}

export async function eliminarMensajeAccion(id: number): Promise<boolean> {
  await requerirUsuario();
  return eliminarMensaje(esquemaId.parse(id));
}
