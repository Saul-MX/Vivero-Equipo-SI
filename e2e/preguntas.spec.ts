import { expect, test, type Page } from "@playwright/test";
import { consultar } from "./base-de-datos";

const preguntasEnBase = async () =>
  (await consultar<{ pregunta: string }>("SELECT pregunta FROM preguntas_frecuentes ORDER BY orden, id")).map(
    (fila) => fila.pregunta,
  );

async function agregar(page: Page, pregunta: string, respuesta: string) {
  await page.getByRole("button", { name: "Agregar pregunta" }).click();
  const formulario = page.getByRole("form", { name: "Nueva pregunta" });
  await formulario.getByLabel("Pregunta").fill(pregunta);
  await formulario.getByLabel("Respuesta").fill(respuesta);
  await formulario.getByRole("button", { name: "Agregar", exact: true }).click();
  await expect(page.getByText("Se agregó la pregunta.").last()).toBeVisible();
  await expect(formulario).toHaveCount(0);
}

test.describe("Preguntas frecuentes", () => {
  test("agregar: estado vacío, campos obligatorios y textos limpios", async ({ page }) => {
    await page.goto("/panel/preguntas");
    await expect(page.getByText("Todavía no hay preguntas.")).toBeVisible();

    await page.getByRole("button", { name: "Agregar pregunta" }).click();
    const formulario = page.getByRole("form", { name: "Nueva pregunta" });
    await formulario.getByRole("button", { name: "Agregar", exact: true }).click();
    await expect(formulario.getByText("Escribe la pregunta.")).toBeVisible();
    await expect(formulario.getByText("Escribe la respuesta.")).toBeVisible();
    await formulario.getByRole("button", { name: "Cancelar" }).click();

    // Si alguien pega HTML, se guarda solo el texto.
    await agregar(page, "<b>¿Hacen envíos?</b>", "Sí, dentro de Atlixco.\n\nPregunta por otras zonas.");
    await agregar(page, "¿Venden al mayoreo?", "Sí, para viveros y jardineros.");
    await agregar(page, "¿Qué horario tienen?", "Todos los días de 8:00 a 18:00.");

    expect(await preguntasEnBase()).toEqual(["¿Hacen envíos?", "¿Venden al mayoreo?", "¿Qué horario tienen?"]);
    await expect(page.getByRole("heading", { name: "¿Hacen envíos?" })).toBeVisible();
    await expect(page.getByText("3 preguntas.", { exact: false })).toBeVisible();
  });

  test("editar en su lugar y reordenar", async ({ page }) => {
    await page.goto("/panel/preguntas");
    await page.getByRole("button", { name: "Editar «¿Venden al mayoreo?»" }).click();
    const formulario = page.getByRole("form", { name: "Editar pregunta" });
    await expect(formulario.getByLabel("Respuesta")).toHaveValue("Sí, para viveros y jardineros.");
    await formulario.getByLabel("Pregunta").fill("¿Venden por mayoreo?");
    await formulario.getByRole("button", { name: "Guardar", exact: true }).click();
    await expect(page.getByText("Listo, se guardó.")).toBeVisible();
    await expect(page.getByRole("heading", { name: "¿Venden por mayoreo?" })).toBeVisible();

    await page.getByRole("button", { name: "Subir «¿Qué horario tienen?»" }).click();
    await expect.poll(preguntasEnBase).toEqual(["¿Hacen envíos?", "¿Qué horario tienen?", "¿Venden por mayoreo?"]);
    await expect(page.getByRole("button", { name: "Subir «¿Hacen envíos?»" })).toBeDisabled();

    await page.reload();
    await expect(page.getByRole("heading", { level: 3 })).toHaveText([
      "¿Hacen envíos?",
      "¿Qué horario tienen?",
      "¿Venden por mayoreo?",
    ]);
  });

  test("eliminar pide confirmación", async ({ page }) => {
    await page.goto("/panel/preguntas");
    await page.getByRole("button", { name: "Eliminar «¿Venden por mayoreo?»" }).click();
    const dialogo = page.getByRole("alertdialog");
    await expect(dialogo).toContainText("«¿Venden por mayoreo?» dejará de aparecer en la página Contacto.");
    await dialogo.getByRole("button", { name: "Cancelar" }).click();
    expect(await preguntasEnBase()).toHaveLength(3);

    await page.getByRole("button", { name: "Eliminar «¿Venden por mayoreo?»" }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Eliminar" }).click();
    await expect(page.getByText("Se eliminó la pregunta.")).toBeVisible();
    await expect(page.getByRole("heading", { name: "¿Venden por mayoreo?" })).toHaveCount(0);
    expect(await preguntasEnBase()).toEqual(["¿Hacen envíos?", "¿Qué horario tienen?"]);
  });
});
