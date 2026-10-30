// ¿Qué temporada se ve hoy en el sitio? (Reglas 1 y 2 de la especificación.)
//
// Función pura: recibe las temporadas, la configuración y el mes, y no consulta la base ni el reloj.
// Así se puede probar con cualquier fecha (e2e/temporada-vigente.spec.ts).

export type ModoTemporada = "AUTOMATICA" | "FORZADA" | "FIJA_TODO_EL_ANIO";

export type TemporadaParaCalculo = {
  id: number;
  mesInicio: number; // 1 = enero … 12 = diciembre
  mesFin: number;
  prioridad: number;
  visible: boolean;
  todoElAnio: boolean; // la temporada base («Todo el año»)
  ordenCatalogo: number; // posición de su catálogo en «Catálogos»: desempata
};

export type ConfiguracionTemporadas = {
  modo: ModoTemporada;
  temporadaForzadaId: number | null;
};

/**
 * - automatica: una temporada cuyas fechas incluyen el mes.
 * - base: ninguna aplicaba, se usa «Todo el año».
 * - forzada: el panel la eligió a mano.
 * - fija: modo «Fijo en Todo el año».
 */
export type MotivoTemporada = "automatica" | "base" | "forzada" | "fija";

/**
 * ¿El mes cae dentro de la temporada?
 * Si el mes de inicio es mayor que el de fin, la temporada cruza el año: nov → ene incluye
 * noviembre, diciembre y enero.
 */
export function incluyeMes(temporada: Pick<TemporadaParaCalculo, "mesInicio" | "mesFin" | "todoElAnio">, mes: number) {
  if (temporada.todoElAnio) return true;
  const { mesInicio, mesFin } = temporada;
  return mesInicio <= mesFin ? mes >= mesInicio && mes <= mesFin : mes >= mesInicio || mes <= mesFin;
}

export function calcularTemporadaVigente<T extends TemporadaParaCalculo>(
  temporadas: readonly T[],
  configuracion: ConfiguracionTemporadas,
  mes: number,
): { temporada: T | null; motivo: MotivoTemporada } {
  const base = temporadas.find((temporada) => temporada.todoElAnio) ?? null;

  // Modo fijo: se ignoran todas las temporadas y se usa «Todo el año».
  if (configuracion.modo === "FIJA_TODO_EL_ANIO") return { temporada: base, motivo: "fija" };

  // Modo forzado: siempre la elegida, sin importar la fecha (ni si está oculta).
  // Si la elegida ya no existe, se sigue como en el modo automático.
  if (configuracion.modo === "FORZADA") {
    const forzada = temporadas.find((temporada) => temporada.id === configuracion.temporadaForzadaId);
    if (forzada) return { temporada: forzada, motivo: "forzada" };
  }

  // Modo automático: las temporadas visibles que incluyen el mes. Gana la de mayor prioridad;
  // si empatan, la que va primero en «Catálogos». Las ocultas se ignoran.
  const candidatas = temporadas
    .filter((temporada) => temporada.visible && !temporada.todoElAnio && incluyeMes(temporada, mes))
    .sort((a, b) => b.prioridad - a.prioridad || a.ordenCatalogo - b.ordenCatalogo);

  if (candidatas.length > 0) return { temporada: candidatas[0], motivo: "automatica" };
  return { temporada: base, motivo: "base" };
}

/** Mes actual en la hora de Puebla, aunque el servidor esté en otra zona horaria. */
export function mesEnMexico(fecha: Date = new Date()): number {
  return Number(
    new Intl.DateTimeFormat("en-US", { timeZone: "America/Mexico_City", month: "numeric" }).format(fecha),
  );
}
