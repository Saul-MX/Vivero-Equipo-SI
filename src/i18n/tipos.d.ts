// Tipos de las traducciones: TypeScript avisa si se usa una clave que no existe en messages/es-MX.json.
import type mensajes from "../../messages/es-MX.json";

declare module "next-intl" {
  interface AppConfig {
    Locale: "es-MX";
    Messages: typeof mensajes;
  }
}
