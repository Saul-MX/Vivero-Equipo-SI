import { readFile } from "node:fs/promises";
import { rutaEnDisco } from "@/lib/archivos/almacen";
import { PATRON_ARCHIVO_PUBLICO } from "@/lib/archivos/claves";
import { obtenerSesion } from "@/lib/auth/sesion";

// Sirve las fotos y folletos subidos desde el panel (están fuera de la carpeta del proyecto,
// así que Next no puede servirlos como archivos de «public/»).
// Solo responde a nombres con el formato exacto que genera el panel: nada de rutas arbitrarias.
export async function GET(_peticion: Request, { params }: RouteContext<"/archivos/[...ruta]">) {
  const relativa = (await params).ruta.join("/");
  const partes = relativa.match(PATRON_ARCHIVO_PUBLICO);
  if (!partes) return new Response(null, { status: 404 });

  const [, carpeta, , variante] = partes;
  // Lo temporal (subido pero aún sin guardar) solo lo ve quien tiene sesión en el panel.
  if (carpeta === "temporal" && !(await obtenerSesion())) {
    return new Response(null, { status: 404 });
  }

  let datos: Buffer;
  try {
    datos = await readFile(rutaEnDisco(relativa));
  } catch {
    return new Response(null, { status: 404 });
  }

  return new Response(new Uint8Array(datos), {
    headers: {
      "Content-Type": variante === ".pdf" ? "application/pdf" : "image/webp",
      // Cada archivo tiene un nombre único que nunca cambia: se puede guardar en caché un año.
      "Cache-Control": carpeta === "temporal" ? "private, no-store" : "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
