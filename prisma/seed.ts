// Datos iniciales: catálogos con sus temporadas, colores, tamaños de maceta y ajustes del sitio.
// Solo actúa la PRIMERA vez (base recién creada). Como en Hostinger corre en cada despliegue,
// así no reaparece algo que el dueño haya borrado desde el panel.
// Uso: npm run db:semilla
// Para volver a crear solo lo que falte (sin sobrescribir lo editado): npm run db:semilla:completar
import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient({
  adapter: new PrismaMariaDb(process.env.DATABASE_URL!),
});

type CatalogoInicial = {
  nombre: string;
  slug: string;
  color: string;
  permanente: boolean;
  temporada: {
    mesInicio: number;
    mesFin: number;
    textoAviso: string;
    prioridad: number;
    todoElAnio?: boolean;
  };
};

// Tabla de la sección 4.3. Prioridades: en noviembre coinciden Cempasúchil y Nochebuena
// (gana Nochebuena por prioridad); en febrero–marzo empatan Tulipán y Jacintos
// (gana Tulipán porque va primero en el orden de catálogos).
const CATALOGOS: CatalogoInicial[] = [
  {
    nombre: "Nochebuena",
    slug: "nochebuena",
    color: "#B3261E",
    permanente: false,
    temporada: { mesInicio: 11, mesFin: 12, textoAviso: "Ya llegó la Nochebuena", prioridad: 2 },
  },
  {
    nombre: "Tulipán",
    slug: "tulipan",
    color: "#D63A7A",
    permanente: false,
    temporada: { mesInicio: 1, mesFin: 3, textoAviso: "Llegaron los tulipanes", prioridad: 1 },
  },
  {
    nombre: "Jacintos",
    slug: "jacintos",
    color: "#3F4BA8",
    permanente: false,
    temporada: { mesInicio: 2, mesFin: 4, textoAviso: "Jacintos en flor", prioridad: 1 },
  },
  {
    nombre: "Cempasúchil",
    slug: "cempasuchil",
    color: "#E8710A",
    permanente: false,
    temporada: { mesInicio: 10, mesFin: 11, textoAviso: "Flores para tu ofrenda", prioridad: 1 },
  },
  {
    nombre: "Todo el año",
    slug: "todo-el-anio",
    color: "#1E3A2E",
    permanente: true,
    temporada: {
      mesInicio: 1,
      mesFin: 12,
      textoAviso: "Plantas para todo el año",
      prioridad: 0,
      todoElAnio: true,
    },
  },
  {
    nombre: "Árboles",
    slug: "arboles",
    color: "#4C7A3D",
    permanente: true,
    temporada: { mesInicio: 8, mesFin: 9, textoAviso: "Temporada de árboles", prioridad: 1 },
  },
];

const COLORES: [nombre: string, hex: string][] = [
  ["Rojo", "#C62828"],
  ["Blanco", "#FFFFFF"],
  ["Rosa", "#EC7FA9"],
  ["Amarillo", "#F4C430"],
  ["Naranja", "#EF7D1A"],
  ["Morado", "#7B4BA0"],
  ["Jaspeado", "#D98BA0"],
  ["Verde", "#4F8A3C"],
  ["Azul", "#3B6FB6"],
  ["Variegado", "#A7C47A"],
  ["Multicolor", "#9C6ADE"],
];

const MACETAS = ["Maceta 4", "Maceta 6", "Maceta 8", "Maceta 10", "Maceta 12", "Maceta 15"];

async function main() {
  const yaInicializada = await prisma.configuracionSitio.findUnique({ where: { id: 1 } });
  if (yaInicializada && !process.argv.includes("--forzar")) {
    console.log("La base ya tiene sus datos iniciales; no se cambió nada.");
    return;
  }

  for (const [indice, { temporada, ...catalogo }] of CATALOGOS.entries()) {
    const creado = await prisma.catalogo.upsert({
      where: { slug: catalogo.slug },
      update: {},
      create: { ...catalogo, orden: indice + 1 },
    });
    await prisma.temporada.upsert({
      where: { catalogoId: creado.id },
      update: {},
      create: { ...temporada, catalogoId: creado.id },
    });
  }

  for (const [indice, [nombre, hex]] of COLORES.entries()) {
    await prisma.color.upsert({
      where: { nombre },
      update: {},
      create: { nombre, hex, orden: indice + 1 },
    });
  }

  for (const [indice, nombre] of MACETAS.entries()) {
    await prisma.maceta.upsert({
      where: { nombre },
      update: {},
      create: { nombre, orden: indice + 1 },
    });
  }

  await prisma.configuracionSitio.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } });
  await prisma.datosNegocio.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      direccion: "Segunda Calle de José María Morelos 48, Col. Cabrera, Atlixco, Puebla",
    },
  });

  console.log(
    `Datos iniciales listos: ${CATALOGOS.length} catálogos con temporada, ` +
      `${COLORES.length} colores y ${MACETAS.length} tamaños de maceta.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
