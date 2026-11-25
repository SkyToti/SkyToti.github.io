"use client";
// Solo para el banco: hace de «chispa» falsa. Cuando cada [data-estacion] del banco entra a la mitad de la ventana,
// le pone la clase `llego` y despacha `estacion:llega` (burbujea hasta document), una sola vez, como LineaViva.
import { useEffect } from "react";

export default function BancoEstaciones({ selector = "[data-banco-estacion]" }: { selector?: string }) {
  useEffect(() => {
    const io = new IntersectionObserver(
      (entradas) => {
        for (const e of entradas) {
          const el = e.target as HTMLElement;
          if (!e.isIntersecting || el.classList.contains("llego")) continue;
          el.classList.add("llego");
          el.dispatchEvent(new CustomEvent("estacion:llega", { bubbles: true, detail: { nombre: el.dataset.estacion, quieto: false } }));
          io.unobserve(el);
        }
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    document.querySelectorAll(selector).forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [selector]);
  return null;
}
