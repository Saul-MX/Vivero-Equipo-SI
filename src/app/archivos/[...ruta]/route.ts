import { createReadStream } from "node:fs";
import { readFile, stat } from "node:fs/promises";
import { Readable } from "node:stream";
import { rutaEnDisco } from "@/lib/archivos/almacen";
import { PATRON_ARCHIVO_PUBLICO } from "@/lib/archivos/claves";
import { obtenerSesion } from "@/lib/auth/sesion";

// Sirve las fotos, folletos y videos subidos desde el panel (están fuera de la carpeta del proyecto,
// así que Next no puede servirlos como archivos de «public/»).
// Solo responde a nombres con el formato exacto que genera el panel: nada de rutas arbitrarias.

const TIPOS: Record<string, string> = {
  "-g.webp": "image/webp",
  "-t.webp": "image/webp",
  ".pdf": "application/pdf",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
};

export async function GET(peticion: Request, { params }: RouteContext<"/archivos/[...ruta]">) {
  const relativa = (await params).ruta.join("/");
  const partes = relativa.match(PATRON_ARCHIVO_PUBLICO);
  if (!partes) return new Response(null, { status: 404 });

  const [, carpeta, , variante] = partes;
  // Lo temporal (subido pero aún sin guardar) solo lo ve quien tiene sesión en el panel.
  if (carpeta === "temporal" && !(await obtenerSesion())) {
    return new Response(null, { status: 404 });
  }

  const encabezados = {
    "Content-Type": TIPOS[variante],
    // Cada archivo tiene un nombre único que nunca cambia: se puede guardar en caché un año.
    "Cache-Control": carpeta === "temporal" ? "private, no-store" : "public, max-age=31536000, immutable",
    "X-Content-Type-Options": "nosniff",
  };
  const ruta = rutaEnDisco(relativa);

  if (variante === ".mp4" || variante === ".webm") {
    return servirVideo(peticion, ruta, encabezados);
  }

  let datos: Buffer;
  try {
    datos = await readFile(ruta);
  } catch {
    return new Response(null, { status: 404 });
  }
  return new Response(new Uint8Array(datos), { headers: encabezados });
}

/**
 * Los navegadores piden los videos por partes («Range»); Safari no los reproduce si el servidor
 * no lo permite. Se envía la parte pedida sin cargar todo el video en memoria.
 */
async function servirVideo(peticion: Request, ruta: string, encabezados: Record<string, string>) {
  let tamano: number;
  try {
    tamano = (await stat(ruta)).size;
  } catch {
    return new Response(null, { status: 404 });
  }

  const rango = peticion.headers.get("range")?.match(/^bytes=(\d*)-(\d*)$/);
  if (!rango || (!rango[1] && !rango[2])) {
    return new Response(cuerpo(ruta, 0, tamano - 1), {
      headers: { ...encabezados, "Accept-Ranges": "bytes", "Content-Length": String(tamano) },
    });
  }

  // «bytes=100-» (desde 100), «bytes=100-199» o «bytes=-500» (los últimos 500).
  const inicio = rango[1] ? Number(rango[1]) : Math.max(0, tamano - Number(rango[2]));
  const fin = rango[1] && rango[2] ? Math.min(Number(rango[2]), tamano - 1) : tamano - 1;
  if (inicio > fin || inicio >= tamano) {
    return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${tamano}` } });
  }
  return new Response(cuerpo(ruta, inicio, fin), {
    status: 206,
    headers: {
      ...encabezados,
      "Accept-Ranges": "bytes",
      "Content-Range": `bytes ${inicio}-${fin}/${tamano}`,
      "Content-Length": String(fin - inicio + 1),
    },
  });
}

function cuerpo(ruta: string, inicio: number, fin: number) {
  return Readable.toWeb(createReadStream(ruta, { start: inicio, end: fin })) as ReadableStream<Uint8Array>;
}
