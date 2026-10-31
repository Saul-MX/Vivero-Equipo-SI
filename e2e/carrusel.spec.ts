import { randomUUID } from "node:crypto";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { expect, test, type Page } from "@playwright/test";
import { fotoDePrueba, gifDePrueba, IMAGEN_FALSA, medidasDe, VIDEO_FALSO, VIDEO_PRUEBA } from "./archivos-prueba";
import { consultar, ejecutar } from "./base-de-datos";

type AnuncioEnBase = {
  id: number;
  tipoMedio: string;
  archivo: string;
  archivoMovil: string | null;
  imagenEspera: string | null;
  titulo: string;
  boton1Destino: string;
  boton2Destino: string | null;
  posicionTexto: string;
  oscurecido: number;
  visible: number;
};
const anuncioEnBase = async (titulo: string) =>
  (await consultar<AnuncioEnBase>("SELECT * FROM anuncios WHERE titulo = ? ORDER BY id DESC LIMIT 1", [titulo]))[0];

const fila = (page: Page, titulo: string) =>
  page.getByRole("row").filter({ has: page.getByRole("link", { name: titulo, exact: true }) });

const idTemporada = async (slug: string) =>
  (
    await consultar<{ id: number }>(
      "SELECT t.id FROM temporadas t JOIN catalogos c ON c.id = t.catalogoId WHERE c.slug = ?",
      [slug],
    )
  )[0].id;

/** Fecha de Puebla («AAAA-MM-DD») desplazada `dias` desde hoy. */
function fecha(dias: number) {
  const hoy = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Mexico_City" }).format(new Date());
  const valor = new Date(`${hoy}T12:00:00Z`);
  valor.setUTCDate(valor.getUTCDate() + dias);
  return valor.toISOString().slice(0, 10);
}

