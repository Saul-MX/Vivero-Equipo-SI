import { expect, test } from "@playwright/test";
import { esCodigoInicial, esHashDelCodigoInicial, generarCodigo, hashCodigo } from "../src/lib/auth/codigos";

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

test("el registro con Google reconoce el código inicial por su hash", () => {
  expect(esHashDelCodigoInicial(hashCodigo("vivero-inicio-2026"), "VIVERO-INICIO-2026")).toBe(true);
  expect(esHashDelCodigoInicial(hashCodigo("OTRO-CODIGO-2026"), "VIVERO-INICIO-2026")).toBe(false);
  // Un «hash» mal formado nunca se acepta (ni siquiera llega a compararse).
  expect(esHashDelCodigoInicial("no-es-un-hash", "VIVERO-INICIO-2026")).toBe(false);
  expect(esHashDelCodigoInicial(hashCodigo("CORTO-1"), "CORTO-1")).toBe(false);
});

// Hallazgo de la revisión (corregido): el valor de ejemplo de .env.example se aceptaba como código
// inicial; quien copiara la plantilla sin cambiarlo dejaba el panel abierto.
test("el código de ejemplo de .env.example nunca sirve como código inicial", () => {
  const ejemplo = "CAMBIA-ESTE-CODIGO-2026";
  expect(esCodigoInicial(ejemplo, ejemplo)).toBe(false);
  expect(esHashDelCodigoInicial(hashCodigo(ejemplo), ejemplo)).toBe(false);
});
