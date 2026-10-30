import "server-only";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@/generated/prisma/client";

// Un solo cliente de base de datos para toda la app. En desarrollo se guarda en globalThis
// para que la recarga en caliente no abra conexiones nuevas en cada cambio.
const globalConPrisma = globalThis as unknown as { prisma?: PrismaClient };

function crearCliente() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("Falta la variable DATABASE_URL (revisa el archivo .env).");
  }
  return new PrismaClient({ adapter: new PrismaMariaDb(url) });
}

export const prisma = globalConPrisma.prisma ?? crearCliente();

if (process.env.NODE_ENV !== "production") {
  globalConPrisma.prisma = prisma;
}
