// Prepara la base de datos de PRUEBAS antes de arrancar el servidor:
// la borra, la vuelve a crear vacía y le aplica las migraciones y los datos iniciales.
import "dotenv/config";
import { execSync } from "node:child_process";
import * as mariadb from "mariadb";

async function main() {
  const url = process.env.DATABASE_URL_PRUEBA;
  if (!url) {
    throw new Error("Falta DATABASE_URL_PRUEBA en el archivo .env (ver .env.example).");
  }

  const direccion = new URL(url);
  const nombreBase = direccion.pathname.replace(/^\//, "");

  // Candado: solo se borra una base cuyo nombre termine en «_prueba», para nunca tocar datos reales.
  if (!/^[a-z0-9_]+_prueba$/.test(nombreBase)) {
    throw new Error(
      `Por seguridad, la base de pruebas debe llamarse algo como «vivero_encanto_prueba» (se recibió «${nombreBase}»).`,
    );
  }

  const conexion = await mariadb.createConnection({
    host: direccion.hostname,
    port: Number(direccion.port || 3306),
    user: decodeURIComponent(direccion.username),
    password: decodeURIComponent(direccion.password),
  });
  try {
    await conexion.query(`DROP DATABASE IF EXISTS \`${nombreBase}\``);
    await conexion.query(
      `CREATE DATABASE \`${nombreBase}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
    );
  } finally {
    await conexion.end();
  }

  const entorno = { ...process.env, DATABASE_URL: url };
  execSync("npx prisma migrate deploy", { stdio: "inherit", env: entorno });
  execSync("npx prisma db seed", { stdio: "inherit", env: entorno });
  console.log(`Base de pruebas «${nombreBase}» lista.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
