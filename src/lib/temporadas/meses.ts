// Nombres de los meses en el idioma del sitio (sin escribirlos a mano: así funcionan en inglés también).

export const MESES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;

/** 11 → «Noviembre» (o «noviembre» con mayuscula: false). */
export function nombreMes(mes: number, idioma: string, { mayuscula = true } = {}): string {
  const nombre = new Intl.DateTimeFormat(idioma, { month: "long", timeZone: "UTC" }).format(
    new Date(Date.UTC(2026, mes - 1, 15)),
  );
  return mayuscula ? nombre.charAt(0).toLocaleUpperCase(idioma) + nombre.slice(1) : nombre;
}
