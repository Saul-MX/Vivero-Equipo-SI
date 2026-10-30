import { expect, test, type Page } from "@playwright/test";
import { fotoDePrueba, IMAGEN_FALSA, medidasDe, PDF_PRUEBA } from "./archivos-prueba";
import { crearPlanta } from "./base-de-datos";
import { nuevaVentanaSinSesion } from "./utilidades";

/** Nombres de los catálogos en el orden de la lista (se leen de sus interruptores). */
async function ordenCatalogos(page: Page) {
  const interruptores = page.getByRole("switch", { name: /^Mostrar .+ en el sitio$/ });
  await expect(interruptores.first()).toBeVisible();
  const etiquetas = await interruptores.evaluateAll((elementos) =>
    elementos.map((elemento) => elemento.getAttribute("aria-label") ?? ""),
  );
  return etiquetas.map((etiqueta) => etiqueta.replace(/^Mostrar /, "").replace(/ en el sitio$/, ""));
}

const filaDe = (page: Page, nombre: string) =>
  page.getByRole("listitem").filter({ has: page.getByRole("link", { name: nombre, exact: true }) });

test.describe("Catálogos", () => {
  let urlMiniatura = "";

  test("crear un catálogo con portada, textos, folleto y temporada", async ({ page }) => {
    await page.goto("/panel/catalogos");
    await page.getByRole("link", { name: "Nuevo catálogo" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Nuevo catálogo" })).toBeVisible();

    await page.getByLabel("Nombre", { exact: true }).fill("Suculentas");
    await page.getByLabel("Color", { exact: true }).fill("#7a9e3b");
    await page.getByLabel("Foto de portada").setInputFiles(await fotoDePrueba({ color: "#7a9e3b" }));
    await expect(page.getByRole("img", { name: "Vista previa de la foto" })).toBeVisible();
    await page.getByLabel("Texto de presentación").fill("Plantas que guardan agua y piden poco riego.");
    await page.getByLabel("Puntos destacados").fill("Poco riego\nIdeales para interiores");
    await page.getByLabel("Folleto PDF (opcional)").setInputFiles(PDF_PRUEBA);
    await expect(page.getByRole("link", { name: "Ver el folleto" })).toBeVisible();
    await page.getByRole("switch", { name: "Este catálogo tiene temporada" }).click();
    await page.getByLabel("Empieza").selectOption("5");
    await page.getByLabel("Termina").selectOption("7");

    await page.getByRole("button", { name: "Guardar", exact: true }).first().click();
    await expect(page.getByText("Listo, se guardó.")).toBeVisible();
    await expect(page).toHaveURL("/panel/catalogos");

    const fila = filaDe(page, "Suculentas");
    await expect(fila).toContainText("/suculentas");
    await expect(fila).toContainText("Mayo a julio");
    await expect(fila).toContainText("Sin plantas");
    expect((await ordenCatalogos(page)).at(-1)).toBe("Suculentas");

    // La portada se guardó en WebP y en dos tamaños: 640 px para listas y 1600 px para la página.
    urlMiniatura = (await fila.locator("img").getAttribute("src")) ?? "";
    expect(urlMiniatura).toMatch(/^\/archivos\/catalogos\/[0-9a-f-]{36}-t\.webp$/);
    const miniatura = await page.request.get(urlMiniatura);
    expect(miniatura.headers()["content-type"]).toBe("image/webp");
    expect(await medidasDe(await miniatura.body())).toEqual({ ancho: 640, alto: 427, formato: "webp" });
    const grande = await page.request.get(urlMiniatura.replace("-t.webp", "-g.webp"));
    expect(await medidasDe(await grande.body())).toEqual({ ancho: 1600, alto: 1067, formato: "webp" });
  });

  test("cambiar el nombre no cambia la dirección (slug) del catálogo", async ({ page }) => {
    await page.goto("/panel/catalogos");
    await page.getByRole("link", { name: "Suculentas", exact: true }).click();
    await expect(page.getByLabel("Texto de presentación")).toHaveValue(/guardan agua/);
    await expect(page.getByLabel("Empieza")).toHaveValue("5");

    await page.getByLabel("Nombre", { exact: true }).fill("Suculentas y cactus");
    await page.getByRole("button", { name: "Guardar y seguir editando" }).click();
    await expect(page.getByText("Listo, se guardó.")).toBeVisible();
    await expect(page).toHaveURL(/\/panel\/catalogos\/\d+$/);
    await page.reload();
    await expect(page.getByRole("heading", { level: 1, name: "Suculentas y cactus" })).toBeVisible();
    await expect(page.getByText("/catalogos/suculentas", { exact: true })).toBeVisible();
  });

  test("rechaza archivos que no son fotos y protege las subidas sin guardar", async ({ page, browser }) => {
    await page.goto("/panel/catalogos");
    await page.getByRole("link", { name: "Suculentas y cactus", exact: true }).click();

    // Un texto disfrazado de .jpg: el servidor lo revisa por dentro y lo rechaza.
    await page.getByLabel("Foto de portada").setInputFiles(IMAGEN_FALSA);
    await expect(page.getByText("Ese archivo no es una foto JPG, PNG o WebP.")).toBeVisible();

    // Una foto subida pero sin guardar queda en «temporal/»: solo la ve quien tiene sesión.
    await page.getByLabel("Foto de portada").setInputFiles(await fotoDePrueba({ color: "#1e3a2e" }));
    const vistaPrevia = page.getByRole("img", { name: "Vista previa de la foto" });
    await expect(vistaPrevia).toHaveAttribute("src", /\/archivos\/temporal\//);
    const urlTemporal = (await vistaPrevia.getAttribute("src")) ?? "";
    expect((await page.request.get(urlTemporal)).status()).toBe(200);
    const anonimo = await nuevaVentanaSinSesion(browser);
    expect((await anonimo.pagina.request.get(urlTemporal)).status()).toBe(404);
    expect((await anonimo.pagina.request.get("/archivos/catalogos/..%2F..%2F.env")).status()).toBe(404);
    await anonimo.contexto.close();
  });

  test("subir, bajar y ocultar sin borrar", async ({ page }) => {
    await page.goto("/panel/catalogos");
    await page.getByRole("button", { name: "Subir Suculentas y cactus" }).click();
    await expect.poll(() => ordenCatalogos(page)).toEqual([
      "Nochebuena", "Tulipán", "Jacintos", "Cempasúchil", "Todo el año", "Suculentas y cactus", "Árboles",
    ]);

    const interruptor = page.getByRole("switch", { name: "Mostrar Jacintos en el sitio" });
    await interruptor.click();
    await expect(page.getByText("«Jacintos» quedó oculto; no se borró.")).toBeVisible();
    await page.reload();
    await expect(interruptor).not.toBeChecked();
    await interruptor.click();
    await expect(page.getByText("«Jacintos» ya se ve en el sitio.")).toBeVisible();
  });

  test("eliminar: no deja borrar la temporada base ni catálogos con plantas", async ({ page }) => {
    await crearPlanta("Pino de prueba", { catalogo: "arboles" });
    await page.goto("/panel/catalogos");
    const dialogo = page.getByRole("alertdialog");

    await page.getByRole("button", { name: "Eliminar Todo el año" }).click();
    await expect(dialogo).toContainText("temporada base");
    await expect(dialogo.getByRole("button", { name: "Eliminar" })).toHaveCount(0);
    await dialogo.getByRole("button", { name: "Cerrar" }).click();

    await page.getByRole("button", { name: "Eliminar Árboles" }).click();
    await expect(dialogo).toContainText("No se puede eliminar: tiene 1 planta.");
    await expect(dialogo.getByRole("button", { name: "Eliminar" })).toHaveCount(0);
    await dialogo.getByRole("button", { name: "Cerrar" }).click();

    await page.getByRole("button", { name: "Eliminar Suculentas y cactus" }).click();
    await expect(dialogo).toContainText("Esta acción no se puede deshacer.");
    await dialogo.getByRole("button", { name: "Eliminar" }).click();
    await expect(page.getByText("Se eliminó el catálogo «Suculentas y cactus».")).toBeVisible();
    await expect(page.getByRole("link", { name: "Suculentas y cactus", exact: true })).toHaveCount(0);

    // También se borraron sus archivos.
    expect((await page.request.get(urlMiniatura)).status()).toBe(404);
  });
});
