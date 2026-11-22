import "server-only";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { APIError, getOAuthState } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import { username } from "better-auth/plugins";
import { prisma } from "@/lib/db";
import { DIA_MS, DIAS_SESION, PREFIJO_COOKIES, RUTA_INGRESO } from "./constantes";
import { hashearContrasena, verificarContrasena } from "./contrasena";
import { asignarInvitacion, reservarInvitacion } from "./invitaciones";

// Acceso al panel con better-auth: usuario y contraseña, o Google.
//
// Reglas de seguridad (además de las que trae better-auth: cookies httpOnly firmadas, «state» y PKCE
// en el viaje a Google, sesiones guardadas en la base que se pueden cerrar al momento):
// 1. Desde el navegador solo se puede llegar a la vuelta de Google (/api/auth/callback/google; ver
//    route.ts). Entrar, registrarse, cambiar la contraseña, etc. pasa SIEMPRE por las acciones del
//    servidor, que validan los datos y frenan la fuerza bruta (limite-intentos.ts).
// 2. Ninguna cuenta se crea sin un código de invitación válido (hook «user.create.before»).
// 3. Google nunca se une solo a una cuenta existente: se vincula a propósito desde «Mi cuenta».

/** Google solo se activa si están sus dos variables en el .env. */
export const googleConfigurado = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

/** Encabezado con el que la acción de registro pasa el hash del código al hook de abajo. */
export const ENCABEZADO_INVITACION = "x-vivero-invitacion";

/**
 * Correo interno de las cuentas con usuario y contraseña (better-auth exige uno).
 * «.invalid» es un dominio reservado que nunca existe: no le llega correo ni choca con uno de Google.
 */
export function correoInterno(usuario: string): string {
  return `${usuario}@cuentas.vivero.invalid`;
}

export function esCorreoInterno(correo: string): boolean {
  return correo.endsWith("@cuentas.vivero.invalid");
}

type ContextoAuth = { path?: string; headers?: Headers } | null | undefined;

/** El hash del código de invitación que trae este intento de crear cuenta (o null si no trae). */
async function invitacionDelIntento(ctx: ContextoAuth): Promise<string | null> {
  if (!ctx?.path) return null;
  // Registro con usuario y contraseña: solo lo llama la acción del servidor (route.ts no deja
  // llegar a /sign-up/email desde fuera), que manda el hash en este encabezado.
  if (ctx.path === "/sign-up/email") {
    return ctx.headers?.get(ENCABEZADO_INVITACION) ?? null;
  }
  // Vuelta de Google: el hash se guardó junto con el «state» del viaje (en la base, no en el navegador).
  if (ctx.path.startsWith("/callback/")) {
    const estado = await getOAuthState();
    const invitacion = estado?.invitacion;
    return typeof invitacion === "string" ? invitacion : null;
  }
  return null;
}

// Hash reservado en «create.before», para anotar en «create.after» quién lo usó.
const reservas = new WeakMap<object, string>();

const SEGUNDOS_DIA = DIA_MS / 1000;

