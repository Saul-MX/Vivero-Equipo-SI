import type { MetadataRoute } from "next";
import { catalogosVisibles, plantasVisibles } from "@/lib/sitio/datos";
import { urlDelSitio } from "@/lib/sitio/metadatos";

// Mapa del sitio para buscadores (/sitemap.xml): las páginas fijas, los catálogos y cada planta visible.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = urlDelSitio();
  const url = (ruta: string) => new URL(ruta, base).toString();
  const [catalogos, plantas] = await Promise.all([catalogosVisibles(), plantasVisibles()]);

  return [
    { url: url("/"), changeFrequency: "daily", priority: 1 },
    ...["/temporada", "/catalogos", "/plantas", "/fertilizantes", "/nosotros", "/contacto"].map((ruta) => ({
      url: url(ruta),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...catalogos.map((catalogo) => ({ url: url(`/catalogos/${catalogo.slug}`), changeFrequency: "weekly" as const })),
    ...plantas.map((planta) => ({ url: url(`/plantas/${planta.slug}`), changeFrequency: "monthly" as const })),
  ];
}
