import { expect, test, type Page } from "@playwright/test";
import { consultar, ejecutar } from "./base-de-datos";

const leido = async (nombre: string) =>
  (await consultar<{ leido: number }>("SELECT leido FROM mensajes WHERE nombre = ?", [nombre]))[0]?.leido;

const enLista = (page: Page, nombre: string) => page.getByRole("link", { name: new RegExp(`^${nombre}`) });

test.describe("Mensajes", () => {
  test.beforeAll(async () => {
    // (Si una prueba falla, Playwright vuelve a preparar todo: primero se quita lo de la vez anterior.)
    await ejecutar("DELETE FROM mensajes WHERE nombre IN ('Lucía Prueba', 'Pedro Prueba')");
    await ejecutar(`INSERT INTO mensajes (nombre, contacto, texto, creadoEn) VALUES
      ('Lucía Prueba', '+52 222 765 4321', 'Quiero 20 nochebuenas para un evento.\nEs en diciembre.', NOW() - INTERVAL 2 HOUR),
      ('Pedro Prueba', 'pedro@example.com', '¿Hacen envíos a Cholula?', NOW() - INTERVAL 1 HOUR)`);
  });

  test("la bandeja muestra los más nuevos primero y separa los sin leer", async ({ page }) => {
    await page.goto("/panel/mensajes");
    await expect(page.getByRole("heading", { level: 1, name: "Mensajes" })).toBeVisible();
    const pedro = enLista(page, "Pedro Prueba");
    const lucia = enLista(page, "Lucía Prueba");
    await expect(pedro).toContainText("(sin leer)");
    await expect(pedro).toContainText("¿Hacen envíos a Cholula?");
    // Pedro escribió después: va primero.
    const textos = await page.getByRole("main").getByRole("listitem").allTextContents();
    expect(textos.findIndex((texto) => texto.includes("Pedro Prueba"))).toBeLessThan(
      textos.findIndex((texto) => texto.includes("Lucía Prueba")),
    );

    await page.getByRole("link", { name: /^Sin leer \(\d+\)$/ }).click();
    await expect(page).toHaveURL("/panel/mensajes?ver=sin-leer");
    await expect(lucia).toBeVisible();
  });

  test("abrir un mensaje lo marca como leído; responder por WhatsApp o llamada", async ({ page }) => {
    await page.goto("/panel/mensajes");
    await enLista(page, "Lucía Prueba").click();
    await expect(page.getByRole("heading", { level: 1, name: "Lucía Prueba" })).toBeVisible();
    // (La bandeja sigue en la página, oculta, para volver al instante: se busca solo lo visible.)
    await expect(page.getByText("Es en diciembre.", { exact: false }).filter({ visible: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Responder por WhatsApp" })).toHaveAttribute("href", "https://wa.me/522227654321");
    await expect(page.getByRole("link", { name: "Llamar" })).toHaveAttribute("href", "tel:522227654321");
    await expect.poll(() => leido("Lucía Prueba")).toBe(1);

    await page.getByRole("button", { name: "Marcar como no leído" }).click();
    await expect(page.getByText("Se marcó como no leído.")).toBeVisible();
    expect(await leido("Lucía Prueba")).toBe(0);
    await page.getByRole("button", { name: "Marcar como leído" }).click();
    await expect(page.getByText("Se marcó como leído.")).toBeVisible();
    expect(await leido("Lucía Prueba")).toBe(1);

    await page.getByRole("link", { name: "Volver a mensajes" }).click();
    await expect(enLista(page, "Lucía Prueba")).not.toContainText("(sin leer)");
  });

  test("un correo se responde por correo; eliminar pide confirmación", async ({ page }) => {
    await page.goto("/panel/mensajes");
    await enLista(page, "Pedro Prueba").click();
    await expect(page.getByRole("link", { name: "Responder por correo" })).toHaveAttribute("href", "mailto:pedro@example.com");

    await page.getByRole("button", { name: "Eliminar mensaje" }).click();
    const dialogo = page.getByRole("alertdialog");
    await expect(dialogo).toContainText("¿Eliminar el mensaje de Pedro Prueba?");
    await dialogo.getByRole("button", { name: "Eliminar" }).click();
    await expect(page.getByText("Se eliminó el mensaje de Pedro Prueba.")).toBeVisible();
    await expect(page).toHaveURL("/panel/mensajes");
    await expect(enLista(page, "Pedro Prueba")).toHaveCount(0);
    expect(await leido("Pedro Prueba")).toBeUndefined();
  });
});
