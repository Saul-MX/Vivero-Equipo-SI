import "server-only";
import { prisma } from "@/lib/db";

/**
 * Correo que viene dentro del «id token» de Google guardado al vincular. Solo se usa para mostrarlo
 * en «Mi cuenta»: better-auth ya revisó el token al recibirlo directamente de Google.
 */
function correoDelTokenId(tokenId: string | null): string | null {
  const cuerpo = tokenId?.split(".")[1];
  if (!cuerpo) return null;
  try {
    const datos: unknown = JSON.parse(Buffer.from(cuerpo, "base64url").toString("utf8"));
    if (typeof datos === "object" && datos !== null && "email" in datos && typeof datos.email === "string") {
      return datos.email;
    }
  } catch {
    // Token ilegible: simplemente no se muestra el correo.
  }
  return null;
}

/** Con qué puede entrar el usuario: contraseña, Google o ambas. */
export async function formasDeEntrar(usuarioId: string) {
  const cuentas = await prisma.cuentaAcceso.findMany({
    where: { usuarioId },
    select: { proveedor: true, tokenId: true },
  });
  const google = cuentas.find((cuenta) => cuenta.proveedor === "google");
  return {
    tieneContrasena: cuentas.some((cuenta) => cuenta.proveedor === "credential"),
    google: google ? { correo: correoDelTokenId(google.tokenId) } : null,
  };
}
