import { expect, test as preparar } from "@playwright/test";
import { ADMIN, ARCHIVO_SESION_ADMIN, CODIGO_INICIAL_PRUEBA } from "./datos";
import { registrarCuenta } from "./utilidades";

preparar("crea la primera cuenta con el código inicial del .env", async ({ page }) => {
  await registrarCuenta(page, { codigo: CODIGO_INICIAL_PRUEBA, ...ADMIN });

  await expect(page).toHaveURL("/panel");
  await expect(page.getByRole("heading", { level: 1, name: `Hola, ${ADMIN.usuario}` })).toBeVisible();
  await page.context().storageState({ path: ARCHIVO_SESION_ADMIN });
});
