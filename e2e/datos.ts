// Datos fijos de las pruebas (solo existen en la base de pruebas).

export const PUERTO_PRUEBAS = 3100;
export const CODIGO_INICIAL_PRUEBA = "PRUEBA-INICIAL-2026";
export const ADMIN = { usuario: "saul", contrasena: "contrasena-segura-1" };
export const ARCHIVO_SESION_ADMIN = "e2e/.auth/saul.json";
export const SIN_SESION = { cookies: [], origins: [] };
export const GOOGLE_CLIENT_ID_PRUEBA = "id-falso-de-pruebas.apps.googleusercontent.com";
/** Cookie de sesión de better-auth (con prefijo «vivero»; en http no lleva «__Secure-»). */
export const COOKIE_SESION = "vivero.session_token";
