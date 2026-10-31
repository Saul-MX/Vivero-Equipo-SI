import "server-only";
import {
  borrarArchivo,
  existeTemporal,
  listarArchivosDeCarpeta,
  resolverArchivo,
  type ArchivoEnCarpeta,
} from "@/lib/archivos/almacen";
import { esClaveTemporal, esClaveValida, esClaveVideo, type TipoArchivo } from "@/lib/archivos/claves";
import { prisma } from "@/lib/db";
import { moverId } from "@/lib/orden";
import { leerEstadoTemporadas } from "@/lib/temporadas/temporadas";
import type { AnuncioValidado, EntradaAnuncio } from "@/lib/validacion/anuncio";
import { fechaEnMexico, saleHoy } from "./regla";

// Anuncios del carrusel de portada (sección 5.1) y sus archivos.

const ORDEN = [{ orden: "asc" }, { id: "asc" }] as const;

const tipoDe = (clave: string): TipoArchivo => (esClaveVideo(clave) ? "video" : "imagen");
/** Las fechas «Desde/Hasta» se guardan como DATE: se manejan como «AAAA-MM-DD». */
const aTexto = (fecha: Date | null) => (fecha ? fecha.toISOString().slice(0, 10) : null);
const aFecha = (texto: string | null) => (texto ? new Date(`${texto}T00:00:00Z`) : null);

export type AnuncioEnLista = {
  id: number;
  titulo: string;
  tipoMedio: "IMAGEN" | "VIDEO";
  archivo: string | null;
  imagenEspera: string | null;
  temporada: { nombre: string; color: string } | null; // null = «Siempre»
  desde: string | null;
  hasta: string | null;
  visible: boolean;
  saleHoy: boolean;
};

/** Lista del panel, en orden, marcando los que salen hoy en la portada. */
export async function listarAnunciosPanel(): Promise<AnuncioEnLista[]> {
  const [filas, { vigente }] = await Promise.all([
    prisma.anuncio.findMany({
      orderBy: [...ORDEN],
      select: {
        id: true,
        titulo: true,
        tipoMedio: true,
        archivo: true,
        imagenEspera: true,
        temporadaId: true,
        desde: true,
        hasta: true,
        visible: true,
        orden: true,
        temporada: { select: { catalogo: { select: { nombre: true, color: true } } } },
      },
    }),
    leerEstadoTemporadas(),
  ]);
  const hoy = fechaEnMexico();
  return filas.map((fila) => {
    const desde = aTexto(fila.desde);
    const hasta = aTexto(fila.hasta);
    return {
      id: fila.id,
      titulo: fila.titulo ?? "",
      tipoMedio: fila.tipoMedio,
      archivo: fila.archivo,
      imagenEspera: fila.imagenEspera,
      temporada: fila.temporada?.catalogo ?? null,
      desde,
      hasta,
      visible: fila.visible,
      saleHoy: saleHoy({ ...fila, desde, hasta }, vigente?.id ?? null, hoy),
    };
  });
}

/** Temporadas para el selector «Temporada» (en el orden de Catálogos). */
export async function opcionesTemporadas(): Promise<{ id: number; nombre: string; visible: boolean }[]> {
  const { temporadas } = await leerEstadoTemporadas();
  return temporadas.map((temporada) => ({
    id: temporada.id,
    nombre: temporada.catalogo.nombre,
    visible: temporada.visible,
  }));
}

/** Un anuncio con la forma del formulario, o null si no existe. */
export async function obtenerAnuncio(id: number): Promise<EntradaAnuncio | null> {
  const fila = await prisma.anuncio.findUnique({ where: { id } });
  if (!fila) return null;
  return {
    tipoMedio: fila.tipoMedio,
    archivo: fila.archivo,
    archivoMovil: fila.archivoMovil,
    imagenEspera: fila.imagenEspera,
    imagenConTexto: fila.imagenConTexto,
    textoPequeno: fila.textoPequeno ?? "",
    titulo: fila.titulo ?? "",
    texto: fila.texto ?? "",
    boton1Texto: fila.boton1Texto ?? "",
    boton1Destino: fila.boton1Destino ?? "",
    boton2Texto: fila.boton2Texto ?? "",
    boton2Destino: fila.boton2Destino ?? "",
    posicionTexto: fila.posicionTexto,
    oscurecido: fila.oscurecido,
    temporadaId: fila.temporadaId === null ? "" : String(fila.temporadaId),
    desde: aTexto(fila.desde) ?? "",
    hasta: aTexto(fila.hasta) ?? "",
    visible: fila.visible,
  };
}

export type ResultadoGuardarAnuncio =
  | { ok: true; id: number }
  | { ok: false; error: "noEncontrado" | "archivoNoEncontrado" | "temporadaNoExiste" };

