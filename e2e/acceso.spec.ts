import { expect, test } from "@playwright/test";
import { ADMIN, CODIGO_INICIAL_PRUEBA, COOKIE_SESION, SIN_SESION } from "./datos";
import { iniciarSesion, registrarCuenta } from "./utilidades";

test.use({ storageState: SIN_SESION });

test("las pantallas del panel piden iniciar sesión", async ({ page }) => {
  for (const ruta of ["/panel", "/panel/plantas", "/panel/mi-cuenta"]) {
    await page.goto(ruta);
    await expect(page).toHaveURL("/panel/ingresar");
  }
});

test("una cookie de sesión inventada no da acceso", async ({ page, context, baseURL }) => {
  await context.addCookies([{ name: COOKIE_SESION, value: "token-inventado.firma-inventada", url: baseURL! }]);
  await page.goto("/panel/mi-cuenta");
  await expect(page).toHaveURL("/panel/ingresar");
});

test("el código inicial deja de servir cuando ya existe una cuenta", async ({ page }) => {
  await registrarCuenta(page, {
    codigo: CODIGO_INICIAL_PRUEBA,
    usuario: "intrusa",
    contrasena: "contrasena-intrusa-1",
  });
  await expect(page.getByText("El código no es válido, ya se usó o ya venció.")).toBeVisible();
  await expect(page).toHaveURL("/panel/registro");
});

test("un código inventado no sirve", async ({ page }) => {
  await registrarCuenta(page, {
    codigo: "AAAA-BBBB-CCCC",
    usuario: "intrusa",
    contrasena: "contrasena-intrusa-1",
  });
  await expect(page.getByText("El código no es válido, ya se usó o ya venció.")).toBeVisible();
});

test("el registro avisa de datos incorrectos antes de enviar", async ({ page }) => {
  await page.goto("/panel/registro");
  await page.getByRole("button", { name: "Crear cuenta" }).click();
  await expect(page.getByText("Escribe tu código de invitación.")).toBeVisible();

  await page.getByLabel("Usuario", { exact: true }).fill("Saúl Pérez");
  await page.getByLabel("Contraseña", { exact: true }).fill("corta");
  await page.getByRole("button", { name: "Crear cuenta" }).click();
  await expect(page.getByText(/Usa solo letras minúsculas sin acentos/)).toBeVisible();
  await expect(page.getByText("La contraseña debe tener al menos 8 caracteres.")).toBeVisible();

  await page.getByLabel("Contraseña", { exact: true }).fill("contrasena-valida-1");
  await page.getByLabel("Repite la contraseña", { exact: true }).fill("contrasena-valida-2");
  await page.getByRole("button", { name: "Crear cuenta" }).click();
  await expect(page.getByText("Las contraseñas no coinciden.")).toBeVisible();
});

test("usuario o contraseña incorrectos muestran un aviso", async ({ page }) => {
  await iniciarSesion(page, ADMIN.usuario, "contrasena-equivocada");
  await expect(page.getByText("Usuario o contraseña incorrectos.")).toBeVisible();
  await expect(page).toHaveURL("/panel/ingresar");
});

test("después de 5 intentos fallidos se bloquea un rato", async ({ page }) => {
  for (let intento = 1; intento <= 5; intento++) {
    await iniciarSesion(page, "intruso", `intento-${intento}-fallido`);
    await expect(page.getByText("Usuario o contraseña incorrectos.")).toBeVisible();
  }
  await iniciarSesion(page, "intruso", "intento-6-fallido");
  await expect(page.getByText(/Demasiados intentos\. Espera 1[45] minutos/)).toBeVisible();
});

test("con la sesión iniciada, «Entrar» lleva directo al panel", async ({ page }) => {
  await iniciarSesion(page, ADMIN.usuario, ADMIN.contrasena);
  await expect(page).toHaveURL("/panel");
  await page.goto("/panel/ingresar");
  await expect(page).toHaveURL("/panel");
});

test("entrar y salir del panel", async ({ page }) => {
  await iniciarSesion(page, ADMIN.usuario, ADMIN.contrasena);
  await expect(page).toHaveURL("/panel");
  await expect(page.getByRole("heading", { level: 1, name: `Hola, ${ADMIN.usuario}` })).toBeVisible();

  await page.getByRole("button", { name: "Salir" }).click();
  await expect(page).toHaveURL("/panel/ingresar");

  // La sesión quedó cerrada: el panel vuelve a pedir datos.
  await page.goto("/panel");
  await expect(page).toHaveURL("/panel/ingresar");
});
