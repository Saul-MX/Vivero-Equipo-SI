import { crearEnlaceWhatsapp } from "@/lib/datos-negocio/normalizar";

// Cómo responder a quien dejó un mensaje en Contacto, según lo que escribió en «Teléfono o correo».

export type FormaDeResponder = { tipo: "whatsapp" | "llamar" | "correo"; href: string };

export function formasDeResponder(contacto: string): FormaDeResponder[] {
  const texto = contacto.trim();
  if (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(texto)) return [{ tipo: "correo", href: `mailto:${texto}` }];

  const digitos = texto.replace(/\D/g, "");
  if (digitos.length < 7) return [];
  const formas: FormaDeResponder[] = [{ tipo: "llamar", href: `tel:${digitos}` }];
  // Un celular de México: 10 números (o 12 con el 52 del país adelante).
  const celular = digitos.length === 12 && digitos.startsWith("52") ? digitos.slice(2) : digitos;
  if (celular.length === 10) formas.unshift({ tipo: "whatsapp", href: crearEnlaceWhatsapp(celular) });
  return formas;
}
