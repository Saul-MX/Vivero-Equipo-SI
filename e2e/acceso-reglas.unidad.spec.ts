import { expect, test } from "@playwright/test";
import { ipDeLaPeticion } from "../src/lib/ip";
import { esquemaRegistro } from "../src/lib/validacion/cuenta";

// Reglas del acceso que no necesitan navegador ni base de datos.

const ip = (forwardedFor: string | null, proxies = 1, realIp: string | null = null) =>
  ipDeLaPeticion({ forwardedFor, realIp }, proxies);

test("la IP sale del final de X-Forwarded-For, donde la escribe el proxy", () => {
  // El atacante inventa lo del principio; el proxy del hosting agrega la IP real al final.
  expect(ip("203.0.113.1, 198.51.100.7")).toBe("198.51.100.7");
  expect(ip("1.1.1.1, 2.2.2.2, 198.51.100.7")).toBe("198.51.100.7");
  // Con un CDN y el hosting (2 proxies), la real es la penúltima.
  expect(ip("203.0.113.1, 198.51.100.7, 10.0.0.2", 2)).toBe("198.51.100.7");
  // Si el proxy reemplaza el encabezado, queda una sola: es la buena.
  expect(ip("198.51.100.7")).toBe("198.51.100.7");
  expect(ip(" 198.51.100.7 ,")).toBe("198.51.100.7");
});

test("sin X-Forwarded-For se usa X-Real-IP; sin nada, «desconocida»", () => {
  expect(ip(null, 1, "198.51.100.9")).toBe("198.51.100.9");
  expect(ip(null)).toBe("desconocida");
  expect(ip("   ")).toBe("desconocida");
  // Un valor raro de PROXIES_DE_CONFIANZA se trata como 1.
  expect(ip("203.0.113.1, 198.51.100.7", Number("no-es-numero"))).toBe("198.51.100.7");
  expect(ip("203.0.113.1, 198.51.100.7", 0)).toBe("198.51.100.7");
  expect(ip("x".repeat(100))).toHaveLength(64);
});

test("el registro rechaza usuarios con puntos al inicio, al final o seguidos", () => {
  const datos = (usuario: string) => ({
    codigo: "AAAA-BBBB-CCCC",
    usuario,
    contrasena: "contrasena-valida-1",
    repetirContrasena: "contrasena-valida-1",
  });
  for (const usuario of ["ana.", ".ana", "a..b"]) {
    const resultado = esquemaRegistro.safeParse(datos(usuario));
    expect(resultado.success, usuario).toBe(false);
    expect(resultado.error?.issues.map((i) => i.message), usuario).toContain("usuarioPuntos");
  }
  for (const usuario of ["ana.perez", "a.b.c", "ana_-1"]) {
    expect(esquemaRegistro.safeParse(datos(usuario)).success, usuario).toBe(true);
  }
});
