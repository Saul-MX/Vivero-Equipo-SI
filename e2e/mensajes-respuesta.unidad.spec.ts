import { expect, test } from "@playwright/test";
import { formasDeResponder } from "../src/lib/mensajes/respuesta";

test("un celular de 10 números: WhatsApp y llamada", () => {
  expect(formasDeResponder("222 123 4567")).toEqual([
    { tipo: "whatsapp", href: "https://wa.me/522221234567" },
    { tipo: "llamar", href: "tel:2221234567" },
  ]);
  // Con el 52 del país adelante, también.
  expect(formasDeResponder("+52 (222) 123-4567")[0]).toEqual({ tipo: "whatsapp", href: "https://wa.me/522221234567" });
});

test("un teléfono fijo corto: solo llamada", () => {
  expect(formasDeResponder("761 5253")).toEqual([{ tipo: "llamar", href: "tel:7615253" }]);
});

test("un correo: responder por correo", () => {
  expect(formasDeResponder(" rosa@example.com ")).toEqual([{ tipo: "correo", href: "mailto:rosa@example.com" }]);
});

test("algo que no es teléfono ni correo: sin botones", () => {
  expect(formasDeResponder("mi vecina")).toEqual([]);
  expect(formasDeResponder("123")).toEqual([]);
});
