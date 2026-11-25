"use client";
// <Ambiente>: el fondo del plano a toda la ventana, fijo y DETRÁS del contenido (z-index -1, sin puntero). En el HTML
// va solo la retícula del sitio (.reticula-fondo: CSS puro, se ve igual sin JavaScript). Cuando la página queda
// ociosa entran, en un trozo aparte, 10 marcas a mano por las orillas (cruces de registro, cotas, flechitas) que se
// desplazan apenas con el scroll y se apartan del ratón (AmbienteMarcas). Muy tenue: no compite con el texto.
// Se monta UNA vez por página (p. ej. primer hijo del <body> o antes de <main>).
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import css from "./trafico.module.css";

const Marcas = dynamic(() => import("./AmbienteMarcas"), { ssr: false });

export default function Ambiente() {
  const [listo, setListo] = useState(false);
  useEffect(() => {
    const w = window as Window & { requestIdleCallback?: (f: () => void, o?: { timeout: number }) => number; cancelIdleCallback?: (n: number) => void };
    if (w.requestIdleCallback) {
      const n = w.requestIdleCallback(() => setListo(true), { timeout: 2500 });
      return () => w.cancelIdleCallback?.(n);
    }
    const t = window.setTimeout(() => setListo(true), 1200);
    return () => window.clearTimeout(t);
  }, []);
  return (
    <div className={css.ambiente} aria-hidden="true" data-ambiente="">
      <div className={`reticula-fondo ${css.reticula}`} />
      {listo && <Marcas />}
    </div>
  );
}
