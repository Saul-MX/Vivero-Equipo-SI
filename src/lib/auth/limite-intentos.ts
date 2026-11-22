import "server-only";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { MINUTO_MS } from "./constantes";

// Protección contra fuerza bruta y spam: se cuentan los intentos por clave (por ejemplo
// «ingreso:usuario:saul» o «ingreso:ip:1.2.3.4»). La ventana empieza con el primer intento; al pasar
// del máximo, la clave queda bloqueada hasta que la ventana termine. Se guarda en la base de datos
// para que funcione aunque el servidor se reinicie.
//
// Primero se CUENTA el intento y después se decide si pasa (consumirIntento). Si se revisara primero y
// se anotara después, varias peticiones al mismo tiempo verían el contador sin sus fallos y pasarían
// todas. Cada paso es una sola instrucción atómica en la base, así que tampoco chocan entre sí.

export type ReglaIntentos = {
  clave: string;
  maximo: number;
  ventanaMs: number;
};

function esClaveRepetida(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

/** Suma 1 a la clave (o abre una ventana nueva si no había o ya venció) y devuelve cómo quedó. */
async function sumarIntento({ clave, ventanaMs }: ReglaIntentos) {
  for (let intento = 0; intento < 5; intento++) {
    const ahora = new Date();
    const { count: sumadas } = await prisma.limiteIntentos.updateMany({
      where: { clave, reiniciaEn: { gt: ahora } },
      data: { intentos: { increment: 1 } },
    });
    if (sumadas === 0) {
      const nueva = { intentos: 1, reiniciaEn: new Date(ahora.getTime() + ventanaMs) };
      // Si había una ventana vencida, se reinicia; solo una petición lo logra (la condición se
      // vuelve a revisar sobre la fila ya bloqueada).
      const { count: reiniciadas } = await prisma.limiteIntentos.updateMany({
        where: { clave, reiniciaEn: { lte: ahora } },
        data: nueva,
      });
      if (reiniciadas === 0) {
        try {
          await prisma.limiteIntentos.create({ data: { clave, ...nueva } });
        } catch (error) {
          // Otra petición la creó un instante antes: se vuelve a intentar sumando.
          if (esClaveRepetida(error)) continue;
          throw error;
        }
      }
    }
    const fila = await prisma.limiteIntentos.findUnique({ where: { clave } });
    if (fila) return fila;
  }
  throw new Error(`No se pudo contar el intento de «${clave}».`);
}

/**
 * Cuenta este intento en cada regla. Devuelve los minutos que faltan si alguna ya pasó de su máximo
 * (el intento NO debe seguir), o null si puede seguir.
 */
export async function consumirIntento(reglas: ReglaIntentos[]): Promise<number | null> {
  const ahora = Date.now();
  let restanteMs = 0;
  for (const regla of reglas) {
    const fila = await sumarIntento(regla);
    if (fila.intentos > regla.maximo) {
      restanteMs = Math.max(restanteMs, fila.reiniciaEn.getTime() - ahora);
    }
  }
  // Limpieza: las ventanas vencidas ya no sirven.
  await prisma.limiteIntentos.deleteMany({ where: { reiniciaEn: { lt: new Date(ahora) } } });
  return restanteMs > 0 ? Math.max(1, Math.ceil(restanteMs / MINUTO_MS)) : null;
}

/** Devuelve un intento que al final no contaba (por ejemplo, salió bien o el error no era del usuario). */
export async function devolverIntento(claves: string[]): Promise<void> {
  await prisma.limiteIntentos.updateMany({
    where: { clave: { in: claves }, intentos: { gt: 0 } },
    data: { intentos: { decrement: 1 } },
  });
}

/** Tras un acierto, se olvidan los intentos de esa clave. */
export async function limpiarIntentos(clave: string): Promise<void> {
  await prisma.limiteIntentos.deleteMany({ where: { clave } });
}
