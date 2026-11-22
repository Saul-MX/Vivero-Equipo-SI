import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { consultar, ejecutar } from "./base-de-datos";
import { SIN_SESION } from "./datos";
import { crearCodigoInvitacion, iniciarSesion, nuevaVentanaSinSesion } from "./utilidades";

// Hallazgos de la revisión de seguridad y QA (noviembre de 2026).
// «Fallos corregidos»: cada prueba se escribió primero y fallaba, demostrando el problema; después se
// arregló el código. Quedan como pruebas de regresión.
// «Cobertura que faltaba»: casos que nadie probaba y que ya funcionaban bien.

const CODIGO_NO_VALIDO = "El código no es válido, ya se usó o ya venció.";
const GRACIAS = "¡Gracias! Recibimos tu mensaje";
const DEMASIADOS_MENSAJES = /Ya recibimos varios mensajes desde tu conexión/;

/** Llena y envía Contacto como una persona (espera más de 3 s para no parecer un programa). */
async function llenarContacto(page: Page, nombre: string, texto = "¿Tienen nochebuenas blancas para diciembre?") {
  const formulario = page.getByRole("form", { name: "Escríbenos un mensaje" });
  await formulario.getByLabel("Tu nombre").fill(nombre);
  await formulario.getByLabel("Teléfono o correo").fill("222 123 4567");
  await formulario.getByLabel("Mensaje").fill(texto);
  await page.waitForTimeout(3200);
  return formulario.getByRole("button", { name: "Enviar mensaje" });
}

async function revisarAccesibilidad(page: Page) {
  const resultado = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  expect(resultado.violations).toEqual([]);
}

