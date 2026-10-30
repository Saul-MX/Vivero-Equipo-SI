import { expect, test } from "@playwright/test";
import {
  calcularTemporadaVigente,
  incluyeMes,
  mesEnMexico,
  type ConfiguracionTemporadas,
  type TemporadaParaCalculo,
} from "../src/lib/temporadas/vigente";

// Pruebas unitarias (sin navegador) de la lógica de «temporada vigente».

type Temporada = TemporadaParaCalculo & { nombre: string };

/** Las temporadas iniciales, en el orden de «Catálogos». */
function temporadasIniciales(cambios: Partial<Record<string, Partial<Temporada>>> = {}): Temporada[] {
  const lista: Temporada[] = [
    { id: 1, nombre: "Nochebuena", mesInicio: 11, mesFin: 12, prioridad: 2, visible: true, todoElAnio: false, ordenCatalogo: 1 },
    { id: 2, nombre: "Tulipán", mesInicio: 1, mesFin: 3, prioridad: 1, visible: true, todoElAnio: false, ordenCatalogo: 2 },
    { id: 3, nombre: "Jacintos", mesInicio: 2, mesFin: 4, prioridad: 1, visible: true, todoElAnio: false, ordenCatalogo: 3 },
    { id: 4, nombre: "Cempasúchil", mesInicio: 10, mesFin: 11, prioridad: 1, visible: true, todoElAnio: false, ordenCatalogo: 4 },
    { id: 5, nombre: "Todo el año", mesInicio: 1, mesFin: 12, prioridad: 0, visible: true, todoElAnio: true, ordenCatalogo: 5 },
    { id: 6, nombre: "Árboles", mesInicio: 8, mesFin: 9, prioridad: 1, visible: true, todoElAnio: false, ordenCatalogo: 6 },
  ];
  return lista.map((temporada) => ({ ...temporada, ...cambios[temporada.nombre] }));
}

const AUTOMATICA: ConfiguracionTemporadas = { modo: "AUTOMATICA", temporadaForzadaId: null };

function vigente(temporadas: Temporada[], mes: number, configuracion = AUTOMATICA) {
  const resultado = calcularTemporadaVigente(temporadas, configuracion, mes);
  return { nombre: resultado.temporada?.nombre ?? null, motivo: resultado.motivo };
}

test("automática: cada mes del año con las temporadas iniciales", () => {
  const temporadas = temporadasIniciales();
  const esperado = [
    "Tulipán", "Tulipán", "Tulipán", "Jacintos", "Todo el año", "Todo el año",
    "Todo el año", "Árboles", "Árboles", "Cempasúchil", "Nochebuena", "Nochebuena",
  ];
  expect(esperado.map((_, indice) => vigente(temporadas, indice + 1).nombre)).toEqual(esperado);
});

test("si dos coinciden, gana la de mayor prioridad (noviembre: Nochebuena sobre Cempasúchil)", () => {
  expect(vigente(temporadasIniciales(), 11)).toEqual({ nombre: "Nochebuena", motivo: "automatica" });
  const subeCempasuchil = temporadasIniciales({ Cempasúchil: { prioridad: 5 } });
  expect(vigente(subeCempasuchil, 11).nombre).toBe("Cempasúchil");
});

test("empate de prioridad: gana la que va primero en Catálogos", () => {
  // Tulipán (posición 2) y Jacintos (posición 3) coinciden en febrero y marzo con prioridad 1.
  expect(vigente(temporadasIniciales(), 2).nombre).toBe("Tulipán");
  const jacintosPrimero = temporadasIniciales({ Jacintos: { ordenCatalogo: 1 }, Nochebuena: { ordenCatalogo: 3 } });
  expect(vigente(jacintosPrimero, 2).nombre).toBe("Jacintos");
  expect(vigente(jacintosPrimero, 3).nombre).toBe("Jacintos");
});

test("una temporada que cruza el año (noviembre a enero)", () => {
  const cruzaAnio = { mesInicio: 11, mesFin: 1, todoElAnio: false };
  expect([10, 11, 12, 1, 2].map((mes) => incluyeMes(cruzaAnio, mes))).toEqual([false, true, true, true, false]);

  const temporadas = temporadasIniciales({ Nochebuena: { mesInicio: 11, mesFin: 1, prioridad: 3 } });
  expect(vigente(temporadas, 1).nombre).toBe("Nochebuena"); // le gana a Tulipán por prioridad
  expect(vigente(temporadas, 2).nombre).toBe("Tulipán");
});

test("las temporadas ocultas se ignoran en el modo automático", () => {
  const sinCempasuchil = temporadasIniciales({ Cempasúchil: { visible: false } });
  expect(vigente(sinCempasuchil, 10)).toEqual({ nombre: "Todo el año", motivo: "base" });
  const sinNochebuena = temporadasIniciales({ Nochebuena: { visible: false } });
  expect(vigente(sinNochebuena, 11).nombre).toBe("Cempasúchil");
});

test("si ninguna aplica se usa «Todo el año»; sin temporada base no hay ninguna", () => {
  expect(vigente(temporadasIniciales(), 6)).toEqual({ nombre: "Todo el año", motivo: "base" });
  const sinBase = temporadasIniciales().filter((temporada) => !temporada.todoElAnio);
  expect(vigente(sinBase, 6)).toEqual({ nombre: null, motivo: "base" });
});

test("modo forzado: siempre la elegida, aunque no sea su fecha o esté oculta", () => {
  const forzarTulipan: ConfiguracionTemporadas = { modo: "FORZADA", temporadaForzadaId: 2 };
  expect(vigente(temporadasIniciales(), 10, forzarTulipan)).toEqual({ nombre: "Tulipán", motivo: "forzada" });
  const tulipanOculto = temporadasIniciales({ Tulipán: { visible: false } });
  expect(vigente(tulipanOculto, 7, forzarTulipan).nombre).toBe("Tulipán");
  // Si la elegida ya no existe, se comporta como el modo automático.
  const forzarInexistente: ConfiguracionTemporadas = { modo: "FORZADA", temporadaForzadaId: 99 };
  expect(vigente(temporadasIniciales(), 10, forzarInexistente)).toEqual({ nombre: "Cempasúchil", motivo: "automatica" });
});

test("modo fijo: siempre «Todo el año», sin importar el mes", () => {
  const fijo: ConfiguracionTemporadas = { modo: "FIJA_TODO_EL_ANIO", temporadaForzadaId: 2 };
  for (const mes of [1, 2, 10, 11, 12]) {
    expect(vigente(temporadasIniciales(), mes, fijo)).toEqual({ nombre: "Todo el año", motivo: "fija" });
  }
});

test("el mes se toma en la hora de Puebla, no en la del servidor", () => {
  // 1 de noviembre a las 03:00 en Londres (UTC) todavía es 31 de octubre en Puebla.
  expect(mesEnMexico(new Date("2026-11-01T03:00:00Z"))).toBe(10);
  expect(mesEnMexico(new Date("2026-11-01T08:00:00Z"))).toBe(11);
});
