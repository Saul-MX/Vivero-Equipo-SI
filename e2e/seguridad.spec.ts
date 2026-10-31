import { expect, test } from "@playwright/test";
import { fotoDePrueba } from "./archivos-prueba";
import { nuevaVentanaSinSesion } from "./utilidades";

// Revisiones de seguridad que no se ven en pantalla.

test("las páginas llevan las cabeceras de seguridad", async ({ request }) => {
  for (const ruta of ["/", "/panel/ingresar"]) {
    const cabeceras = (await request.get(ruta)).headers();
    expect(cabeceras["x-content-type-options"], ruta).toBe("nosniff");
    expect(cabeceras["x-frame-options"], ruta).toBe("SAMEORIGIN");
    expect(cabeceras["referrer-policy"], ruta).toBe("strict-origin-when-cross-origin");
    expect(cabeceras["strict-transport-security"], ruta).toContain("max-age=31536000");
    const politica = cabeceras["content-security-policy"];
    expect(politica, ruta).toContain("default-src 'self'");
    expect(politica, ruta).toContain("frame-src https://www.google.com");
    expect(politica, ruta).toContain("object-src 'none'");
    expect(cabeceras["x-powered-by"], ruta).toBeUndefined();
  }
});

test.describe("subida de archivos (/panel/subir)", () => {
  const formulario = async (bytes?: number) => {
    const foto = await fotoDePrueba({ ancho: 200, alto: 200 });
    return { archivo: { ...foto, buffer: bytes ? Buffer.alloc(bytes, 1) : foto.buffer } };
  };

  test("con sesión y el encabezado del panel, acepta una foto", async ({ request }) => {
    const respuesta = await request.post("/panel/subir?tipo=imagen", {
      headers: { "x-vivero-subida": "1" },
      multipart: await formulario(),
    });
    expect(respuesta.status()).toBe(200);
    expect(await respuesta.json()).toMatchObject({ ok: true, clave: expect.stringMatching(/^temporal\//) });
  });

  test("sin el encabezado del panel (por ejemplo, desde otro sitio) se rechaza", async ({ request }) => {
    const respuesta = await request.post("/panel/subir?tipo=imagen", { multipart: await formulario() });
    expect(respuesta.status()).toBe(403);
  });

  test("sin sesión se rechaza", async ({ browser }) => {
    const { contexto, pagina } = await nuevaVentanaSinSesion(browser);
    const respuesta = await pagina.request.post("/panel/subir?tipo=imagen", {
      headers: { "x-vivero-subida": "1" },
      multipart: await formulario(),
      maxRedirects: 0,
    });
    expect([307, 401]).toContain(respuesta.status());
    await contexto.close();
  });

  test("un archivo de más de 15 MB se rechaza antes de leerlo", async ({ request }) => {
    const respuesta = await request.post("/panel/subir?tipo=imagen", {
      headers: { "x-vivero-subida": "1" },
      multipart: await formulario(16 * 1024 * 1024),
    });
    expect(respuesta.status()).toBe(413);
    expect(await respuesta.json()).toEqual({ ok: false, error: "archivoGrande" });
  });

  test("un tipo de subida desconocido se rechaza", async ({ request }) => {
    const respuesta = await request.post("/panel/subir?tipo=exe", {
      headers: { "x-vivero-subida": "1" },
      multipart: await formulario(),
    });
    expect(respuesta.status()).toBe(400);
  });
});

test("un archivo temporal (aún sin guardar) no lo ve quien no tiene sesión", async ({ request, browser }) => {
  const subida = await request.post("/panel/subir?tipo=imagen", {
    headers: { "x-vivero-subida": "1" },
    multipart: { archivo: await fotoDePrueba({ ancho: 200, alto: 200 }) },
  });
  const { clave } = (await subida.json()) as { clave: string };
  expect((await request.get(`/archivos/${clave}-t.webp`)).status()).toBe(200);
  const { contexto, pagina } = await nuevaVentanaSinSesion(browser);
  expect((await pagina.request.get(`/archivos/${clave}-t.webp`)).status()).toBe(404);
  expect((await pagina.request.get("/archivos/../.env")).status()).toBe(404);
  await contexto.close();
});
