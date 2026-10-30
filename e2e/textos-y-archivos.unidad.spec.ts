import { expect, test } from "@playwright/test";
import { esClaveTemporal, esClaveValida, esClaveVideo, PATRON_ARCHIVO_PUBLICO } from "../src/lib/archivos/claves";
import { texto } from "../src/lib/validacion/comunes";
import { limpiarTexto } from "../src/lib/validacion/limpiar-texto";

const UUID = "0b8f6a7e-3c1d-4e2f-9a8b-7c6d5e4f3a2b";

test("los textos se guardan sin HTML ni caracteres invisibles", () => {
  expect(limpiarTexto("<b>Hola</b> <script>alert(1)</script>mundo")).toBe("Hola alert(1)mundo");
  expect(limpiarTexto('<img src=x onerror="alert(1)">Foto')).toBe("Foto");
  expect(limpiarTexto("Ca​sa﻿\u0007")).toBe("Casa");
  expect(limpiarTexto("Uno\r\nDos\rTres")).toBe("Uno\nDos\nTres");
});

test("la limpieza respeta el texto normal", () => {
  expect(limpiarTexto("Riega si la tierra mide < 5 cm de humedad y 3 > 2")).toBe(
    "Riega si la tierra mide < 5 cm de humedad y 3 > 2",
  );
  expect(limpiarTexto("Párrafo uno.\n\n\n\nPárrafo dos.  \nSigue")).toBe("Párrafo uno.\n\nPárrafo dos.\nSigue");
  // Una «é» escrita como «e» + acento se guarda como una sola letra (así se encuentra al buscar).
  expect(limpiarTexto("Café")).toBe("Café");
});

test("los campos de texto del panel aplican la limpieza y el largo máximo", () => {
  expect(texto(20).parse("  <i>Nochebuena</i>  ")).toBe("Nochebuena");
  expect(texto(5).safeParse("<b>abc</b>").success).toBe(true); // el largo se mide ya limpio
  expect(texto(5).safeParse("abcdef").success).toBe(false);
});

test("claves de archivo: fotos, videos y carpetas permitidas", () => {
  expect(esClaveValida(`anuncios/${UUID}`)).toBe(true);
  expect(esClaveValida(`anuncios/${UUID}.mp4`)).toBe(true);
  expect(esClaveValida(`testimonios/${UUID}`)).toBe(true);
  expect(esClaveValida(`nosotros/${UUID}.webm`)).toBe(true);
  expect(esClaveValida(`otra/${UUID}`)).toBe(false);
  expect(esClaveValida(`anuncios/${UUID}.exe`)).toBe(false);
  expect(esClaveValida(`anuncios/../${UUID}`)).toBe(false);
  expect(esClaveTemporal(`temporal/${UUID}.webm`)).toBe(true);
  expect(esClaveVideo(`anuncios/${UUID}.webm`)).toBe(true);
  expect(esClaveVideo(`anuncios/${UUID}`)).toBe(false);
});

test("solo se sirven los nombres de archivo que genera el panel", () => {
  expect(PATRON_ARCHIVO_PUBLICO.test(`anuncios/${UUID}.mp4`)).toBe(true);
  expect(PATRON_ARCHIVO_PUBLICO.test(`anuncios/${UUID}-g.webp`)).toBe(true);
  expect(PATRON_ARCHIVO_PUBLICO.test(`anuncios/${UUID}.html`)).toBe(false);
  expect(PATRON_ARCHIVO_PUBLICO.test(`anuncios/${UUID}.mp4.html`)).toBe(false);
});
