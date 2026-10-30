import { expect, test, type Locator, type Page } from "@playwright/test";
import { extraerSrcMapa } from "../src/lib/datos-negocio/normalizar";
import {
  coloresDePlanta,
  contarHuerfanos,
  crearPlanta,
  existePlanta,
  leerDatosNegocio,
  macetasDePlanta,
  tonosGuardados,
} from "./base-de-datos";

// Código tal como lo copia Google Maps («Compartir» → «Insertar un mapa»), con un atributo
// malicioso agregado a propósito: solo debe guardarse la dirección del mapa.
const IFRAME_MAPA =
  '<iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3776!2d-98.43!3d18.90!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1&amp;hl=es" width="600" height="450" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade" onload="alert(1)"></iframe>';

const campo = (page: Page, etiqueta: string) => page.getByLabel(etiqueta, { exact: true });

/** Formulario de una lista («Guardar colores» o «Guardar macetas»). */
const formularioLista = (page: Page, boton: string) =>
  page.locator("form").filter({ has: page.getByRole("button", { name: boton }) });

/** Valores de los campos de nombre de una lista, en orden (espera a que la lista se muestre). */
async function nombresDeLista(lista: Locator, etiqueta: RegExp) {
  const campos = lista.getByRole("textbox", { name: etiqueta });
  await expect(campos.first()).toBeVisible();
  return Promise.all((await campos.all()).map((c) => c.inputValue()));
}

async function campoConValor(lista: Locator, etiqueta: RegExp, valor: string) {
  const nombres = await nombresDeLista(lista, etiqueta);
  const indice = nombres.indexOf(valor);
  expect(indice, `«${valor}» en la lista`).toBeGreaterThanOrEqual(0);
  return { indice, campo: lista.getByRole("textbox", { name: etiqueta }).nth(indice) };
}

