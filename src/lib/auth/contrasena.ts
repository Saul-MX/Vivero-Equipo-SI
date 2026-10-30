import "server-only";
import { hash, verify } from "@node-rs/argon2";

// argon2id (el algoritmo por defecto de la librería) con los parámetros que recomienda OWASP:
// 19 MiB de memoria, 2 iteraciones y 1 hilo.
const OPCIONES = { memoryCost: 19456, timeCost: 2, parallelism: 1 };

export function hashearContrasena(contrasena: string): Promise<string> {
  return hash(contrasena, OPCIONES);
}

// Hash de una contraseña inventada. Si el usuario no existe se verifica contra él de todos modos,
// para que la respuesta tarde lo mismo y no delate qué nombres de usuario existen.
let hashFicticio: Promise<string> | undefined;

export async function verificarContrasena(
  hashGuardado: string | null | undefined,
  contrasena: string,
): Promise<boolean> {
  if (!hashGuardado) {
    hashFicticio ??= hash("contrasena-ficticia-para-igualar-tiempos", OPCIONES);
    await verify(await hashFicticio, contrasena);
    return false;
  }
  try {
    return await verify(hashGuardado, contrasena);
  } catch {
    return false;
  }
}
