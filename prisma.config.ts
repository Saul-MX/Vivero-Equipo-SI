// Configuración de la herramienta de Prisma (migraciones y datos iniciales).
// Prisma no lee el archivo .env por sí solo; dotenv lo carga aquí.
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
