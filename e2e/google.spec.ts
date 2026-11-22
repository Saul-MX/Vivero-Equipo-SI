import { expect, test, type Page } from "@playwright/test";
import { CODIGO_INICIAL_PRUEBA, COOKIE_SESION, GOOGLE_CLIENT_ID_PRUEBA, PUERTO_PRUEBAS, SIN_SESION } from "./datos";
import { crearCodigoInvitacion, nuevaVentanaSinSesion } from "./utilidades";

// Inicio de sesión con Google. Google no se puede usar en las pruebas, así que se intercepta el
// viaje HACIA Google (para revisar qué se le pide) y se simula la vuelta con el «state» real.

const VUELTA_GOOGLE = `http://localhost:${PUERTO_PRUEBAS}/api/auth/callback/google`;
const CODIGO_NO_VALIDO = "El código no es válido, ya se usó o ya venció.";

/** Detiene la ida a Google y devuelve la dirección a la que se iba a mandar al navegador. */
async function interceptarGoogle(page: Page) {
  let resolver: (url: URL) => void;
  const destino = new Promise<URL>((r) => (resolver = r));
  await page.route("https://accounts.google.com/**", async (ruta) => {
    resolver(new URL(ruta.request().url()));
    await ruta.fulfill({ status: 200, contentType: "text/html", body: "<title>Google (simulado)</title>" });
  });
  return destino;
}

function revisarIdaAGoogle(url: URL) {
  expect(url.origin).toBe("https://accounts.google.com");
  const p = url.searchParams;
  expect(p.get("client_id")).toBe(GOOGLE_CLIENT_ID_PRUEBA);
  expect(p.get("redirect_uri")).toBe(VUELTA_GOOGLE);
  expect(p.get("response_type")).toBe("code");
  expect(p.get("prompt")).toBe("select_account");
  expect(p.get("scope")?.split(" ")).toEqual(expect.arrayContaining(["openid", "email", "profile"]));
  // Protecciones del viaje: «state» contra CSRF y PKCE contra el robo del código.
  expect(p.get("state")?.length).toBeGreaterThanOrEqual(16);
  expect(p.get("code_challenge_method")).toBe("S256");
  expect(p.get("code_challenge")).toBeTruthy();
}

