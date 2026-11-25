"use client";
// <Abanico>: de 2 a 4 <Vista> superpuestas en abanico (escritorio). La que se toca, se señala o se enfoca pasa al
// frente con resorte; con el teclado se recorren con Tab o con las flechas ← →. En un toque, la primera vez solo la
// trae al frente (no navega). En < 1024 px es un carrusel con el dedo (scroll-snap). Sin JavaScript: el carrusel o
// el abanico quieto, con todas las vistas y sus enlaces. Contrato: components/paginas/inicio/LEEME.md.
import { Children, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from "react";
import css from "./vista.module.css";

type Vars = CSSProperties & Record<`--${string}`, string | number | undefined>;

export default function Abanico({
  children,
  etiqueta,
  abre = "16%",
  giro = 5,
  className,
  style,
}: {
  /** las <Vista> (2 a 4), cada una con su `ancho`; mejor sin `inclina` (el abanico ya las gira) */
  children: ReactNode;
  /** nombre accesible del grupo */
  etiqueta: string;
  /** cuánto se separa cada vista de la del centro (CSS, relativo al ancho del abanico) */
  abre?: string;
  /** grados de giro entre una vista y la siguiente */
  giro?: number;
  className?: string;
  style?: CSSProperties;
}) {
  const hojas = Children.toArray(children);
  const n = hojas.length;
  const [frente, setFrente] = useState(0);
  const tocada = useRef<number | null>(null);
  const raiz = useRef<HTMLDivElement>(null);

  const mover = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    const todas = [...(raiz.current?.querySelectorAll<HTMLElement>("[data-hoja]") ?? [])];
    const actual = todas.findIndex((h) => h.contains(document.activeElement));
    const sig = todas[(Math.max(0, actual) + (e.key === "ArrowRight" ? 1 : n - 1)) % n];
    const foco = sig?.querySelector<HTMLElement>("a,button,[tabindex]");
    if (!foco) return;
    e.preventDefault();
    foco.focus();
  };

  return (
    <div
      ref={raiz}
      role="region"
      aria-label={etiqueta}
      tabIndex={0}
      className={`${css.abanico} ${className ?? ""}`}
      style={{ ...style, "--n": n, "--abre": abre, "--giro": `${giro}deg` } as Vars}
      onKeyDown={mover}
    >
      {hojas.map((hoja, i) => (
        <div
          key={i}
          data-hoja=""
          data-frente={i === frente || undefined}
          className={css.hoja}
          style={{ "--i": i, "--z": i === frente ? n + 1 : n - Math.abs(i - frente) } as Vars}
          onPointerEnter={(e) => e.pointerType === "mouse" && setFrente(i)}
          onFocus={() => setFrente(i)}
          onPointerDown={(e) => {
            tocada.current = e.pointerType !== "mouse" && i !== frente ? i : null;
          }}
          onClickCapture={(e) => {
            if (tocada.current !== i) return;
            tocada.current = null;
            e.preventDefault();
            setFrente(i);
          }}
        >
          {hoja}
        </div>
      ))}
    </div>
  );
}
