"use client";

import { IconoWhatsapp, MensajeWhatsappDePagina, useEnlaceWhatsapp } from "./whatsapp";

/**
 * En la ficha de una planta: botón «Preguntar por WhatsApp» y, mientras la ficha está abierta,
 * el botón flotante también pregunta por esta planta (regla 10). Los textos llegan ya traducidos.
 */
export function WhatsappDePlanta({ mensaje, texto }: { mensaje: string; texto: string }) {
  const enlace = useEnlaceWhatsapp(mensaje);

  return (
    <>
      <MensajeWhatsappDePagina mensaje={mensaje} />
      {enlace && (
        <a
          href={enlace}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-12 items-center gap-2 self-start rounded-full bg-[#0b6b3a] px-6 font-semibold text-white outline-none hover:opacity-90 focus-visible:ring-4 focus-visible:ring-[#0b6b3a]/40"
        >
          <IconoWhatsapp />
          {texto}
        </a>
      )}
    </>
  );
}
