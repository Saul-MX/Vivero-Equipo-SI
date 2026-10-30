import "server-only";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { esCodigoInicial, generarCodigo, hashCodigo, normalizarCodigo } from "./codigos";
import { DIA_MS, DIAS_INVITACION } from "./constantes";

export async function crearInvitacion(creadaPorId: number) {
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

class FalloRegistro extends Error {
  constructor(readonly motivo: "codigoInvalido" | "usuarioOcupado") {
    super(motivo);
  }
}

type ResultadoRegistro =
  | { ok: true; usuarioId: number }
  | { ok: false; motivo: "codigoInvalido" | "usuarioOcupado" };

/**
 * Crea una cuenta con un código de invitación, todo en una sola transacción:
 * - La PRIMERA cuenta se crea con el código inicial del .env (solo mientras no exista ninguna).
 * - Las demás necesitan un código vigente y sin usar, que queda marcado como usado.
 */
export async function registrarUsuario(datos: {
  codigo: string;
  usuario: string;
  hashContrasena: string;
}): Promise<ResultadoRegistro> {
  try {
    return await prisma.$transaction(async (tx) => {
      const ahora = new Date();
      const hayCuentas = (await tx.usuario.count()) > 0;
      let invitacionId: number | null = null;

      if (hayCuentas || !esCodigoInicial(datos.codigo, process.env.CODIGO_INVITACION_INICIAL)) {
        const invitacion = await tx.invitacion.findUnique({
          where: { hashCodigo: hashCodigo(datos.codigo) },
        });
        if (!invitacion || invitacion.usadaEn || invitacion.expiraEn <= ahora) {
          throw new FalloRegistro("codigoInvalido");
        }
        invitacionId = invitacion.id;
      }

      const ocupado = await tx.usuario.findUnique({
        where: { usuario: datos.usuario },
        select: { id: true },
      });
      if (ocupado) throw new FalloRegistro("usuarioOcupado");

      const nuevo = await tx.usuario.create({
        data: { usuario: datos.usuario, hashContrasena: datos.hashContrasena },
      });

      if (invitacionId !== null) {
        // Se marca como usada solo si sigue sin usarse: si dos personas la usan al mismo
        // tiempo, una de las dos transacciones falla y no se crea su cuenta.
        const { count } = await tx.invitacion.updateMany({
          where: { id: invitacionId, usadaEn: null },
          data: { usadaEn: ahora, usadaPorId: nuevo.id },
        });
        if (count !== 1) throw new FalloRegistro("codigoInvalido");
      }

      return { ok: true as const, usuarioId: nuevo.id };
    });
  } catch (error) {
    if (error instanceof FalloRegistro) return { ok: false, motivo: error.motivo };
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { ok: false, motivo: "usuarioOcupado" };
    }
    throw error;
  }
}
