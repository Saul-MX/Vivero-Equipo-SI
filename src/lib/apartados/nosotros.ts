import "server-only";
import type { SeccionNosotros } from "@/generated/prisma/client";
import { borrarArchivo, confirmarArchivo, existeTemporal, medidasImagen } from "@/lib/archivos/almacen";
import { esClaveTemporal } from "@/lib/archivos/claves";
import { prisma } from "@/lib/db";
import type { EntradaNosotros, NosotrosValidado, SeccionConGaleria } from "@/lib/validacion/nosotros";

// Contenido de las páginas del menú Nosotros: Historia, Momentos importantes, Misión, Visión y Valores.

const SECCIONES: Record<SeccionConGaleria, SeccionNosotros> = {
  historia: "HISTORIA",
  mision: "MISION",
  vision: "VISION",
  valores: "VALORES",
};
const CLAVES = Object.keys(SECCIONES) as SeccionConGaleria[];

type FotoPorGuardar = { id: number | null; archivo: string; orden: number };
type SeccionPorGuardar = { clave: SeccionConGaleria; fotoSuperior: string | null; galeria: FotoPorGuardar[] };
type MomentoPorGuardar = NosotrosValidado["momentos"][number] & { orden: number };

/** Todo el contenido de Nosotros, con la forma del formulario del panel. */
export async function leerNosotros(): Promise<EntradaNosotros> {
  const [contenidos, galeria, valores, momentos] = await Promise.all([
    prisma.contenidoNosotros.findMany(),
    prisma.fotoGaleriaNosotros.findMany({ orderBy: [{ orden: "asc" }, { id: "asc" }] }),
    prisma.valorNosotros.findMany({ orderBy: [{ orden: "asc" }, { id: "asc" }] }),
    prisma.momentoNosotros.findMany({ orderBy: [{ orden: "asc" }, { id: "asc" }] }),
  ]);
  const seccion = (clave: SeccionConGaleria) => {
    const contenido = contenidos.find((fila) => fila.seccion === SECCIONES[clave]);
    return {
      texto: contenido?.texto ?? "",
      fotoSuperior: contenido?.fotoSuperior ?? null,
      galeria: galeria
        .filter((foto) => foto.seccion === SECCIONES[clave])
        .map((foto) => ({ id: foto.id, clave: foto.archivo, esPortada: false })),
    };
  };
  const { fotoSuperior, galeria: galeriaValores } = seccion("valores");
  return {
    historia: seccion("historia"),
    momentos: momentos.map((momento) => ({
      id: momento.id,
      titulo: momento.titulo,
      texto: momento.texto ?? "",
      foto: momento.foto,
    })),
    mision: seccion("mision"),
    vision: seccion("vision"),
    valores: {
      fotoSuperior,
      galeria: galeriaValores,
      lista: valores.map((valor) => ({ titulo: valor.titulo, descripcion: valor.descripcion ?? "" })),
    },
  };
}

export type ResultadoGuardarNosotros = { ok: true } | { ok: false; error: "archivoNoEncontrado" };

/**
 * Guarda todo Nosotros. Primero revisa TODAS las fotos (las guardadas deben ser las que ya
 * estaban; las nuevas, temporales que sigan existiendo) y solo entonces mueve las nuevas a su
 * carpeta: si algo falla, no se toca nada y el formulario puede reintentarse tal cual.
 */