export const auth = betterAuth({
  appName: "Vivero El Encanto",
  baseURL: process.env.SITIO_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  telemetry: { enabled: false },
  database: prismaAdapter(prisma, { provider: "mysql" }),

  // Si algo falla en la vuelta de Google y no hay a dónde regresar, se vuelve a «Entrar».
  onAPIError: { errorURL: RUTA_INGRESO },

  user: {
    modelName: "usuario",
    fields: {
      name: "nombre",
      email: "correo",
      emailVerified: "correoVerificado",
      image: "imagen",
      createdAt: "creadoEn",
      updatedAt: "actualizadoEn",
    },
    // Filtro final (si falla, rechaza). Solo se aceptan cuentas con usuario y contraseña o con Google,
    // y de Google solo con el correo ya verificado por Google.
    validateUserInfo: ({ user, source }) => {
      if (source.method === "email-password") return;
      if (source.method === "oauth" && source.oauth?.providerId === "google") {
        if (user.emailVerified !== true) return { error: "correo_sin_verificar" };
        return;
      }
      return { error: "metodo_no_permitido" };
    },
  },
  session: {
    modelName: "sesion",
    fields: {
      userId: "usuarioId",
      expiresAt: "expiraEn",
      ipAddress: "ip",
      userAgent: "navegador",
      createdAt: "creadaEn",
      updatedAt: "actualizadaEn",
    },
    expiresIn: DIAS_SESION * SEGUNDOS_DIA,
    // Mientras se use, la sesión se renueva (como mucho una vez al día).
    updateAge: SEGUNDOS_DIA,
  },
  account: {
    modelName: "cuentaAcceso",
    fields: {
      accountId: "idEnProveedor",
      providerId: "proveedor",
      userId: "usuarioId",
      accessToken: "tokenAcceso",
      refreshToken: "tokenRenovacion",
      idToken: "tokenId",
      accessTokenExpiresAt: "accesoExpiraEn",
      refreshTokenExpiresAt: "renovacionExpiraEn",
      scope: "permisos",
      password: "contrasena",
      createdAt: "creadaEn",
      updatedAt: "actualizadaEn",
    },
    // Los tokens de Google se guardan cifrados con BETTER_AUTH_SECRET.
    encryptOAuthTokens: true,
    accountLinking: {
      enabled: true,
      // Nunca se une Google a una cuenta solo porque el correo coincida.
      disableImplicitLinking: true,
      // Al vincular desde «Mi cuenta», el correo de Google no tiene que ser el de la cuenta
      // (las de usuario y contraseña usan uno interno). Solo se puede con la sesión iniciada.
      allowDifferentEmails: true,
      updateUserInfoOnLink: false,
    },
  },
  verification: {
    modelName: "verificacion",
    fields: {
      identifier: "identificador",
      value: "valor",
      expiresAt: "expiraEn",
      createdAt: "creadaEn",
      updatedAt: "actualizadaEn",
    },
  },

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    autoSignIn: true,
    // argon2id con los parámetros de OWASP (contrasena.ts), en vez del scrypt de fábrica.
    password: {
      hash: hashearContrasena,
      verify: ({ hash, password }) => verificarContrasena(hash, password),
    },
  },

  socialProviders: googleConfigurado
    ? {
        google: {
          clientId: process.env.GOOGLE_CLIENT_ID!,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
          // Siempre deja elegir la cuenta de Google (útil si hay varias en el mismo navegador).
          prompt: "select_account",
          // Entrar con un Google que no está vinculado NO crea cuenta; solo el registro con código.
          disableImplicitSignUp: true,
        },
      }
    : {},

  advanced: {
    cookiePrefix: PREFIJO_COOKIES,
    ipAddress: { ipAddressHeaders: ["x-forwarded-for", "x-real-ip"] },
  },

  databaseHooks: {
    user: {
      create: {
        // Corre después de que el plugin de usuario revisa que el nombre esté libre, así que un
        // código no se gasta por elegir un usuario ocupado.
        before: async (_usuario, ctx) => {
          const hash = await invitacionDelIntento(ctx);
          if (!hash || !(await reservarInvitacion(hash))) {
            throw new APIError("FORBIDDEN", {
              code: "invitacion_invalida",
              message: "El código de invitación no es válido, ya se usó o ya venció.",
            });
          }
          if (ctx) reservas.set(ctx, hash);
        },
        after: async (usuario, ctx) => {
          const hash = ctx ? reservas.get(ctx) : undefined;
          if (hash) await asignarInvitacion(hash, usuario.id);
        },
      },
    },
  },

  plugins: [
    username({
      minUsernameLength: 3,
      maxUsernameLength: 30,
      // Las mismas reglas que el formulario (validacion/cuenta.ts).
      usernameValidator: (valor) => /^[a-z0-9._-]+$/.test(valor),
      displayUsername: false,
      schema: { user: { fields: { username: "usuario" } } },
    }),
    // Debe ir al final: copia las cookies de better-auth a la respuesta de las acciones del servidor.
    nextCookies(),
  ],
});
