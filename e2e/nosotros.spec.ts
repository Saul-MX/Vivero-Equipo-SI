import { expect, test, type Page } from "@playwright/test";
import { fotoDePrueba } from "./archivos-prueba";
import { consultar } from "./base-de-datos";

const region = (page: Page, nombre: string) => page.getByRole("region", { name: nombre, exact: true });

async function guardar(page: Page) {
  await page.getByRole("button", { name: "Guardar", exact: true }).last().click();
  await expect(page.getByText("Listo, se guardó.").last()).toBeVisible();
  await expect(page.getByRole("button", { name: "Guardando…" })).toHaveCount(0);
}

test.describe("Nosotros", () => {
  test("llenar historia, momentos, misión, visión y valores con sus fotos", async ({ page }) => {
    await page.goto("/panel/nosotros");
    await expect(page.getByRole("heading", { level: 1, name: "Nosotros" })).toBeVisible();

    // Historia: texto con párrafos, foto de arriba y galería.
    const historia = region(page, "Historia");
    await historia.getByLabel("Cómo empezó el vivero").fill("Empezamos en 1998 con un invernadero.\n\nHoy somos tres generaciones.");
    await historia.getByLabel("Foto de arriba (opcional)").setInputFiles(await fotoDePrueba({ color: "#1e3a2e" }));
    await expect(historia.getByRole("img", { name: "Vista previa de la foto" })).toBeVisible();
    await historia.getByLabel("Elegir fotos").setInputFiles([
      await fotoDePrueba({ color: "#3e5a3f", nombre: "a.jpg" }),
      await fotoDePrueba({ color: "#6b7f67", nombre: "b.jpg" }),
    ]);
    await expect(historia.getByRole("img", { name: /^Foto \d$/ })).toHaveCount(2);
    await expect(historia.getByText("Portada")).toHaveCount(0); // aquí no hay portada

    // Momentos: el título es obligatorio.
    const momentos = region(page, "Momentos importantes");
    await expect(momentos.getByText("Todavía no hay momentos.")).toBeVisible();
    await momentos.getByRole("button", { name: "Agregar momento" }).click();
    await momentos.getByRole("button", { name: "Agregar momento" }).click();
    await page.getByRole("button", { name: "Guardar", exact: true }).first().click();
    await expect(momentos.getByText("Escribe el título del momento (un año o una palabra).")).toHaveCount(2);

    const momento1 = momentos.getByRole("listitem").nth(0);
    await momento1.getByLabel("Título").fill("1998");
    await momento1.getByLabel("Texto (opcional)").fill("Abrimos el primer invernadero.");
    await momento1.getByLabel("Foto (opcional)").setInputFiles(await fotoDePrueba({ color: "#c7cbb8" }));
    await expect(momento1.getByRole("img", { name: "Vista previa de la foto" })).toBeVisible();
    await momentos.getByRole("listitem").nth(1).getByLabel("Título").fill("Hoy");

    await region(page, "Misión").getByLabel("Texto de la misión").fill("Llevar plantas sanas a cada casa.");
    await region(page, "Visión").getByLabel("Texto de la visión").fill("Ser el vivero de confianza de Puebla.");

    const valores = region(page, "Valores");
    for (const [indice, nombre] of ["Honestidad", "Trabajo"].entries()) {
      await valores.getByRole("button", { name: "Agregar valor" }).click();
      await valores.getByRole("listitem").nth(indice).getByLabel("Nombre del valor").fill(nombre);
    }
    await valores.getByRole("listitem").nth(1).getByLabel("Descripción (opcional)").fill("De sol a sol.");

    await guardar(page);
    // Se puede volver a guardar enseguida: las fotos ya tienen su lugar definitivo.
    await guardar(page);

    const contenido = await consultar<{ seccion: string; texto: string | null; fotoSuperior: string | null }>(
      "SELECT seccion, texto, fotoSuperior FROM nosotros_contenido ORDER BY seccion",
    );
    const historiaBase = contenido.find((fila) => fila.seccion === "HISTORIA")!;
    expect(historiaBase.texto).toBe("Empezamos en 1998 con un invernadero.\n\nHoy somos tres generaciones.");
    expect(historiaBase.fotoSuperior).toMatch(/^nosotros\//);
    expect(contenido.find((fila) => fila.seccion === "MISION")!.texto).toBe("Llevar plantas sanas a cada casa.");
    const galeria = await consultar<{ seccion: string; archivo: string; ancho: number }>(
      "SELECT seccion, archivo, ancho FROM nosotros_galeria ORDER BY orden",
    );
    expect(galeria.map((foto) => foto.seccion)).toEqual(["HISTORIA", "HISTORIA"]);
    expect(galeria.every((foto) => foto.archivo.startsWith("nosotros/") && foto.ancho === 1600)).toBe(true);
    expect(
      await consultar("SELECT titulo, texto, foto IS NOT NULL AS conFoto FROM nosotros_momentos ORDER BY orden"),
    ).toEqual([
      { titulo: "1998", texto: "Abrimos el primer invernadero.", conFoto: 1 },
      { titulo: "Hoy", texto: null, conFoto: 0 },
    ]);
    expect(await consultar("SELECT titulo, descripcion FROM nosotros_valores ORDER BY orden")).toEqual([
      { titulo: "Honestidad", descripcion: null },
      { titulo: "Trabajo", descripcion: "De sol a sol." },
    ]);
  });

  test("lo guardado se carga; ordenar y quitar borra las fotos que ya no se usan", async ({ page }) => {
    await page.goto("/panel/nosotros");
    const historia = region(page, "Historia");
    await expect(historia.getByLabel("Cómo empezó el vivero")).toHaveValue(/Hoy somos tres generaciones\./);
    await expect(historia.getByRole("img", { name: /^Foto \d$/ })).toHaveCount(2);

    const [fotoQuitada] = await consultar<{ archivo: string }>("SELECT archivo FROM nosotros_galeria ORDER BY orden LIMIT 1");
    const [momento] = await consultar<{ foto: string }>("SELECT foto FROM nosotros_momentos WHERE titulo = '1998'");
    for (const clave of [fotoQuitada.archivo, momento.foto]) {
      expect((await page.request.get(`/archivos/${clave}-t.webp`)).status()).toBe(200);
    }

    await historia.getByRole("button", { name: "Quitar la foto 1" }).click();
    const momentos = region(page, "Momentos importantes");
    await momentos.getByRole("button", { name: "Bajar el momento 1" }).click();
    await expect(momentos.getByRole("listitem").nth(0).getByLabel("Título")).toHaveValue("Hoy");
    await momentos.getByRole("button", { name: "Quitar el momento 2" }).click(); // «1998», con foto
    const valores = region(page, "Valores");
    await valores.getByRole("button", { name: "Subir el valor 2" }).click();
    await guardar(page);

    expect(await consultar("SELECT titulo FROM nosotros_momentos ORDER BY orden")).toEqual([{ titulo: "Hoy" }]);
    expect(await consultar("SELECT titulo FROM nosotros_valores ORDER BY orden")).toEqual([
      { titulo: "Trabajo" },
      { titulo: "Honestidad" },
    ]);
    const [{ n }] = await consultar<{ n: bigint }>("SELECT COUNT(*) AS n FROM nosotros_galeria");
    expect(Number(n)).toBe(1);
    for (const clave of [fotoQuitada.archivo, momento.foto]) {
      expect((await page.request.get(`/archivos/${clave}-t.webp`)).status()).toBe(404);
    }
  });
});
