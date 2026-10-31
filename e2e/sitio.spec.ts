import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { fotoDePrueba } from "./archivos-prueba";
import { consultar } from "./base-de-datos";

// Sitio público (fase 5). Todo lo que se revisa se captura antes desde el panel, como lo haría
// el vivero: así también se comprueba que el sitio muestra los cambios al momento.

const menu = (page: Page) => page.getByRole("navigation", { name: "Menú principal" });

async function crearFertilizante(page: Page, nombre: string) {
  await page.goto("/panel/fertilizantes/nuevo");
  await page.getByRole("textbox", { name: "Nombre", exact: true }).fill(nombre);
  await page.getByRole("combobox", { name: "Tipo" }).selectOption({ label: "Orgánico" });
  await page.getByLabel("Para qué sirve").fill("Da fuerza a las hojas.");
  await page.getByLabel("Presentación").fill("Costal de 5 kg");
  await page.getByLabel("Dosis").fill("Un puño por maceta");
  await page.getByLabel("Cada cuánto").fill("cada mes");
  await page.getByLabel("Cómo se aplica").fill("Esparce sobre la tierra.\nRiega.");
  await page.getByRole("button", { name: "Guardar", exact: true }).first().click();
  await expect(page).toHaveURL("/panel/fertilizantes");
}

async function crearPlanta(page: Page, datos: { nombre: string; catalogo: string; fertilizante?: string }) {
  await page.goto("/panel/plantas/nueva");
  await page.getByRole("textbox", { name: "Nombre", exact: true }).fill(datos.nombre);
  await page.getByRole("combobox", { name: "Catálogo", exact: true }).selectOption({ label: datos.catalogo });
  for (const opcion of ["Media sombra", "Blanco", "Maceta 8"]) {
    await page.getByRole("checkbox", { name: opcion, exact: true }).check();
  }
  await page.getByLabel("Días por semana").selectOption({ label: "2 veces por semana" });
  await page.getByLabel("Cantidad de agua").selectOption({ label: "Moderada" });
  if (datos.fertilizante) await page.getByLabel("Fertilizante recomendado").selectOption({ label: datos.fertilizante });
  await page.getByLabel("Descripción corta").fill(`${datos.nombre}: hojas grandes y muy verdes.`);
  await page.getByLabel("Cuidados").fill("Lejos del sol directo.");
  await page.getByLabel("Elegir fotos").setInputFiles(await fotoDePrueba({ color: "#3e5a3f", ancho: 1200, alto: 1500 }));
  await expect(page.getByRole("img", { name: "Foto 1" })).toBeVisible();
  await page.getByRole("button", { name: "Guardar", exact: true }).first().click();
  await expect(page).toHaveURL("/panel/plantas");
  const [planta] = await consultar<{ slug: string }>("SELECT slug FROM plantas WHERE nombre = ? ORDER BY id DESC LIMIT 1", [
    datos.nombre,
  ]);
  return planta.slug;
}

async function elegirModo(page: Page, modo: string, temporada?: string) {
  await page.goto("/panel/temporadas");
  await page.getByRole("radio", { name: new RegExp(`^${modo}`) }).check();
  if (temporada) await page.getByLabel("Temporada que se muestra").selectOption({ label: temporada });
  await page.getByRole("button", { name: "Guardar", exact: true }).first().click();
  await expect(page.getByText("Listo. El sitio ya usa este modo.")).toBeVisible();
}

async function cambiarDisponibilidadGeneral(page: Page, encendida: boolean) {
  await page.goto("/panel/plantas");
  const general = page.getByRole("switch", { name: "Mostrar disponibilidad en el sitio" });
  if ((await general.getAttribute("aria-checked")) !== String(encendida)) {
    await general.click();
    // Se espera a que el servidor lo guarde (el interruptor cambia en pantalla antes).
    await expect(
      page.getByText(encendida ? "El sitio ya muestra la disponibilidad." : "El sitio ya no muestra la disponibilidad."),
    ).toBeVisible();
  }
}

const slugDe = async (nombre: string) =>
  (await consultar<{ slug: string }>("SELECT slug FROM plantas WHERE nombre = ? ORDER BY id DESC LIMIT 1", [nombre]))[0].slug;

