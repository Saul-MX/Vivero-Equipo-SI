import { expect, test, type Page } from "@playwright/test";
import { fotoDePrueba, IMAGEN_FALSA } from "./archivos-prueba";
import { consultar, crearPlanta } from "./base-de-datos";

const fila = (page: Page, nombre: string) =>
  page.getByRole("row").filter({ has: page.getByRole("link", { name: nombre, exact: true }) });

async function fertilizanteEnBase(nombre: string) {
  const [fertilizante] = await consultar<{ id: number; tipo: string; foto: string | null; visible: number }>(
    "SELECT id, tipo, foto, visible FROM fertilizantes WHERE nombre = ? ORDER BY id DESC LIMIT 1",
    [nombre],
  );
  return fertilizante;
}

async function catalogosDe(fertilizanteId: number) {
  const filas = await consultar<{ nombre: string }>(
    `SELECT c.nombre FROM fertilizante_catalogos fc JOIN catalogos c ON c.id = fc.catalogoId
     WHERE fc.fertilizanteId = ? ORDER BY c.nombre`,
    [fertilizanteId],
  );
  return filas.map((fila) => fila.nombre);
}

test.describe("Fertilizantes", () => {
  test("sin fertilizantes se ve el aviso y el botón para agregar", async ({ page }) => {
    await page.goto("/panel/fertilizantes");
    await expect(page.getByText("Todavía no hay fertilizantes.")).toBeVisible();
    await page.getByRole("link", { name: "Agregar fertilizante" }).first().click();
    await expect(page.getByRole("heading", { level: 1, name: "Nuevo fertilizante" })).toBeVisible();
  });

  test("agregar un fertilizante con foto y catálogos recomendados", async ({ page }) => {
    await page.goto("/panel/fertilizantes/nuevo");

    // Sin llenar nada no se guarda, y se explica qué falta.
    await page.getByRole("button", { name: "Guardar", exact: true }).first().click();
    for (const mensaje of [
      "Escribe el nombre.",
      "Elige el tipo.",
      "Escribe para qué sirve.",
      "Escribe la presentación.",
      "Escribe la dosis.",
      "Escribe cada cuánto se aplica.",
      "Escribe cómo se aplica (un paso por renglón).",
    ]) {
      await expect(page.getByText(mensaje)).toBeVisible();
    }

    await page.getByRole("textbox", { name: "Nombre", exact: true }).fill("Triple 17");
    await page.getByRole("combobox", { name: "Tipo" }).selectOption({ label: "Granulado" });
    await page.getByLabel("Para qué sirve").fill("Nutrición completa para floración y follaje.");
    for (const catalogo of ["Nochebuena", "Todo el año"]) {
      await page.getByRole("checkbox", { name: catalogo, exact: true }).check();
    }
    await page.getByLabel("Presentación").fill("Bolsa de 1 kg");
    await page.getByLabel("Dosis").fill("1 cucharada por maceta");
    await page.getByLabel("Cada cuánto").fill("cada 15 días");
    await page.getByLabel("Cómo se aplica").fill("Esparce alrededor del tallo.\nRiega después.");

    // Un archivo que no es foto se rechaza; una foto buena se acepta.
    const subidor = page.getByLabel("Foto del producto (opcional)");
    await subidor.setInputFiles(IMAGEN_FALSA);
    await expect(page.getByText("Ese archivo no es una foto JPG, PNG o WebP.")).toBeVisible();
    await subidor.setInputFiles(await fotoDePrueba({ color: "#3e5a3f", nombre: "bolsa.jpg" }));
    await expect(page.getByRole("img", { name: "Vista previa de la foto" })).toBeVisible();

    await page.getByRole("button", { name: "Guardar", exact: true }).first().click();
    await expect(page.getByText("Listo, se guardó.")).toBeVisible();
    await expect(page).toHaveURL("/panel/fertilizantes");
    await expect(fila(page, "Triple 17")).toContainText("Granulado");
    await expect(fila(page, "Triple 17")).toContainText("Bolsa de 1 kg");
    await expect(fila(page, "Triple 17")).toContainText("Nochebuena");

    const fertilizante = await fertilizanteEnBase("Triple 17");
    expect(fertilizante).toMatchObject({ tipo: "GRANULADO", visible: 1 });
    expect(fertilizante.foto).toMatch(/^fertilizantes\//);
    expect(await catalogosDe(fertilizante.id)).toEqual(["Nochebuena", "Todo el año"]);
  });

  test("editar: los datos se cargan y los cambios se guardan", async ({ page }) => {
    await page.goto("/panel/fertilizantes");
    await page.getByRole("link", { name: "Triple 17", exact: true }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Triple 17" })).toBeVisible();
    await expect(page.getByRole("combobox", { name: "Tipo" })).toHaveValue("GRANULADO");
    await expect(page.getByRole("checkbox", { name: "Nochebuena", exact: true })).toBeChecked();
    await expect(page.getByLabel("Cómo se aplica")).toHaveValue("Esparce alrededor del tallo.\nRiega después.");

    await page.getByRole("textbox", { name: "Nombre", exact: true }).fill("Triple 17 floración");
    await page.getByRole("checkbox", { name: "Todo el año", exact: true }).uncheck();
    await page.getByLabel("Precauciones (opcional)").fill("Usa guantes.");
    await page.getByRole("button", { name: "Guardar y seguir editando" }).click();
    await expect(page.getByText("Listo, se guardó.")).toBeVisible();

    await page.reload();
    await expect(page.getByRole("heading", { level: 1, name: "Triple 17 floración" })).toBeVisible();
    await expect(page.getByLabel("Precauciones (opcional)")).toHaveValue("Usa guantes.");
    const fertilizante = await fertilizanteEnBase("Triple 17 floración");
    expect(await catalogosDe(fertilizante.id)).toEqual(["Nochebuena"]);
  });

  test("ocultar un fertilizante no lo borra", async ({ page }) => {
    await page.goto("/panel/fertilizantes");
    const visible = page.getByRole("switch", { name: "Mostrar Triple 17 floración en el sitio" });
    await expect(visible).toBeChecked();
    await visible.click();
    await expect(page.getByText("«Triple 17 floración» quedó oculto; no se borró.")).toBeVisible();
    await page.reload();
    await expect(visible).not.toBeChecked();
    expect((await fertilizanteEnBase("Triple 17 floración")).visible).toBe(0);

    await visible.click();
    await expect(page.getByText("«Triple 17 floración» ya se ve en el sitio.")).toBeVisible();
  });

  test("se elige en el riego de una planta y aparece en la vista previa", async ({ page }) => {
    const plantaId = await crearPlanta("Planta con fertilizante", {});
    await page.goto(`/panel/plantas/${plantaId}`);
    const selector = page.getByLabel("Fertilizante recomendado");
    await selector.selectOption({ label: "Triple 17 floración" });
    await expect(page.getByTestId("vista-previa-riego")).toContainText("Fertilizante recomendado: Triple 17 floración");
    await page.getByRole("button", { name: "Guardar y seguir editando" }).click();
    await expect(page.getByText("Listo, se guardó.")).toBeVisible();

    const fertilizante = await fertilizanteEnBase("Triple 17 floración");
    const [planta] = await consultar<{ fertilizanteId: number | null }>(
      "SELECT fertilizanteId FROM plantas WHERE id = ?",
      [plantaId],
    );
    expect(planta.fertilizanteId).toBe(fertilizante.id);
  });

  test("eliminar uno en uso avisa, deja la planta sin fertilizante y borra la foto", async ({ page }) => {
    const fertilizante = await fertilizanteEnBase("Triple 17 floración");
    await page.goto(`/panel/fertilizantes/${fertilizante.id}`);
    const urlFoto = (await page.getByRole("img", { name: "Vista previa de la foto" }).getAttribute("src")) ?? "";
    expect((await page.request.get(urlFoto)).status()).toBe(200);

    await page.getByRole("button", { name: "Eliminar fertilizante" }).click();
    const dialogo = page.getByRole("alertdialog");
    await expect(dialogo).toContainText("¿Eliminar «Triple 17 floración»?");
    await expect(dialogo).toContainText("Lo recomienda 1 planta");
    await expect(dialogo).toContainText("apaga «Visible en el sitio»");
    await dialogo.getByRole("button", { name: "Eliminar" }).click();

    await expect(page.getByText("Se eliminó «Triple 17 floración».")).toBeVisible();
    await expect(page).toHaveURL("/panel/fertilizantes");
    await expect(page.getByText("Todavía no hay fertilizantes.")).toBeVisible();

    const [planta] = await consultar<{ fertilizanteId: number | null }>(
      "SELECT fertilizanteId FROM plantas WHERE nombre = ?",
      ["Planta con fertilizante"],
    );
    expect(planta.fertilizanteId).toBeNull();
    expect(await consultar("SELECT * FROM fertilizante_catalogos WHERE fertilizanteId = ?", [fertilizante.id])).toEqual([]);
    expect((await page.request.get(urlFoto)).status()).toBe(404);
  });
});
