import type { MetadataRoute } from "next";
import { urlDelSitio } from "@/lib/sitio/metadatos";

// Indica a los buscadores qué pueden revisar: todo el sitio público, nunca el panel.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/panel", "/archivos/temporal/"] },
    sitemap: new URL("/sitemap.xml", urlDelSitio()).toString(),
  };
}
