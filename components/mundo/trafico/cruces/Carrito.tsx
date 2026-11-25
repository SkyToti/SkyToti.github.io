"use client";
// Cruce `carrito` (scrub): un agente empuja de izquierda a derecha un carrito con el número del siguiente proyecto.
// Avanza ligado al scroll mientras la banda cruza la ventana (de que asoma abajo a que se va arriba). Se mueve a
// saltos de un cuadro (PASO unidades): en cada salto cambia el cuadro del ciclo y el pie apoyado queda en su sitio
// (no patina); las ruedas giran lo que avanzan. Menos movimiento: viñeta quieta a mitad del recorrido.
import { useId, useRef, type CSSProperties } from "react";
import empuja from "@/components/dibujo/datos/trafico-empuja.json";
import carrito from "@/components/dibujo/datos/trafico-carrito.json";
import suelo from "@/components/dibujo/datos/trafico-suelo.json";
import { limpiarId } from "@/components/dibujo/ids";
import { gsap, useGSAP } from "../../gsapMundo";
import { LETRERO, LIENZO_CARRITO, PASO, RUEDA, marcado, ponerCuadro, puedeMover, vb } from "../comun";
import css from "../trafico.module.css";

const [, , VW, VH] = LIENZO_CARRITO;

export default function Carrito({ numero = "" }: { numero?: string }) {
  const raiz = useRef<HTMLDivElement>(null);
  const uid = limpiarId(useId());

  useGSAP(
    () => {
      const escena = raiz.current!;
      const actor = escena.querySelector<SVGSVGElement>("[data-actor]")!;
      const agente = actor.querySelector("[data-agente]")!;
      const ruedas = [...actor.querySelectorAll<SVGGElement>('[data-anim^="rueda"]')];
      ruedas.forEach((r) => gsap.set(r, { svgOrigin: r.dataset.o }));

      let W = 0, A = 0, s = 1, ultimo = -1;
      const medir = () => {
        W = escena.clientWidth;
        const r = actor.getBoundingClientRect();
        A = r.width;
        s = r.height / VH;
      };
      /** p 0–1: de fuera por la izquierda a fuera por la derecha */
      const aplicar = (p: number) => {
        const paso = PASO * s;
        const n = Math.floor((p * (W + A + paso)) / paso);
        if (n === ultimo) return;
        ultimo = n;
        gsap.set(actor, { x: -A + n * paso });
        ponerCuadro(agente, n);
        gsap.set(ruedas, { rotation: ((n * PASO) / RUEDA) * (180 / Math.PI) });
      };

      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        if (!puedeMover()) return;
        const estado = { p: 0 };
        medir();
        aplicar(0);
        gsap.to(estado, {
          p: 1,
          ease: "none",
          onUpdate: () => aplicar(estado.p),
          scrollTrigger: {
            trigger: escena,
            start: "clamp(top bottom)",
            end: "clamp(bottom top)",
            scrub: 0.4,
            onRefresh: () => { medir(); ultimo = -1; aplicar(estado.p); },
          },
        });
      });
      mm.add("(prefers-reduced-motion: reduce)", () => { medir(); aplicar(0.5); });
      if (!puedeMover() && window.matchMedia("(prefers-reduced-motion: no-preference)").matches) { medir(); aplicar(0.5); }
      return () => mm.revert();
    },
    { scope: raiz },
  );

  return (
    <div ref={raiz} className={css.escena}>
      <svg className={css.suelo} viewBox="0 -8 3200 16" focusable="false" dangerouslySetInnerHTML={{ __html: marcado(suelo, `s${uid}`) }} />
      <svg
        data-actor=""
        className={css.actor}
        viewBox={vb(LIENZO_CARRITO)}
        focusable="false"
        style={{ "--h": "clamp(150px, 13vw + 50px, 190px)", "--r": VW / VH } as CSSProperties}
      >
        <g dangerouslySetInnerHTML={{ __html: marcado(carrito, `c${uid}`) }} />
        <text className={css.numero} x={LETRERO.x} y={LETRERO.y} textAnchor="middle" dominantBaseline="central" fontSize={numero.length > 2 ? 30 : 40}>
          {numero}
        </text>
        <g data-agente="" data-c="0" className={css.agente} dangerouslySetInnerHTML={{ __html: marcado(empuja, `a${uid}`) }} />
      </svg>
    </div>
  );
}
