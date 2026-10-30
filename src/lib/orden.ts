// Listas ordenables del panel (preguntas, testimonios, anuncios): subir o bajar un elemento.

/**
 * Devuelve los ids en su nuevo orden tras mover `id` una posición, o null si no se puede
 * (no existe, o ya está hasta arriba / hasta abajo).
 */
export function moverId(ids: number[], id: number, direccion: "subir" | "bajar"): number[] | null {
  const actual = ids.indexOf(id);
  const destino = direccion === "subir" ? actual - 1 : actual + 1;
  if (actual < 0 || destino < 0 || destino >= ids.length) return null;
  const nuevos = [...ids];
  [nuevos[actual], nuevos[destino]] = [nuevos[destino], nuevos[actual]];
  return nuevos;
}
