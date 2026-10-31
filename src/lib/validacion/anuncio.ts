import { z } from "zod";
import { esClaveValida, esClaveVideo } from "@/lib/archivos/claves";
import { normalizarDestino } from "@/lib/carrusel/destino";
import { requerido, texto } from "./comunes";

// Reglas del formulario «Nuevo anuncio» del carrusel (sección 5.1).
// Se usan en el navegador y otra vez en el servidor (el que manda).

export const TIPOS_MEDIO = ["IMAGEN", "VIDEO"] as const;
export const POSICIONES_TEXTO = ["IZQUIERDA", "CENTRO", "DERECHA"] as const;

const claveImagen = z
  .string()
  .refine((clave) => esClaveValida(clave) && !esClaveVideo(clave), "archivoNoEncontrado")
  .nullable();

const destino = (requeridoSiVacio: boolean) =>
  z
    .string()
    .trim()
    .max(500, "textoLargo")
    .refine((valor) => valor !== "" || !requeridoSiVacio, { message: "destinoRequerido", abort: true })
    .refine((valor) => valor === "" || normalizarDestino(valor) !== null, { message: "destinoInvalido", abort: true })
    .transform((valor) => (valor === "" ? "" : normalizarDestino(valor)!));

/** Fecha de un campo «date» del navegador («AAAA-MM-DD»), o vacía. */
const fecha = z
  .string()
  .regex(/^(\d{4}-\d{2}-\d{2})?$/, "fechaInvalida")
  .refine((valor) => valor === "" || !Number.isNaN(Date.parse(`${valor}T00:00:00Z`)), "fechaInvalida");

export const esquemaAnuncio = z
  .object({
    tipoMedio: z.enum(TIPOS_MEDIO),
    archivo: z
      .string()
      .nullable()
      .refine((clave) => clave !== null, { message: "archivoAnuncioRequerido", abort: true })
      .refine((clave) => clave === null || esClaveValida(clave), "archivoNoEncontrado"),
    archivoMovil: claveImagen, // foto para celular (solo con foto)
    imagenEspera: claveImagen, // imagen mientras carga el video (solo con video)
    imagenConTexto: z.boolean(),
    textoPequeno: texto(120),
    titulo: requerido("tituloAnuncioRequerido", 160),
    texto: texto(300),
    boton1Texto: requerido("botonTextoRequerido", 60),
    boton1Destino: destino(true),
    boton2Texto: texto(60),
    boton2Destino: destino(false),
    posicionTexto: z.enum(POSICIONES_TEXTO),
    oscurecido: z.number().int().min(0, "oscurecidoInvalido").max(100, "oscurecidoInvalido"),
    temporadaId: z.string().regex(/^\d*$/, "noEncontrado"), // "" = «Siempre»
    desde: fecha,
    hasta: fecha,
    visible: z.boolean(),
  })
  .superRefine((datos, contexto) => {
    if (datos.archivo !== null && esClaveVideo(datos.archivo) !== (datos.tipoMedio === "VIDEO")) {
      contexto.addIssue({ code: "custom", path: ["archivo"], message: "archivoNoEncontrado" });
    }
    // El segundo botón es opcional, pero si tiene texto necesita destino y al revés.
    if (datos.boton2Texto !== "" && datos.boton2Destino === "") {
      contexto.addIssue({ code: "custom", path: ["boton2Destino"], message: "destinoRequerido" });
    }
    if (datos.boton2Texto === "" && datos.boton2Destino !== "") {
      contexto.addIssue({ code: "custom", path: ["boton2Texto"], message: "botonTextoRequerido" });
    }
    if (datos.desde !== "" && datos.hasta !== "" && datos.desde > datos.hasta) {
      contexto.addIssue({ code: "custom", path: ["hasta"], message: "fechasInvertidas" });
    }
  })
  .transform((datos) => ({
    ...datos,
    archivo: datos.archivo!,
    // Lo que no aplica al tipo elegido no se guarda.
    archivoMovil: datos.tipoMedio === "IMAGEN" ? datos.archivoMovil : null,
    imagenEspera: datos.tipoMedio === "VIDEO" ? datos.imagenEspera : null,
    temporadaId: datos.temporadaId === "" ? null : Number(datos.temporadaId),
    desde: datos.desde || null,
    hasta: datos.hasta || null,
  }));

export type EntradaAnuncio = z.input<typeof esquemaAnuncio>;
export type AnuncioValidado = z.output<typeof esquemaAnuncio>;