test.describe("Sitio público", () => {

  test("la barra tiene los 6 apartados y «Catálogos» se despliega", async ({ page }) => {
    await page.goto("/");
    // El primer enlace o botón de cada apartado (el desplegable de «Catálogos» está dentro del suyo).
    const apartados = menu(page).locator(":scope > ul > li").locator(":scope > a, :scope > div > button");
    await expect(apartados).toHaveText(["Inicio", "Catálogos", "Temporada", "Fertilizantes", "Nosotros", "Contacto"]);
    await expect(menu(page).getByRole("link", { name: "Inicio" })).toHaveAttribute("aria-current", "page");

    // Desplegable: catálogos permanentes, Fertilizantes y, al final, «Ver todas las plantas».
    const boton = menu(page).getByRole("button", { name: "Catálogos" });
    await boton.click();
    await expect(boton).toHaveAttribute("aria-expanded", "true");
    const opciones = menu(page).locator("ul ul li");
    const textos = await opciones.allTextContents();
    expect(textos).toContain("Todo el año");
    expect(textos).toContain("Árboles");
    expect(textos).not.toContain("Nochebuena"); // las de temporada se ven en «Temporada»
    expect(textos.slice(-2)).toEqual(["Fertilizantes", "Ver todas las plantas"]);
    await page.keyboard.press("Escape");
    await expect(boton).toHaveAttribute("aria-expanded", "false");

    // Con teclado: Enter abre y lleva al primer enlace; Escape cierra y regresa al botón.
    await boton.focus();
    await page.keyboard.press("Enter");
    await expect(menu(page).getByRole("link", { name: textos[0], exact: true })).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(boton).toBeFocused();
    await expect(boton).toHaveAttribute("aria-expanded", "false");

    await boton.click();
    await menu(page).getByRole("link", { name: "Todo el año" }).click();
    await expect(page).toHaveURL("/catalogos/todo-el-anio");
    await expect(page.getByRole("heading", { level: 1, name: "Todo el año" })).toBeVisible();

    for (const [nombre, ruta, titulo] of [
      ["Fertilizantes", "/fertilizantes", "Fertilizantes"],
      ["Nosotros", "/nosotros", "Nosotros"],
      ["Contacto", "/contacto", "Contacto"],
      ["Temporada", "/temporada", null],
    ] as const) {
      await menu(page).getByRole("link", { name: nombre, exact: true }).click();
      await expect(page).toHaveURL(ruta);
      await expect(menu(page).getByRole("link", { name: nombre, exact: true })).toHaveAttribute("aria-current", "page");
      if (titulo) await expect(page.getByRole("heading", { level: 1, name: titulo })).toBeVisible();
    }
  });

  test("en celular, el menú se abre con un botón", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await page.getByRole("button", { name: "Abrir el menú" }).click();
    const panel = page.getByRole("dialog");
    await expect(panel.getByRole("link", { name: "Ver todas las plantas" })).toBeVisible();
    await panel.getByRole("link", { name: "Contacto" }).click();
    await expect(page).toHaveURL("/contacto");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    // Nada se sale de lo ancho de la pantalla.
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  });

  test("ficha de planta con todo lo capturado y WhatsApp con su nombre", async ({ page }) => {
    await crearFertilizante(page, "Abono del sitio");
    const slugHelecho = await crearPlanta(page, {
      nombre: "Helecho del sitio",
      catalogo: "Todo el año",
      fertilizante: "Abono del sitio",
    });
    await cambiarDisponibilidadGeneral(page, true);

    await page.goto("/catalogos/todo-el-anio");
    await page.getByRole("link", { name: /Helecho del sitio/ }).click();
    await expect(page).toHaveURL(`/plantas/${slugHelecho}`);
    await expect(page.getByRole("heading", { level: 1, name: "Helecho del sitio" })).toBeVisible();
    await expect(page.getByRole("img", { name: "Helecho del sitio, foto 1 de 1" })).toBeVisible();
    for (const texto of [
      "Helecho del sitio: hojas grandes y muy verdes.",
      "Media sombra",
      "Blanco",
      "Maceta 8",
      "Regar 2 veces por semana",
      "Cantidad de agua: moderada",
      "Lejos del sol directo.",
      "Disponible",
    ]) {
      await expect(page.getByRole("article").getByText(texto, { exact: true })).toBeVisible();
    }
    const [{ id: idFertilizante }] = await consultar<{ id: number }>("SELECT id FROM fertilizantes WHERE nombre = 'Abono del sitio'");
    await expect(page.getByRole("link", { name: "Abono del sitio" })).toHaveAttribute(
      "href",
      `/fertilizantes#fertilizante-${idFertilizante}`,
    );

    // WhatsApp: el botón de la ficha y el flotante preguntan por esta planta.
    const mensaje = encodeURIComponent("Hola, me interesa la planta Helecho del sitio.");
    await expect(page.getByRole("link", { name: "Preguntar por WhatsApp" })).toHaveAttribute(
      "href",
      new RegExp(`^https://wa\\.me/52\\d{10}\\?text=${mensaje.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`),
    );
    await expect(page.getByTestId("whatsapp-flotante")).toHaveAttribute("href", new RegExp("Helecho%20del%20sitio"));
    // Fuera de la ficha, el botón flotante vuelve al mensaje general.
    await menu(page).getByRole("link", { name: "Contacto", exact: true }).click();
    await expect(page.getByTestId("whatsapp-flotante")).not.toHaveAttribute("href", /Helecho/);

    // La ficha cumple WCAG 2.1 AA.
    await page.goto(`/plantas/${slugHelecho}`);
    const accesibilidad = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
    expect(accesibilidad.violations).toEqual([]);

    // El fertilizante tiene su lugar en la página Fertilizantes.
    await page.getByRole("link", { name: "Abono del sitio" }).click();
    const fertilizante = page.locator(`#fertilizante-${idFertilizante}`);
    await expect(fertilizante).toContainText("Un puño por maceta");
    await expect(fertilizante.getByRole("listitem")).toHaveText(["Esparce sobre la tierra.", "Riega."]);
  });

  test("la disponibilidad y lo oculto se respetan en el sitio", async ({ page }) => {
    const slugHelecho = await slugDe("Helecho del sitio");

    // Con la disponibilidad encendida: una planta agotada dice «Agotado» y se puede filtrar.
    await cambiarDisponibilidadGeneral(page, true);
    await page.goto("/panel/plantas");
    await page.getByRole("switch", { name: "Helecho del sitio disponible" }).click();
    await expect(page.getByText("«Helecho del sitio» quedó agotada.")).toBeVisible();
    await page.goto("/plantas");
    const helecho = page.getByRole("link", { name: /Helecho del sitio/ });
    await expect(helecho).toContainText("Agotado");
    const filtro = page.getByRole("button", { name: /^Solo disponibles \(\d+\)$/ });
    await filtro.click();
    await expect(filtro).toHaveAttribute("aria-pressed", "true");
    await expect(helecho).toBeHidden();
    await filtro.click();
    await expect(helecho).toBeVisible();
    await page.goto("/panel/plantas");
    await page.getByRole("switch", { name: "Helecho del sitio disponible" }).click();
    await expect(page.getByText("«Helecho del sitio» quedó disponible.")).toBeVisible();
    await cambiarDisponibilidadGeneral(page, false);
    await page.goto(`/plantas/${slugHelecho}`);
    await expect(page.getByRole("heading", { level: 1, name: "Helecho del sitio" })).toBeVisible();
    await expect(page.getByText("Disponible", { exact: true })).toHaveCount(0);

    // Ocultar no es borrar: deja de verse en el sitio y vuelve al encenderla.
    await page.goto("/panel/plantas");
    const visible = page.getByRole("switch", { name: "Mostrar Helecho del sitio en el sitio" });
    await visible.click();
    await expect(page.getByText("«Helecho del sitio» quedó oculta; no se borró.")).toBeVisible();
    await page.goto(`/plantas/${slugHelecho}`);
    await expect(page.getByRole("heading", { level: 1, name: "No encontramos esta página" })).toBeVisible();
    await page.goto("/plantas");
    await expect(page.getByRole("link", { name: /Helecho del sitio/ })).toHaveCount(0);

    await page.goto("/panel/plantas");
    await page.getByRole("switch", { name: "Mostrar Helecho del sitio en el sitio" }).click();
    await expect(page.getByText("«Helecho del sitio» ya se ve en el sitio.")).toBeVisible();
    await page.goto("/plantas");
    await expect(page.getByRole("link", { name: /Helecho del sitio/ })).toBeVisible();
  });

  test("al forzar otra temporada cambian el color, la página Temporada y el carrusel", async ({ page }) => {
    await crearPlanta(page, { nombre: "Tulipán del sitio", catalogo: "Tulipán" });
    // Un anuncio que solo sale en temporada de Tulipán.
    await page.goto("/panel/carrusel/nuevo");
    // (Se reintenta: recién abierta la página, el archivo puede elegirse antes de que esté lista.)
    const foto = await fotoDePrueba({ color: "#d63a7a" });
    await expect(async () => {
      await page.getByLabel("Foto del anuncio").setInputFiles(foto);
      await expect(page.getByRole("img", { name: "Vista previa de la foto" })).toBeVisible({ timeout: 5000 });
    }).toPass();
    await page.getByRole("textbox", { name: "Título", exact: true }).fill("Llegaron los tulipanes");
    await page.getByLabel("Botón principal").fill("Ver tulipanes");
    await page.getByRole("textbox", { name: "Lleva a", exact: true }).fill("/temporada");
    await page.getByRole("combobox", { name: "Temporada", exact: true }).selectOption({ label: "Tulipán" });
    await page.getByRole("button", { name: "Guardar", exact: true }).first().click();
    await expect(page).toHaveURL("/panel/carrusel");

    const colores = Object.fromEntries(
      (await consultar<{ slug: string; color: string }>("SELECT slug, color FROM catalogos")).map((fila) => [fila.slug, fila.color]),
    );
    const sitio = page.getByTestId("sitio");
    const acento = () => sitio.evaluate((elemento) => (elemento as HTMLElement).style.getPropertyValue("--acento"));

    // Forzada: Tulipán.
    await elegirModo(page, "Forzar una temporada", "Tulipán");
    await page.goto("/");
    await expect(sitio).toHaveAttribute("data-temporada", "tulipan");
    expect((await acento()).toLowerCase()).toBe(colores.tulipan.toLowerCase());
    await expect(page.getByRole("heading", { level: 2, name: "Tulipán" })).toBeVisible();
    const carrusel = page.getByRole("region", { name: "Anuncios" });
    await expect(carrusel.getByText("Ver tulipanes")).toBeVisible();
    await menu(page).getByRole("link", { name: "Temporada", exact: true }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Tulipán" })).toBeVisible();
    await expect(page.getByRole("link", { name: /Tulipán del sitio/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /Helecho del sitio/ })).toHaveCount(0);

    // Forzada: Nochebuena. El sitio cambia al momento.
    await elegirModo(page, "Forzar una temporada", "Nochebuena");
    await page.goto("/temporada");
    await expect(sitio).toHaveAttribute("data-temporada", "nochebuena");
    expect((await acento()).toLowerCase()).toBe(colores.nochebuena.toLowerCase());
    await expect(page.getByRole("heading", { level: 1, name: "Nochebuena" })).toBeVisible();
    await expect(page.getByRole("link", { name: /Tulipán del sitio/ })).toHaveCount(0);
    await page.goto("/");
    await expect(page.getByText("Ver tulipanes")).toHaveCount(0);

    // Fijo en «Todo el año»: verde pino y las plantas de todo el año.
    await elegirModo(page, "Fijo en Todo el año");
    await page.goto("/temporada");
    await expect(sitio).toHaveAttribute("data-temporada", "todo-el-anio");
    await expect(page.getByRole("link", { name: /Helecho del sitio/ })).toBeVisible();

    await elegirModo(page, "Automática por fechas");
  });

  test("Contacto: datos, mapa, preguntas frecuentes y formulario con protección contra spam", async ({ page }) => {
    await page.goto("/panel/preguntas");
    await page.getByRole("button", { name: "Agregar pregunta" }).click();
    const nueva = page.getByRole("form", { name: "Nueva pregunta" });
    await nueva.getByLabel("Pregunta").fill("¿Tienen estacionamiento?");
    await nueva.getByLabel("Respuesta").fill("Sí, frente al vivero.");
    await nueva.getByRole("button", { name: "Agregar", exact: true }).click();
    await expect(nueva).toHaveCount(0);

    await page.goto("/contacto");
    const [datos] = await consultar<{ mapaSrc: string | null; direccion: string | null }>(
      "SELECT mapaSrc, direccion FROM datos_negocio WHERE id = 1",
    );
    if (datos.direccion) await expect(page.getByText(datos.direccion).first()).toBeVisible();
    if (datos.mapaSrc) await expect(page.locator("iframe")).toHaveAttribute("src", datos.mapaSrc);

    // Preguntas frecuentes al final, como acordeón.
    const respuesta = page.getByText("Sí, frente al vivero.");
    await expect(respuesta).toBeHidden();
    await page.getByText("¿Tienen estacionamiento?").click();
    await expect(respuesta).toBeVisible();

    const mensajes = async () =>
      Number((await consultar<{ n: bigint }>("SELECT COUNT(*) AS n FROM mensajes"))[0].n);
    const antes = await mensajes();
    const formulario = page.getByRole("form", { name: "Escríbenos un mensaje" });

    await formulario.getByRole("button", { name: "Enviar mensaje" }).click();
    await expect(formulario.getByText("Escribe tu nombre.")).toBeVisible();
    await formulario.getByLabel("Teléfono o correo").fill("abc");
    await formulario.getByRole("button", { name: "Enviar mensaje" }).click();
    await expect(formulario.getByText("Escribe un teléfono (con lada) o un correo válido.")).toBeVisible();

    // Una persona: tarda más de 3 segundos en escribir. Se guarda.
    await formulario.getByLabel("Tu nombre").fill("Rosa <b>Pérez</b>");
    await formulario.getByLabel("Teléfono o correo").fill("222 123 4567");
    await formulario.getByLabel("Mensaje").fill("¿Tienen nochebuenas blancas para diciembre?");
    await page.waitForTimeout(3200);
    await formulario.getByRole("button", { name: "Enviar mensaje" }).click();
    await expect(page.getByText("¡Gracias! Recibimos tu mensaje")).toBeVisible();
    expect(await mensajes()).toBe(antes + 1);
    const [guardado] = await consultar<{ nombre: string; contacto: string; leido: number }>(
      "SELECT nombre, contacto, leido FROM mensajes ORDER BY id DESC LIMIT 1",
    );
    expect(guardado).toEqual({ nombre: "Rosa Pérez", contacto: "222 123 4567", leido: 0 });

    // Un programa: llena el campo trampa. Parece enviado, pero no se guarda.
    await page.getByRole("button", { name: "Enviar otro mensaje" }).click();
    await formulario.getByLabel("Tu nombre").fill("Robot");
    await formulario.getByLabel("Teléfono o correo").fill("robot@example.com");
    await formulario.getByLabel("Mensaje").fill("Compre seguidores baratos ahora mismo.");
    await page.locator("#sitio-web").fill("https://spam.example.com", { force: true });
    await page.waitForTimeout(3200);
    await formulario.getByRole("button", { name: "Enviar mensaje" }).click();
    await expect(page.getByText("¡Gracias! Recibimos tu mensaje")).toBeVisible();

    // Otro programa: lo envía todo en menos de 3 segundos. Tampoco se guarda.
    await page.getByRole("button", { name: "Enviar otro mensaje" }).click();
    await formulario.getByLabel("Tu nombre").fill("Robot rápido");
    await formulario.getByLabel("Teléfono o correo").fill("robot@example.com");
    await formulario.getByLabel("Mensaje").fill("Mensaje escrito en un instante.");
    await formulario.getByRole("button", { name: "Enviar mensaje" }).click();
    await expect(page.getByText("¡Gracias! Recibimos tu mensaje")).toBeVisible();
    expect(await mensajes()).toBe(antes + 1);
  });

  test("SEO: título, Open Graph, mapa del sitio y robots", async ({ page, request }) => {
    const slugHelecho = await slugDe("Helecho del sitio");
    await page.goto(`/plantas/${slugHelecho}`);
    await expect(page).toHaveTitle("Helecho del sitio · Vivero El Encanto");
    await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", "Helecho del sitio: hojas grandes y muy verdes.");
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute("content", "Helecho del sitio");
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", /\/archivos\/plantas\/.+-g\.webp$/);
    await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute("content", "es_MX");
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", new RegExp(`/plantas/${slugHelecho}$`));

    await page.goto("/");
    await expect(page).toHaveTitle("Vivero El Encanto · Plantas en Atlixco, Puebla");

    const mapa = await (await request.get("/sitemap.xml")).text();
    expect(mapa).toContain(`/plantas/${slugHelecho}</loc>`);
    expect(mapa).toContain("/catalogos/todo-el-anio</loc>");
    expect(mapa).not.toContain("/panel");
    const robots = await (await request.get("/robots.txt")).text();
    expect(robots).toContain("Disallow: /panel");
    expect(robots).toContain("Sitemap: ");
  });

  test("con teclado, lo primero es «Saltar al contenido»", async ({ page }) => {
    await page.goto("/fertilizantes");
    await page.keyboard.press("Tab");
    const saltar = page.getByRole("link", { name: "Saltar al contenido" });
    await expect(saltar).toBeFocused();
    await expect(saltar).toBeVisible();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/#contenido$/);
  });

  test("con contenido real, las páginas del sitio cumplen WCAG 2.1 AA (computadora y celular)", async ({ page }) => {
    const rutas = ["/", "/catalogos", "/catalogos/todo-el-anio", "/plantas", "/temporada", "/fertilizantes", "/nosotros", "/contacto"];
    for (const ancho of [1280, 390]) {
      await page.setViewportSize({ width: ancho, height: 900 });
      for (const ruta of rutas) {
        await page.goto(ruta);
        await expect(page.getByRole("heading", { level: 1 })).toBeAttached();
        const resultado = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
        expect(resultado.violations, `${ruta} a ${ancho}px`).toEqual([]);
      }
    }
  });
});
