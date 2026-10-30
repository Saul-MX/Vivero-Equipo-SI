import { expect, test } from "@playwright/test";
import { crearCodigoInvitacion, iniciarSesion, nuevaVentanaSinSesion, registrarCuenta } from "./utilidades";

const CODIGO_NO_VALIDO = "El código no es válido, ya se usó o ya venció.";

test("un código de invitación sirve una sola vez", async ({ page, browser }) => {
  const codigo = await crearCodigoInvitacion(page);
  expect(codigo).toMatch(/^[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/);
  await expect(page.getByText(`Termina en ${codigo.slice(-4)}`)).toBeVisible();

  const ana = await nuevaVentanaSinSesion(browser);
  await registrarCuenta(ana.pagina, { codigo, usuario: "ana", contrasena: "contrasena-de-ana-1" });
  await expect(ana.pagina).toHaveURL("/panel");
  await expect(ana.pagina.getByRole("heading", { level: 1, name: "Hola, ana" })).toBeVisible();
  await ana.contexto.close();

  const beto = await nuevaVentanaSinSesion(browser);
  await registrarCuenta(beto.pagina, { codigo, usuario: "beto", contrasena: "contrasena-de-beto-1" });
  await expect(beto.pagina.getByText(CODIGO_NO_VALIDO)).toBeVisible();
  await beto.contexto.close();

  // Ya usado, deja de aparecer entre los pendientes.
  await page.reload();
  await expect(page.getByText(`Termina en ${codigo.slice(-4)}`)).toHaveCount(0);
});

test("un código cancelado ya no sirve", async ({ page, browser }) => {
  const codigo = await crearCodigoInvitacion(page);
  const fila = page.getByRole("listitem").filter({ hasText: `Termina en ${codigo.slice(-4)}` });

  await fila.getByRole("button", { name: "Cancelar código" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Sí, cancelarlo" }).click();
  await expect(page.getByText("El código se canceló.")).toBeVisible();
  await expect(fila).toHaveCount(0);

  const otra = await nuevaVentanaSinSesion(browser);
  await registrarCuenta(otra.pagina, { codigo, usuario: "dora", contrasena: "contrasena-de-dora-1" });
  await expect(otra.pagina.getByText(CODIGO_NO_VALIDO)).toBeVisible();
  await otra.contexto.close();
});

test("cambiar la contraseña cierra las sesiones de otros aparatos", async ({ page, browser }) => {
  // Se usa una cuenta propia («carla») para no afectar la sesión del administrador en otras pruebas.
  const codigo = await crearCodigoInvitacion(page);
  const anterior = "contrasena-de-carla-1";
  const nueva = "contrasena-de-carla-2";

  const telefono = await nuevaVentanaSinSesion(browser);
  await registrarCuenta(telefono.pagina, { codigo, usuario: "carla", contrasena: anterior });
  await expect(telefono.pagina).toHaveURL("/panel");

  const computadora = await nuevaVentanaSinSesion(browser);
  await iniciarSesion(computadora.pagina, "carla", anterior);
  await expect(computadora.pagina).toHaveURL("/panel");

  const pagina = telefono.pagina;
  await pagina.goto("/panel/mi-cuenta");
  await expect(pagina.getByLabel("Usuario", { exact: true })).toHaveValue("carla");
  await expect(pagina.getByLabel("Usuario", { exact: true })).toHaveAttribute("readonly");
  const cambiar = async (actual: string, nuevaContrasena: string, repetir: string) => {
    await pagina.getByLabel("Contraseña actual", { exact: true }).fill(actual);
    await pagina.getByLabel("Contraseña nueva", { exact: true }).fill(nuevaContrasena);
    await pagina.getByLabel("Repítela", { exact: true }).fill(repetir);
    await pagina.getByRole("button", { name: "Cambiar contraseña" }).click();
  };

  await cambiar("contrasena-equivocada", nueva, nueva);
  await expect(pagina.getByText("La contraseña actual no es correcta.")).toBeVisible();

  await cambiar(anterior, nueva, "otra-cosa-distinta");
  await expect(pagina.getByText("Las contraseñas no coinciden.")).toBeVisible();

  await cambiar(anterior, anterior, anterior);
  await expect(pagina.getByText("La contraseña nueva debe ser distinta a la actual.")).toBeVisible();

  await cambiar(anterior, nueva, nueva);
  await expect(pagina.getByText(/Listo, tu contraseña se cambió/)).toBeVisible();

  // La sesión de la «computadora» se cerró sola.
  await computadora.pagina.goto("/panel");
  await expect(computadora.pagina).toHaveURL("/panel/ingresar");

  await iniciarSesion(computadora.pagina, "carla", anterior);
  await expect(computadora.pagina.getByText("Usuario o contraseña incorrectos.")).toBeVisible();
  await iniciarSesion(computadora.pagina, "carla", nueva);
  await expect(computadora.pagina).toHaveURL("/panel");

  await telefono.contexto.close();
  await computadora.contexto.close();
});
