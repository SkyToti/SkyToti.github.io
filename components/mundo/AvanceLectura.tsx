"use client";
// Avance de lectura de la cabecera: una línea fina bajo la cabecera con una mini chispa en su punta, atada al
// scroll de toda la página (scaleX y x; scrub 0.8). Sin JavaScript no se ve (CSS: solo con `html.js`).
import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";

export default function AvanceLectura() {
  const raiz = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = raiz.current;
      if (!el) return;
      const quieto = matchMedia("(prefers-reduced-motion: reduce)").matches;
      gsap
        .timeline({ scrollTrigger: { start: 0, end: "max", scrub: quieto ? true : 0.8, invalidateOnRefresh: true } })
        .fromTo("[data-avance-trazo]", { scaleX: 0 }, { scaleX: 1, duration: 1, ease: "none" }, 0)
        .fromTo("[data-avance-chispa]", { x: 0 }, { x: () => el.clientWidth, duration: 1, ease: "none" }, 0);
    },
    { scope: raiz },
  );

  return (
    <div ref={raiz} aria-hidden="true" className="avance">
      <span data-avance-trazo="" className="avance-trazo" />
      <span data-avance-chispa="" className="avance-chispa" />
    </div>
  );
}
