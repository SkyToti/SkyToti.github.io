// <html> y <body> compartidos por los dos root layouts (app/(es) y app/(en)/en): solo cambia el idioma.
import type { ReactNode } from "react";
import Suave from "@/components/movimiento/Suave";
import { CARA_ROTULOS, GUION_ARRANQUE, GUION_ROTULOS } from "@/lib/arranque";
import { fuenteMono, fuenteTexto } from "@/lib/fuentes";
import { ETIQUETA, type Idioma } from "@/lib/idioma";
import { TEXTOS } from "@/lib/textos";

export default function RaizHtml({ idioma, children }: { idioma: Idioma; children: ReactNode }) {
  return (
    // suppressHydrationWarning: el guion de arranque pone las clases `js` y `mueve` antes de hidratar.
    <html lang={ETIQUETA[idioma]} className={`${fuenteTexto.variable} ${fuenteMono.variable}`} suppressHydrationWarning>
      {/* La regla es para pages/ (next/head); en App Router el <head> del root layout es lo correcto. */}
      {/* eslint-disable-next-line @next/next/no-head-element */}
      <head>
        {/* En línea y en el <head>: corre antes del primer pintado. */}
        <script dangerouslySetInnerHTML={{ __html: GUION_ARRANQUE }} />
        {/* La letra de los rótulos llega tras `load` (lib/arranque.ts); sin JavaScript, desde aquí. */}
        <script dangerouslySetInnerHTML={{ __html: GUION_ROTULOS }} />
        <noscript>
          <style>{CARA_ROTULOS}</style>
        </noscript>
      </head>
      <body>
        <a
          href="#contenido"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[60] focus:rounded-[6px] focus:bg-ambar focus:px-4 focus:py-3 focus:font-semibold focus:text-noche"
        >
          {TEXTOS[idioma].saltarAlContenido}
        </a>
        {children}
        <Suave />
      </body>
    </html>
  );
}
