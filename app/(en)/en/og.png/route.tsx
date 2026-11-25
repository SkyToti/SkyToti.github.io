// /en/og.png: imagen para compartir en inglés, generada al compilar (lib/imagenOg.tsx). Ver app/(es)/og.png.
import { imagenOg } from "@/lib/imagenOg";

export const dynamic = "force-static";

export function GET() {
  return imagenOg("en");
}
