import { expect, test } from "@playwright/test";
import { fotoDePrueba } from "./archivos-prueba";
import { consultar } from "./base-de-datos";

test.describe("Novedades", () => {
  test("publicar una novedad con imagen: sale en Inicio del sitio", async ({ page }) => {
    await page.goto("/panel/novedades");
    await expect(page.getByText("Todavía no hay novedades.")).toBeVisible();

    // Desde el acceso rápido del Inicio.
    await page.goto("/panel");
    await page.getByRole("link", { name: /^Publicar novedad/ }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Nueva novedad" })).toBeVisible();
    await page.getByRole("button", { name: "Publicar" }).first().click();
    await expect(page.getByText("Escribe el título.")).toBeVisible();
    await expect(page.getByText("Escribe el texto de la novedad.")).toBeVisible();

    await page.getByRole("textbox", { name: "Título", exact: true }).fill("Ya llegaron las nochebuenas");
    await page.getByLabel("Texto", { exact: true }).fill("Rojas, blancas y jaspeadas.\n\nVen por la tuya.");
    await expect(async () => {
      await page.getByLabel("Imagen (opcional)").setInputFiles(await fotoDePrueba({ color: "#b3261e" }));
      await expect(page.getByRole("img", { name: "Vista previa de la foto" })).toBeVisible({ timeout: 5000 });
    }).toPass();
    await page.getByRole("button", { name: "Publicar" }).first().click();
    await expect(page.getByText("Se publicó la novedad.")).toBeVisible();
    await expect(page).toHaveURL("/panel/novedades");
    await expect(page.getByRole("link", { name: "Ya llegaron las nochebuenas", exact: true })).toBeVisible();

    const [novedad] = await consultar<{ imagen: string; visible: number }>(
      "SELECT imagen, visible FROM novedades WHERE titulo = 'Ya llegaron las nochebuenas'",
    );
    expect(novedad).toMatchObject({ visible: 1 });
    expect(novedad.imagen).toMatch(/^novedades\//);

    await page.goto("/");
    const seccion = page.getByRole("region", { name: "Novedades" });
    await expect(seccion.getByRole("heading", { name: "Ya llegaron las nochebuenas" })).toBeVisible();
    await expect(seccion).toContainText("Ven por la tuya.");
  });

  test("editar y ocultar: ocultar no es borrar", async ({ page }) => {
    await page.goto("/panel/novedades");
    await page.getByRole("link", { name: "Ya llegaron las nochebuenas", exact: true }).click();
    await page.getByRole("textbox", { name: "Título", exact: true }).fill("Ya llegaron las nochebuenas rojas");
    await page.getByRole("button", { name: "Guardar", exact: true }).first().click();
    await expect(page.getByText("Listo, se guardó.")).toBeVisible();
    await expect(page).toHaveURL("/panel/novedades");

    await page.getByRole("switch", { name: "Mostrar «Ya llegaron las nochebuenas rojas» en el sitio" }).click();
    await expect(page.getByText("«Ya llegaron las nochebuenas rojas» quedó oculta; no se borró.")).toBeVisible();
    expect(await consultar("SELECT visible FROM novedades WHERE titulo = 'Ya llegaron las nochebuenas rojas'")).toEqual([
      { visible: 0 },
    ]);
    await page.goto("/");
    await expect(page.getByRole("region", { name: "Novedades" })).toHaveCount(0);

    await page.goto("/panel/novedades");
    await page.getByRole("switch", { name: "Mostrar «Ya llegaron las nochebuenas rojas» en el sitio" }).click();
    await expect(page.getByText("«Ya llegaron las nochebuenas rojas» ya se ve en el sitio.")).toBeVisible();
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Ya llegaron las nochebuenas rojas" })).toBeVisible();
  });
});
