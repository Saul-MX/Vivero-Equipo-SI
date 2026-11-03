import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const conTraducciones = createNextIntlPlugin("./src/i18n/request.ts");

// Política de contenido (CSP): de dónde puede cargar cosas el sitio. Solo del propio dominio,
// más el mapa de Google en Contacto. Next pone algunos scripts y estilos en la página, por eso
// se permiten los «inline». Solo en producción (en desarrollo Next necesita más permisos).
const POLITICA_CONTENIDO = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "media-src 'self' blob:",
  "font-src 'self'",
  "connect-src 'self'",
  "frame-src https://www.google.com https://maps.google.com",
  "frame-ancestors 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");
const enProduccion = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  // Solo en desarrollo: permite abrir el sitio desde la red local (ej. http://192.168.56.1:3000 o el
  // celular). Sin esto, Next bloquea sus scripts de desarrollo y los menús no responden.
  allowedDevOrigins: ["192.168.*.*"],
  experimental: {
    // Las acciones del servidor (formularios, Contacto, inicio de sesión) solo reciben datos: 2 MB bastan.
    // Las fotos y videos se suben por /panel/subir, que revisa la sesión y el tamaño antes de leerlos;
    // esa ruta pasa por el proxy del panel, que debe aceptar hasta 41 MB (video de 40 MB + formulario).
    serverActions: { bodySizeLimit: "2mb" },
    proxyClientMaxBodySize: "41mb",
    // El CSS (Tailwind, ~15 KB) va dentro de la página en vez de un archivo aparte que bloquea el dibujo:
    // en celular la primera vista aparece antes.
    inlineCss: true,
  },
  turbopack: {
    // La raíz es esta carpeta (evita que Next confunda archivos de carpetas superiores).
    root: import.meta.dirname,
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  // Encabezados de seguridad básicos para todas las páginas.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          ...(enProduccion
            ? [
                { key: "Content-Security-Policy", value: POLITICA_CONTENIDO },
                // Siempre por https (el navegador lo recuerda un año). En http://localhost no tiene efecto.
                { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
              ]
            : []),
        ],
      },
    ];
  },
};

export default conTraducciones(nextConfig);
