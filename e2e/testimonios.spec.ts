import { expect, test, type Page } from "@playwright/test";
import { fotoDePrueba, IMAGEN_FALSA } from "./archivos-prueba";
import { consultar } from "./base-de-datos";

type Fila = { nombre: string; texto: string; avatar: string | null; visible: number };
const testimoniosEnBase = () =>
  consultar<Fila>("SELECT nombre, texto, avatar, visible FROM testimonios ORDER BY orden, id");

const elemento = (page: Page, nombre: string) =>
  page.getByRole("listitem").filter({ has: page.getByRole("heading", { name: nombre, exact: true }) });

test.describe("Testimonios", () => {
  test("agregar con y sin foto: la foto es opcional y hay avatar por defecto", async ({ page }) => {
    await page.goto("/panel/testimonios");
    await expect(page.getByText("Todavía no hay testimonios.")).toBeVisible();

    await page.getByRole("button", { name: "Agregar testimonio" }).click();
    let formulario = page.getByRole("form", { name: "Nuevo testimonio" });
    await formulario.getByRole("button", { name: "Agregar", exact: true }).click();
    await expect(formulario.getByText("Escribe el nombre del cliente.")).toBeVisible();
    await expect(formulario.getByText("Escribe lo que dijo el cliente.")).toBeVisible();

    // Sin foto: avatar por defecto con la inicial.
    await formulario.getByLabel("Nombre del cliente").fill("María G.");
    await formulario.getByLabel("Testimonio").fill("Mis nochebuenas duraron hasta febrero.");
    await formulario.getByRole("button", { name: "Agregar", exact: true }).click();
    await expect(page.getByText("Se agregó el testimonio.")).toBeVisible();
    await expect(elemento(page, "María G.").locator('[data-avatar="por-defecto"]')).toHaveText("M");

    // Con foto (y un archivo falso que se rechaza antes).
    await page.getByRole("button", { name: "Agregar testimonio" }).click();
    formulario = page.getByRole("form", { name: "Nuevo testimonio" });
    const subidor = formulario.getByLabel("Foto del cliente (opcional)");
    await subidor.setInputFiles(IMAGEN_FALSA);
    await expect(formulario.getByText("Ese archivo no es una foto JPG, PNG o WebP.")).toBeVisible();
    await subidor.setInputFiles(await fotoDePrueba({ color: "#6b7f67", ancho: 800, alto: 800 }));
    await expect(formulario.getByRole("img", { name: "Vista previa de la foto" })).toBeVisible();
    await formulario.getByLabel("Nombre del cliente").fill("Jardines Ruiz");
    await formulario.getByLabel("Testimonio").fill("Siempre encontramos <em>buena</em> planta para nuestros clientes.");
    await formulario.getByRole("button", { name: "Agregar", exact: true }).click();
    await expect(formulario).toHaveCount(0);
    await expect(elemento(page, "Jardines Ruiz").locator("img")).toBeAttached(); // decorativa (alt="")
    await expect(elemento(page, "Jardines Ruiz").locator('[data-avatar="por-defecto"]')).toHaveCount(0);

    const filas = await testimoniosEnBase();
    expect(filas.map((fila) => fila.nombre)).toEqual(["María G.", "Jardines Ruiz"]);
    expect(filas[0].avatar).toBeNull();
    expect(filas[1].avatar).toMatch(/^testimonios\//);
    expect(filas[1].texto).toBe("Siempre encontramos buena planta para nuestros clientes.");
  });

  test("editar, quitar la foto (se borra del servidor), ocultar y reordenar", async ({ page }) => {
    await page.goto("/panel/testimonios");
    const [, conFoto] = await testimoniosEnBase();
    const urlFoto = `/archivos/${conFoto.avatar}-t.webp`;
    expect((await page.request.get(urlFoto)).status()).toBe(200);

    await page.getByRole("button", { name: "Editar el testimonio de Jardines Ruiz" }).click();
    const formulario = page.getByRole("form", { name: "Editar testimonio" });
    await formulario.getByRole("button", { name: "Quitar foto" }).click();
    await formulario.getByLabel("Nombre del cliente").fill("Jardines Ruiz (Puebla)");
    await formulario.getByRole("button", { name: "Guardar", exact: true }).click();
    await expect(page.getByText("Listo, se guardó.")).toBeVisible();
    await expect(elemento(page, "Jardines Ruiz (Puebla)").locator('[data-avatar="por-defecto"]')).toHaveText("J");
    expect((await page.request.get(urlFoto)).status()).toBe(404);

    const visible = page.getByRole("switch", { name: "Mostrar el testimonio de María G. en el sitio" });
    await visible.click();
    await expect(page.getByText("El testimonio de María G. quedó oculto; no se borró.")).toBeVisible();
    await page.getByRole("button", { name: "Subir el testimonio de Jardines Ruiz (Puebla)" }).click();
    await expect
      .poll(async () => (await testimoniosEnBase()).map((fila) => `${fila.nombre}:${fila.visible}`))
      .toEqual(["Jardines Ruiz (Puebla):1", "María G.:0"]);

    await page.reload();
    await expect(visible).not.toBeChecked();
    await expect(page.getByRole("heading", { level: 3 })).toHaveText(["Jardines Ruiz (Puebla)", "María G."]);
  });

  test("eliminar pide confirmación", async ({ page }) => {
    await page.goto("/panel/testimonios");
    await page.getByRole("button", { name: "Eliminar el testimonio de María G." }).click();
    const dialogo = page.getByRole("alertdialog");
    await expect(dialogo).toContainText("¿Eliminar el testimonio de María G.?");
    await dialogo.getByRole("button", { name: "Eliminar" }).click();
    await expect(page.getByText("Se eliminó el testimonio de María G.")).toBeVisible();
    expect((await testimoniosEnBase()).map((fila) => fila.nombre)).toEqual(["Jardines Ruiz (Puebla)"]);
  });
});
