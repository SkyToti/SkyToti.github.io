// Las dos familias de la dirección (DIRECCION.md §2), alojadas en el propio sitio por next/font.
// Dejan --fuente-texto y --fuente-mono en <html>; app/tokens.css las usa en --letra-texto y --letra-mono.
// Solo «latin»: sin las caras latin-ext ni su precarga (68 KB menos en la carga inicial). Ningún texto del sitio usa
// ese rango (comprobado en out/: fuera de «latin» solo hay flechas y símbolos, que no están en ninguno de los dos).
import { Bricolage_Grotesque, JetBrains_Mono } from "next/font/google";

export const fuenteTexto = Bricolage_Grotesque({
  subsets: ["latin"],
  axes: ["opsz", "wdth"],
  display: "swap",
  variable: "--fuente-texto",
});

export const fuenteMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--fuente-mono",
});
