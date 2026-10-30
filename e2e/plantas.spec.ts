import { expect, test, type Page } from "@playwright/test";
import { fotoDePrueba, IMAGEN_FALSA } from "./archivos-prueba";
import { consultar } from "./base-de-datos";

const fila = (page: Page, nombre: string) =>
  page.getByRole("row").filter({ has: page.getByRole("link", { name: nombre, exact: true }) });

async function plantaEnBase(nombre: string) {
  const [planta] = await consultar<{ id: number; slug: string; disponible: number; visible: number }>(
    "SELECT id, slug, disponible, visible FROM plantas WHERE nombre = ? ORDER BY id DESC LIMIT 1",
    [nombre],
  );
  return planta;
}

test.describe("Plantas", () => {
  test("agregar una planta completa: chips, riego con vista previa, fotos y portada", async ({ page }) => {
    await page.goto("/panel/plantas");
    await expect(page.getByText(/^Tienes \d+ plantas? en total\.$/)).toBeVisible();
    await page.getByRole("link", { name: "Agregar planta" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Nueva planta" })).toBeVisible();

    // Sin nombre ni catálogo no se puede guardar.
    await page.getByRole("button", { name: "Guardar", exact: true }).first().click();
    await expect(page.getByText("Escribe el nombre.")).toBeVisible();
    await expect(page.getByText("Elige un catálogo.")).toBeVisible();

    await page.getByRole("textbox", { name: "Nombre", exact: true }).fill("Nochebuena roja");
    await page.getByLabel("Variedad (opcional)").fill("Prestige");
    await page.getByRole("combobox", { name: "Catálogo", exact: true }).selectOption({ label: "Nochebuena" });
    await page.getByLabel("Etiqueta en la tarjeta").selectOption({ label: "Nuevo" });
    for (const opcion of ["Sol", "Media sombra", "Coral", "Blanco", "Maceta 8", "Maceta 10"]) {
      await page.getByRole("checkbox", { name: opcion, exact: true }).check();
    }

    // Riego y su vista previa «Así se ve en la ficha».
    const vistaPrevia = page.getByTestId("vista-previa-riego");
    await expect(vistaPrevia).toContainText("Todavía no hay datos de riego.");
    await page.getByLabel("Días por semana").selectOption({ label: "2 veces por semana" });
    await page.getByLabel("Cantidad de agua").selectOption({ label: "Moderada" });
    await page.getByLabel("Nota de riego (opcional)").fill("Riega sin mojar las hojas.");
    await expect(vistaPrevia).toContainText("2 veces por semana");
    await expect(vistaPrevia).toContainText("Cantidad de agua: moderada");
    await expect(vistaPrevia).toContainText("Riega sin mojar las hojas.");
    await expect(page.getByLabel("Fertilizante recomendado")).toHaveValue("");

    await page.getByLabel("Descripción corta").fill("Roja intensa, ideal para la temporada navideña.");
    await page.getByLabel("Cuidados").fill("Lejos de corrientes de aire. Temperatura de 15 a 22 °C.");

    // Fotos: dos buenas, una falsa y una demasiado grande.
    const subidor = page.getByLabel("Elegir fotos");
    await subidor.setInputFiles([
      await fotoDePrueba({ color: "#b3261e", nombre: "roja.jpg" }),
      await fotoDePrueba({ color: "#2e7d32", nombre: "verde.jpg" }),
    ]);
    await expect(page.getByRole("img", { name: "Foto 2" })).toBeVisible();
    await subidor.setInputFiles([
      IMAGEN_FALSA,
      { name: "enorme.jpg", mimeType: "image/jpeg", buffer: Buffer.alloc(16 * 1024 * 1024) },
    ]);
    await expect(page.getByText("no-es-foto.jpg: Ese archivo no es una foto JPG, PNG o WebP.")).toBeVisible();
    await expect(page.getByText("enorme.jpg: El archivo pesa más de 15 MB. Elige uno más ligero.")).toBeVisible();
    await expect(page.getByRole("img", { name: /^Foto \d+$/ })).toHaveCount(2);

    // La primera queda como portada; se cambia a la segunda.
    await expect(page.getByRole("listitem").filter({ has: page.getByRole("img", { name: "Foto 1" }) })).toContainText("Portada");
    await page.getByRole("button", { name: "Usar la foto 2 como portada" }).click();
    await expect(page.getByRole("listitem").filter({ has: page.getByRole("img", { name: "Foto 2" }) })).toContainText("Portada");

    await page.getByRole("button", { name: "Guardar", exact: true }).first().click();
    await expect(page.getByText("Listo, se guardó.")).toBeVisible();
    await expect(page).toHaveURL("/panel/plantas");
    await expect(fila(page, "Nochebuena roja")).toContainText("Nochebuena");
    await expect(fila(page, "Nochebuena roja")).toContainText("2 fotos");

    // En la base: slug con nombre y variedad, relaciones y la portada en la segunda foto.
    const planta = await plantaEnBase("Nochebuena roja");
    expect(planta.slug).toBe("nochebuena-roja-prestige");
    // (MySQL ordena las listas fijas por su posición: Sol, Media sombra, Sombra.)
    const luces = await consultar<{ luz: string }>("SELECT luz FROM planta_luces WHERE plantaId = ? ORDER BY luz", [planta.id]);
    expect(luces.map((fila) => fila.luz)).toEqual(["SOL", "MEDIA_SOMBRA"]);
    const colores = await consultar<{ nombre: string }>(
      "SELECT c.nombre FROM planta_colores pc JOIN colores c ON c.id = pc.colorId WHERE pc.plantaId = ? ORDER BY c.nombre",
      [planta.id],
    );
    expect(colores.map((fila) => fila.nombre)).toEqual(["Blanco", "Coral"]);
    const [riego] = await consultar<{ riegoDiasSemana: number; cantidadAgua: string; etiqueta: string }>(
      "SELECT riegoDiasSemana, cantidadAgua, etiqueta FROM plantas WHERE id = ?",
      [planta.id],
    );
    expect(riego).toEqual({ riegoDiasSemana: 2, cantidadAgua: "MODERADA", etiqueta: "NUEVO" });
    const fotos = await consultar<{ orden: number; esPortada: number; ancho: number }>(
      "SELECT orden, esPortada, ancho FROM fotos_planta WHERE plantaId = ? ORDER BY orden",
      [planta.id],
    );
    expect(fotos).toEqual([
      { orden: 1, esPortada: 0, ancho: 1600 },
      { orden: 2, esPortada: 1, ancho: 1600 },
    ]);
  });

  test("cambiar el nombre no cambia su dirección; quitar una foto la borra del servidor", async ({ page }) => {
    await page.goto("/panel/plantas");
    await page.getByRole("link", { name: "Nochebuena roja", exact: true }).click();
    await expect(page.getByText("/plantas/nochebuena-roja-prestige").first()).toBeVisible();
    await expect(page.getByLabel("Variedad (opcional)")).toHaveValue("Prestige");
    await expect(page.getByRole("checkbox", { name: "Sol", exact: true })).toBeChecked();
    await expect(page.getByLabel("Días por semana")).toHaveValue("2");
    await expect(page.getByTestId("vista-previa-riego")).toContainText("2 veces por semana");

    const urlFotoQuitada = (await page.getByRole("img", { name: "Foto 1" }).getAttribute("src")) ?? "";
    expect((await page.request.get(urlFotoQuitada)).status()).toBe(200);
    await page.getByRole("textbox", { name: "Nombre", exact: true }).fill("Nochebuena roja grande");
    await page.getByRole("button", { name: "Quitar la foto 1" }).click();
    await expect(page.getByRole("img", { name: /^Foto \d+$/ })).toHaveCount(1);

    await page.getByRole("button", { name: "Guardar y seguir editando" }).click();
    await expect(page.getByText("Listo, se guardó.")).toBeVisible();
    await page.reload();
    await expect(page.getByRole("heading", { level: 1, name: "Nochebuena roja grande" })).toBeVisible();
    await expect(page.getByText("/plantas/nochebuena-roja-prestige").first()).toBeVisible();
    await expect(page.getByRole("listitem").filter({ has: page.getByRole("img", { name: "Foto 1" }) })).toContainText("Portada");

    expect((await plantaEnBase("Nochebuena roja grande")).slug).toBe("nochebuena-roja-prestige");
    expect((await page.request.get(urlFotoQuitada)).status()).toBe(404);
  });

  test("buscar por nombre y filtrar por catálogo, color y disponibilidad", async ({ page }) => {
    await page.goto("/panel/plantas");
    await page.getByLabel("Buscar por nombre").fill("ROJA");
    await page.getByRole("button", { name: "Buscar" }).click();
    await expect(page).toHaveURL(/q=ROJA/);
    await expect(fila(page, "Nochebuena roja grande")).toBeVisible();
    await expect(page.getByRole("link", { name: "Pino de prueba", exact: true })).toHaveCount(0);

    await page.getByRole("link", { name: "Quitar filtros" }).first().click();
    await page.getByRole("combobox", { name: "Color", exact: true }).selectOption({ label: "Coral" });
    await page.getByRole("button", { name: "Buscar" }).click();
    await expect(page.getByRole("row")).toHaveCount(2); // encabezado + 1 planta
    await expect(fila(page, "Nochebuena roja grande")).toBeVisible();

    await page.getByRole("combobox", { name: "Disponibilidad" }).selectOption({ label: "Agotadas" });
    await page.getByRole("button", { name: "Buscar" }).click();
    await expect(page.getByText("No hay plantas que coincidan con tu búsqueda.")).toBeVisible();

    // Desde Catálogos, «1 planta» lleva al listado filtrado por ese catálogo.
    await page.goto("/panel/catalogos");
    await page
      .getByRole("listitem")
      .filter({ has: page.getByRole("link", { name: "Nochebuena", exact: true }) })
      .getByRole("link", { name: "1 planta" })
      .click();
    await expect(page).toHaveURL(/\/panel\/plantas\?catalogo=\d+$/);
    await expect(page.getByRole("combobox", { name: "Catálogo", exact: true })).toHaveValue(/\d+/);
    await expect(fila(page, "Nochebuena roja grande")).toBeVisible();
    await expect(page.getByRole("link", { name: "Pino de prueba", exact: true })).toHaveCount(0);
  });

  test("interruptores: disponible, visible y la disponibilidad general", async ({ page }) => {
    await page.goto("/panel/plantas");
    const disponible = page.getByRole("switch", { name: "Nochebuena roja grande disponible" });
    await disponible.click();
    await expect(page.getByText("«Nochebuena roja grande» quedó agotada.")).toBeVisible();

    const visible = page.getByRole("switch", { name: "Mostrar Nochebuena roja grande en el sitio" });
    await visible.click();
    await expect(page.getByText("«Nochebuena roja grande» quedó oculta; no se borró.")).toBeVisible();

    const general = page.getByRole("switch", { name: "Mostrar disponibilidad en el sitio" });
    await expect(general).not.toBeChecked();
    await general.click();
    await expect(page.getByText("El sitio ya muestra la disponibilidad.")).toBeVisible();

    await page.reload();
    await expect(disponible).not.toBeChecked();
    await expect(visible).not.toBeChecked();
    await expect(general).toBeChecked();
    expect(await plantaEnBase("Nochebuena roja grande")).toMatchObject({ disponible: 0, visible: 0 });
    const [configuracion] = await consultar<{ mostrarDisponibilidad: number }>(
      "SELECT mostrarDisponibilidad FROM configuracion_sitio WHERE id = 1",
    );
    expect(configuracion.mostrarDisponibilidad).toBe(1);

    await visible.click(); // se vuelve a mostrar para las siguientes pruebas
    await expect(page.getByText("«Nochebuena roja grande» ya se ve en el sitio.")).toBeVisible();
  });

  test("dos plantas con el mismo nombre y variedad tienen direcciones distintas", async ({ page }) => {
    await page.goto("/panel/plantas/nueva");
    await page.getByRole("textbox", { name: "Nombre", exact: true }).fill("Nochebuena roja");
    await page.getByLabel("Variedad (opcional)").fill("Prestige");
    await page.getByRole("combobox", { name: "Catálogo", exact: true }).selectOption({ label: "Nochebuena" });
    await page.getByRole("button", { name: "Guardar", exact: true }).first().click();
    await expect(page).toHaveURL("/panel/plantas");
    expect((await plantaEnBase("Nochebuena roja")).slug).toBe("nochebuena-roja-prestige-2");
  });

  test("eliminar una planta pide confirmación y borra sus fotos", async ({ page }) => {
    await page.goto("/panel/plantas");
    await page.getByRole("link", { name: "Nochebuena roja grande", exact: true }).click();
    const urlFoto = (await page.getByRole("img", { name: "Foto 1" }).getAttribute("src")) ?? "";

    await page.getByRole("button", { name: "Eliminar planta" }).click();
    const dialogo = page.getByRole("alertdialog");
    await expect(dialogo).toContainText("¿Eliminar «Nochebuena roja grande»?");
    await expect(dialogo).toContainText("apaga «Visible en el sitio»");
    await dialogo.getByRole("button", { name: "Eliminar" }).click();

    await expect(page.getByText("Se eliminó «Nochebuena roja grande».")).toBeVisible();
    await expect(page).toHaveURL("/panel/plantas");
    await expect(page.getByRole("link", { name: "Nochebuena roja grande", exact: true })).toHaveCount(0);
    expect((await page.request.get(urlFoto)).status()).toBe(404);
  });
});
