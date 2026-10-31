import {
  guardarImagenTemporal,
  guardarPdfTemporal,
  guardarVideoTemporal,
  MAXIMO_BYTES,
  MAXIMO_BYTES_VIDEO,
} from "@/lib/archivos/almacen";
import { obtenerSesion } from "@/lib/auth/sesion";
import type { ClaveError } from "@/lib/resultado";

// Subida de archivos del panel (uno por envío). Va aparte de las acciones del servidor para que
// solo AQUÍ se acepten envíos grandes (videos de hasta 40 MB): antes de leer el archivo se revisa
// la sesión y el tamaño declarado. El archivo queda en «temporal/» hasta que se guarda el formulario.

export type ResultadoSubida =
  | { ok: true; clave: string; ancho?: number; alto?: number }
  | { ok: false; error: ClaveError };

const TIPOS = ["imagen", "imagenAnuncio", "pdf", "video"] as const;
type TipoSubida = (typeof TIPOS)[number];
const MARGEN_FORMULARIO = 64 * 1024; // lo que ocupa el envoltorio del formulario además del archivo

/** Encabezado que solo puede poner el propio panel (un sitio ajeno no puede enviarlo): evita CSRF. */
export const ENCABEZADO_SUBIDA = "x-vivero-subida";

const responder = (resultado: ResultadoSubida, status = 200) => Response.json(resultado, { status });

export async function POST(peticion: Request) {
  if (peticion.headers.get(ENCABEZADO_SUBIDA) !== "1") return new Response(null, { status: 403 });
  if (!(await obtenerSesion())) return new Response(null, { status: 401 });

  const tipo = new URL(peticion.url).searchParams.get("tipo") as TipoSubida;
  if (!TIPOS.includes(tipo)) return new Response(null, { status: 400 });
  const maximo = tipo === "video" ? MAXIMO_BYTES_VIDEO : MAXIMO_BYTES;
  const errorGrande: ClaveError = tipo === "video" ? "videoGrande" : "archivoGrande";

  // El tamaño se revisa ANTES de leer el cuerpo, para no recibir envíos enormes.
  const largo = Number(peticion.headers.get("content-length"));
  if (!Number.isFinite(largo) || largo <= 0) return new Response(null, { status: 411 });
  if (largo > maximo + MARGEN_FORMULARIO) return responder({ ok: false, error: errorGrande }, 413);

  let archivo: FormDataEntryValue | null;
  try {
    archivo = (await peticion.formData()).get("archivo");
  } catch {
    return responder({ ok: false, error: "subidaFallida" }, 400);
  }
  if (!(archivo instanceof File) || archivo.size === 0) return responder({ ok: false, error: "archivoRequerido" }, 400);
  if (archivo.size > maximo) return responder({ ok: false, error: errorGrande }, 413);
  const datos = Buffer.from(await archivo.arrayBuffer());

  if (tipo === "pdf") {
    const clave = await guardarPdfTemporal(datos);
    return clave ? responder({ ok: true, clave }) : responder({ ok: false, error: "pdfInvalido" }, 415);
  }
  if (tipo === "video") {
    const clave = await guardarVideoTemporal(datos);
    return clave ? responder({ ok: true, clave }) : responder({ ok: false, error: "videoInvalido" }, 415);
  }
  const imagen = await guardarImagenTemporal(datos, tipo === "imagenAnuncio" ? "anuncio" : "normal");
  if (!imagen) return responder({ ok: false, error: tipo === "imagenAnuncio" ? "imagenAnuncioInvalida" : "imagenInvalida" }, 415);
  return responder({ ok: true, ...imagen });
}
