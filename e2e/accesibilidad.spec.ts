import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { SIN_SESION } from "./datos";

// Revisión automática de accesibilidad (WCAG 2.1 nivel AA): contraste, etiquetas, encabezados, etc.
async function revisar(page: Page) {
  const resultado = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  expect(resultado.violations).toEqual([]);
}

test.describe("sin sesión", () => {
  test.use({ storageState: SIN_SESION });

  for (const ruta of [
    "/",
    "/catalogos",
    "/plantas",
    "/temporada",
    "/fertilizantes",
    "/nosotros",
    "/contacto",
    "/panel/ingresar",
    "/panel/registro",
  ]) {
    test(`${ruta} cumple WCAG 2.1 AA`, async ({ page }) => {
      await page.goto(ruta);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await revisar(page);
    });
  }

  test("los mensajes de error también cumplen", async ({ page }) => {
    await page.goto("/panel/registro");
    await page.getByRole("button", { name: "Crear cuenta" }).click();
    await expect(page.getByText("Escribe tu código de invitación.")).toBeVisible();
    await revisar(page);
  });
});

test.describe("con sesión", () => {
  for (const ruta of [
    "/panel",
    "/panel/plantas",
    "/panel/mi-cuenta",
    "/panel/datos-y-redes",
    "/panel/catalogos",
    "/panel/catalogos/nuevo",
    "/panel/temporadas",
    "/panel/plantas/nueva",
    "/panel/fertilizantes",
    "/panel/fertilizantes/nuevo",
    "/panel/preguntas",
    "/panel/testimonios",
    "/panel/nosotros",
    "/panel/carrusel",
    "/panel/carrusel?pestana=archivos",
    "/panel/carrusel/nuevo",
  ]) {
    test(`${ruta} cumple WCAG 2.1 AA`, async ({ page }) => {
      await page.goto(ruta);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await revisar(page);
    });
  }

  test("los errores y el diálogo de eliminar de «Datos y redes» cumplen", async ({ page }) => {
    await page.goto("/panel/datos-y-redes");
    await page.getByLabel("WhatsApp", { exact: true }).fill("123");
    await page.getByRole("button", { name: "Guardar datos" }).first().click();
    await expect(page.getByText(/Escribe el número a 10 dígitos/)).toBeVisible();
    await revisar(page);

    await page.getByRole("button", { name: /^Eliminar / }).first().click();
    await expect(page.getByRole("alertdialog")).toBeVisible();
    await revisar(page);
  });

  test("el menú abierto en celular cumple", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/panel");
    await page.getByRole("button", { name: "Abrir menú" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await revisar(page);
  });
});
