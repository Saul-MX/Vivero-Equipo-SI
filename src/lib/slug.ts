// Slugs: la parte de la dirección web que identifica algo («/plantas/nochebuena-roja-prestige»).
// Se crean UNA vez al dar de alta (planta o catálogo) y no cambian si después se cambia el nombre,
// para que los enlaces y los códigos QR impresos sigan funcionando.

/** «Nochebuena roja Prestige» → «nochebuena-roja-prestige» (sin acentos, ñ → n). */
export function crearSlug(texto: string, maximo = 80): string {
  const slug = texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, maximo)
    .replace(/-+$/, "");
  return slug || "sin-nombre";
}

/** Si el slug ya existe, prueba «-2», «-3», … hasta encontrar uno libre. */
export async function slugUnico(base: string, existe: (slug: string) => Promise<boolean>): Promise<string> {
  let candidato = base;
  for (let numero = 2; await existe(candidato); numero++) {
    candidato = `${base.slice(0, 74)}-${numero}`;
  }
  return candidato;
}
