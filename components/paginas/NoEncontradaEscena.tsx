"use client";
// La broma de la 404 (cliente): al cargar, Haku empuja la taza desde la orilla y se cae; al tocarlo, tira con la
// cola otra cosa de la mesa (la bola de papel, luego el lápiz); cuando ya no queda nada, solo mueve la oreja y
// parpadea. El dibujo lo pinta el servidor (<Dibujo nombre="no-encontrada">, viene como children) y aquí solo se
// mueven sus anclas (data-anim) con GSAP, dentro de `scope`.
// Estado quieto (sin JavaScript o con prefers-reduced-motion, es decir sin html.mueve): la taza ya en el suelo, por
// CSS (NoEncontrada.tsx). Con html.mueve la taza empieza en la mesa y el golpe oculto; GSAP la tira.
import { useRef, useState, type ReactNode } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { CAIDAS, type Caida } from "./NoEncontradaCaidas";
import css from "./NoEncontrada.module.css";

type Props = { children: ReactNode; anclas: Record<string, [number, number]> };

const ETIQUETA = {
  es: "Haku: tócalo y tira otra cosa de la mesa",
  en: "Haku: poke him and he knocks something else off the table",
};

export default function NoEncontradaEscena({ children, anclas }: Props) {
  const raiz = useRef<HTMLDivElement>(null);
  const [etiqueta, setEtiqueta] = useState(ETIQUETA.es);
  const tirar = useRef<(() => void) | null>(null);

  useGSAP(
    (_ctx, contextSafe) => {
      const html = document.documentElement;
      // el guion de arranque quita `mueve` a los 10 s si nadie avisa que el movimiento arrancó
      (window as unknown as { __movimientoListo?: boolean }).__movimientoListo = true;
      if (html.classList.contains("en")) setEtiqueta(ETIQUETA.en);
      const mueve = html.classList.contains("mueve");
      const q = gsap.utils.selector(raiz);
      const origen = (a: string) => `${anclas[a]![0]} ${anclas[a]![1]}`;
      const destino = (c: Caida, a: string) => ({
        x: anclas[`${a}Suelo`]![0] - anclas[a]![0],
        y: anclas[`${a}Suelo`]![1] - anclas[a]![1],
        rotation: c.giro,
      });

      const pata = (t: gsap.core.Timeline, en: number) =>
        t.to(q('[data-anim="pata"]'), { rotation: -16, svgOrigin: origen("pata"), duration: 0.26, ease: "power2.out", yoyo: true, repeat: 1 }, en);
      const cola = (t: gsap.core.Timeline, en: number) =>
        t.to(q('[data-anim="cola"]'), { keyframes: [{ rotation: -84, duration: 0.18, ease: "power2.in" }, { rotation: 10, duration: 0.3, ease: "power1.out" }, { rotation: 0, duration: 0.25 }], svgOrigin: origen("cola") }, en);
      const parpadear = (t: gsap.core.Timeline, en: number) =>
        t.to(q('[data-anim^="ojo"], [data-anim^="pupila"]'), { scaleY: 0.1, transformOrigin: "50% 50%", duration: 0.07, yoyo: true, repeat: 1 }, en);
      const oreja = (t: gsap.core.Timeline, en: number) =>
        t.to(q('[data-anim="oreja"]'), { keyframes: [{ rotation: 16, duration: 0.09 }, { rotation: -7, duration: 0.12 }, { rotation: 0, duration: 0.14 }], svgOrigin: origen("oreja") }, en);

      // la taza: al cargar (con movimiento)
      if (mueve) {
        const t = gsap.timeline({ delay: 0.7 });
        parpadear(t, 0);
        pata(t, 0.35);
        const taza = q('[data-anim="taza"]');
        const fin = destino(CAIDAS.taza, "taza");
        t.to(taza, { x: 10, svgOrigin: origen("taza"), duration: 0.26, ease: "power1.out" }, 0.47)
          .to(taza, { x: 24, y: 6, rotation: 34, duration: 0.3, ease: "power1.in" })
          .to(taza, { x: fin.x, y: fin.y, rotation: fin.rotation, duration: 0.5, ease: "power2.in" })
          .to(taza, { y: fin.y - 9, rotation: fin.rotation - 6, duration: 0.13, ease: "power1.out" })
          .to(taza, { y: fin.y, rotation: fin.rotation, duration: 0.15, ease: "power1.in" })
          .to(q('[data-g="golpe"]'), { opacity: 1, duration: 0.08 }, "<-0.15")
          .to(q('[data-anim="pupilaIzq"], [data-anim="pupilaDer"]'), { y: 4, x: 2, duration: 0.3 }, "<");
      }

      // al tocar: la siguiente cosa de la mesa
      const fila: ("bola" | "lapiz")[] = ["bola", "lapiz"];
      let ocupado = false;
      tirar.current = contextSafe!(() => {
        if (ocupado) return;
        const cosa = fila.shift();
        const conMovimiento = html.classList.contains("mueve");
        if (!cosa) {
          if (!conMovimiento) return;
          const t = gsap.timeline();
          oreja(t, 0);
          parpadear(t, 0.1);
          return;
        }
        const fin = destino(CAIDAS[cosa], cosa);
        const blanco = q(`[data-anim="${cosa}"]`);
        if (!conMovimiento) {
          gsap.set(blanco, { ...fin, svgOrigin: origen(cosa) });
          return;
        }
        ocupado = true;
        const t = gsap.timeline({ onComplete: () => void (ocupado = false) });
        cola(t, 0);
        t.to(blanco, { x: fin.x * 0.35, y: -34, rotation: fin.rotation * 0.4, svgOrigin: origen(cosa), duration: 0.3, ease: "power1.out" }, 0.16)
          .to(blanco, { x: fin.x, y: fin.y, rotation: fin.rotation, duration: 0.5, ease: "power2.in" })
          .to(blanco, { y: fin.y - 7, duration: 0.11, ease: "power1.out" })
          .to(blanco, { y: fin.y, duration: 0.13, ease: "power1.in" });
        oreja(t, 0.5);
      });
    },
    { scope: raiz },
  );

  return (
    <div ref={raiz} className={css.escena}>
      {children}
      <button type="button" className={css.tocar} aria-label={etiqueta} onClick={() => tirar.current?.()} />
    </div>
  );
}
