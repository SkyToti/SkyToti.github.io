import type { MetadataRoute } from "next";
import { contenido } from "@/lib/contenido";
import { alternos, rutaCaso, rutaInicio, type Idioma } from "@/lib/idioma";
import { urlAbsoluta } from "@/lib/sitio";

// Exportación estática: se genera una vez, al compilar. Sin lastModified (Google solo lo usa si es la fecha
// real del último cambio de contenido, nunca la de compilación).
export const dynamic = "force-static";

const entrada = (ruta: (idioma: Idioma) => string): MetadataRoute.Sitemap =>
  (["es", "en"] as const).map((idioma) => ({
    url: urlAbsoluta(ruta(idioma)),
    alternates: {
      languages: Object.fromEntries(Object.entries(alternos(ruta)).map(([k, v]) => [k, urlAbsoluta(v)])),
    },
  }));

export default function sitemap(): MetadataRoute.Sitemap {
  return [...entrada(rutaInicio), ...contenido().slugs().flatMap((slug) => entrada((i) => rutaCaso(i, slug)))];
}