test.describe("Carrusel de portada", () => {
  test.afterAll(async () => {
    // Se deja la configuración y las temporadas como estaban para las demás pruebas.
    await ejecutar("UPDATE configuracion_sitio SET modoTemporada = 'AUTOMATICA', temporadaForzadaId = NULL WHERE id = 1");
    await ejecutar("DELETE FROM anuncios WHERE temporadaId IS NOT NULL");
  });

  test("anuncio con foto: campos obligatorios, «Lleva a», vista previa y guardado", async ({ page }) => {
    await page.goto("/panel/carrusel");
    await expect(page.getByText("Todavía no hay anuncios.")).toBeVisible();
    await expect(page.getByText(/Un anuncio sale en la portada si está visible/)).toBeVisible();
    await page.getByRole("link", { name: "Nuevo anuncio" }).first().click();
    await expect(page.getByRole("heading", { level: 1, name: "Nuevo anuncio" })).toBeVisible();

    await page.getByRole("button", { name: "Guardar", exact: true }).first().click();
    for (const mensaje of [
      "Sube la foto o el video del anuncio.",
      "Escribe el título del anuncio.",
      "Escribe el texto del botón.",
      "Escribe a dónde lleva el botón.",
    ]) {
      await expect(page.getByText(mensaje)).toBeVisible();
    }

    // Foto grande: se reduce a 2400 px. Una falsa se rechaza.
    const foto = page.getByLabel("Foto del anuncio");
    await foto.setInputFiles(IMAGEN_FALSA);
    await expect(page.getByText("Ese archivo no es una foto JPG, PNG, WebP o GIF.")).toBeVisible();
    await foto.setInputFiles(await fotoDePrueba({ ancho: 3200, alto: 1400, color: "#1e3a2e" }));
    await expect(page.getByRole("img", { name: "Vista previa de la foto" })).toBeVisible();

    // Foto para celular: un GIF animado.
    await page.getByText("Más opciones de imagen").click();
    await page.getByLabel("Foto para celular (opcional)").setInputFiles(await gifDePrueba());
    await expect(page.getByRole("img", { name: "Vista previa de la foto" })).toHaveCount(2);

    // Vista previa en vivo.
    const vistaPrevia = page.getByTestId("vista-previa-anuncio");
    await expect(vistaPrevia).toContainText("Aquí va el título del anuncio");
    await page.getByLabel("Texto pequeño de arriba (opcional)").fill("Temporada navideña");
    await page.getByRole("textbox", { name: "Título", exact: true }).fill("Nochebuenas para tu casa");
    await page.getByLabel("Texto corto (opcional)").fill("Rojas, blancas y jaspeadas.");
    await expect(vistaPrevia).toContainText("Temporada navideña");
    await expect(vistaPrevia).toContainText("Nochebuenas para tu casa");

    await page.getByLabel("Botón principal").fill("Ver catálogo");
    await page.getByRole("textbox", { name: "Lleva a", exact: true }).fill("javascript:alert(1)");
    await page.getByLabel("Segundo botón (opcional)").fill("Escríbenos");
    await page.getByLabel("Lleva a (segundo botón)").fill("WhatsApp");
    await page.getByRole("button", { name: "Guardar", exact: true }).first().click();
    await expect(page.getByText(/^Escribe una página del sitio que empiece con \//)).toBeVisible();
    await page.getByRole("textbox", { name: "Lleva a", exact: true }).fill("/catalogos");
    await expect(vistaPrevia).toContainText("Ver catálogo");

    await page.getByRole("radio", { name: "Centro" }).check();
    await page.getByLabel("Oscurecer la foto para leer mejor").fill("70");
    await expect(page.getByText("70 %")).toBeVisible();

    // Celular: se ve la foto para celular.
    await page.getByRole("button", { name: "Celular", exact: true }).click();
    await expect(vistaPrevia).toHaveAttribute("data-vista", "celular");
    const fotoMovil = await page.getByRole("img", { name: "Vista previa de la foto" }).nth(1).getAttribute("src");
    await expect(vistaPrevia.locator("img")).toHaveAttribute("src", fotoMovil!.replace("-t.webp", "-g.webp"));

    await page.getByRole("button", { name: "Guardar", exact: true }).first().click();
    await expect(page.getByText("Listo, se guardó.")).toBeVisible();
    await expect(page).toHaveURL("/panel/carrusel");
    await expect(fila(page, "Nochebuenas para tu casa")).toContainText("Siempre");
    await expect(fila(page, "Nochebuenas para tu casa")).toContainText("Sale hoy");

    const anuncio = await anuncioEnBase("Nochebuenas para tu casa");
    expect(anuncio).toMatchObject({
      tipoMedio: "IMAGEN",
      boton1Destino: "/catalogos",
      boton2Destino: "whatsapp",
      posicionTexto: "CENTRO",
      oscurecido: 70,
      visible: 1,
    });
    expect(anuncio.archivo).toMatch(/^anuncios\//);
    const grande = await page.request.get(`/archivos/${anuncio.archivo}-g.webp`);
    expect(await medidasDe(await grande.body())).toMatchObject({ ancho: 2400, formato: "webp" });
    const movil = await page.request.get(`/archivos/${anuncio.archivoMovil}-g.webp`);
    expect((await medidasDe(await movil.body())).formato).toBe("webp");
  });

  test("anuncio con video: solo MP4 o WebM y se sirve por partes", async ({ page }) => {
    await page.goto("/panel/carrusel/nuevo");
    // Al cambiar a video, la foto elegida se quita (una foto no sirve como video).
    // (Se reintenta: recién abierta la página, el archivo puede elegirse antes de que esté lista.)
    const foto = await fotoDePrueba();
    await expect(async () => {
      await page.getByLabel("Foto del anuncio").setInputFiles(foto);
      await expect(page.getByRole("img", { name: "Vista previa de la foto" })).toBeVisible({ timeout: 5000 });
    }).toPass();
    await page.getByRole("radio", { name: "Video" }).check();
    await expect(page.getByRole("img", { name: "Vista previa de la foto" })).toHaveCount(0);

    const video = page.getByLabel("Video del anuncio");
    await video.setInputFiles(VIDEO_FALSO);
    await expect(page.getByText("Ese archivo no es un video MP4 o WebM.")).toBeVisible();
    await video.setInputFiles({ name: "enorme.mp4", mimeType: "video/mp4", buffer: Buffer.alloc(41 * 1024 * 1024) });
    await expect(page.getByText("El video pesa más de 40 MB. Elige uno más ligero o más corto.")).toBeVisible();
    await video.setInputFiles(VIDEO_PRUEBA);
    await expect(page.getByLabel("Vista previa del video")).toBeAttached();

    await page.getByRole("textbox", { name: "Título", exact: true }).fill("Así crecen en el invernadero");
    await page.getByLabel("Botón principal").fill("Visítanos");
    await page.getByRole("textbox", { name: "Lleva a", exact: true }).fill("https://maps.app.goo.gl/AbC123");
    await page.getByRole("button", { name: "Guardar", exact: true }).first().click();
    await expect(page.getByText("Listo, se guardó.")).toBeVisible();
    await expect(fila(page, "Así crecen en el invernadero")).toContainText("Video");

    const anuncio = await anuncioEnBase("Así crecen en el invernadero");
    expect(anuncio.tipoMedio).toBe("VIDEO");
    expect(anuncio.archivo).toMatch(/^anuncios\/[0-9a-f-]{36}\.mp4$/);
    const parte = await page.request.get(`/archivos/${anuncio.archivo}`, { headers: { Range: "bytes=0-99" } });
    expect(parte.status()).toBe(206);
    expect(parte.headers()["content-type"]).toBe("video/mp4");
    expect(parte.headers()["content-range"]).toBe(`bytes 0-99/${VIDEO_PRUEBA.buffer.length}`);
    expect((await parte.body()).length).toBe(100);
  });

  test("la regla: solo salen hoy los visibles, de «Siempre» o de la temporada vigente y dentro de sus fechas", async ({
    page,
  }) => {
    // Se fuerza Nochebuena para que la prueba no dependa del mes en que se corra.
    const nochebuena = await idTemporada("nochebuena");
    const tulipan = await idTemporada("tulipan");
    await ejecutar("UPDATE configuracion_sitio SET modoTemporada = 'FORZADA', temporadaForzadaId = ? WHERE id = 1", [
      nochebuena,
    ]);
    const { archivo } = await anuncioEnBase("Nochebuenas para tu casa");
    const casos: [string, number | null, string | null, string | null, number][] = [
      ["De Nochebuena", nochebuena, null, null, 1],
      ["De Tulipán", tulipan, null, null, 1],
      ["Ya terminó", null, fecha(-10), fecha(-1), 1],
      ["Empieza mañana", null, fecha(1), null, 1],
      ["Termina hoy", null, fecha(-3), fecha(0), 1],
      ["Oculto", null, null, null, 0],
    ];
    for (const [titulo, temporadaId, desde, hasta, visible] of casos) {
      await ejecutar(
        `INSERT INTO anuncios (tipoMedio, archivo, titulo, boton1Texto, boton1Destino, temporadaId, desde, hasta, visible, orden, actualizadoEn)
         VALUES ('IMAGEN', ?, ?, 'Ver', '/catalogos', ?, ?, ?, ?, 10, NOW(3))`,
        [archivo, titulo, temporadaId, desde, hasta, visible],
      );
    }

    await page.goto("/panel/carrusel");
    for (const [titulo, saleHoy] of [
      ["Nochebuenas para tu casa", true],
      ["De Nochebuena", true],
      ["Termina hoy", true],
      ["De Tulipán", false],
      ["Ya terminó", false],
      ["Empieza mañana", false],
      ["Oculto", false],
    ] as const) {
      const badge = fila(page, titulo).getByText("Sale hoy");
      await expect(badge, titulo).toHaveCount(saleHoy ? 1 : 0);
    }
    await expect(fila(page, "De Nochebuena")).toContainText("Nochebuena");

    // Una temporada que usan anuncios no se puede borrar junto con su catálogo.
    await page.goto("/panel/catalogos");
    await page.getByRole("button", { name: "Eliminar Tulipán" }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Eliminar" }).click();
    await expect(page.getByText("No se puede quitar la temporada: hay anuncios del carrusel que la usan.")).toBeVisible();
    expect(await consultar("SELECT id FROM catalogos WHERE slug = 'tulipan'")).toHaveLength(1);
  });

  test("ordenar, ocultar y editar", async ({ page }) => {
    await page.goto("/panel/carrusel");
    await page.getByRole("button", { name: "Subir «Así crecen en el invernadero»" }).click();
    await expect
      .poll(async () => (await consultar<{ titulo: string }>("SELECT titulo FROM anuncios ORDER BY orden, id LIMIT 2")).map((a) => a.titulo))
      .toEqual(["Así crecen en el invernadero", "Nochebuenas para tu casa"]);

    await page.getByRole("switch", { name: "Mostrar «Nochebuenas para tu casa» en el sitio" }).click();
    await expect(page.getByText("«Nochebuenas para tu casa» quedó oculto; no se borró.")).toBeVisible();
    await page.reload();
    await expect(fila(page, "Nochebuenas para tu casa").getByText("Sale hoy")).toHaveCount(0);
    expect((await anuncioEnBase("Nochebuenas para tu casa")).visible).toBe(0);

    await page.getByRole("link", { name: "Nochebuenas para tu casa", exact: true }).click();
    await expect(page.getByRole("radio", { name: "Centro" })).toBeChecked();
    await expect(page.getByLabel("Oscurecer la foto para leer mejor")).toHaveValue("70");
    await expect(page.getByLabel("Lleva a (segundo botón)")).toHaveValue("whatsapp");
    await page.getByLabel("La imagen ya trae su texto").click();
    await expect(page.getByLabel("Texto corto (opcional)")).toBeHidden();
    await page.getByRole("button", { name: "Guardar y seguir editando" }).click();
    await expect(page.getByText("Listo, se guardó.")).toBeVisible();
    // Ocultar los campos no los borra: el texto corto se conserva.
    expect(
      (await consultar("SELECT imagenConTexto, texto FROM anuncios WHERE titulo = 'Nochebuenas para tu casa'"))[0],
    ).toEqual({ imagenConTexto: 1, texto: "Rojas, blancas y jaspeadas." });
  });

  test("«Otros archivos»: muestra quién usa cada archivo y deja borrar los que no se usan", async ({ page }) => {
    // Un archivo que ya no usa nadie (por ejemplo, de un anuncio que se borró a mano).
    const huerfano = `anuncios/${randomUUID()}`;
    const { buffer } = await fotoDePrueba({ ancho: 300, alto: 200 });
    for (const sufijo of ["-g.webp", "-t.webp"]) {
      await writeFile(path.resolve(".archivos-prueba", `${huerfano}${sufijo}`), buffer);
    }

    await page.goto("/panel/carrusel");
    await page.getByRole("link", { name: "Otros archivos" }).click();
    await expect(page).toHaveURL(/pestana=archivos/);
    await expect(page.getByRole("link", { name: "Otros archivos" })).toHaveAttribute("aria-current", "page");
    await expect(page.getByText(/archivos · .* [KM]B en total · 1 sin usar\./)).toBeVisible();
    await expect(page.getByText("Lo usa").first()).toBeVisible();

    await page.getByRole("button", { name: /^Borrar/ }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Eliminar" }).click();
    await expect(page.getByText("Se borró el archivo.")).toBeVisible();
    await expect(page.getByText(/todos se usan\./)).toBeVisible();
    expect((await page.request.get(`/archivos/${huerfano}-t.webp`)).status()).toBe(404);
  });

  test("eliminar un anuncio pide confirmación y borra sus archivos", async ({ page }) => {
    const anuncio = await anuncioEnBase("Nochebuenas para tu casa");
    await page.goto(`/panel/carrusel/${anuncio.id}`);
    await page.getByRole("button", { name: "Eliminar anuncio" }).click();
    const dialogo = page.getByRole("alertdialog");
    await expect(dialogo).toContainText("¿Eliminar «Nochebuenas para tu casa»?");
    await dialogo.getByRole("button", { name: "Eliminar" }).click();
    await expect(page.getByText("Se eliminó «Nochebuenas para tu casa».")).toBeVisible();
    await expect(page).toHaveURL("/panel/carrusel");

    // Los anuncios de prueba de la regla usaban la misma foto; se quitan antes de revisar.
    await ejecutar("DELETE FROM anuncios WHERE archivo = ?", [anuncio.archivo]);
    expect((await page.request.get(`/archivos/${anuncio.archivo}-g.webp`)).status()).toBe(404);
    expect((await page.request.get(`/archivos/${anuncio.archivoMovil}-g.webp`)).status()).toBe(404);
  });
});
