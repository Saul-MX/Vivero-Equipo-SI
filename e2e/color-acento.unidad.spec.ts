import { expect, test } from "@playwright/test";
import {
  colorTextoSobre,
  contraste,
  degradadoTemporada,
  fondoLegible,
  TEXTO_CLARO,
  TEXTO_OSCURO,
  variablesAcento,
} from "../src/lib/sitio/color";

// Colores iniciales de cada temporada (prisma/seed.ts) y algunos más que se podrían elegir en el panel.
const COLORES = {
  Nochebuena: "#B3261E",
  Tulipán: "#D63A7A",
  Jacintos: "#3F4BA8",
  Cempasúchil: "#E8710A",
  "Todo el año": "#1E3A2E",
  Árboles: "#4C7A3D",
  Amarillo: "#F2C94C",
  Blanco: "#FFFFFF",
  Gris: "#808080",
  Morado: "#9C6ADE",
};

test("el contraste se calcula como en WCAG", () => {
  expect(contraste("#000000", "#ffffff")).toBeCloseTo(21, 0);
  expect(contraste("#ffffff", "#ffffff")).toBeCloseTo(1, 5);
});

test("con cualquier color de temporada, el texto de botones e insignias cumple WCAG AA (4.5)", () => {
  for (const [nombre, color] of Object.entries(COLORES)) {
    const { "--acento-fondo": fondo, "--acento-texto": texto } = variablesAcento(color);
    expect(contraste(fondo, texto), nombre).toBeGreaterThanOrEqual(4.5);
  }
});

test("si el color ya se lee bien, no se toca; si es un tono medio, se oscurece poco", () => {
  expect(fondoLegible("#B3261E")).toBe("#b3261e");
  expect(fondoLegible("#1E3A2E")).toBe("#1e3a2e");
  const tulipan = fondoLegible("#D63A7A");
  expect(tulipan).not.toBe("#d63a7a");
  expect(contraste(tulipan, TEXTO_CLARO)).toBeGreaterThanOrEqual(4.5);
  expect(contraste(tulipan, "#d63a7a")).toBeLessThan(1.5); // sigue siendo «el mismo rosa»
});

test("colores oscuros llevan texto blanco; claros, texto verde bosque", () => {
  expect(colorTextoSobre("#1E3A2E")).toBe(TEXTO_CLARO);
  expect(colorTextoSobre("#B3261E")).toBe(TEXTO_CLARO);
  expect(colorTextoSobre("#F2C94C")).toBe(TEXTO_OSCURO);
  expect(colorTextoSobre("#E8710A")).toBe(TEXTO_OSCURO);
});

test("un color mal escrito no rompe el sitio: se usa el verde pino", () => {
  expect(variablesAcento("rojo")["--acento"]).toBe("#1e3a2e");
  expect(variablesAcento(null)["--acento-texto"]).toBe(TEXTO_CLARO);
  expect(variablesAcento("#D63A7A")["--acento"]).toBe("#D63A7A");
});

test("la tarjeta de temporada del panel se lee bien en los dos extremos del degradado", () => {
  for (const [nombre, color] of Object.entries(COLORES)) {
    const { desde, hasta, texto } = degradadoTemporada(color);
    expect(contraste(desde, texto), `${nombre} (inicio)`).toBeGreaterThanOrEqual(4.5);
    expect(contraste(hasta, texto), `${nombre} (final)`).toBeGreaterThanOrEqual(4.5);
  }
});
