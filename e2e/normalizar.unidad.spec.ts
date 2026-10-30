import { expect, test } from "@playwright/test";
import {
  crearEnlaceWhatsapp,
  extraerSrcMapa,
  indicesRepetidos,
  normalizarEnlaceMaps,
  normalizarFacebook,
  normalizarInstagram,
  normalizarTelefonos,
  sonTelefonosValidos,
} from "../src/lib/datos-negocio/normalizar";
import { esquemaColores, esquemaDatosNegocio } from "../src/lib/validacion/datos-negocio";

// Reglas de «Datos y redes» sin navegador: son las mismas que aplica el servidor al guardar.

const EMBED = "https://www.google.com/maps/embed?pb=!1m18!1m12&hl=es";

test.describe("mapa para insertar", () => {
  test("del <iframe> completo solo se queda la dirección del mapa", () => {
    const iframe = `<iframe src="${EMBED.replace("&", "&amp;")}" width="600" onload="alert(1)"></iframe>`;
    expect(extraerSrcMapa(iframe)).toBe(EMBED);
    expect(extraerSrcMapa(EMBED)).toBe(EMBED);
    expect(extraerSrcMapa(`<iframe src='${EMBED}'></iframe>`)).toBe(EMBED);
    expect(extraerSrcMapa("https://maps.google.com/maps?q=Atlixco&output=embed")).not.toBeNull();
  });

  test("rechaza lo que no es un mapa de Google con https", () => {
    for (const malo of [
      '<iframe src="https://sitio-malo.com/maps/embed?pb=1"></iframe>',
      '<iframe src="javascript:alert(1)"></iframe>',
      '<iframe src="http://www.google.com/maps/embed?pb=1"></iframe>',
      "<script>alert(1)</script>",
      '<img src="https://www.google.com/maps/embed?pb=1">',
      "https://www.google.com/search?q=vivero",
      "https://usuario:clave@www.google.com/maps/embed?pb=1",
      "texto cualquiera",
    ]) {
      expect(extraerSrcMapa(malo), malo).toBeNull();
    }
  });
});

test("enlaces de Google Maps, Facebook e Instagram", () => {
  expect(normalizarEnlaceMaps("https://maps.app.goo.gl/AbC123")).toBe("https://maps.app.goo.gl/AbC123");
  expect(normalizarEnlaceMaps("www.google.com/maps/place/Atlixco")).toBe("https://www.google.com/maps/place/Atlixco");
  expect(normalizarEnlaceMaps("https://www.google.com/search?q=x")).toBeNull();
  expect(normalizarEnlaceMaps("javascript:alert(1)")).toBeNull();

  expect(normalizarFacebook("facebook.com/vivero")).toBe("https://facebook.com/vivero");
  expect(normalizarFacebook("https://www.facebook.com/")).toBeNull();
  expect(normalizarFacebook("https://twitter.com/vivero")).toBeNull();

  expect(normalizarInstagram("@vivero_el.encanto")).toBe("https://www.instagram.com/vivero_el.encanto/");
  expect(normalizarInstagram("https://instagram.com/vivero?igsh=abc")).toBe("https://www.instagram.com/vivero");
  expect(normalizarInstagram("vivero")).toBeNull();
});

test("teléfonos y WhatsApp", () => {
  expect(normalizarTelefonos(" 244 761 52 53,244  122 83 37 , ")).toBe("244 761 52 53, 244 122 83 37");
  expect(sonTelefonosValidos("244 761 52 53, 244 122 83 37")).toBe(true);
  expect(sonTelefonosValidos("244 761, abc")).toBe(false);
  expect(crearEnlaceWhatsapp("2441234567")).toBe("https://wa.me/522441234567");
  expect(crearEnlaceWhatsapp("2441234567", "Hola, me interesa la Nochebuena")).toBe(
    "https://wa.me/522441234567?text=Hola%2C%20me%20interesa%20la%20Nochebuena",
  );
});

test("el servidor limpia y valida los datos del negocio", () => {
  const valido = esquemaDatosNegocio.safeParse({
    whatsapp: "244-123 4567",
    telefonos: "244 761 52 53,244 122 83 37",
    correo: "",
    horario: "Lunes a domingo de 8:00 a 18:00",
    horarioEspecial: "",
    direccion: "Atlixco, Puebla",
    enlaceMaps: "maps.app.goo.gl/AbC123",
    mapa: `<iframe src="${EMBED}"></iframe>`,
    facebook: "",
    instagram: "@vivero",
  });
  expect(valido.success).toBe(true);
  expect(valido.data).toMatchObject({
    whatsapp: "2441234567",
    telefonos: "244 761 52 53, 244 122 83 37",
    enlaceMaps: "https://maps.app.goo.gl/AbC123",
    mapa: EMBED,
    instagram: "https://www.instagram.com/vivero/",
  });

  const invalido = esquemaDatosNegocio.safeParse({
    whatsapp: "52 244 123 4567",
    telefonos: "",
    correo: "x@",
    horario: "",
    horarioEspecial: "",
    direccion: "",
    enlaceMaps: "https://example.com",
    mapa: "<script>alert(1)</script>",
    facebook: "",
    instagram: "",
  });
  expect(invalido.success).toBe(false);
  // Un solo mensaje por campo (el que se muestra en pantalla).
  const campos = invalido.error!.issues.map((i) => i.path.join("."));
  expect(new Set(campos).size).toBe(campos.length);
  const mensajes = Object.fromEntries(invalido.error!.issues.map((i) => [i.path.join("."), i.message]));
  expect(mensajes).toMatchObject({
    whatsapp: "whatsappInvalido",
    telefonos: "telefonosRequeridos",
    correo: "correoInvalido",
    horario: "horarioRequerido",
    direccion: "direccionRequerida",
    enlaceMaps: "enlaceMapsInvalido",
    mapa: "mapaInvalido",
  });
});

test("las listas no aceptan nombres repetidos (sin importar mayúsculas ni acentos)", () => {
  expect(indicesRepetidos(["Rojo", "Azul", "rojo", "Café", "cafe"])).toEqual([2, 4]);
  const resultado = esquemaColores.safeParse({
    colores: [
      { colorId: 1, nombre: "Rojo", hex: "#c62828" },
      { colorId: null, nombre: " ROJO ", hex: "#000000" },
      { colorId: null, nombre: "", hex: "rojo" },
    ],
  });
  expect(resultado.success).toBe(false);
  const mensajes = resultado.error!.issues.map((i) => `${i.path.join(".")}=${i.message}`);
  expect(mensajes).toEqual(
    expect.arrayContaining([
      "colores.1.nombre=nombreRepetido",
      "colores.2.nombre=colorNombreRequerido",
      "colores.2.hex=colorTonoInvalido",
    ]),
  );
});