test.describe("Fallos corregidos", () => {
  test.describe("sin sesión", () => {
    test.use({ storageState: SIN_SESION });

    // [Alta] src/lib/peticion.ts tomaba la PRIMERA IP de X-Forwarded-For, que la escribe el cliente.
    // Las pruebas no tienen un proxy delante, así que se simula lo que llega en producción: la IP que
    // inventa el atacante al principio y, al final, la que agrega el proxy del hosting (siempre la
    // misma, porque es la misma computadora).
    test("inventar X-Forwarded-For no salta el límite de 5 mensajes por hora", async ({ page }) => {
      test.setTimeout(90_000);
      await ejecutar("DELETE FROM limite_intentos WHERE clave LIKE 'mensaje:%'");
      let bloqueado = false;
      for (let intento = 1; intento <= 7 && !bloqueado; intento++) {
        // IPs de documentación: 203.0.113.0/24 (inventadas) y 198.51.100.7 (la que pone el proxy).
        await page.setExtraHTTPHeaders({ "x-forwarded-for": `203.0.113.${intento}, 198.51.100.7` });
        await page.goto("/contacto");
        await (await llenarContacto(page, `Spam con IP falsa ${intento}`)).click();
        await expect(page.getByText(GRACIAS).or(page.getByText(DEMASIADOS_MENSAJES))).toBeVisible();
        bloqueado = await page.getByText(DEMASIADOS_MENSAJES).isVisible();
      }
      // Los 7 vienen de la misma computadora: a más tardar el 6.º debió rechazarse.
      expect(bloqueado).toBe(true);
      await ejecutar("DELETE FROM limite_intentos WHERE clave LIKE 'mensaje:%'");
    });

    // [Alta] Se revisaba el bloqueo y el fallo se anotaba hasta después del hash: las peticiones
    // simultáneas no veían los fallos de las demás (12 de 12 probaban su contraseña).
    test("intentos de entrar en paralelo no pasan del límite de 5 por usuario", async ({ browser }) => {
      test.setTimeout(90_000);
      await ejecutar("DELETE FROM limite_intentos WHERE clave LIKE 'ingreso:%'");
      const ventanas = await Promise.all(Array.from({ length: 12 }, () => nuevaVentanaSinSesion(browser)));
      try {
        for (const [i, { pagina }] of ventanas.entries()) {
          await pagina.goto("/panel/ingresar");
          await pagina.getByLabel("Usuario", { exact: true }).fill("carrera");
          await pagina.getByLabel("Contraseña", { exact: true }).fill(`intento-paralelo-${i}`);
        }
        await Promise.all(ventanas.map(({ pagina }) => pagina.getByRole("button", { name: "Entrar", exact: true }).click()));

        const resultados = await Promise.all(
          ventanas.map(async ({ pagina }) => {
            const incorrecto = pagina.getByText("Usuario o contraseña incorrectos.");
            const bloqueado = pagina.getByText(/Demasiados intentos/);
            const inesperado = pagina.getByText("Algo salió mal. Intenta de nuevo en un momento.");
            await expect(incorrecto.or(bloqueado).or(inesperado)).toBeVisible({ timeout: 30_000 });
            if (await bloqueado.isVisible()) return "bloqueado";
            return (await incorrecto.isVisible()) ? "incorrecto" : "inesperado";
          }),
        );
        // «incorrecto» e «inesperado» llegaron a comprobar la contraseña; solo «bloqueado» la frenó.
        expect.soft(resultados.filter((r) => r !== "bloqueado").length, resultados.join(", ")).toBeLessThanOrEqual(5);
        // Y nunca debe reventar: anotar fallos al mismo tiempo choca con la llave de limite_intentos (P2002).
        expect.soft(resultados.filter((r) => r === "inesperado"), resultados.join(", ")).toEqual([]);
      } finally {
        await Promise.all(ventanas.map(({ contexto }) => contexto.close()));
        await ejecutar("DELETE FROM limite_intentos WHERE clave LIKE 'ingreso:%'");
      }
    });

    // [Baja] El campo acepta teléfono O correo, pero le decía al navegador que era un correo (WCAG 1.3.5).
    test("«Teléfono o correo» no se anuncia como campo de correo", async ({ page }) => {
      await page.goto("/contacto");
      const campo = page.getByRole("form", { name: "Escríbenos un mensaje" }).getByLabel("Teléfono o correo");
      await expect(campo).not.toHaveAttribute("autocomplete", "email");
    });
  });

  // [Baja] «ana.» pasaba la validación del formulario, pero better-auth rechazaba su correo interno
  // («ana.@cuentas.vivero.invalid») y la persona veía «código no válido». Ahora se avisa en el campo.
  test("un usuario que termina en punto no se reporta como «código no válido»", async ({ page, browser }) => {
    const codigo = await crearCodigoInvitacion(page);
    const invitada = await nuevaVentanaSinSesion(browser);
    const pagina = invitada.pagina;
    await pagina.goto("/panel/registro");
    await pagina.getByLabel("Código de invitación", { exact: true }).fill(codigo);
    await pagina.getByLabel("Usuario", { exact: true }).fill("ana.");
    await pagina.getByLabel("Contraseña", { exact: true }).fill("contrasena-de-ana-9");
    await pagina.getByLabel("Repite la contraseña", { exact: true }).fill("contrasena-de-ana-9");
    await pagina.getByRole("button", { name: "Crear cuenta", exact: true }).click();
    await expect(
      pagina.getByText("El usuario no puede empezar ni terminar con punto, ni llevar dos puntos seguidos."),
    ).toBeVisible();
    await expect(pagina.getByText(CODIGO_NO_VALIDO)).not.toBeVisible();
    await invitada.contexto.close();

    // Y el código sigue sirviendo.
    await page.reload();
    await expect(page.getByText(`Termina en ${codigo.slice(-4)}`)).toBeVisible();
  });

  // [Baja] Dos personas, dos códigos, el mismo usuario a la vez: las dos pasaban la revisión de «usuario
  // libre» y gastaban su código; el INSERT de una fallaba por el índice único y su código quedaba gastado
  // sin cuenta. Ahora ese código se devuelve y la persona ve «Ese usuario ya existe».
  test("si dos eligen el mismo usuario a la vez, el código de quien pierde sigue sirviendo", async ({ page, browser }) => {
    const codigos = [await crearCodigoInvitacion(page), await crearCodigoInvitacion(page)];
    const ventanas = await Promise.all(codigos.map(() => nuevaVentanaSinSesion(browser)));
    for (const [i, { pagina }] of ventanas.entries()) {
      await pagina.goto("/panel/registro");
      await pagina.getByLabel("Código de invitación", { exact: true }).fill(codigos[i]);
      await pagina.getByLabel("Usuario", { exact: true }).fill("gemelo");
      await pagina.getByLabel("Contraseña", { exact: true }).fill("contrasena-gemela-1");
      await pagina.getByLabel("Repite la contraseña", { exact: true }).fill("contrasena-gemela-1");
    }
    await Promise.all(ventanas.map(({ pagina }) => pagina.getByRole("button", { name: "Crear cuenta", exact: true }).click()));
    const gano = await Promise.all(
      ventanas.map(async ({ pagina }) => {
        await expect(pagina.getByRole("heading", { name: "Hola, gemelo" }).or(pagina.getByText("Ese usuario ya existe. Elige otro."))).toBeVisible();
        return pagina.url().endsWith("/panel");
      }),
    );
    for (const { contexto } of ventanas) await contexto.close();
    expect(gano.filter(Boolean)).toHaveLength(1);
    const perdedor = codigos[gano.indexOf(false)];
    await page.reload();
    await expect(page.getByText(`Termina en ${perdedor.slice(-4)}`)).toBeVisible();
  });

  // [Baja] Una búsqueda de más de 120 letras se cambiaba por «sin búsqueda» y se veían todas las plantas.
  test("buscar un texto de más de 120 letras no muestra todas las plantas", async ({ page }) => {
    await page.goto(`/panel/plantas?q=${"x".repeat(121)}`);
    await expect(page.getByText("No hay plantas que coincidan con tu búsqueda.")).toBeVisible();
  });
});

