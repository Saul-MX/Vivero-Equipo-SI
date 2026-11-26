import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { consultar, ejecutar } from "./base-de-datos";
import { fotoDePrueba, IMAGEN_FALSA } from "./archivos-prueba";
import { ADMIN, SIN_SESION } from "./datos";
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

  // ── Segunda revisión: la matriz de QA ejecutada en una instalación limpia ──

  // [Alta] Next conserva ocultas las pantallas visitadas: al volver a «Agregar planta» reaparecía la
  // planta recién guardada con sus fotos temporales (ya movidas) y la segunda no se podía guardar.
  test("dos plantas seguidas con «Agregar planta»: el formulario empieza vacío y ambas se guardan", async ({ page }) => {
    await page.goto("/panel/plantas");
    for (const nombre of ["Seguida uno", "Seguida dos"]) {
      await page.getByRole("link", { name: "Agregar planta" }).first().click();
      await expect(page).toHaveURL("/panel/plantas/nueva");
      await expect(page.getByRole("textbox", { name: "Nombre", exact: true })).toHaveValue("");
      await expect(page.getByRole("img", { name: /^Foto \d+$/ })).toHaveCount(0);
      await page.getByRole("textbox", { name: "Nombre", exact: true }).fill(nombre);
      await page.getByRole("combobox", { name: "Catálogo", exact: true }).selectOption({ label: "Todo el año" });
      await page.getByLabel("Elegir fotos").setInputFiles(await fotoDePrueba({ nombre: `${nombre}.jpg` }));
      await expect(page.getByRole("img", { name: "Foto 1" })).toBeVisible();
      await page.getByRole("button", { name: "Guardar", exact: true }).first().click();
      await expect(page).toHaveURL("/panel/plantas");
      await expect(page.getByRole("link", { name: nombre, exact: true })).toBeVisible();
    }
  });

  // [Alta] Después de «Salir», la pantalla de entrar conservaba el usuario y la contraseña escritos.
  test("después de «Salir», la pantalla de entrar no conserva el usuario ni la contraseña", async ({ browser }) => {
    const { contexto, pagina } = await nuevaVentanaSinSesion(browser);
    await iniciarSesion(pagina, ADMIN.usuario, ADMIN.contrasena);
    await expect(pagina).toHaveURL("/panel");
    await pagina.getByRole("button", { name: "Salir" }).click();
    await expect(pagina).toHaveURL("/panel/ingresar");
    await expect(pagina.getByLabel("Usuario", { exact: true })).toHaveValue("");
    await expect(pagina.getByLabel("Contraseña", { exact: true })).toHaveValue("");
    await contexto.close();
  });

  // ── Tercera revisión: la matriz completa y las pruebas «como las haría una IA» ──

  // [Media] «Quitar filtros» dejaba escrito lo buscado (Next regresaba a la pantalla sin filtros tal
  // como se había dejado): la siguiente búsqueda salía vacía sin razón.
  test("«Quitar filtros» también vacía el buscador y los filtros", async ({ page }) => {
    await page.goto("/panel/plantas");
    const buscador = page.getByLabel("Buscar por nombre");
    const catalogo = page.getByRole("combobox", { name: "Catálogo", exact: true });
    await catalogo.selectOption({ label: "Todo el año" });
    await buscador.fill("zzz sin resultados");
    await buscador.press("Enter");
    await expect(page.getByText("No hay plantas que coincidan con tu búsqueda.")).toBeVisible();
    // Después de buscar, los campos muestran lo que se buscó.
    await expect(buscador).toHaveValue("zzz sin resultados");
    await expect(catalogo.locator("option:checked")).toHaveText("Todo el año");

    await page.getByRole("link", { name: "Quitar filtros" }).first().click();
    await expect(page).toHaveURL("/panel/plantas");
    await expect(buscador).toHaveValue("");
    await expect(catalogo).toHaveValue("");

    // Y un filtro nuevo se queda elegido (no regresa a «Todos»).
    await catalogo.selectOption({ label: "Todo el año" });
    await page.getByRole("button", { name: "Buscar" }).click();
    await expect(page).toHaveURL(/catalogo=\d+/);
    await expect(catalogo.locator("option:checked")).toHaveText("Todo el año");
    await expect(buscador).toHaveValue("");
  });

  // [Media] Una foto elegida antes de que la página terminara de cargar (internet lento) se perdía
  // sin aviso: quedaba en el campo, pero no se subía ni salía ningún mensaje.
  test("una foto elegida antes de que la página termine de cargar sí se sube", async ({ page }) => {
    // Se detiene el JavaScript de la página hasta después de elegir la foto, como en un celular lento.
    let soltar!: () => void;
    const detenido = new Promise<void>((listo) => (soltar = listo));
    await page.route("**/_next/static/**/*.js", async (ruta) => {
      await detenido;
      await ruta.continue();
    });
    await page.goto("/panel/plantas/nueva", { waitUntil: "domcontentloaded" });
    await page.getByLabel("Elegir fotos").setInputFiles(await fotoDePrueba({ nombre: "temprana.jpg" }));
    soltar();
    await expect(page.getByRole("img", { name: "Foto 1" })).toBeVisible();
  });

  // [Baja] Un archivo que no es foto se enviaba al servidor: el aviso salía bien, pero la consola del
  // navegador mostraba «Failed to load resource: 415». Ahora se revisa su contenido antes de enviarlo.
  test("un archivo que no es foto se rechaza sin enviarlo y sin errores en la consola", async ({ page }) => {
    const errores: string[] = [];
    page.on("console", (mensaje) => mensaje.type() === "error" && errores.push(mensaje.text()));
    let envios = 0;
    page.on("request", (peticion) => {
      if (peticion.url().includes("/panel/subir")) envios++;
    });
    await page.goto("/panel/plantas/nueva");
    await page.getByLabel("Elegir fotos").setInputFiles([
      IMAGEN_FALSA,
      { name: "dibujo.png", mimeType: "image/png", buffer: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>') },
    ]);
    await expect(page.getByText("no-es-foto.jpg: Ese archivo no es una foto JPG, PNG o WebP.")).toBeVisible();
    await expect(page.getByText("dibujo.png: Ese archivo no es una foto JPG, PNG o WebP.")).toBeVisible();
    expect(envios).toBe(0);
    expect(errores).toEqual([]);
  });

  // [Baja] Una foto HEIC del celular empieza con «ftyp», como un MP4, y se aceptaba como video.
  test("una foto HEIC renombrada a .mp4 no se acepta como video", async ({ request }) => {
    const heic = Buffer.concat([Buffer.from([0, 0, 0, 0x18]), Buffer.from("ftypheic", "latin1"), Buffer.alloc(4096, 1)]);
    const respuesta = await request.post("/panel/subir?tipo=video", {
      headers: { "x-vivero-subida": "1" },
      multipart: { archivo: { name: "foto.mp4", mimeType: "video/mp4", buffer: heic } },
    });
    expect(respuesta.status()).toBe(415);
    expect(await respuesta.json()).toEqual({ ok: false, error: "videoInvalido" });
  });

  // [Baja] Con Tab, el foco entraba al mapa de Contacto y no se veía en ningún lado (WCAG 2.4.7).
  test("con Tab, el mapa de Contacto se marca al recibir el foco y se desmarca al salir", async ({ page }) => {
    const ponerMapa = async (src: string) => {
      await page.goto("/panel/datos-y-redes");
      const campoMapa = page.getByLabel("Mapa para insertar (opcional)", { exact: true });
      const anterior = await campoMapa.inputValue();
      await campoMapa.fill(src);
      await page.getByRole("button", { name: "Guardar datos" }).first().click();
      await expect(page.getByText("Listo, los datos se guardaron.")).toBeVisible();
      return anterior;
    };
    const mapaOriginal = await ponerMapa("https://www.google.com/maps/embed?pb=prueba-foco");

    // El mapa de verdad no hace falta: se sirve uno falso con un enlace que recibe el foco.
    await page.route("https://www.google.com/maps/**", (ruta) =>
      ruta.fulfill({ contentType: "text/html", body: "<a href='#'>Ver mapa más grande</a>" }),
    );
    await page.goto("/contacto");
    const mapa = page.locator('iframe[src*="prueba-foco"]');
    await mapa.scrollIntoViewIfNeeded();
    await expect(mapa).toBeVisible();
    const contorno = () => mapa.evaluate((marco) => getComputedStyle(marco).outlineStyle);
    await expect.poll(contorno).toBe("none");

    let dentro = false;
    for (let i = 0; i < 80 && !dentro; i++) {
      await page.keyboard.press("Tab");
      dentro = await mapa.evaluate((marco) => document.activeElement === marco);
    }
    expect(dentro, "el mapa se alcanza con Tab").toBe(true);
    await expect.poll(contorno).not.toBe("none");

    await page.keyboard.press("Shift+Tab");
    await expect.poll(contorno).toBe("none");

    // Se deja el mapa que había, para las demás pruebas.
    await page.unrouteAll();
    await ponerMapa(mapaOriginal);
  });
});

