// Acceso directo a la base de PRUEBAS, para preparar casos (por ejemplo, plantas que usan un color)
// y revisar que no queden datos huérfanos.
import "dotenv/config";
import * as mariadb from "mariadb";

async function conBase<T>(trabajo: (conexion: mariadb.Connection) => Promise<T>): Promise<T> {
  const url = new URL(process.env.DATABASE_URL_PRUEBA ?? "");
  const conexion = await mariadb.createConnection({
    host: url.hostname,
    port: Number(url.port || 3306),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.replace(/^\//, ""),
  });
  try {
    return await trabajo(conexion);
  } finally {
    await conexion.end();
  }
}

/** Crea una planta (en «Todo el año») que usa los colores y tamaños indicados por nombre. */
export function crearPlanta(nombre: string, opciones: { colores?: string[]; macetas?: string[] }) {
  return conBase(async (conexion) => {
    const slug = `${nombre.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}`;
    const resultado = await conexion.query(
      `INSERT INTO plantas (nombre, slug, catalogoId, actualizadoEn)
       SELECT ?, ?, id, NOW(3) FROM catalogos WHERE slug = 'todo-el-anio'`,
      [nombre, slug],
    );
    const plantaId = Number(resultado.insertId);
    for (const color of opciones.colores ?? []) {
      await conexion.query(
        "INSERT INTO planta_colores (plantaId, colorId) SELECT ?, id FROM colores WHERE nombre = ?",
        [plantaId, color],
      );
    }
    for (const maceta of opciones.macetas ?? []) {
      await conexion.query(
        "INSERT INTO planta_macetas (plantaId, macetaId) SELECT ?, id FROM macetas WHERE nombre = ?",
        [plantaId, maceta],
      );
    }
    return plantaId;
  });
}

export function existePlanta(plantaId: number) {
  return conBase(async (conexion) => {
    const filas = await conexion.query("SELECT id FROM plantas WHERE id = ?", [plantaId]);
    return filas.length === 1;
  });
}

export function coloresDePlanta(plantaId: number) {
  return conBase(async (conexion) => {
    const filas: { nombre: string }[] = await conexion.query(
      `SELECT c.nombre FROM planta_colores pc JOIN colores c ON c.id = pc.colorId
       WHERE pc.plantaId = ? ORDER BY c.nombre`,
      [plantaId],
    );
    return filas.map((fila) => fila.nombre);
  });
}

export function macetasDePlanta(plantaId: number) {
  return conBase(async (conexion) => {
    const filas: { nombre: string }[] = await conexion.query(
      `SELECT m.nombre FROM planta_macetas pm JOIN macetas m ON m.id = pm.macetaId
       WHERE pm.plantaId = ? ORDER BY m.nombre`,
      [plantaId],
    );
    return filas.map((fila) => fila.nombre);
  });
}

/** Tono guardado de cada color: { Rojo: "#C62828", … }. */
export function tonosGuardados() {
  return conBase(async (conexion) => {
    const filas: { nombre: string; hex: string }[] = await conexion.query("SELECT nombre, hex FROM colores");
    return Object.fromEntries(filas.map((fila) => [fila.nombre, fila.hex]));
  });
}

/** Cuenta las relaciones planta–color y planta–maceta que apuntan a algo que ya no existe. */
export function contarHuerfanos() {
  return conBase(async (conexion) => {
    const [fila] = await conexion.query(
      `SELECT
         (SELECT COUNT(*) FROM planta_colores pc LEFT JOIN colores c ON c.id = pc.colorId WHERE c.id IS NULL) +
         (SELECT COUNT(*) FROM planta_macetas pm LEFT JOIN macetas m ON m.id = pm.macetaId WHERE m.id IS NULL)
         AS huerfanos`,
    );
    return Number(fila.huerfanos);
  });
}

export function leerDatosNegocio() {
  return conBase(async (conexion) => {
    const [fila] = await conexion.query("SELECT * FROM datos_negocio WHERE id = 1");
    return fila as Record<string, string | null>;
  });
}