export async function guardarAnuncio(datos: AnuncioValidado, id: number | null): Promise<ResultadoGuardarAnuncio> {
  const actual = id
    ? await prisma.anuncio.findUnique({ where: { id }, select: { archivo: true, archivoMovil: true, imagenEspera: true } })
    : null;
  if (id !== null && !actual) return { ok: false, error: "noEncontrado" };
  if (datos.temporadaId !== null) {
    const temporada = await prisma.temporada.findUnique({ where: { id: datos.temporadaId }, select: { id: true } });
    if (!temporada) return { ok: false, error: "temporadaNoExiste" };
  }

  // Primero se revisan los tres archivos y solo después se mueven: si uno falla, no se toca nada.
  const campos = [
    [datos.archivo, actual?.archivo ?? null],
    [datos.archivoMovil, actual?.archivoMovil ?? null],
    [datos.imagenEspera, actual?.imagenEspera ?? null],
  ] as const;
  for (const [nuevo, anterior] of campos) {
    const valido =
      nuevo === null || nuevo === anterior || (esClaveTemporal(nuevo) && (await existeTemporal(nuevo, tipoDe(nuevo))));
    if (!valido) return { ok: false, error: "archivoNoEncontrado" };
  }
  const resueltos = [];
  for (const [nuevo, anterior] of campos) {
    resueltos.push((await resolverArchivo(nuevo, anterior, "anuncios", tipoDe(nuevo ?? "")))!);
  }
  const [archivo, archivoMovil, imagenEspera] = resueltos;

  const datosAnuncio = {
    tipoMedio: datos.tipoMedio,
    archivo: archivo.clave,
    archivoMovil: archivoMovil.clave,
    imagenEspera: imagenEspera.clave,
    imagenConTexto: datos.imagenConTexto,
    textoPequeno: datos.textoPequeno || null,
    titulo: datos.titulo,
    texto: datos.texto || null,
    boton1Texto: datos.boton1Texto,
    boton1Destino: datos.boton1Destino,
    boton2Texto: datos.boton2Texto || null,
    boton2Destino: datos.boton2Destino || null,
    posicionTexto: datos.posicionTexto,
    oscurecido: datos.oscurecido,
    temporadaId: datos.temporadaId,
    desde: aFecha(datos.desde),
    hasta: aFecha(datos.hasta),
    visible: datos.visible,
  };

  let guardadoId = id;
  if (guardadoId === null) {
    const ultimo = await prisma.anuncio.aggregate({ _max: { orden: true } });
    guardadoId = (await prisma.anuncio.create({ data: { ...datosAnuncio, orden: (ultimo._max.orden ?? 0) + 1 } })).id;
  } else {
    await prisma.anuncio.update({ where: { id: guardadoId }, data: datosAnuncio });
  }

  await Promise.all(resueltos.map(({ borrar }) => (borrar ? borrarArchivo(borrar, tipoDe(borrar)) : null)));
  return { ok: true, id: guardadoId };
}

export async function cambiarVisibleAnuncio(id: number, visible: boolean): Promise<void> {
  await prisma.anuncio.updateMany({ where: { id }, data: { visible } });
}

export async function moverAnuncio(id: number, direccion: "subir" | "bajar"): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const ids = (await tx.anuncio.findMany({ orderBy: [...ORDEN], select: { id: true } })).map((fila) => fila.id);
    const nuevos = moverId(ids, id, direccion);
    if (!nuevos) return;
    for (const [indice, idAnuncio] of nuevos.entries()) {
      await tx.anuncio.update({ where: { id: idAnuncio }, data: { orden: indice + 1 } });
    }
  });
}

/** Elimina el anuncio y sus archivos. Devuelve su título, o null si ya no existía. */
export async function eliminarAnuncio(id: number): Promise<string | null> {
  const anuncio = await prisma.anuncio.findUnique({
    where: { id },
    select: { titulo: true, archivo: true, archivoMovil: true, imagenEspera: true },
  });
  if (!anuncio) return null;
  await prisma.anuncio.delete({ where: { id } });
  await Promise.all(
    [anuncio.archivo, anuncio.archivoMovil, anuncio.imagenEspera].map((clave) =>
      clave ? borrarArchivo(clave, tipoDe(clave)) : null,
    ),
  );
  return anuncio.titulo ?? "";
}

// ───────────── Pestaña «Otros archivos» ─────────────

export type UsoArchivo = { id: number; titulo: string; campo: "archivo" | "archivoMovil" | "imagenEspera" };
export type ArchivoDelCarrusel = ArchivoEnCarpeta & { usos: UsoArchivo[] };

async function usosDeArchivos(): Promise<Map<string, UsoArchivo[]>> {
  const anuncios = await prisma.anuncio.findMany({
    orderBy: [...ORDEN],
    select: { id: true, titulo: true, archivo: true, archivoMovil: true, imagenEspera: true },
  });
  const usos = new Map<string, UsoArchivo[]>();
  for (const anuncio of anuncios) {
    for (const campo of ["archivo", "archivoMovil", "imagenEspera"] as const) {
      const clave = anuncio[campo];
      if (clave) usos.set(clave, [...(usos.get(clave) ?? []), { id: anuncio.id, titulo: anuncio.titulo ?? "", campo }]);
    }
  }
  return usos;
}

/** Fotos y videos guardados del carrusel, con qué anuncio usa cada uno. */
export async function archivosDelCarrusel(): Promise<ArchivoDelCarrusel[]> {
  const [archivos, usos] = await Promise.all([listarArchivosDeCarpeta("anuncios"), usosDeArchivos()]);
  return archivos.map((archivo) => ({ ...archivo, usos: usos.get(archivo.clave) ?? [] }));
}

/** Borra un archivo del carrusel que ya no usa ningún anuncio (si alguno lo usa, no se borra). */
export async function eliminarArchivoCarrusel(clave: string): Promise<"ok" | "enUso" | "noEncontrado"> {
  if (!esClaveValida(clave) || !clave.startsWith("anuncios/")) return "noEncontrado";
  if ((await usosDeArchivos()).has(clave)) return "enUso";
  const existe = (await listarArchivosDeCarpeta("anuncios")).some((archivo) => archivo.clave === clave);
  if (!existe) return "noEncontrado";
  await borrarArchivo(clave, tipoDe(clave));
  return "ok";
}
