"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { ArrowLeftIcon, MailIcon, MailOpenIcon, PhoneIcon, Trash2Icon } from "lucide-react";
import { useTraductorErrores } from "@/components/formularios/use-traductor-errores";
import { ConfirmarEliminar } from "@/components/panel/confirmar-eliminar";
import { EncabezadoPagina } from "@/components/panel/encabezado-pagina";
import { IconoWhatsapp } from "@/components/sitio/whatsapp";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { FormaDeResponder } from "@/lib/mensajes/respuesta";
import { eliminarMensajeAccion, marcarMensajeAccion } from "./acciones";

type Props = {
  mensaje: { id: number; nombre: string; contacto: string; texto: string; leido: boolean; fecha: string };
  formas: FormaDeResponder[];
};

const ICONOS = { whatsapp: IconoWhatsapp, llamar: PhoneIcon, correo: MailIcon } as const;

/** Un mensaje abierto. Al abrirlo se marca como leído; se puede volver a marcar como no leído. */
export function DetalleMensaje({ mensaje, formas }: Props) {
  const t = useTranslations("panel.mensajes");
  const traducir = useTraductorErrores();
  const router = useRouter();
  const [pendiente, iniciar] = useTransition();
  // Abrir un mensaje lo marca como leído (lo hace el efecto de abajo): la pantalla ya lo muestra así.
  const [leido, setLeido] = useState(true);
  const [confirmar, setConfirmar] = useState(false);
  const yaMarcado = useRef(false);

  // Se marca como leído en el navegador (y no al preparar la página): así las precargas de
  // los enlaces no lo marcan sin que nadie lo haya visto.
  useEffect(() => {
    if (mensaje.leido || yaMarcado.current) return;
    yaMarcado.current = true;
    void marcarMensajeAccion(mensaje.id, true);
  }, [mensaje.id, mensaje.leido]);

  const cambiarLeido = () =>
    iniciar(async () => {
      try {
        await marcarMensajeAccion(mensaje.id, !leido);
        setLeido(!leido);
        toast.success(t(leido ? "marcadoNoLeido" : "marcadoLeido"));
      } catch {
        toast.error(traducir("inesperado"));
      }
    });

  const eliminar = async () => {
    try {
      await eliminarMensajeAccion(mensaje.id);
      toast.success(t("eliminado", { nombre: mensaje.nombre }));
      router.push("/panel/mensajes");
    } catch {
      toast.error(traducir("inesperado"));
    }
  };

  return (
    <>
      <EncabezadoPagina
        titulo={mensaje.nombre}
        subtitulo={t("recibido", { fecha: mensaje.fecha })}
        acciones={
          <Button variant="outline" asChild>
            <Link href="/panel/mensajes">
              <ArrowLeftIcon aria-hidden />
              {t("volver")}
            </Link>
          </Button>
        }
      />
      <Card>
        <CardContent className="flex flex-col gap-6">
          <div>
            <p className="text-sm font-semibold text-texto-suave">{t("contacto")}</p>
            <p className="text-lg text-foreground">{mensaje.contacto}</p>
          </div>
          <p className="text-lg whitespace-pre-line text-foreground">{mensaje.texto}</p>
          {formas.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {formas.map((forma) => {
                const Icono = ICONOS[forma.tipo];
                return (
                  <Button key={forma.tipo} variant={forma === formas[0] ? "default" : "outline"} asChild>
                    <a href={forma.href} {...(forma.tipo === "whatsapp" ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                      <Icono aria-hidden className="size-4" />
                      {t(`responder.${forma.tipo}`)}
                    </a>
                  </Button>
                );
              })}
            </div>
          )}
          <div className="flex flex-wrap gap-3 border-t border-border pt-5">
            <Button type="button" variant="outline" disabled={pendiente} onClick={cambiarLeido}>
              {leido ? <MailIcon aria-hidden /> : <MailOpenIcon aria-hidden />}
              {leido ? t("marcarNoLeido") : t("marcarLeido")}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="text-destructive hover:text-destructive sm:ml-auto"
              onClick={() => setConfirmar(true)}
            >
              <Trash2Icon aria-hidden />
              {t("eliminar")}
            </Button>
          </div>
        </CardContent>
      </Card>
      <ConfirmarEliminar
        abierto={confirmar}
        titulo={t("eliminarTitulo", { nombre: mensaje.nombre })}
        texto={t("eliminarTexto")}
        alCerrar={() => setConfirmar(false)}
        alConfirmar={eliminar}
      />
    </>
  );
}
