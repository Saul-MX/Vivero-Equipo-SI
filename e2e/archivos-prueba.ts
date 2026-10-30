// Archivos de prueba generados al momento (no se guardan en el repositorio).
import sharp from "sharp";

type ArchivoPrueba = { name: string; mimeType: string; buffer: Buffer };

/** Foto de un solo color; por defecto grande (2400 × 1600) para comprobar que se reduce. */
export async function fotoDePrueba(
  { color = "#c62828", ancho = 2400, alto = 1600, nombre = "foto.jpg" } = {},
): Promise<ArchivoPrueba> {
  const buffer = await sharp({ create: { width: ancho, height: alto, channels: 3, background: color } })
    .jpeg()
    .toBuffer();
  return { name: nombre, mimeType: "image/jpeg", buffer };
}

export const PDF_PRUEBA: ArchivoPrueba = {
  name: "folleto.pdf",
  mimeType: "application/pdf",
  buffer: Buffer.from("%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n"),
};

/** Se hace pasar por JPG, pero es texto: el servidor debe rechazarlo al revisar su contenido. */
export const IMAGEN_FALSA: ArchivoPrueba = {
  name: "no-es-foto.jpg",
  mimeType: "image/jpeg",
  buffer: Buffer.from("esto no es una imagen"),
};

/** Lee el ancho y alto de una imagen servida por el sitio. */
export async function medidasDe(datos: Buffer) {
  const { width, height, format } = await sharp(datos).metadata();
  return { ancho: width ?? 0, alto: height ?? 0, formato: format };
}
