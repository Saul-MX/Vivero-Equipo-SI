"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { crearEnlaceWhatsapp } from "@/lib/datos-negocio/normalizar";
import { cn } from "@/lib/utils";

// Botón de WhatsApp del sitio (regla 10): abre https://wa.me/52<número> con un mensaje prellenado.
// El mensaje general se cambia por el de una planta mientras su ficha está abierta.

type ContextoWhatsapp = { numero: string | null; mensaje: string | null; fijarMensaje: (mensaje: string | null) => void };

const Contexto = createContext<ContextoWhatsapp>({ numero: null, mensaje: null, fijarMensaje: () => {} });

export function ProveedorWhatsapp({ numero, children }: { numero: string | null; children: ReactNode }) {
  const [mensaje, fijarMensaje] = useState<string | null>(null);
  return <Contexto value={{ numero, mensaje, fijarMensaje }}>{children}</Contexto>;
}

/** La ficha de una planta lo usa para que el botón flotante pregunte por esa planta. */
export function MensajeWhatsappDePagina({ mensaje }: { mensaje: string }) {
  const { fijarMensaje } = useContext(Contexto);
  useEffect(() => {
    fijarMensaje(mensaje);
    return () => fijarMensaje(null);
  }, [mensaje, fijarMensaje]);
  return null;
}

/** El logotipo de WhatsApp (decorativo: el botón lleva su texto). */
export function IconoWhatsapp({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" fill="currentColor" className={cn("size-6", className)}>
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm.01 18.15h-.01a8.23 8.23 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24 2.2 0 4.27.86 5.83 2.42a8.18 8.18 0 0 1 2.41 5.83c0 4.54-3.7 8.23-8.24 8.23Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.13-.15.17-.25.25-.42.08-.17.04-.31-.02-.43-.06-.13-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.22.25-.86.85-.86 2.07 0 1.22.89 2.39 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.14-1.18-.06-.1-.22-.16-.47-.29Z" />
    </svg>
  );
}

/** Enlace a WhatsApp con el mensaje de la página (o el indicado). Si no hay número, no se muestra. */
export function useEnlaceWhatsapp(mensajePropio?: string): string | null {
  const t = useTranslations("sitio.whatsapp");
  const { numero, mensaje } = useContext(Contexto);
  if (!numero) return null;
  return crearEnlaceWhatsapp(numero, mensajePropio ?? mensaje ?? t("mensajeGeneral"));
}

export function BotonWhatsappFlotante() {
  const t = useTranslations("sitio.whatsapp");
  const enlace = useEnlaceWhatsapp();
  if (!enlace) return null;
  return (
    <a
      href={enlace}
      target="_blank"
      rel="noopener noreferrer"
      data-testid="whatsapp-flotante"
      className="fixed right-4 bottom-4 z-40 inline-flex min-h-14 items-center gap-2 rounded-full bg-[#0b6b3a] px-4 text-white shadow-lg shadow-black/20 transition-transform outline-none hover:scale-105 focus-visible:ring-4 focus-visible:ring-[#0b6b3a]/40 sm:right-6 sm:bottom-6"
    >
      <IconoWhatsapp className="size-7" />
      <span className="font-semibold max-sm:sr-only">{t("boton")}</span>
    </a>
  );
}
