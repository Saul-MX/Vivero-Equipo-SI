"use client";

import { useActionState, useId, useRef, useState } from "react";
import { CircleCheckIcon, SendIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { enviarMensaje, type EstadoContacto } from "./acciones";

export type TextosContacto = {
  titulo: string;
  nombre: string;
  contacto: string;
  contactoAyuda: string;
  mensaje: string;
  trampa: string;
  enviar: string;
  enviando: string;
  privacidad: string;
  graciasTitulo: string;
  graciasTexto: string;
  otro: string;
};

const ahora = () => Date.now();

/**
 * «Escríbenos»: el mensaje se guarda y el vivero lo ve en su panel. Para que la página cargue rápido
 * en el celular, aquí no hay librerías de formularios: el servidor revisa todo y devuelve los errores.
 */
export function FormularioContacto({ textos }: { textos: TextosContacto }) {
  // Cada «Enviar otro mensaje» arma un formulario nuevo y vacío.
  const [vuelta, setVuelta] = useState(0);
  return <Formulario key={vuelta} textos={textos} alOtro={() => setVuelta((valor) => valor + 1)} />;
}

function Formulario({ textos, alOtro }: { textos: TextosContacto; alOtro: () => void }) {
  const [estado, accion, enviando] = useActionState<EstadoContacto, FormData>(enviarMensaje, { estado: "inicial" });
  const id = useId();
  // Momento en que la persona entró al primer campo: un envío casi instantáneo no lo hizo una persona.
  const inicio = useRef<number | null>(null);

  if (estado.estado === "enviado") {
    return (
      <div role="status" className="flex flex-col items-start gap-4 rounded-md border border-hilo bg-white p-6 sm:p-8">
        <CircleCheckIcon aria-hidden className="size-10 text-hoja" />
        <h3 className="text-2xl font-semibold text-pino">{textos.graciasTitulo}</h3>
        <p className="text-foreground">{textos.graciasTexto}</p>
        <button type="button" onClick={alOtro} className="font-semibold text-pino underline underline-offset-4">
          {textos.otro}
        </button>
      </div>
    );
  }

  const error = estado.estado === "error" ? estado : null;
  const campo = (nombre: "nombre" | "contacto" | "texto", etiqueta: string, ayuda?: string) => {
    const idCampo = `${id}-${nombre}`;
    const mensajeError = error?.campos[nombre];
    const descritoPor =
      [ayuda && `${idCampo}-ayuda`, mensajeError && `${idCampo}-error`].filter(Boolean).join(" ") || undefined;
    const clases = cn(
      "w-full rounded-2xl border bg-white px-4 text-base text-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
      mensajeError ? "border-destructive" : "border-salvia",
    );
    const comunes = {
      id: idCampo,
      name: nombre,
      defaultValue: error?.valores[nombre] ?? "",
      "aria-invalid": mensajeError ? true : undefined,
      "aria-describedby": descritoPor,
    };
    return (
      <div className="flex flex-col gap-2">
        <label htmlFor={idCampo} className="text-sm font-medium text-foreground">
          {etiqueta}
        </label>
        {nombre === "texto" ? (
          <textarea {...comunes} rows={5} className={cn(clases, "py-3")} />
        ) : (
          <input
            {...comunes}
            type="text"
            autoComplete={nombre === "nombre" ? "name" : "email"}
            className={cn(clases, "h-11")}
          />
        )}
        {ayuda && (
          <p id={`${idCampo}-ayuda`} className="text-sm text-texto-suave">
            {ayuda}
          </p>
        )}
        {mensajeError && (
          <p id={`${idCampo}-error`} className="text-sm font-medium text-destructive">
            {mensajeError}
          </p>
        )}
      </div>
    );
  };

  return (
    <form
      action={accion}
      noValidate
      aria-labelledby={`${id}-titulo`}
      onFocus={() => {
        inicio.current ??= ahora();
      }}
      onSubmit={(evento) => {
        const tiempo = evento.currentTarget.elements.namedItem("tiempoMs") as HTMLInputElement;
        tiempo.value = String(inicio.current === null ? 0 : ahora() - inicio.current);
      }}
      className="relative flex flex-col gap-5 rounded-md border border-hilo bg-white p-6 sm:p-8"
    >
      <h2 id={`${id}-titulo`} className="text-2xl font-semibold text-pino">
        {textos.titulo}
      </h2>
      {error && (
        <p role="alert" className="rounded-2xl bg-[#fdecea] px-4 py-3 text-sm font-medium text-[#8a2018]">
          {error.general}
        </p>
      )}
      {campo("nombre", textos.nombre)}
      {campo("contacto", textos.contacto, textos.contactoAyuda)}
      {campo("texto", textos.mensaje)}
      <input type="hidden" name="tiempoMs" defaultValue="0" />
      {/* Campo trampa: las personas no lo ven; los programas que llenan todo, sí. */}
      <div aria-hidden className="absolute -left-[10000px] h-px w-px overflow-hidden">
        <label htmlFor="sitio-web">{textos.trampa}</label>
        <input id="sitio-web" name="sitioWeb" type="text" tabIndex={-1} autoComplete="off" />
      </div>
      <button
        type="submit"
        disabled={enviando}
        className="inline-flex min-h-12 items-center justify-center gap-2 self-start rounded-full bg-acento-fondo px-7 font-semibold text-acento-texto outline-none hover:opacity-90 focus-visible:ring-4 focus-visible:ring-ring/50 disabled:opacity-60"
      >
        <SendIcon aria-hidden className="size-4" />
        {enviando ? textos.enviando : textos.enviar}
      </button>
      <p className="text-sm text-texto-suave">{textos.privacidad}</p>
    </form>
  );
}
