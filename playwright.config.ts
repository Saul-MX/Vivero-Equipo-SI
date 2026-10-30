import "dotenv/config";
import { defineConfig, devices } from "@playwright/test";
import { ARCHIVO_SESION_ADMIN, CODIGO_INICIAL_PRUEBA, PUERTO_PRUEBAS } from "./e2e/datos";

// Pruebas de punta a punta: se arma el sitio como en producción y se usa con un navegador real.
// Usan SU PROPIA base de datos (DATABASE_URL_PRUEBA), que se borra y se vuelve a crear en cada corrida.
export default defineConfig({
  testDir: "./e2e",
  // Las pruebas comparten la base de datos y dependen de la primera cuenta: van una por una.
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: `http://localhost:${PUERTO_PRUEBAS}`,
    locale: "es-MX",
    timezoneId: "America/Mexico_City",
    trace: "retain-on-failure",
  },
  projects: [
    // 1) Crea la primera cuenta con el código inicial y guarda su sesión.
    { name: "preparacion", testMatch: /.*\.setup\.ts/, use: { ...devices["Desktop Chrome"] } },
    // 2) El resto de las pruebas, ya con esa sesión.
    {
      name: "chromium",
      testIgnore: /.*\.setup\.ts/,
      dependencies: ["preparacion"],
      use: { ...devices["Desktop Chrome"], storageState: ARCHIVO_SESION_ADMIN },
    },
  ],
  webServer: {
    command: `npx tsx e2e/preparar-base.ts && npm run build && npx next start -p ${PUERTO_PRUEBAS}`,
    url: `http://localhost:${PUERTO_PRUEBAS}/panel/ingresar`,
    timeout: 300_000,
    reuseExistingServer: false,
    env: {
      DATABASE_URL: process.env.DATABASE_URL_PRUEBA ?? "",
      CODIGO_INVITACION_INICIAL: CODIGO_INICIAL_PRUEBA,
    },
  },
});
