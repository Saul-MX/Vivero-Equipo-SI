import "server-only";
import { prisma } from "@/lib/db";
import { MINUTO_MS } from "./constantes";

// Protección contra fuerza bruta: se cuentan los intentos fallidos por clave
// (por ejemplo «ingreso:usuario:saul» o «ingreso:ip:1.2.3.4»). La ventana empieza con
// el primer fallo; al llegar al máximo, la clave queda bloqueada hasta que la ventana termine.
// Se guarda en la base de datos para que funcione aunque el servidor se reinicie.

export type ReglaIntentos = {
  clave: string;
  maximo: number;
  ventanaMs: number;
};

/** Minutos que faltan para poder intentar de nuevo, o null si no hay bloqueo. */
export async function minutosDeBloqueo(reglas: ReglaIntentos[]): Promise<number | null> {
  const ahora = Date.now();
  const filas = await prisma.limiteIntentos.findMany({
    where: { clave: { in: reglas.map((regla) => regla.clave) } },
  });

  let restanteMs = 0;
  for (const fila of filas) {
    const regla = reglas.find((r) => r.clave === fila.clave);
    const vigente = fila.reiniciaEn.getTime() > ahora;
    if (regla && vigente && fila.intentos >= regla.maximo) {
      restanteMs = Math.max(restanteMs, fila.reiniciaEn.getTime() - ahora);
    }
  }
  return restanteMs > 0 ? Math.ceil(restanteMs / MINUTO_MS) : null;
}

/** Suma un intento fallido a cada regla. */
export async function registrarFallo(reglas: ReglaIntentos[]): Promise<void> {
  const ahora = new Date();
  for (const { clave, ventanaMs } of reglas) {
    const fila = await prisma.limiteIntentos.findUnique({ where: { clave } });
    if (fila && fila.reiniciaEn > ahora) {
      await prisma.limiteIntentos.update({ where: { clave }, data: { intentos: { increment: 1 } } });
    } else {
      const nueva = { intentos: 1, reiniciaEn: new Date(ahora.getTime() + ventanaMs) };
      await prisma.limiteIntentos.upsert({ where: { clave }, create: { clave, ...nueva }, update: nueva });
    }
  }
  // Limpieza: las ventanas vencidas ya no sirven.
  await prisma.limiteIntentos.deleteMany({ where: { reiniciaEn: { lt: ahora } } });
}

/** Tras un acierto, se olvidan los fallos de esa clave. */
export async function limpiarIntentos(clave: string): Promise<void> {
  await prisma.limiteIntentos.deleteMany({ where: { clave } });
}
