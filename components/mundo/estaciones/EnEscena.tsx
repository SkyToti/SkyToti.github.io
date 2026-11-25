"use client";
// El contenedor del Haku dibujado de una estación (`data-haku="propio"`, el buzón y el pie). Regla de UN solo Haku:
// mientras el guía anda, el Haku de aquí no se ve (lo esconde el CSS del guía) hasta que el guía llega, salta y
// desaparece (`haku:entra-en-escena`, sobre este mismo contenedor); al irse (`haku:sale-de-escena`) se esconde otra vez.
// Lo que el dibujo hizo con su Haku todavía escondido (empujar el sobre, las «z») se repite al entrar en escena: el
// guía solo entra cuando la entrada del dibujo ya terminó (`data-entro`), así que se vuelve a poner como al principio
// (`reinicio`: vars de GSAP por `data-anim`) y corre `gesto`, con Haku ya a la vista.
import { useEffect, useRef, type ReactNode } from "react";
import { gsap } from "@/components/dibujo/gsapDibujo";

export default function EnEscena({
  gesto,
  reinicio,
  className,
  children,
}: {
  gesto: string;
  reinicio?: Record<string, gsap.TweenVars>;
  className?: string;
  children: ReactNode;
}) {
  const raiz = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = raiz.current;
    if (!el) return;
    const alEntrar = (ev: Event) => {
      if (ev.target !== el || !el.querySelector("[data-entro]")) return;
      const mueve = document.documentElement.classList.contains("mueve") && !matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (!mueve) return;
      for (const [anim, vars] of Object.entries(reinicio ?? {})) {
        const piezas = el.querySelectorAll(`[data-anim="${anim}"]`);
        if (piezas.length) gsap.set(piezas, vars);
      }
      el.querySelector("svg[data-dibujo]")?.dispatchEvent(new CustomEvent("dibujo:gesto", { bubbles: true, detail: { gesto } }));
    };
    el.addEventListener("haku:entra-en-escena", alEntrar);
    return () => {
      el.removeEventListener("haku:entra-en-escena", alEntrar);
    };
  }, [gesto, reinicio]);

  return (
    <div ref={raiz} className={className} data-haku="propio">
      {children}
    </div>
  );
}
