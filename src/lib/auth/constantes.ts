// Valores compartidos por el proxy, las páginas y las acciones del servidor.
// (Sin "server-only": proxy.ts también los importa.)

export const COOKIE_SESION = "vivero_sesion";

export const RUTA_PANEL = "/panel";
export const RUTA_INGRESO = "/panel/ingresar";
export const RUTA_REGISTRO = "/panel/registro";

export const DIAS_SESION = 30;
export const DIAS_INVITACION = 7;

export const MINUTO_MS = 60 * 1000;
export const DIA_MS = 24 * 60 * MINUTO_MS;
