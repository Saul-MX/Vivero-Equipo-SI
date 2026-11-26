// Borra los contadores de intentos (entrar, códigos de invitación, Google, contraseña y Contacto).
// Sirve para seguir probando sin esperar a que terminen los bloqueos temporales («Demasiados
// intentos», «Ya recibimos varios mensajes…»). No toca cuentas, sesiones ni contenido.
// Uso: npm run db:limpiar-intentos
import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient({
  adapter: new PrismaMariaDb(process.env.DATABASE_URL!),
});

async function main() {
  const { count } = await prisma.limiteIntentos.deleteMany({});
  console.log(`Listo: se borraron ${count} contadores de intentos. Ya puedes volver a intentar.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
