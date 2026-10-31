import { expect, test, type Page } from "@playwright/test";
import { consultar, crearPlanta, ejecutar } from "./base-de-datos";

const cuenta = async (sql: string) => Number((await consultar<{ n: bigint }>(sql))[0].n);
const pendiente = (page: Page, clave: string) => page.locator(`[data-pendiente="${clave}"]`);

test.describe("Inicio del panel", () => {
  test.afterAll(async () => {
    await ejecutar("UPDATE configuracion_sitio SET modoTemporada = 'AUTOMATICA', temporadaForzadaId = NULL WHERE id = 1");
  });

  test("saludo, «Ver el sitio» y accesos rápidos", async ({ page }) => {
    await page.goto("/panel");
    await expect(page.getByRole("heading", { level: 1, name: "Hola, saul" })).toBeVisible();
    await expect(page.getByText("Esto es lo que se ve hoy en el sitio")).toBeVisible();
    const verSitio = page.getByRole("main").getByRole("link", { name: /Ver el sitio/ });
    await expect(verSitio).toHaveAttribute("href", "/");
    await expect(verSitio).toHaveAttribute("target", "_blank");

    for (const [nombre, href] of [
      ["Agregar planta", "/panel/plantas/nueva"],
      ["Nuevo anuncio", "/panel/carrusel/nuevo"],
      ["Publicar novedad", "/panel/novedades/nueva"],
      ["Ver mensajes", "/panel/mensajes"],
    ]) {
      await expect(page.getByRole("link", { name: new RegExp(`^${nombre}`) })).toHaveAttribute("href", href);
    }
  });

  test("Pendientes: contadores reales y botones que llevan a resolverlos", async ({ page }) => {
    // Una planta oculta y sin foto, para que ambos contadores tengan algo.
    const plantaId = await crearPlanta("Planta pendiente", {});
    await ejecutar("UPDATE plantas SET visible = 0 WHERE id = ?", [plantaId]);
    await ejecutar("INSERT INTO mensajes (nombre, contacto, texto) VALUES ('Ana', '2221234567', 'Hola, ¿tienen helechos?')");

    await page.goto("/panel");
    const sinLeer = await cuenta("SELECT COUNT(*) AS n FROM mensajes WHERE leido = 0");
    const ocultas = await cuenta("SELECT COUNT(*) AS n FROM plantas WHERE visible = 0");
    const sinFoto = await cuenta(
      "SELECT COUNT(*) AS n FROM plantas p WHERE NOT EXISTS (SELECT 1 FROM fotos_planta f WHERE f.plantaId = p.id)",
    );
    await expect(pendiente(page, "mensajes")).toContainText(`${sinLeer} mensaje${sinLeer === 1 ? "" : "s"} sin leer`);
    await expect(pendiente(page, "ocultas")).toContainText(`${ocultas} planta${ocultas === 1 ? "" : "s"} oculta`);
    await expect(pendiente(page, "sinFoto")).toContainText(`${sinFoto} planta${sinFoto === 1 ? "" : "s"} sin foto`);
    await expect(page.getByRole("link", { name: /^Ver mensajes/ })).toContainText(String(sinLeer));

    await pendiente(page, "ocultas").getByRole("link", { name: "Revisar" }).click();
    await expect(page).toHaveURL("/panel/plantas?revisar=ocultas");
    await expect(page.getByText("Mostrando solo las plantas ocultas.")).toBeVisible();
    await expect(page.getByRole("link", { name: "Planta pendiente", exact: true }).first()).toBeVisible();
    // Solo ocultas: ningún interruptor «Mostrar … en el sitio» está encendido.
    await expect(page.getByRole("switch", { name: /^Mostrar .* en el sitio$/, checked: true })).toHaveCount(0);

    await page.goto("/panel");
    await pendiente(page, "sinFoto").getByRole("link", { name: "Ver" }).click();
    await expect(page).toHaveURL("/panel/plantas?revisar=sin-foto");
    await expect(page.getByText("Mostrando solo las plantas sin foto.")).toBeVisible();
    await expect(page.getByText("Sin fotos").first()).toBeVisible();

    await page.goto("/panel");
    await pendiente(page, "mensajes").getByRole("link", { name: "Abrir" }).click();
    await expect(page).toHaveURL("/panel/mensajes?ver=sin-leer");
  });

  test("«Falta número de WhatsApp» aparece solo cuando falta, con su botón «Poner»", async ({ page }) => {
    const [{ whatsapp }] = await consultar<{ whatsapp: string | null }>("SELECT whatsapp FROM datos_negocio WHERE id = 1");
    await ejecutar("UPDATE datos_negocio SET whatsapp = NULL WHERE id = 1");
    try {
      await page.goto("/panel");
      await expect(pendiente(page, "whatsapp")).toContainText("Falta número de WhatsApp");
      await pendiente(page, "whatsapp").getByRole("link", { name: "Poner" }).click();
      await expect(page).toHaveURL("/panel/datos-y-redes");
    } finally {
      await ejecutar("UPDATE datos_negocio SET whatsapp = ? WHERE id = 1", [whatsapp ?? "2441234567"]);
    }
    await page.goto("/panel");
    await expect(pendiente(page, "whatsapp")).toHaveCount(0);
  });

  test("tarjeta de temporada y «Anuncios en portada hoy»", async ({ page }) => {
    const [jacintos] = await consultar<{ id: number; color: string }>(
      "SELECT t.id, c.color FROM temporadas t JOIN catalogos c ON c.id = t.catalogoId WHERE c.slug = 'jacintos'",
    );
    await ejecutar("UPDATE configuracion_sitio SET modoTemporada = 'FORZADA', temporadaForzadaId = ? WHERE id = 1", [jacintos.id]);
    const [{ archivo }] = await consultar<{ archivo: string }>("SELECT archivo FROM anuncios WHERE archivo IS NOT NULL LIMIT 1").then(
      (filas) => (filas.length ? filas : [{ archivo: "anuncios/00000000-0000-4000-8000-000000000000" }]),
    );
    await ejecutar(
      `INSERT INTO anuncios (tipoMedio, archivo, titulo, boton1Texto, boton1Destino, temporadaId, visible, orden, actualizadoEn)
       VALUES ('IMAGEN', ?, 'Anuncio de Jacintos', 'Ver', '/temporada', ?, 1, 99, NOW(3))`,
      [archivo, jacintos.id],
    );

    await page.goto("/panel");
    const tarjeta = page.getByTestId("tarjeta-temporada");
    await expect(tarjeta.getByRole("heading", { level: 2 })).toHaveText("Jacintos");
    await expect(tarjeta).toContainText("Ahora se ve: Jacintos (forzada)");
    // El fondo es un degradado que empieza con el color de la temporada (en su versión legible).
    expect(await tarjeta.evaluate((elemento) => getComputedStyle(elemento).backgroundImage)).toContain("linear-gradient");
    await tarjeta.getByRole("link", { name: "Cambiar temporada" }).click();
    await expect(page).toHaveURL("/panel/temporadas");

    await page.goto("/panel");
    const anuncios = page.getByRole("heading", { name: "Anuncios en portada hoy" }).locator("xpath=ancestor::*[@data-slot='card'][1]");
    await expect(anuncios.getByRole("link", { name: /Anuncio de Jacintos/ })).toBeVisible();

    // Con otra temporada, ese anuncio ya no sale hoy.
    await ejecutar("DELETE FROM anuncios WHERE titulo = 'Anuncio de Jacintos'");
    await ejecutar("UPDATE anuncios SET visible = 0");
    await page.reload();
    await expect(anuncios).toContainText("Ninguno para esta temporada.");
    await expect(anuncios.getByRole("link", { name: "Crear uno" })).toHaveAttribute("href", "/panel/carrusel/nuevo");
    await ejecutar("UPDATE anuncios SET visible = 1");
  });
});
