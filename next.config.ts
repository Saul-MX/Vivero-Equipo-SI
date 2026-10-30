import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const conTraducciones = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  experimental: {
    // Las fotos pueden pesar hasta 15 MB y se suben una por envío; 16 MB deja margen
    // para los datos del formulario. Aplica a las acciones del servidor y al proxy del panel.
    serverActions: { bodySizeLimit: "16mb" },
    proxyClientMaxBodySize: "16mb",
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
        ],
      },
    ];
  },
};

export default conTraducciones(nextConfig);
