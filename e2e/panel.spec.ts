import { expect, test, type Page } from "@playwright/test";
import { ADMIN } from "./datos";
import { nuevaVentanaSinSesion } from "./utilidades";

const PANTALLAS = [
  { menu: "Plantas", titulo: "Plantas", ruta: "/panel/plantas" },
  { menu: "Catálogos", titulo: "Catálogos", ruta: "/panel/catalogos" },
  { menu: "Temporadas", titulo: "Temporadas", ruta: "/panel/temporadas" },
  { menu: "Fertilizantes", titulo: "Fertilizantes", ruta: "/panel/fertilizantes" },
  { menu: "Carrusel de portada", titulo: "Carrusel de portada", ruta: "/panel/carrusel" },
  { menu: "Nosotros", titulo: "Nosotros", ruta: "/panel/nosotros" },
  { menu: "Preguntas frecuentes", titulo: "Preguntas frecuentes", ruta: "/panel/preguntas" },
  { menu: "Testimonios", titulo: "Testimonios", ruta: "/panel/testimonios" },
  { menu: "Novedades", titulo: "Novedades", ruta: "/panel/novedades" },
  { menu: "Mensajes", titulo: "Mensajes", ruta: "/panel/mensajes" },
  { menu: "Datos y redes", titulo: "Datos y redes", ruta: "/panel/datos-y-redes" },
  { menu: "Mi cuenta", titulo: "Mi cuenta", ruta: "/panel/mi-cuenta" },
  { menu: "Inicio", titulo: `Hola, ${ADMIN.usuario}`, ruta: "/panel" },
];

test("el menú lateral tiene sus grupos y lleva a cada pantalla", async ({ page }) => {
  await page.goto("/panel");
  const menu = page.getByRole("navigation", { name: "Menú del panel" });

  for (const grupo of ["Catálogo", "Apartados de página", "Otros"]) {
    await expect(menu.getByText(grupo, { exact: true })).toBeVisible();
  }

  for (const pantalla of PANTALLAS) {
    const enlace = menu.getByRole("link", { name: pantalla.menu, exact: true });
    await enlace.click();
    await expect(page).toHaveURL(pantalla.ruta);
    await expect(page.getByRole("heading", { level: 1, name: pantalla.titulo })).toBeVisible();
    await expect(enlace).toHaveAttribute("aria-current", "page");
  }
});

test("«Ver el sitio» abre la página principal en otra pestaña", async ({ page }) => {
  await page.goto("/panel");
  const enlace = page
    .getByRole("navigation", { name: "Menú del panel" })
    .getByRole("link", { name: /Ver el sitio/ });
  await expect(enlace).toHaveAttribute("href", "/");
  await expect(enlace).toHaveAttribute("target", "_blank");
});

test.describe("en celular", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("el menú se abre con un botón y se cierra al elegir una opción", async ({ page }) => {
    await page.goto("/panel");
    await page.getByRole("button", { name: "Abrir menú" }).click();

    const menu = page.getByRole("dialog");
    await menu.getByRole("link", { name: "Plantas", exact: true }).click();

    await expect(page).toHaveURL("/panel/plantas");
    await expect(menu).toBeHidden();
    await expect(page.getByRole("heading", { level: 1, name: "Plantas" })).toBeVisible();
  });

  test("las pantallas no se salen de lo ancho de la pantalla", async ({ page, browser }) => {
    const medirAncho = async (pagina: Page, ruta: string) => {
      await pagina.goto(ruta);
      await expect(pagina).toHaveURL(ruta);
      await expect(pagina.getByRole("heading", { level: 1 })).toBeVisible();
      const anchoContenido = await pagina.evaluate(() => document.documentElement.scrollWidth);
      expect(anchoContenido, ruta).toBeLessThanOrEqual(390);
    };

    for (const ruta of [
      "/panel",
      "/panel/plantas",
      "/panel/plantas/nueva",
      "/panel/catalogos",
      "/panel/catalogos/nuevo",
      "/panel/temporadas",
      "/panel/fertilizantes",
      "/panel/fertilizantes/nuevo",
      "/panel/carrusel",
      "/panel/carrusel?pestana=archivos",
      "/panel/carrusel/nuevo",
      "/panel/nosotros",
      "/panel/preguntas",
      "/panel/testimonios",
      "/panel/novedades",
      "/panel/novedades/nueva",
      "/panel/mensajes",
      "/panel/mi-cuenta",
      "/panel/datos-y-redes",
      // Sitio público
      "/",
      "/catalogos",
      "/plantas",
      "/temporada",
      "/fertilizantes",
      "/nosotros",
      "/contacto",
    ]) {
      await medirAncho(page, ruta);
    }

    // «Entrar» y «Crear cuenta» se revisan sin sesión (con sesión, el sitio manda directo al panel).
    const sinSesion = await nuevaVentanaSinSesion(browser);
    await sinSesion.pagina.setViewportSize({ width: 390, height: 844 });
    for (const ruta of ["/panel/ingresar", "/panel/registro"]) {
      await medirAncho(sinSesion.pagina, ruta);
    }
    await sinSesion.contexto.close();
  });
});
