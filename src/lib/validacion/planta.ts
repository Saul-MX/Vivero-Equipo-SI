import { z } from "zod";
import { esClaveValida } from "@/lib/archivos/claves";
import { requerido, texto } from "./comunes";

// Formulario «Nueva planta» / editar planta (sección 4.2). Las listas desplegables y casillas
// llegan como texto («3», «MODERADA», …) y aquí se convierten a lo que guarda la base.

export const LUCES = ["SOL", "MEDIA_SOMBRA", "SOMBRA"] as const;
export const CANTIDADES_AGUA = ["POCA", "MODERADA", "ABUNDANTE"] as const;
export const ETIQUETAS_PLANTA = ["NUEVO", "OFERTA"] as const;
/** Días de riego por semana: «» = sin dato, 1 a 6, y 7 = diario. */
export const DIAS_RIEGO = ["1", "2", "3", "4", "5", "6", "7"] as const;
export const MAXIMO_FOTOS = 20;

const id = z.string().regex(/^\d+$/).transform(Number);
const vacioANulo = <T extends string>(valor: T | "") => (valor === "" ? null : valor);

export const esquemaPlanta = z.object({
  nombre: requerido("nombreRequerido", 120),
  variedad: texto(120),
  catalogoId: z.string().regex(/^\d+$/, "catalogoRequerido").transform(Number),
  etiqueta: z.enum(["", ...ETIQUETAS_PLANTA]).transform(vacioANulo),
  luces: z.array(z.enum(LUCES)).max(LUCES.length),
  colores: z.array(id).max(100),
  macetas: z.array(id).max(100),
  riegoDias: z.enum(["", ...DIAS_RIEGO]).transform((valor) => (valor === "" ? null : Number(valor))),
  cantidadAgua: z.enum(["", ...CANTIDADES_AGUA]).transform(vacioANulo),
  fertilizanteId: z
    .string()
    .regex(/^\d*$/)
    .transform((valor) => (valor === "" ? null : Number(valor))),
  notaRiego: texto(255),
  descripcionCorta: texto(500),
  cuidados: texto(5000),
  disponible: z.boolean(),
  visible: z.boolean(),
  // Fotos en orden. `id` = foto ya guardada; null = recién subida (clave «temporal/…»).
  fotos: z
    .array(
      z.object({
        id: z.number().int().positive().nullable(),
        clave: z.string().refine(esClaveValida, "archivoNoEncontrado"),
        esPortada: z.boolean(),
      }),
    )
    .max(MAXIMO_FOTOS, "demasiadasFotos"),
});

export type EntradaPlanta = z.input<typeof esquemaPlanta>;
export type PlantaValidada = z.output<typeof esquemaPlanta>;
export type FotoEnFormulario = EntradaPlanta["fotos"][number];

/** Filtros del listado de plantas (vienen en la dirección: ?q=…&catalogo=…&color=…&disponible=si). */
export const esquemaFiltrosPlantas = z.object({
  q: z.string().trim().max(120).catch(""),
  catalogo: z.coerce.number().int().positive().optional().catch(undefined),
  color: z.coerce.number().int().positive().optional().catch(undefined),
  disponible: z.enum(["si", "no"]).optional().catch(undefined),
  // Desde «Pendientes» del Inicio: solo las ocultas o solo las que no tienen foto.
  revisar: z.enum(["ocultas", "sin-foto"]).optional().catch(undefined),
});
export type FiltrosPlantas = z.output<typeof esquemaFiltrosPlantas>;
