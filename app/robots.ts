import type { MetadataRoute } from "next";
import { urlAbsoluta } from "@/lib/sitio";

// Exportación estática: se genera una vez, al compilar.
export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: urlAbsoluta("/sitemap.xml"),
  };
}
