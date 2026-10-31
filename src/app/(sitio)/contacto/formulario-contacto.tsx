"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CircleCheckIcon, SendIcon } from "lucide-react";
import { CampoAreaTexto, CampoTexto } from "@/components/formularios/campo-texto";
import { useTraductorErrores } from "@/components/formularios/use-traductor-errores";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { esquemaMensaje, type EntradaMensaje, type MensajeValidado } from "@/lib/validacion/mensaje";
import { enviarMensaje } from "./acciones";

const VACIO: EntradaMensaje = { nombre: "", contacto: "", texto: "", sitioWeb: "", tiempoMs: 0 };
const ahora = () => Date.now();

/** «Escríbenos»: el mensaje se guarda y el vivero lo ve en su panel. */
export function FormularioContacto() {
  const t = useTranslations("sitio.contacto.formulario");
  const traducir = useTraductorErrores();
  const [enviado, setEnviado] = useState(false);
  const [errorGeneral, setErrorGeneral] = useState<string>();
  // Momento en que la persona entró al primer campo: un envío casi instantáneo no lo hizo una persona.
  const inicio = useRef<number | null>(null);

  const {
    register,
    handleSubmit,
    getValues,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EntradaMensaje, unknown, MensajeValidado>({
    resolver: zodResolver(esquemaMensaje),
    defaultValues: VACIO,
  });

  const enviar = async () => {
    setErrorGeneral(undefined);
    try {
      const tiempoMs = inicio.current === null ? 0 : ahora() - inicio.current;
      const resultado = await enviarMensaje({ ...getValues(), tiempoMs });
      if (!resultado.ok) {
        for (const [campo, clave] of Object.entries(resultado.campos ?? {})) {
          setError(campo as keyof EntradaMensaje, { message: clave });
        }
        setErrorGeneral(traducir(resultado.error ?? "revisaCampos", { minutos: resultado.minutos ?? 0 }));
        return;
      }
      reset(VACIO);
      inicio.current = null;
      setEnviado(true);
    } catch {
      setErrorGeneral(traducir("inesperado"));
    }
  };

  if (enviado) {
    return (
      <div role="status" className="flex flex-col items-start gap-4 rounded-3xl bg-white p-6 ring-1 ring-border sm:p-8">
        <CircleCheckIcon aria-hidden className="size-10 text-hoja" />
        <h3 className="font-serif text-2xl font-semibold text-pino">{t("graciasTitulo")}</h3>
        <p className="text-foreground">{t("graciasTexto")}</p>
        <button type="button" onClick={() => setEnviado(false)} className="font-semibold text-pino underline underline-offset-4">
          {t("otro")}
        </button>
      </div>
    );
  }

  return (
    <form
      onFocus={() => {
        inicio.current ??= ahora();
      }}
      onSubmit={(evento) => void handleSubmit(enviar)(evento)}
      noValidate
      aria-labelledby="titulo-formulario-contacto"
      className="relative flex flex-col gap-5 rounded-3xl bg-white p-6 ring-1 ring-border sm:p-8"
    >
      <h2 id="titulo-formulario-contacto" className="font-serif text-2xl font-semibold text-pino">
        {t("titulo")}
      </h2>
      {errorGeneral && (
        <Alert variant="destructive">
          <AlertTitle>{errorGeneral}</AlertTitle>
        </Alert>
      )}
      <CampoTexto id="nombre" etiqueta={t("nombre")} autoComplete="name" error={traducir(errors.nombre?.message)} {...register("nombre")} />
      <CampoTexto
        id="contacto"
        etiqueta={t("contacto")}
        ayuda={t("contactoAyuda")}
        autoComplete="email"
        error={traducir(errors.contacto?.message)}
        {...register("contacto")}
      />
      <CampoAreaTexto id="texto" etiqueta={t("mensaje")} rows={5} error={traducir(errors.texto?.message)} {...register("texto")} />
      {/* Campo trampa: las personas no lo ven; los programas que llenan todo, sí. */}
      <div aria-hidden className="absolute -left-[10000px] h-px w-px overflow-hidden">
        <label htmlFor="sitio-web">{t("trampa")}</label>
        <input id="sitio-web" type="text" tabIndex={-1} autoComplete="off" {...register("sitioWeb")} />
      </div>
      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex min-h-12 items-center justify-center gap-2 self-start rounded-full bg-acento-fondo px-7 font-semibold text-acento-texto outline-none hover:opacity-90 focus-visible:ring-4 focus-visible:ring-ring/50 disabled:opacity-60"
      >
        <SendIcon aria-hidden className="size-4" />
        {isSubmitting ? t("enviando") : t("enviar")}
      </button>
      <p className="text-sm text-texto-suave">{t("privacidad")}</p>
    </form>
  );
}
