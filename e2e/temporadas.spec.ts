import { expect, test, type Page } from "@playwright/test";
import { nombreMes } from "../src/lib/temporadas/meses";
import { calcularTemporadaVigente, mesEnMexico } from "../src/lib/temporadas/vigente";
import { consultar } from "./base-de-datos";

// Temporadas iniciales (datos de prueba), en el orden de «Catálogos».
const INICIALES = [
  { id: 1, nombre: "Nochebuena", mesInicio: 11, mesFin: 12, prioridad: 2, visible: true, todoElAnio: false, ordenCatalogo: 1 },
  { id: 2, nombre: "Tulipán", mesInicio: 1, mesFin: 3, prioridad: 1, visible: true, todoElAnio: false, ordenCatalogo: 2 },
  { id: 3, nombre: "Jacintos", mesInicio: 2, mesFin: 4, prioridad: 1, visible: true, todoElAnio: false, ordenCatalogo: 3 },
  { id: 4, nombre: "Cempasúchil", mesInicio: 10, mesFin: 11, prioridad: 1, visible: true, todoElAnio: false, ordenCatalogo: 4 },
  { id: 5, nombre: "Todo el año", mesInicio: 1, mesFin: 12, prioridad: 0, visible: true, todoElAnio: true, ordenCatalogo: 5 },
  { id: 6, nombre: "Árboles", mesInicio: 8, mesFin: 9, prioridad: 1, visible: true, todoElAnio: false, ordenCatalogo: 6 },
];

const tarjeta = (page: Page, nombre: string) => page.getByRole("region", { name: nombre, exact: true });

async function elegirModo(page: Page, modo: string, temporada?: string) {
  await page.getByRole("radio", { name: new RegExp(`^${modo}`) }).check();
  if (temporada !== undefined) await page.getByLabel("Temporada que se muestra").selectOption({ label: temporada });
  await page.getByRole("button", { name: "Guardar", exact: true }).first().click();
}

test.describe("Temporadas", () => {
  test("modo automático: se ve la temporada que toca este mes", async ({ page }) => {
    // Lo que debe verse hoy, calculado con la misma regla (las pruebas pueden correr en cualquier mes).
    const mes = mesEnMexico();
    const esperada = calcularTemporadaVigente(INICIALES, { modo: "AUTOMATICA", temporadaForzadaId: null }, mes).temporada!;

    await page.goto("/panel/temporadas");
    await expect(page.getByText(`Ahora se ve: ${esperada.nombre} (${nombreMes(mes, "es-MX")})`)).toBeVisible();
    await expect(tarjeta(page, esperada.nombre).getByText("Se ve hoy")).toBeVisible();
    await expect(page.getByText("Se ve hoy")).toHaveCount(1);
    await expect(page.getByText(/gana la de prioridad más alta/)).toBeVisible();

    await page.goto("/panel/catalogos");
    const filaVigente = page
      .getByRole("listitem")
      .filter({ has: page.getByRole("link", { name: esperada.nombre, exact: true }) });
    await expect(filaVigente.getByText("Se ve hoy")).toBeVisible();
  });

  test("forzar una temporada y fijar «Todo el año»", async ({ page }) => {
    await page.goto("/panel/temporadas");

    // Forzar sin elegir cuál: avisa.
    await elegirModo(page, "Forzar una temporada", "Elige una temporada");
    await expect(page.getByText("Elige qué temporada quieres mostrar.")).toBeVisible();

    await elegirModo(page, "Forzar una temporada", "Jacintos");
    await expect(page.getByText("Listo. El sitio ya usa este modo.")).toBeVisible();
    await expect(page.getByText("Ahora se ve: Jacintos (forzada)")).toBeVisible();
    await expect(tarjeta(page, "Jacintos").getByText("Se ve hoy")).toBeVisible();

    await page.goto("/panel/catalogos");
    const filaJacintos = page.getByRole("listitem").filter({ has: page.getByRole("link", { name: "Jacintos", exact: true }) });
    await expect(filaJacintos.getByText("Se ve hoy")).toBeVisible();

    await page.goto("/panel/temporadas");
    await expect(page.getByRole("radio", { name: /^Forzar una temporada/ })).toBeChecked();
    await elegirModo(page, "Fijo en Todo el año");
    await expect(page.getByText("Ahora se ve: Todo el año (fijo)")).toBeVisible();
    await expect(tarjeta(page, "Todo el año").getByText("Se ve hoy")).toBeVisible();

    await elegirModo(page, "Automática por fechas");
    await expect(page.getByText(/^Ahora se ve: .+ \([A-ZÁÉÍÓÚ][a-záéíóú]+\)$/)).toBeVisible();
  });

  test("editar una tarjeta: meses que cruzan el año, aviso, color, prioridad y ocultar", async ({ page }) => {
    await page.goto("/panel/temporadas");
    const tulipan = tarjeta(page, "Tulipán");
    await expect(tulipan.getByText("Enero a marzo")).toBeVisible();

    await tulipan.getByLabel("Prioridad").fill("500");
    await tulipan.getByRole("button", { name: /^Guardar/ }).click();
    await expect(tulipan.getByText("Escribe un número entero del 0 al 100.")).toBeVisible();

    await tulipan.getByLabel("Empieza").selectOption({ label: "Diciembre" });
    await tulipan.getByLabel("Termina").selectOption({ label: "Febrero" });
    await tulipan.getByLabel("Texto del aviso").fill("Llegaron los tulipanes holandeses");
    await tulipan.getByLabel("Color").fill("#ff69b4");
    await tulipan.getByLabel("Prioridad").fill("5");
    await tulipan.getByRole("switch", { name: "Usar en el modo automático" }).click();
    await tulipan.getByRole("button", { name: /^Guardar/ }).click();
    await expect(page.getByText("Listo, la temporada «Tulipán» se guardó.")).toBeVisible();

    await page.reload();
    await expect(tulipan.getByText("Diciembre a febrero (oculta)")).toBeVisible();
    await expect(tulipan.getByLabel("Texto del aviso")).toHaveValue("Llegaron los tulipanes holandeses");
    await expect(tulipan.getByLabel("Prioridad")).toHaveValue("5");
    await expect(tulipan.getByRole("switch", { name: "Usar en el modo automático" })).not.toBeChecked();

    // El color se guarda en el catálogo (es el mismo punto de color de la lista de Catálogos).
    const [catalogo] = await consultar<{ color: string }>("SELECT color FROM catalogos WHERE slug = 'tulipan'");
    expect(catalogo.color).toBe("#FF69B4");

    // La temporada base no tiene meses ni prioridad; «Portada y textos» lleva a la ficha del catálogo.
    const base = tarjeta(page, "Todo el año");
    await expect(base.getByLabel("Empieza")).toHaveCount(0);
    await expect(base.getByText(/ninguna otra temporada aplica/)).toBeVisible();
    await tulipan.getByRole("link", { name: /Portada y textos/ }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Tulipán" })).toBeVisible();
  });
});
