// /og.png: imagen para compartir en español, generada al compilar (lib/imagenOg.tsx). Va como ruta con
// extensión (y no como opengraph-image) para que la exportación estática deje un .png que cualquier servidor
// sirva como image/png.
import { imagenOg } from "@/lib/imagenOg";

export const dynamic = "force-static";

export function GET() {
  return imagenOg("es");
}
