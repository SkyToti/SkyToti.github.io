// 404 de todo el sitio (out/404.html). Con dos root layouts no hay uno común, así que este archivo trae su propio
// <html>, letras y estilos. Bilingüe: el servidor estático sirve el mismo archivo para /… y /en/…, así que el guion
// del <head> mira la ruta y, si empieza en /en/, pone lang="en" y la clase `en` antes del primer pintado (el CSS
// enseña el inglés). Sin JavaScript se ve en español con el enlace en inglés debajo.
import type { Metadata } from "next";
import NoEncontrada from "@/components/paginas/NoEncontrada";
import { CARA_ROTULOS, GUION_ARRANQUE, GUION_ROTULOS } from "@/lib/arranque";
import { fuenteMono, fuenteTexto } from "@/lib/fuentes";
import "./globals.css";

export const metadata: Metadata = {
  title: "404 · Esta página no existe / This page doesn't exist",
  robots: { index: false },
};

const GUION_IDIOMA = `(function(){if(/^\\/en(\\/|$)/.test(location.pathname)){var d=document.documentElement;d.lang="en";d.classList.add("en")}})();`;

export default function GlobalNotFound() {
  return (
    <html lang="es-MX" className={`${fuenteTexto.variable} ${fuenteMono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: GUION_IDIOMA + GUION_ARRANQUE }} />
        <script dangerouslySetInnerHTML={{ __html: GUION_ROTULOS }} />
        <noscript>
          <style>{CARA_ROTULOS}</style>
        </noscript>
      </head>
      <body>
        <NoEncontrada />
      </body>
    </html>
  );
}