test.describe("Datos y redes", () => {
  test("guarda los datos del negocio y los deja limpios", async ({ page }) => {
    await page.goto("/panel/datos-y-redes");
    await campo(page, "WhatsApp").fill("244 123-4567");
    await campo(page, "Teléfonos").fill("244 761 52 53,244 122 83 37 ,");
    await campo(page, "Correo (opcional)").fill("contacto@vivero.mx");
    await campo(page, "Horario").fill("Lunes a domingo de 8:00 a 18:00");
    await campo(page, "Horario especial (opcional)").fill("24 y 31 de diciembre cerramos a las 14:00");
    await expect(campo(page, "Dirección")).toHaveValue(/Atlixco, Puebla/); // viene de los datos iniciales
    await campo(page, "Enlace de Google Maps").fill("https://maps.app.goo.gl/AbCdEf123");
    await campo(page, "Mapa para insertar (opcional)").fill(IFRAME_MAPA);
    await campo(page, "Facebook (opcional)").fill("facebook.com/vivero-prueba");
    await campo(page, "Instagram (opcional)").fill("@vivero_prueba");

    await page.getByRole("button", { name: "Guardar datos" }).first().click();
    await expect(page.getByText("Listo, los datos se guardaron.")).toBeVisible();

    // Al recargar se ven los datos guardados, ya limpios.
    await page.reload();
    const srcEsperado = extraerSrcMapa(IFRAME_MAPA)!;
    await expect(campo(page, "WhatsApp")).toHaveValue("2441234567");
    await expect(campo(page, "Teléfonos")).toHaveValue("244 761 52 53, 244 122 83 37");
    await expect(campo(page, "Mapa para insertar (opcional)")).toHaveValue(srcEsperado);
    await expect(campo(page, "Facebook (opcional)")).toHaveValue("https://facebook.com/vivero-prueba");
    await expect(campo(page, "Instagram (opcional)")).toHaveValue("https://www.instagram.com/vivero_prueba/");

    // En la base solo quedó la dirección del mapa (sin <iframe> ni atributos).
    const guardado = await leerDatosNegocio();
    expect(guardado.mapaSrc).toBe(srcEsperado);
    expect(guardado.mapaSrc).toMatch(/^https:\/\/www\.google\.com\/maps\/embed\?/);
    expect(guardado.mapaSrc).not.toMatch(/iframe|onload|alert/);
  });

  test("avisa de los datos incorrectos y no los guarda", async ({ page }) => {
    await page.goto("/panel/datos-y-redes");
    await campo(page, "WhatsApp").fill("12345");
    await campo(page, "Correo (opcional)").fill("no-es-un-correo");
    await campo(page, "Horario").fill("");
    await campo(page, "Enlace de Google Maps").fill("https://sitio-falso.com/maps");
    await campo(page, "Mapa para insertar (opcional)").fill('<iframe src="https://sitio-malo.com/mapa"></iframe>');
    await campo(page, "Facebook (opcional)").fill("https://twitter.com/vivero");
    await campo(page, "Instagram (opcional)").fill("instagram");

    await page.getByRole("button", { name: "Guardar datos" }).last().click();
    await expect(page.getByText("Revisa los campos marcados en rojo.")).toBeVisible();
    await expect(page.getByText(/Escribe el número a 10 dígitos/)).toBeVisible();
    await expect(page.getByText(/Escribe un correo válido/)).toBeVisible();
    await expect(page.getByText("Escribe el horario.")).toBeVisible();
    await expect(page.getByText(/Pega el enlace que da Google Maps/)).toBeVisible();
    await expect(page.getByText(/Ese código no es un mapa de Google Maps/)).toBeVisible();
    await expect(page.getByText(/Pega el enlace de tu página de Facebook/)).toBeVisible();
    await expect(page.getByText(/Pega el enlace de tu Instagram/)).toBeVisible();

    await page.reload();
    await expect(campo(page, "WhatsApp")).not.toHaveValue("12345");
  });

  test("colores: agregar, intercambiar nombres, evitar repetidos y eliminar uno en uso", async ({ page }) => {
    const plantaId = await crearPlanta("Planta de prueba colores", { colores: ["Rojo", "Blanco"] });
    await page.goto("/panel/datos-y-redes");
    const colores = formularioLista(page, "Guardar colores");
    const nombreColor = /^Nombre del color \d+$/;

    // Contador de plantas que usan el color.
    const filaRojo = colores
      .getByRole("listitem")
      .filter({ has: page.getByRole("button", { name: "Eliminar Rojo" }) });
    await expect(filaRojo).toContainText("1 planta");

    // Eliminar un color en uso: avisa cuántas plantas lo usan.
    await page.getByRole("button", { name: "Eliminar Rojo" }).click();
    const dialogo = page.getByRole("alertdialog");
    await expect(dialogo).toContainText("¿Eliminar «Rojo»?");
    await expect(dialogo).toContainText("Lo usa 1 planta. Si lo eliminas, se quitará de esa planta");
    await dialogo.getByRole("button", { name: "Sí, eliminar" }).click();
    await expect(page.getByText("Se eliminó «Rojo» y se quitó de 1 planta.")).toBeVisible();
    expect(await nombresDeLista(colores, nombreColor)).not.toContain("Rojo");

    // La planta sigue existiendo, ya sin ese color, y no quedó nada huérfano.
    expect(await existePlanta(plantaId)).toBe(true);
    expect(await coloresDePlanta(plantaId)).toEqual(["Blanco"]);
    expect(await contarHuerfanos()).toBe(0);

    // No se puede agregar un nombre repetido (sin importar mayúsculas).
    await colores.getByLabel("Nombre del color nuevo").fill("amarillo");
    await colores.getByRole("button", { name: "Agregar" }).click();
    await expect(colores.getByText("Ya existe uno con ese nombre.")).toBeVisible();

    // Agregar un color nuevo con su tono.
    await colores.getByLabel("Nombre del color nuevo").fill("Coral");
    await colores.getByLabel("Tono del color nuevo").fill("#ff7f50");
    await colores.getByRole("button", { name: "Agregar" }).click();
    await expect(colores.getByText("Sin guardar")).toBeVisible();

    // Los selectores muestran el tono guardado (datos iniciales: Azul #3B6FB6, Verde #4F8A3C).
    const azul = await campoConValor(colores, nombreColor, "Azul");
    await expect(colores.getByLabel(`Tono del color ${azul.indice + 1}`)).toHaveValue("#3b6fb6");
    const tonosAntes = await tonosGuardados();

    // Intercambiar dos nombres en un solo guardado.
    const verde = await campoConValor(colores, nombreColor, "Verde");
    await azul.campo.fill("Verde");
    await verde.campo.fill("Azul");

    await colores.getByRole("button", { name: "Guardar colores" }).click();
    await expect(page.getByText("Listo, los colores se guardaron.")).toBeVisible();

    // En la base: se intercambiaron los nombres, Coral quedó con su tono y los demás no cambiaron.
    const tonosDespues = await tonosGuardados();
    expect(tonosDespues).toEqual({
      ...tonosAntes,
      Verde: tonosAntes.Azul,
      Azul: tonosAntes.Verde,
      Coral: "#FF7F50",
    });

    await page.reload();
    const nombres = await nombresDeLista(colores, nombreColor);
    expect(nombres).toContain("Coral");
    // El color que antes se llamaba «Azul» ahora se llama «Verde» y conserva su tono.
    const verdeNuevo = await campoConValor(colores, nombreColor, "Verde");
    await expect(colores.getByLabel(`Tono del color ${verdeNuevo.indice + 1}`)).toHaveValue("#3b6fb6");
    await expect(colores.getByLabel(`Tono del color ${nombres.indexOf("Coral") + 1}`)).toHaveValue("#ff7f50");

    // Renombrar a un nombre que ya existe marca el error y no guarda.
    const rosa = await campoConValor(colores, nombreColor, "Rosa");
    await rosa.campo.fill("BLANCO");
    await colores.getByRole("button", { name: "Guardar colores" }).click();
    await expect(colores.getByText("Ya existe uno con ese nombre.")).toBeVisible();
    await page.reload();
    expect(await nombresDeLista(colores, nombreColor)).toContain("Rosa");
  });

  test("macetas: ordenar, agregar y eliminar", async ({ page }) => {
    const plantaId = await crearPlanta("Planta de prueba macetas", { macetas: ["Maceta 6", "Maceta 8"] });
    await page.goto("/panel/datos-y-redes");
    const macetas = formularioLista(page, "Guardar macetas");
    const nombreTamano = /^Nombre del tamaño \d+$/;

    expect(await nombresDeLista(macetas, nombreTamano)).toEqual([
      "Maceta 4", "Maceta 6", "Maceta 8", "Maceta 10", "Maceta 12", "Maceta 15",
    ]);

    // Subir «Maceta 15» y agregar «Maceta 20».
    await macetas.getByRole("button", { name: "Subir Maceta 15" }).click();
    await macetas.getByLabel("Nombre del tamaño nuevo").fill("Maceta 20");
    await macetas.getByRole("button", { name: "Agregar" }).click();
    await macetas.getByRole("button", { name: "Guardar macetas" }).click();
    await expect(page.getByText("Listo, los tamaños de maceta se guardaron.")).toBeVisible();

    await page.reload();
    expect(await nombresDeLista(macetas, nombreTamano)).toEqual([
      "Maceta 4", "Maceta 6", "Maceta 8", "Maceta 10", "Maceta 15", "Maceta 12", "Maceta 20",
    ]);

    // Eliminar una en uso: avisa y la quita de la planta, sin borrar la planta.
    const filaMaceta6 = macetas
      .getByRole("listitem")
      .filter({ has: page.getByRole("button", { name: "Eliminar Maceta 6" }) });
    await expect(filaMaceta6).toContainText("1 planta");
    await page.getByRole("button", { name: "Eliminar Maceta 6" }).click();
    await expect(page.getByRole("alertdialog")).toContainText("Lo usa 1 planta");
    await page.getByRole("alertdialog").getByRole("button", { name: "Sí, eliminar" }).click();
    await expect(page.getByText("Se eliminó «Maceta 6» y se quitó de 1 planta.")).toBeVisible();
    expect(await macetasDePlanta(plantaId)).toEqual(["Maceta 8"]);

    // Eliminar una que nadie usa.
    await page.getByRole("button", { name: "Eliminar Maceta 20" }).click();
    await expect(page.getByRole("alertdialog")).toContainText("Ninguna planta lo usa.");
    await page.getByRole("alertdialog").getByRole("button", { name: "Sí, eliminar" }).click();
    await expect(page.getByText("Se eliminó «Maceta 20».")).toBeVisible();

    await page.reload();
    expect(await nombresDeLista(macetas, nombreTamano)).toEqual([
      "Maceta 4", "Maceta 8", "Maceta 10", "Maceta 15", "Maceta 12",
    ]);
    expect(await existePlanta(plantaId)).toBe(true);
    expect(await contarHuerfanos()).toBe(0);
  });
});
