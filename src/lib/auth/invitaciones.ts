import "server-only";
import { prisma } from "@/lib/db";
import { esHashDelCodigoInicial, generarCodigo, hashCodigo, normalizarCodigo } from "./codigos";
import { DIA_MS, DIAS_INVITACION } from "./constantes";

// Las cuentas nuevas solo se crean con un código de invitación, sea con usuario y contraseña o con
// Google. better-auth crea la cuenta; antes de hacerlo llama a reservarInvitacion() (ver auth.ts),
// y si el código no sirve, la cuenta no se crea.
// - La PRIMERA cuenta usa el código inicial del .env (solo mientras no exista ninguna).
// - Las demás necesitan un código vigente y sin usar, que queda marcado como usado.
// Los códigos viajan como su hash SHA-256 (hashCodigo): el código en sí nunca se guarda.

export async function crearInvitacion(creadaPorId: string) {
  const codigo = generarCodigo();
  const expiraEn = new Date(Date.now() + DIAS_INVITACION * DIA_MS);
  await prisma.invitacion.create({
    data: {
      hashCodigo: hashCodigo(codigo),
      terminacion: normalizarCodigo(codigo).slice(-4),
      expiraEn,
      creadaPorId,
    },
  });
  return { codigo, expiraEn };
}

export function listarInvitacionesVigentes() {
  return prisma.invitacion.findMany({
    where: { usadaEn: null, expiraEn: { gt: new Date() } },
    orderBy: { creadaEn: "desc" },
    select: { id: true, terminacion: true, expiraEn: true },
  });
}

/** Solo se pueden cancelar códigos que nadie ha usado. */
export async function cancelarInvitacion(id: number): Promise<void> {
  await prisma.invitacion.deleteMany({ where: { id, usadaEn: null } });
}

async function esCodigoInicialVigente(hash: string): Promise<boolean> {
  if (!esHashDelCodigoInicial(hash, process.env.CODIGO_INVITACION_INICIAL)) return false;
  return (await prisma.usuario.count()) === 0;
}

/** ¿El código sirve en este momento? No lo gasta (se usa para avisar antes de ir a Google). */
export async function invitacionVigente(hash: string): Promise<boolean> {
  if (await esCodigoInicialVigente(hash)) return true;
  const invitacion = await prisma.invitacion.findUnique({
    where: { hashCodigo: hash },
    select: { usadaEn: true, expiraEn: true },
  });
  return !!invitacion && !invitacion.usadaEn && invitacion.expiraEn > new Date();
}

/**
 * Gasta el código justo antes de crear la cuenta. Es atómico: si dos personas usan el mismo
 * código al mismo tiempo, solo una lo consigue (la base marca la fila una sola vez).
 */
export async function reservarInvitacion(hash: string): Promise<boolean> {
  if (await esCodigoInicialVigente(hash)) return true;
  const ahora = new Date();
  const { count } = await prisma.invitacion.updateMany({
    where: { hashCodigo: hash, usadaEn: null, expiraEn: { gt: ahora } },
    data: { usadaEn: ahora },
  });
  return count === 1;
}

/** Ya creada la cuenta, anota quién usó el código. */
export async function asignarInvitacion(hash: string, usuarioId: string): Promise<void> {
  await prisma.invitacion.updateMany({
    where: { hashCodigo: hash, usadaEn: { not: null }, usadaPorId: null },
    data: { usadaPorId: usuarioId },
  });
}

/** Si la cuenta no se pudo crear después de reservar el código, lo devuelve para que siga sirviendo. */
export async function liberarInvitacion(hash: string): Promise<void> {
  await prisma.invitacion.updateMany({
    where: { hashCodigo: hash, usadaPorId: null },
    data: { usadaEn: null },
  });
}
