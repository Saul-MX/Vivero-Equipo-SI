// Color de acento del sitio: el de la temporada que se ve hoy (regla 3 de la especificación).
// Funciones puras para que cualquier color que se elija en el panel se lea bien (WCAG AA).

export const TEXTO_CLARO = "#ffffff";
export const TEXTO_OSCURO = "#0f1f17"; // verde bosque de la paleta
const PINO = "#1e3a2e";
const CONTRASTE_MINIMO = 4.5;

/** Luminancia relativa (WCAG 2.1) de un color «#RRGGBB». */
export function luminancia(hex: string): number {
  const canales = [1, 3, 5].map((inicio) => parseInt(hex.slice(inicio, inicio + 2), 16) / 255);
  const [r, g, b] = canales.map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Contraste WCAG entre dos colores (de 1 a 21). */
export function contraste(a: string, b: string): number {
  const [claro, oscuro] = [luminancia(a), luminancia(b)].sort((x, y) => y - x);
  return (claro + 0.05) / (oscuro + 0.05);
}

/** Texto blanco o verde bosque: el que se lea mejor sobre `fondo`. */
export function colorTextoSobre(fondo: string): string {
  return contraste(fondo, TEXTO_CLARO) >= contraste(fondo, TEXTO_OSCURO) ? TEXTO_CLARO : TEXTO_OSCURO;
}

function oscurecer(hex: string, cantidad: number): string {
  const canal = (inicio: number) =>
    Math.round(parseInt(hex.slice(inicio, inicio + 2), 16) * (1 - cantidad))
      .toString(16)
      .padStart(2, "0");
  return `#${canal(1)}${canal(3)}${canal(5)}`;
}

/**
 * Fondo para poner texto encima (botones, insignias). Si el color de la temporada es un tono medio
 * con el que ningún texto alcanza el contraste mínimo (por ejemplo, el rosa de Tulipán), se oscurece
 * apenas lo necesario. El color exacto se sigue usando en franjas, puntos y bordes.
 */
export function fondoLegible(color: string): string {
  let fondo = color.toLowerCase();
  for (let paso = 1; contraste(fondo, colorTextoSobre(fondo)) < CONTRASTE_MINIMO && paso <= 20; paso++) {
    fondo = oscurecer(color, paso * 0.04);
  }
  return fondo;
}

/** Variables CSS del acento para envolver el sitio. Un color mal escrito se cambia por verde pino. */
export function variablesAcento(color: string | null | undefined): Record<string, string> {
  const valido = color && /^#[0-9a-fA-F]{6}$/.test(color) ? color : PINO;
  const fondo = fondoLegible(valido);
  return { "--acento": valido, "--acento-fondo": fondo, "--acento-texto": colorTextoSobre(fondo) };
}
