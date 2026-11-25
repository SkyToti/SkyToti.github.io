"use client";
// <TiraDeLado>: una fila de piezas (capturas, láminas) que PASA DE LADO con el scroll en escritorio: la pista se corre
// de derecha a izquierda mientras el bloque cruza la pantalla (scrub). Su caja recorta lo que se sale, así la línea
// viva puede pasar junto a ella sin que nada la pise. Con menos movimiento, sin JavaScript y en < 1024 px: un
// carrusel con el dedo (scroll-snap), enfocable con el teclado. Contrato: components/paginas/inicio/LEEME.md.
import { Children, useRef, type CSSProperties, type ReactNode } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import css from "./vista.module.css";

type Vars = CSSProperties & Record<`--${string}`, string | number | undefined>;

export default function TiraDeLado({
  children,
  etiqueta,
  cuadro = "22vw",
  className,
  style,
}: {
  children: ReactNode;
  /** nombre accesible de la tira */
  etiqueta: string;
  /** ancho de cada pieza en escritorio (en < 1024 px, 78 % de la tira) */
  cuadro?: string;
  className?: string;
  style?: CSSProperties;
}) {
  const raiz = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = raiz.current;
      const pista = el?.querySelector<HTMLElement>("[data-pista]");
      if (!el || !pista || !document.documentElement.classList.contains("mueve")) return;
      const mm = gsap.matchMedia();
      mm.add("(min-width: 1024px) and (prefers-reduced-motion: no-preference)", () => {
        el.dataset.pasa = "";
        gsap.fromTo(
          pista,
          { x: 0 },
          {
            x: () => -Math.max(0, pista.scrollWidth - el.clientWidth),
            ease: "none",
            scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: 0.8, invalidateOnRefresh: true },
          },
        );
        return () => {
          delete el.dataset.pasa;
        };
      });
      return () => mm.revert();
    },
    { scope: raiz },
  );

  return (
    <div
      ref={raiz}
      role="region"
      aria-label={etiqueta}
      tabIndex={0}
      className={`${css.tira} ${className ?? ""}`}
      style={{ ...style, "--cuadro": cuadro } as Vars}
    >
      <ul data-pista="" className={css.pista}>
        {Children.toArray(children).map((pieza, i) => (
          <li key={i} className={css.cuadro}>
            {pieza}
          </li>
        ))}
      </ul>
    </div>
  );
}