test.describe("Cobertura que faltaba", () => {
  test.describe("sin sesión", () => {
    test.use({ storageState: SIN_SESION });

    // QA #9, NO reproducido: el botón se desactiva a tiempo y no se duplica el mensaje.
    test("doble clic en «Enviar mensaje» guarda un solo mensaje", async ({ page }) => {
      const nombre = `Doble clic ${Date.now()}`;
      await page.goto("/contacto");
      await (await llenarContacto(page, nombre)).dblclick();
      await expect(page.getByText(GRACIAS)).toBeVisible();
      await page.waitForTimeout(1500); // por si llega un segundo envío
      const [fila] = await consultar<{ n: bigint }>("SELECT COUNT(*) AS n FROM mensajes WHERE nombre = ?", [nombre]);
      expect(Number(fila.n)).toBe(1);
    });

    test("Contacto vacío, mensaje corto y texto de 10,000 letras", async ({ page }) => {
      await page.goto("/contacto");
      const formulario = page.getByRole("form", { name: "Escríbenos un mensaje" });
      await formulario.getByRole("button", { name: "Enviar mensaje" }).click();
      await expect(formulario.getByText("Escribe tu nombre.")).toBeVisible();
      await expect(formulario.getByText("Escribe un teléfono o correo para responderte.")).toBeVisible();
      await expect(formulario.getByText("Escribe tu mensaje.")).toBeVisible();
      await revisarAccesibilidad(page);

      await (await llenarContacto(page, "Corto", "Hola")).click();
      await expect(formulario.getByText("Cuéntanos un poco más (al menos 10 letras).")).toBeVisible();

      const nombre = `Texto enorme ${Date.now()}`;
      await (await llenarContacto(page, nombre, "a".repeat(10_000))).click();
      await expect(formulario.getByText("Este texto es demasiado largo.")).toBeVisible();
      const [fila] = await consultar<{ n: bigint }>("SELECT COUNT(*) AS n FROM mensajes WHERE nombre = ?", [nombre]);
      expect(Number(fila.n)).toBe(0);
    });

    test("el aviso de «Usuario o contraseña incorrectos» cumple WCAG", async ({ page }) => {
      await iniciarSesion(page, "nadie", "contrasena-equivocada");
      await expect(page.getByText("Usuario o contraseña incorrectos.")).toBeVisible();
      await revisarAccesibilidad(page);
      await ejecutar("DELETE FROM limite_intentos WHERE clave LIKE 'ingreso:%'");
    });
  });

  test("cambiar la contraseña se bloquea tras 5 contraseñas actuales equivocadas", async ({ page }) => {
    await page.goto("/panel/mi-cuenta");
    try {
      for (let intento = 1; intento <= 6; intento++) {
        await page.getByLabel("Contraseña actual", { exact: true }).fill(`equivocada-${intento}`);
        await page.getByLabel("Contraseña nueva", { exact: true }).fill("contrasena-nueva-1");
        await page.getByLabel("Repítela", { exact: true }).fill("contrasena-nueva-1");
        await page.getByRole("button", { name: "Cambiar contraseña" }).click();
        const esperado = intento <= 5 ? page.getByText("La contraseña actual no es correcta.") : page.getByText(/Demasiados intentos/);
        await expect(esperado).toBeVisible();
        if (intento === 1) await revisarAccesibilidad(page);
      }
    } finally {
      await ejecutar("DELETE FROM limite_intentos WHERE clave LIKE 'contrasena:%'");
    }
  });
});