test.describe("sin sesión", () => {
  test.use({ storageState: SIN_SESION });

  test("«Continuar con Google» en Entrar lleva a Google con state y PKCE", async ({ page }) => {
    const destino = interceptarGoogle(page);
    await page.goto("/panel/ingresar");
    await page.getByRole("button", { name: "Continuar con Google" }).click();
    revisarIdaAGoogle(await destino);
  });

  test("cancelar en Google regresa a Entrar con un aviso y sin sesión", async ({ page, context }) => {
    const destino = interceptarGoogle(page);
    await page.goto("/panel/ingresar");
    await page.getByRole("button", { name: "Continuar con Google" }).click();
    const state = (await destino).searchParams.get("state")!;

    await page.goto(`${VUELTA_GOOGLE}?error=access_denied&state=${encodeURIComponent(state)}`);
    await expect(page).toHaveURL(/\/panel\/ingresar\?error=access_denied/);
    await expect(page.getByText("Se canceló el inicio con Google.")).toBeVisible();
    expect((await context.cookies()).some((c) => c.name.endsWith(COOKIE_SESION))).toBe(false);
  });

  test("una vuelta de Google inventada (sin state válido) no da acceso", async ({ page }) => {
    await page.goto(`${VUELTA_GOOGLE}?code=codigo-inventado&state=state-inventado`);
    await expect(page).toHaveURL(/\/panel\/ingresar\?error=/);
    await expect(page.getByText("No se pudo continuar con Google. Intenta de nuevo.")).toBeVisible();
    await page.goto("/panel");
    await expect(page).toHaveURL("/panel/ingresar");
  });

  test("crear cuenta con Google exige un código válido antes de ir a Google", async ({ page }) => {
    let fueAGoogle = false;
    await page.route("https://accounts.google.com/**", (ruta) => {
      fueAGoogle = true;
      return ruta.abort();
    });
    await page.goto("/panel/registro");

    await page.getByRole("button", { name: "Continuar con Google" }).click();
    await expect(page.getByText("Escribe tu código de invitación.")).toBeVisible();

    await page.getByLabel("Código de invitación", { exact: true }).fill("AAAA-BBBB-CCCC");
    await page.getByRole("button", { name: "Continuar con Google" }).click();
    await expect(page.getByText(CODIGO_NO_VALIDO)).toBeVisible();

    // El código inicial ya no sirve: existe la cuenta del administrador.
    await page.getByLabel("Código de invitación", { exact: true }).fill(CODIGO_INICIAL_PRUEBA);
    await page.getByRole("button", { name: "Continuar con Google" }).click();
    await expect(page.getByText(CODIGO_NO_VALIDO)).toBeVisible();
    expect(fueAGoogle).toBe(false);
  });

  test("las demás rutas de better-auth no se pueden usar desde fuera", async ({ request }) => {
    const intentos = [
      request.post("/api/auth/sign-up/email", {
        data: { email: "intrusa@ejemplo.com", password: "contrasena-intrusa-1", name: "intrusa" },
      }),
      request.post("/api/auth/sign-in/username", { data: { username: "saul", password: "x".repeat(10) } }),
      request.post("/api/auth/sign-in/social", { data: { provider: "google", requestSignUp: true } }),
      request.post("/api/auth/is-username-available", { data: { username: "saul" } }),
      request.get("/api/auth/get-session"),
      request.get("/api/auth/ok"),
    ];
    for (const respuesta of await Promise.all(intentos)) {
      expect(respuesta.status(), respuesta.url()).toBe(404);
    }
  });
});

test("con un código válido, «Continuar con Google» va a Google sin gastar el código", async ({ page, browser }) => {
  const codigo = await crearCodigoInvitacion(page);

  const invitada = await nuevaVentanaSinSesion(browser);
  const destino = interceptarGoogle(invitada.pagina);
  await invitada.pagina.goto("/panel/registro");
  await invitada.pagina.getByLabel("Código de invitación", { exact: true }).fill(codigo);
  await invitada.pagina.getByRole("button", { name: "Continuar con Google" }).click();
  const ida = await destino;
  revisarIdaAGoogle(ida);

  // Si cancela en Google, regresa a «Crear cuenta» con un aviso.
  const state = ida.searchParams.get("state")!;
  await invitada.pagina.goto(`${VUELTA_GOOGLE}?error=access_denied&state=${encodeURIComponent(state)}`);
  await expect(invitada.pagina).toHaveURL(/\/panel\/registro\?error=access_denied/);
  await invitada.pagina.close();
  await invitada.contexto.close();

  // El código se gasta solo cuando de verdad se crea la cuenta: sigue pendiente.
  await page.reload();
  await expect(page.getByText(`Termina en ${codigo.slice(-4)}`)).toBeVisible();
});

test("«Vincular cuenta de Google» en Mi cuenta va a Google", async ({ page }) => {
  await page.goto("/panel/mi-cuenta");
  await expect(page.getByText("Todavía no vinculas ninguna cuenta de Google.")).toBeVisible();
  const destino = interceptarGoogle(page);
  await page.getByRole("button", { name: "Vincular cuenta de Google" }).click();
  revisarIdaAGoogle(await destino);
});

test("al volver con error de la vinculación, Mi cuenta lo explica", async ({ page }) => {
  await page.goto("/panel/mi-cuenta?error=account_already_linked_to_different_user");
  await expect(page.getByText("Esa cuenta de Google ya está vinculada a otra cuenta del panel.")).toBeVisible();
});
