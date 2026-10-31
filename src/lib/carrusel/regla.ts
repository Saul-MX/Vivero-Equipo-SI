// ¿Qué anuncios del carrusel salen hoy en la portada? (Regla 6 de la especificación.)
//
// Un anuncio sale si: está visible, es de «Siempre» o de la temporada que se ve hoy,
// y la fecha de hoy cae dentro de Desde y Hasta (si se definieron; ambas fechas cuentan).
// Se ordenan por su campo «orden».
//
// Función pura: no consulta la base ni el reloj, así se prueba con cualquier fecha
// (e2e/carrusel-regla.unidad.spec.ts).

export type AnuncioParaRegla = {
  id: number;
  visible: boolean;
  temporadaId: number | null; // null = «Siempre»
  desde: string | null; // «AAAA-MM-DD»
  hasta: string | null;
  orden: number;
};

export function saleHoy(anuncio: AnuncioParaRegla, temporadaVigenteId: number | null, hoy: string): boolean {
  if (!anuncio.visible) return false;
  if (anuncio.temporadaId !== null && anuncio.temporadaId !== temporadaVigenteId) return false;
  // Las fechas «AAAA-MM-DD» se pueden comparar como texto.
  if (anuncio.desde !== null && hoy < anuncio.desde) return false;
  if (anuncio.hasta !== null && hoy > anuncio.hasta) return false;
  return true;
}

export function anunciosDeHoy<T extends AnuncioParaRegla>(
  anuncios: T[],
  temporadaVigenteId: number | null,
  hoy: string,
): T[] {
  return anuncios
    .filter((anuncio) => saleHoy(anuncio, temporadaVigenteId, hoy))
    .sort((a, b) => a.orden - b.orden || a.id - b.id);
}

/** La fecha de hoy («AAAA-MM-DD») en Puebla, no en la hora del servidor. */
export function fechaEnMexico(fecha: Date = new Date()): string {
  // El formato «en-CA» da justo AAAA-MM-DD.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Mexico_City",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(fecha);
}
