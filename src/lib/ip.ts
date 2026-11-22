// IP de quien hace la petición, a partir de los encabezados que pone el proxy del hosting.
// Función pura (sin Next) para poder probarla por separado.
//
// «X-Forwarded-For» es una lista «cliente, proxy1, proxy2…» y cada proxy AGREGA al final la IP de quien
// le habló. Lo que está al principio lo puede escribir cualquiera (basta mandar el encabezado), así que
// no sirve. Con N proxies de confianza delante de la app, la IP real es la N-ésima contando desde el
// final: la que escribió nuestro proxy más externo.

export function ipDeLaPeticion(
  encabezados: { forwardedFor: string | null; realIp: string | null },
  proxiesDeConfianza: number,
): string {
  const lista = (encabezados.forwardedFor ?? "")
    .split(",")
    .map((parte) => parte.trim())
    .filter(Boolean);
  const saltos = Number.isInteger(proxiesDeConfianza) && proxiesDeConfianza > 0 ? proxiesDeConfianza : 1;
  // Si la lista es más corta que los proxies configurados, se toma la primera: es la que escribió el
  // proxy de confianza más cercano al cliente (ninguna parte vino del cliente).
  const ip = lista.length > 0 ? lista[Math.max(0, lista.length - saltos)] : encabezados.realIp?.trim();
  return (ip || "desconocida").slice(0, 64);
}
