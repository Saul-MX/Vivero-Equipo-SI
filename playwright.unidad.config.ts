import { defineConfig } from "@playwright/test";

// Solo las pruebas unitarias (*.unidad.spec.ts): no arman el sitio ni abren el navegador,
// así que tardan segundos. Uso: npm run pruebas:unidad
export default defineConfig({
  testDir: "./e2e",
  testMatch: /\.unidad\.spec\.ts$/,
  reporter: [["list"]],
});
