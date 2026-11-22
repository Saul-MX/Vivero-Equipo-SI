// Valores compartidos por el proxy, las páginas y las acciones del servidor.
// (Sin "server-only": proxy.ts también los importa.)

/** Prefijo de las cookies de better-auth: la de sesión se llama «vivero.session_token». */
export const PREFIJO_COOKIES = "vivero";

export const RUTA_PANEL = "/panel";
export const RUTA_INGRESO = "/panel/ingresar";
export const RUTA_REGISTRO = "/panel/registro";
export const RUTA_MI_CUENTA = "/panel/mi-cuenta";

/** Donde atiende better-auth. Desde fuera solo se deja pasar la vuelta de Google (ver route.ts). */
export const RUTA_API_AUTH = "/api/auth";

export const DIAS_SESION = 30;
export const DIAS_INVITACION = 7;

export const MINUTO_MS = 60 * 1000;
export const DIA_MS = 24 * 60 * MINUTO_MS;
