import { auth, googleConfigurado } from "@/lib/auth/auth";
import { RUTA_API_AUTH } from "@/lib/auth/constantes";

// better-auth trae muchas rutas (entrar, registrarse, cambiar contraseña, revisar si un usuario
// existe…). Aquí SOLO se deja pasar la vuelta de Google, que el navegador tiene que poder abrir.
// Todo lo demás se hace desde las acciones del servidor del panel, que validan los datos y limitan
// los intentos fallidos; si estas rutas quedaran abiertas, alguien podría saltarse esos límites.
const RUTA_VUELTA_GOOGLE = `${RUTA_API_AUTH}/callback/google`;

function noEncontrado() {
  return new Response("No encontrado", { status: 404 });
}

export async function GET(request: Request) {
  if (!googleConfigurado || new URL(request.url).pathname !== RUTA_VUELTA_GOOGLE) return noEncontrado();
  return auth.handler(request);
}

export const POST = noEncontrado;
export const PUT = noEncontrado;
export const PATCH = noEncontrado;
export const DELETE = noEncontrado;
