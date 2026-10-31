import { expect, test } from "@playwright/test";
import { enlaceDeDestino, normalizarDestino } from "../src/lib/carrusel/destino";
import { anunciosDeHoy, fechaEnMexico, saleHoy, type AnuncioParaRegla } from "../src/lib/carrusel/regla";

// Temporadas de ejemplo: 1 = Nochebuena (la vigente en estas pruebas), 2 = Tulipán.
const NOCHEBUENA = 1;
const TULIPAN = 2;
const HOY = "2026-11-15";

const anuncio = (cambios: Partial<AnuncioParaRegla> = {}): AnuncioParaRegla => ({
  id: 1,
  visible: true,
  temporadaId: null,
  desde: null,
  hasta: null,
  orden: 1,
  ...cambios,
});

test("«Siempre», visible y sin fechas: sale todos los días", () => {
  expect(saleHoy(anuncio(), NOCHEBUENA, HOY)).toBe(true);
  expect(saleHoy(anuncio(), null, "2027-03-01")).toBe(true);
});

test("oculto nunca sale", () => {
  expect(saleHoy(anuncio({ visible: false }), NOCHEBUENA, HOY)).toBe(false);
});

test("de una temporada: solo mientras esa temporada es la que se ve hoy", () => {
  expect(saleHoy(anuncio({ temporadaId: NOCHEBUENA }), NOCHEBUENA, HOY)).toBe(true);
  expect(saleHoy(anuncio({ temporadaId: TULIPAN }), NOCHEBUENA, HOY)).toBe(false);
  expect(saleHoy(anuncio({ temporadaId: TULIPAN }), null, HOY)).toBe(false);
});

test("fechas Desde y Hasta: cuentan los dos días de la orilla", () => {
  const conFechas = anuncio({ desde: "2026-11-15", hasta: "2026-12-24" });
  expect(saleHoy(conFechas, null, "2026-11-14")).toBe(false);
  expect(saleHoy(conFechas, null, "2026-11-15")).toBe(true);
  expect(saleHoy(conFechas, null, "2026-12-24")).toBe(true);
  expect(saleHoy(conFechas, null, "2026-12-25")).toBe(false);
});

test("solo Desde o solo Hasta", () => {
  expect(saleHoy(anuncio({ desde: "2026-12-01" }), null, HOY)).toBe(false);
  expect(saleHoy(anuncio({ desde: "2026-12-01" }), null, "2027-06-01")).toBe(true);
  expect(saleHoy(anuncio({ hasta: "2026-11-01" }), null, HOY)).toBe(false);
  expect(saleHoy(anuncio({ hasta: "2026-11-30" }), null, HOY)).toBe(true);
});

test("deben cumplirse todas: temporada correcta pero fuera de fechas no sale", () => {
  expect(saleHoy(anuncio({ temporadaId: NOCHEBUENA, hasta: "2026-11-10" }), NOCHEBUENA, HOY)).toBe(false);
});

test("la lista de hoy filtra y respeta el orden", () => {
  const lista = [
    anuncio({ id: 1, orden: 3 }),
    anuncio({ id: 2, orden: 1, temporadaId: TULIPAN }),
    anuncio({ id: 3, orden: 2, temporadaId: NOCHEBUENA }),
    anuncio({ id: 4, orden: 0, visible: false }),
    anuncio({ id: 5, orden: 2 }),
  ];
  expect(anunciosDeHoy(lista, NOCHEBUENA, HOY).map((a) => a.id)).toEqual([3, 5, 1]);
});

test("«hoy» es la fecha de Puebla, no la del servidor", () => {
  // 15 de noviembre, 2:00 de la mañana en UTC = todavía 14 de noviembre en Puebla.
  expect(fechaEnMexico(new Date("2026-11-15T02:00:00Z"))).toBe("2026-11-14");
  expect(fechaEnMexico(new Date("2026-11-15T18:00:00Z"))).toBe("2026-11-15");
});

test("«Lleva a» acepta páginas del sitio, whatsapp y https://", () => {
  expect(normalizarDestino("/catalogos")).toBe("/catalogos");
  expect(normalizarDestino(" /plantas/nochebuena-roja?foto=2#fotos ")).toBe("/plantas/nochebuena-roja?foto=2#fotos");
  expect(normalizarDestino("WhatsApp")).toBe("whatsapp");
  expect(normalizarDestino("https://www.facebook.com/vivero")).toBe("https://www.facebook.com/vivero");
});

test("«Lleva a» rechaza lo demás", () => {
  for (const malo of [
    "",
    "catalogos",
    "http://example.com",
    "javascript:alert(1)",
    "JavaScript://%0aalert(1)",
    "mailto:hola@example.com",
    "//otro-sitio.com",
    "/ruta con espacios",
    "/<script>",
    "https://localhost",
    "https://usuario:clave@example.com",
  ]) {
    expect(normalizarDestino(malo), malo).toBeNull();
  }
});

test("enlace final de cada destino", () => {
  const whatsapp = "https://wa.me/522441234567";
  expect(enlaceDeDestino("whatsapp", whatsapp)).toEqual({ href: whatsapp, externo: true });
  expect(enlaceDeDestino("whatsapp", null)).toBeNull(); // sin número en «Datos y redes»
  expect(enlaceDeDestino("/contacto", whatsapp)).toEqual({ href: "/contacto", externo: false });
  expect(enlaceDeDestino("https://example.com/", whatsapp)).toEqual({ href: "https://example.com/", externo: true });
});