test.describe("Antes de que la página termine de cargar", () => {
  test.use({ storageState: SIN_SESION });

  /** Detiene el JavaScript de la página (como en un celular lento) hasta llamar a la función que devuelve. */
  async function detenerJavaScript(page: Page) {
    let soltar!: () => void;
    const detenido = new Promise<void>((listo) => (soltar = listo));
    await page.route("**/_next/static/**/*.js", async (ruta) => {
      await detenido;
      await ruta.continue();
    });
    return soltar;
  }
  const activada = (page: Page) =>
    expect
      .poll(() => page.locator("form").first().evaluate((f) => Object.keys(f).some((k) => k.startsWith("__react"))))
      .toBe(true);

  // [Media] Enviar el formulario antes de que la página se activara hacía un envío clásico (GET):
  // el usuario y la CONTRASEÑA quedaban en la dirección, el historial y los registros del servidor.
  test("entrar con Enter antes de que cargue la página no pone la contraseña en la dirección", async ({ page }) => {
    await detenerJavaScript(page);
    await page.goto("/panel/ingresar", { waitUntil: "domcontentloaded" });
    await page.getByLabel("Usuario", { exact: true }).fill("alguien");
    await page.getByLabel("Contraseña", { exact: true }).fill("contrasena-de-prueba-123");
    const [envio] = await Promise.all([
      page.waitForRequest((peticion) => peticion.isNavigationRequest()),
      page.getByLabel("Contraseña", { exact: true }).press("Enter"),
    ]);
    expect(envio.method()).toBe("POST");
    expect(envio.url()).not.toContain("contrasena");
    await expect(page).toHaveURL("/panel/ingresar");
    expect(page.url()).not.toContain("contrasena-de-prueba-123");
  });

  // [Media] Al activarse la página, React Hook Form ponía cada campo en blanco y borraba lo que ya
  // se había escrito (en un celular lento, el código de invitación «se borraba solo»).
  test("lo escrito antes de que cargue la página no se borra y sí se envía", async ({ page }) => {
    // Este código equivocado no debe sumar al límite de 10 por hora que usan otras pruebas.
    await ejecutar("DELETE FROM limite_intentos WHERE clave LIKE 'registro:%'");
    const soltar = await detenerJavaScript(page);
    await page.goto("/panel/registro", { waitUntil: "domcontentloaded" });
    await page.getByLabel("Código de invitación", { exact: true }).fill("CODIGO-QUE-NO-EXISTE");
    soltar();
    await activada(page);
    await expect(page.getByLabel("Código de invitación", { exact: true })).toHaveValue("CODIGO-QUE-NO-EXISTE");
    await page.getByLabel("Usuario", { exact: true }).fill("temprano");
    await page.getByLabel("Contraseña", { exact: true }).fill("contrasena-temprana");
    await page.getByLabel("Repite la contraseña", { exact: true }).fill("contrasena-temprana");
    await page.getByRole("button", { name: "Crear cuenta", exact: true }).click();
    // El formulario recibió el código (si lo hubiera perdido diría «Escribe tu código de invitación.»).
    await expect(page.getByText(CODIGO_NO_VALIDO)).toBeVisible();
    await expect(page.getByText("Escribe tu código de invitación.")).toHaveCount(0);
    await ejecutar("DELETE FROM limite_intentos WHERE clave LIKE 'registro:%'");
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
