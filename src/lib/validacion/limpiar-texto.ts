// Limpieza de los textos que se escriben en el panel, antes de guardarlos.
// React ya escapa todo al mostrarlo, así que esto es una segunda barrera: en la base nunca
// queda HTML, ni caracteres invisibles que rompan el diseño o confundan al buscar.

const ETIQUETA_HTML = /<\/?[a-zA-Z!][^<>]*>/g; // «<b>», «</p>», «<!-- -->»; no toca «3 < 5»
const CONTROL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g; // deja el salto de línea y el tabulador
const INVISIBLES = /[​-‍⁠﻿]/g;

export function limpiarTexto(valor: string): string {
  return valor
    .normalize("NFC")
    .replace(/\r\n?/g, "\n")
    .replace(ETIQUETA_HTML, "")
    .replace(CONTROL, "")
    .replace(INVISIBLES, "")
    .replace(/[ \t]+\n/g, "\n") // espacios al final de cada renglón
    .replace(/\n{3,}/g, "\n\n"); // como mucho un renglón vacío entre párrafos
}
