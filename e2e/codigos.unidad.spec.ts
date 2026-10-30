import { expect, test } from "@playwright/test";
import { esCodigoInicial, generarCodigo, hashCodigo } from "../src/lib/auth/codigos";

// Pruebas de las funciones de códigos de invitación (no necesitan navegador).

test("los códigos tienen el formato XXXX-XXXX-XXXX sin caracteres confusos", () => {
  for (let i = 0; i < 100; i++) {
    expect(generarCodigo()).toMatch(/^[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/);
  }
});

test("un código se acepta sin importar mayúsculas, espacios o guiones", () => {
  expect(hashCodigo(" ab12 cd34-ef56 ")).toBe(hashCodigo("AB12-CD34-EF56"));
  expect(hashCodigo("AB12-CD34-EF56")).not.toBe(hashCodigo("AB12-CD34-EF57"));
});

test("el código inicial del .env exige al menos 12 caracteres", () => {
  expect(esCodigoInicial("vivero-inicio-2026", "VIVERO-INICIO-2026")).toBe(true);
  expect(esCodigoInicial("OTRO-CODIGO-2026", "VIVERO-INICIO-2026")).toBe(false);
  expect(esCodigoInicial("CORTO-1", "CORTO-1")).toBe(false);
  expect(esCodigoInicial("CUALQUIERA", undefined)).toBe(false);
});