export async function guardarNosotros(datos: NosotrosValidado): Promise<ResultadoGuardarNosotros> {
  const [contenidos, galeriaActual, momentosActuales] = await Promise.all([
    prisma.contenidoNosotros.findMany({ select: { seccion: true, fotoSuperior: true } }),
    prisma.fotoGaleriaNosotros.findMany({ select: { id: true, seccion: true, archivo: true } }),
    prisma.momentoNosotros.findMany({ select: { id: true, foto: true } }),
  ]);
  const fotoSuperiorActual = (clave: SeccionConGaleria) =>
    contenidos.find((fila) => fila.seccion === SECCIONES[clave])?.fotoSuperior ?? null;
  const momentoActual = new Map(momentosActuales.map((momento) => [momento.id, momento.foto]));

  // 1) Revisión de todas las fotos, sin mover nada todavía.
  const esNuevaValida = async (clave: string) => esClaveTemporal(clave) && existeTemporal(clave, "imagen");
  const campoValido = async (nuevo: string | null, actual: string | null) =>
    nuevo === null || nuevo === actual || (await esNuevaValida(nuevo));

  for (const clave of CLAVES) {
    if (!(await campoValido(datos[clave].fotoSuperior, fotoSuperiorActual(clave)))) {
      return { ok: false, error: "archivoNoEncontrado" };
    }
    for (const foto of datos[clave].galeria) {
      const guardada = galeriaActual.find((fila) => fila.id === foto.id && fila.seccion === SECCIONES[clave]);
      const valida = foto.id === null ? await esNuevaValida(foto.clave) : guardada?.archivo === foto.clave;
      if (!valida) return { ok: false, error: "archivoNoEncontrado" };
    }
  }
  for (const momento of datos.momentos) {
    const actual = momento.id === null ? null : (momentoActual.get(momento.id) ?? null);
    if (momento.id !== null && !momentoActual.has(momento.id)) momento.id = null; // borrado en otra ventana
    if (!(await campoValido(momento.foto, actual))) return { ok: false, error: "archivoNoEncontrado" };
  }

  // 2) Las fotos nuevas pasan de «temporal/» a «nosotros/».
  const confirmar = async (clave: string | null) =>
    clave !== null && esClaveTemporal(clave) ? confirmarArchivo(clave, "nosotros", "imagen") : clave;

  const porBorrar: string[] = [];
  const secciones: SeccionPorGuardar[] = [];
  for (const clave of CLAVES) {
    const fotoSuperior = await confirmar(datos[clave].fotoSuperior);
    const anterior = fotoSuperiorActual(clave);
    if (anterior && anterior !== fotoSuperior) porBorrar.push(anterior);

    const galeria: FotoPorGuardar[] = [];
    for (const [indice, foto] of datos[clave].galeria.entries()) {
      const archivo = (await confirmar(foto.clave))!;
      galeria.push({ id: foto.id, archivo, orden: indice + 1 });
    }
    secciones.push({ clave, fotoSuperior, galeria });
  }
  const conservadas = new Set(secciones.flatMap((seccion) => seccion.galeria.flatMap((foto) => foto.id ?? [])));
  const fotosQuitadas = galeriaActual.filter((foto) => !conservadas.has(foto.id));
  porBorrar.push(...fotosQuitadas.map((foto) => foto.archivo));

  const momentos: MomentoPorGuardar[] = [];
  for (const [indice, momento] of datos.momentos.entries()) {
    const foto = await confirmar(momento.foto);
    const anterior = momento.id === null ? null : (momentoActual.get(momento.id) ?? null);
    if (anterior && anterior !== foto) porBorrar.push(anterior);
    momentos.push({ ...momento, foto, orden: indice + 1 });
  }
  const momentosConservados = new Set(momentos.flatMap((momento) => momento.id ?? []));
  const momentosQuitados = momentosActuales.filter((momento) => !momentosConservados.has(momento.id));
  porBorrar.push(...momentosQuitados.flatMap((momento) => momento.foto ?? []));

  // Las medidas se leen antes de la transacción (leer archivos dentro la alargaría).
  const medidas = new Map<string, { ancho: number; alto: number }>();
  for (const seccion of secciones) {
    for (const foto of seccion.galeria) {
      if (foto.id === null) medidas.set(foto.archivo, await medidasImagen(foto.archivo));
    }
  }

  // 3) Todo en la base de una sola vez.
  await prisma.$transaction(async (tx) => {
    for (const { clave, fotoSuperior, galeria } of secciones) {
      const seccion = SECCIONES[clave];
      const campos = { texto: clave === "valores" ? null : datos[clave].texto || null, fotoSuperior };
      await tx.contenidoNosotros.upsert({ where: { seccion }, create: { seccion, ...campos }, update: campos });
      for (const foto of galeria) {
        if (foto.id !== null) {
          await tx.fotoGaleriaNosotros.update({ where: { id: foto.id }, data: { orden: foto.orden } });
        } else {
          await tx.fotoGaleriaNosotros.create({
            data: { seccion, archivo: foto.archivo, orden: foto.orden, ...medidas.get(foto.archivo)! },
          });
        }
      }
    }
    await tx.fotoGaleriaNosotros.deleteMany({ where: { id: { in: fotosQuitadas.map((foto) => foto.id) } } });

    await tx.momentoNosotros.deleteMany({ where: { id: { in: momentosQuitados.map((momento) => momento.id) } } });
    for (const momento of momentos) {
      const campos = { titulo: momento.titulo, texto: momento.texto || null, foto: momento.foto, orden: momento.orden };
      if (momento.id !== null) await tx.momentoNosotros.update({ where: { id: momento.id }, data: campos });
      else await tx.momentoNosotros.create({ data: campos });
    }

    // Los valores no tienen archivos: se reemplaza la lista completa.
    await tx.valorNosotros.deleteMany();
    await tx.valorNosotros.createMany({
      data: datos.valores.lista.map((valor, indice) => ({
        titulo: valor.titulo,
        descripcion: valor.descripcion || null,
        orden: indice + 1,
      })),
    });
  });

  await Promise.all(porBorrar.map((clave) => borrarArchivo(clave, "imagen")));
  return { ok: true };
}
