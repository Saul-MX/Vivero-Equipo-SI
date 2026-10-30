import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, readdir, rename, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { type Carpeta, esClaveTemporal, sufijosDe, type TipoArchivo } from "./claves";

// Archivos subidos desde el panel (fotos y folletos PDF).
//
// Se guardan FUERA del proyecto, en la carpeta de UPLOADS_DIR: en Hostinger cada despliegue crea una
// carpeta nueva para la app y lo que estuviera dentro se pierde. En tu computadora, por defecto, es «archivos/».
//
// Flujo: el archivo se sube en cuanto se elige y queda en «temporal/»; al guardar el formulario se
// mueve a su carpeta final («plantas/», «catalogos/», …). Lo temporal de más de 24 horas se borra solo.

export const MAXIMO_BYTES = 15 * 1024 * 1024;
const LADO_GRANDE = 1600; // fichas y portadas
const LADO_TARJETA = 640; // tarjetas y listas (versión ligera)
const VIDA_TEMPORAL_MS = 24 * 60 * 60 * 1000;

export function carpetaRaiz(): string {
  return path.resolve(process.env.UPLOADS_DIR || "archivos");
}

/** Ruta en disco de un archivo, sin permitir salirse de la carpeta raíz. */
export function rutaEnDisco(relativa: string): string {
  const raiz = carpetaRaiz();
  const ruta = path.resolve(raiz, relativa);
  if (!ruta.startsWith(raiz + path.sep)) throw new Error("Ruta de archivo no permitida");
  return ruta;
}

async function nuevaClaveTemporal(): Promise<string> {
  await mkdir(path.dirname(rutaEnDisco("temporal/x")), { recursive: true });
  void limpiarTemporales();
  return `temporal/${randomUUID()}`;
}

export type ImagenGuardada = { clave: string; ancho: number; alto: number };

/**
 * Revisa que sea una imagen JPG, PNG o WebP de verdad (leyendo el archivo, no su nombre),
 * la endereza según la foto del celular y la guarda en dos tamaños WebP.
 * sharp descarta los metadatos de la foto (incluida la ubicación GPS).
 */
export async function guardarImagenTemporal(datos: Buffer): Promise<ImagenGuardada | null> {
  let formato: string | undefined;
  try {
    formato = (await sharp(datos).metadata()).format;
  } catch {
    return null;
  }
  if (!formato || !["jpeg", "png", "webp"].includes(formato)) return null;

  const clave = await nuevaClaveTemporal();
  const original = sharp(datos, { failOn: "error" }).rotate();
  const [grande, tarjeta] = await Promise.all([
    original
      .clone()
      .resize({ width: LADO_GRANDE, height: LADO_GRANDE, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer({ resolveWithObject: true }),
    original
      .clone()
      .resize({ width: LADO_TARJETA, height: LADO_TARJETA, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 78 })
      .toBuffer(),
  ]);
  await writeFile(rutaEnDisco(`${clave}-g.webp`), grande.data);
  await writeFile(rutaEnDisco(`${clave}-t.webp`), tarjeta);
  return { clave, ancho: grande.info.width, alto: grande.info.height };
}

/** Revisa que sea un PDF de verdad (empieza con «%PDF-») y lo guarda tal cual. */
export async function guardarPdfTemporal(datos: Buffer): Promise<string | null> {
  if (datos.subarray(0, 5).toString("latin1") !== "%PDF-") return null;
  const clave = await nuevaClaveTemporal();
  await writeFile(rutaEnDisco(`${clave}.pdf`), datos);
  return clave;
}

export async function existeTemporal(clave: string, tipo: TipoArchivo): Promise<boolean> {
  if (!esClaveTemporal(clave)) return false;
  try {
    await Promise.all(sufijosDe(tipo).map((sufijo) => stat(rutaEnDisco(clave + sufijo))));
    return true;
  } catch {
    return false;
  }
}

/** Mueve un archivo de «temporal/» a su carpeta final y devuelve su nueva clave. */
export async function confirmarArchivo(clave: string, carpeta: Carpeta, tipo: TipoArchivo): Promise<string> {
  if (!esClaveTemporal(clave)) throw new Error("Clave de archivo temporal no válida");
  const final = `${carpeta}/${clave.slice("temporal/".length)}`;
  await mkdir(path.dirname(rutaEnDisco(`${final}.x`)), { recursive: true });
  for (const sufijo of sufijosDe(tipo)) {
    await rename(rutaEnDisco(clave + sufijo), rutaEnDisco(final + sufijo));
  }
  return final;
}

/**
 * Decide qué archivo queda en un campo al guardar un formulario:
 * - el mismo que ya tenía → se conserva;
 * - uno recién subido (temporal) → se mueve a su carpeta y el anterior se marca para borrar;
 * - ninguno → el anterior se marca para borrar.
 * Devuelve null si la clave no es válida (por ejemplo, un temporal que ya caducó).
 * El borrado del anterior se hace DESPUÉS de guardar en la base, con `borrarArchivo`.
 */
export async function resolverArchivo(
  nuevo: string | null,
  actual: string | null,
  carpeta: Carpeta,
  tipo: TipoArchivo,
): Promise<{ clave: string | null; borrar: string | null } | null> {
  if (nuevo === actual) return { clave: actual, borrar: null };
  if (nuevo === null) return { clave: null, borrar: actual };
  if (!(await existeTemporal(nuevo, tipo))) return null;
  return { clave: await confirmarArchivo(nuevo, carpeta, tipo), borrar: actual };
}

export async function borrarArchivo(clave: string | null | undefined, tipo: TipoArchivo): Promise<void> {
  if (!clave) return;
  await Promise.all(sufijosDe(tipo).map((sufijo) => rm(rutaEnDisco(clave + sufijo), { force: true })));
}

/** Borra lo que lleva más de 24 horas en «temporal/» (subidas de formularios que nunca se guardaron). */
export async function limpiarTemporales(): Promise<void> {
  try {
    const carpeta = path.dirname(rutaEnDisco("temporal/x"));
    const limite = Date.now() - VIDA_TEMPORAL_MS;
    for (const nombre of await readdir(carpeta)) {
      const ruta = path.join(carpeta, nombre);
      if ((await stat(ruta)).mtimeMs < limite) await rm(ruta, { force: true });
    }
  } catch {
    // Si la carpeta no existe todavía no hay nada que limpiar.
  }
}
