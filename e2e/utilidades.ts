import type { Browser, Page } from "@playwright/test";
import { test } from "@playwright/test";
import { SIN_SESION } from "./datos";

export async function registrarCuenta(
  page: Page,
  datos: { codigo: string; usuario: string; contrasena: string },
) {
  await page.goto("/panel/registro");
  await page.getByLabel("Código de invitación", { exact: true }).fill(datos.codigo);
  await page.getByLabel("Usuario", { exact: true }).fill(datos.usuario);
  await page.getByLabel("Contraseña", { exact: true }).fill(datos.contrasena);
  await page.getByLabel("Repite la contraseña", { exact: true }).fill(datos.contrasena);
  await page.getByRole("button", { name: "Crear cuenta" }).click();
}

export async function iniciarSesion(page: Page, usuario: string, contrasena: string) {
  await page.goto("/panel/ingresar");
  await page.getByLabel("Usuario", { exact: true }).fill(usuario);
  await page.getByLabel("Contraseña", { exact: true }).fill(contrasena);
  await page.getByRole("button", { name: "Entrar" }).click();
}

/** Abre otra ventana de navegador sin sesión (como si fuera otra persona u otro aparato). */
export async function nuevaVentanaSinSesion(browser: Browser) {
  const contexto = await browser.newContext({
    baseURL: test.info().project.use.baseURL,
    storageState: SIN_SESION,
  });
  return { contexto, pagina: await contexto.newPage() };
}

/** Crea un código de invitación desde «Mi cuenta» (con la sesión de la página) y lo devuelve. */
export async function crearCodigoInvitacion(page: Page) {
  await page.goto("/panel/mi-cuenta");
  await page.getByRole("button", { name: "Crear código de invitación" }).click();
  const codigo = (await page.getByTestId("codigo-invitacion").textContent())?.trim() ?? "";
  return codigo;
}
