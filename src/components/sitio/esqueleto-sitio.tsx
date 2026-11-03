import { CONTENEDOR } from "./encabezado";

/**
 * Lo que se ve el primer instante mientras carga una página con contenido variable. Ocupa toda la
 * pantalla para que el pie no «brinque» cuando llega el contenido (Lighthouse lo mide como CLS).
 */
export function EsqueletoSitio() {
  return (
    <div aria-hidden className={`${CONTENEDOR} min-h-dvh animate-pulse pt-14`}>
      <div className="h-4 w-32 rounded-full bg-muted" />
      <div className="mt-4 h-12 w-2/3 rounded-2xl bg-muted" />
      <div className="mt-4 h-5 w-1/2 rounded-full bg-muted" />
      <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4">
        {[1, 2, 3, 4].map((n) => (
          <div key={n} className="aspect-4/5 rounded-md bg-muted" />
        ))}
      </div>
    </div>
  );
}
