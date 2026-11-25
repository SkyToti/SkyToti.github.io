"use client";
// Cruce `viga` (scrub): tres agentes en fila cargan al hombro una viga larga de derecha a izquierda. Avanzan a saltos
// de un cuadro (sin patinar), cada uno en otra fase del ciclo; el último va un PASO atrasado y, a mitad del cruce, da
// un pasito de más (dos cuadros de golpe) para alcanzar su lugar. La viga descansa en los tres hombros todo el rato.
// En < 640 px: un solo agente con una tabla corta. Menos movimiento: viñeta quieta a mitad del recorrido.
import { useId, useRef, type CSSProperties } from "react";
import hombro from "@/components/dibujo/datos/trafico-hombro.json";
import viga from "@/components/dibujo/datos/trafico-viga.json";
import tabla from "@/components/dibujo/datos/trafico-tabla.json";
import suelo from "@/components/dibujo/datos/trafico-suelo.json";
import { limpiarId } from "@/components/dibujo/ids";
import { gsap, useGSAP } from "../../gsapMundo";
import { AGENTES_VIGA, LIENZO_TABLA, LIENZO_VIGA, PASO, marcado, ponerCuadro, puedeMover, vb } from "../comun";
import css from "../trafico.module.css";

const FASES = [0, 2, 1]; // el de delante, el de en medio, el último
const ALCANZA = 0.42; // fracción del cruce en la que el último da su pasito de más

export default function Viga() {
  const raiz = useRef<HTMLDivElement>(null);
  const uid = limpiarId(useId());

  useGSAP(
    () => {
      const escena = raiz.current!;
      const mm = gsap.matchMedia();
      mm.add(
        { ancho: "(min-width: 640px)", angosto: "(max-width: 639.98px)", quieto: "(prefers-reduced-motion: reduce)" },
        (ctx) => {
          const { ancho, quieto } = ctx.conditions as { ancho: boolean; quieto: boolean };
          const actor = escena.querySelector<SVGSVGElement>(ancho ? "[data-actor='fila']" : "[data-actor='uno']")!;
          const agentes = [...actor.querySelectorAll<SVGGElement>("[data-agente]")];
          const ultimo = ancho ? agentes[2]! : null;
          const [, , , VH] = ancho ? LIENZO_VIGA : LIENZO_TABLA;
          let W = 0, A = 0, s = 1, previo = -1;
          const medir = () => {
            W = escena.clientWidth;
            const r = actor.getBoundingClientRect();
            A = r.width;
            s = r.height / VH;
          };
          /** p 0–1: de fuera por la derecha a fuera por la izquierda (el actor va reflejado) */
          const aplicar = (p: number) => {
            const paso = PASO * s, total = Math.ceil((W + A + paso) / paso);
            const n = Math.floor((p * (W + A + paso)) / paso);
            if (n === previo) return;
            previo = n;
            gsap.set(actor, { x: W - n * paso });
            agentes.forEach((g, i) => ponerCuadro(g, n + (FASES[i] ?? 0)));
            if (ultimo) {
              const alcanzo = n >= Math.floor(total * ALCANZA);
              ponerCuadro(ultimo, n + FASES[2]! + (alcanzo ? 1 : 0));
              gsap.set(ultimo, { x: alcanzo ? 0 : -PASO });
            }
          };
          if (quieto || !puedeMover()) {
            medir();
            aplicar(0.5);
            return;
          }
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
              onRefresh: () => { medir(); previo = -1; aplicar(estado.p); },
            },
          });
        },
      );
      return () => mm.revert();
    },
    { scope: raiz },
  );

  const agente = (k: number) => (
    <g data-agente="" data-c="0" className={css.agente} dangerouslySetInnerHTML={{ __html: marcado(hombro, `a${uid}${k}`) }} />
  );
  const estilo = (l: readonly number[], h: string) => ({ "--h": h, "--r": l[2]! / l[3]! }) as CSSProperties;
  return (
    <div ref={raiz} className={css.escena}>
      <svg className={css.suelo} viewBox="0 -8 3200 16" focusable="false" dangerouslySetInnerHTML={{ __html: marcado(suelo, `s${uid}`) }} />
      <svg data-actor="fila" className={`${css.actor} ${css.alReves} ${css.soloAncho}`} viewBox={vb(LIENZO_VIGA)} focusable="false" style={estilo(LIENZO_VIGA, "clamp(120px, 6vw + 74px, 150px)")}>
        <g dangerouslySetInnerHTML={{ __html: marcado(viga, `v${uid}`) }} />
        {AGENTES_VIGA.map((x, i) => (
          <g key={i} transform={`translate(${x} 0)`}>
            {agente(i)}
          </g>
        ))}
      </svg>
      <svg data-actor="uno" className={`${css.actor} ${css.alReves} ${css.soloAngosto}`} viewBox={vb(LIENZO_TABLA)} focusable="false" style={estilo(LIENZO_TABLA, "120px")}>
        <g dangerouslySetInnerHTML={{ __html: marcado(tabla, `t${uid}`) }} />
        {agente(9)}
      </svg>
    </div>
  );
}
