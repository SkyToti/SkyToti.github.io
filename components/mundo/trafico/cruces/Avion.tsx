"use client";
// Cruce `avion` (scrub): el avión de papel del invento cruza la banda de orilla a orilla en una curva con un rizo,
// ligado al scroll. Detrás deja su ruta punteada, que se va borrando: la ruta es un camino punteado enmascarado
// por una copia lisa que solo deja ver el tramo recién volado: la copia lleva pathLength="1" y un guion del largo de la
// estela (stroke-dasharray fijo); en cada cuadro solo se mueve su stroke-dashoffset, sin medir nada (como el trazo de
// LineaViva.tsx y los grupos de DibujoVivo.tsx; DrawSVG medía el camino en cada cuadro). La ruta se calcula
// con el ancho real de la banda (y se recalcula al cambiar de tamaño). Menos movimiento: el avión quieto a la mitad,
// con su tramo de ruta detrás.
import { useId, useRef } from "react";
import avion from "@/components/dibujo/datos/trafico-avion.json";
import { limpiarId } from "@/components/dibujo/ids";
import { gsap, useGSAP } from "../../gsapMundo";
import { curva, marcado, puedeMover } from "../comun";
import css from "../trafico.module.css";

const ESTELA = 0.3; // fracción de la ruta que sigue visible detrás del avión
/** guion de la máscara: la estela y luego un hueco más largo que toda la ruta (pathLength="1") */
const GUION = `${ESTELA} 2`;

/** la ruta: entra por la izquierda, sube, da un rizo hacia atrás pasada la mitad y sale por la derecha */
function ruta(W: number, H: number) {
  const r = Math.min(56, H * 0.27, W * 0.09);
  const cx = W * 0.56, cy = H * 0.78; // el punto bajo del rizo
  // el rizo: una vuelta entera (de abajo, subiendo por delante, por arriba hacia atrás y de vuelta abajo), corrida
  // un poco hacia delante en cada punto para que la salida no pise la entrada
  const rizo: [number, number][] = [];
  for (let i = 0; i <= 8; i++) {
    const a = ((90 - i * 45) * Math.PI) / 180;
    rizo.push([cx + r * Math.cos(a) + r * 0.09 * i, cy - r + r * Math.sin(a)]);
  }
  return curva([
    [-70, H * 0.62], [W * 0.14, H * 0.74], [W * 0.32, H * 0.6], [cx - r * 1.7, cy + r * 0.04],
    ...rizo,
    [cx + r * 2.3, cy - r * 0.3], [W * 0.82, H * 0.42], [W + 70, H * 0.34],
  ]);
}

export default function Avion() {
  const raiz = useRef<HTMLDivElement>(null);
  const uid = limpiarId(useId());

  useGSAP(
    () => {
      const escena = raiz.current!;
      const svg = escena.querySelector<SVGSVGElement>("svg")!;
      const camino = svg.querySelector<SVGPathElement>("[data-ruta]")!;
      const mascara = svg.querySelector<SVGPathElement>("[data-mascara]")!;
      const nave = svg.querySelector<SVGGElement>("[data-avion]")!;
      const medir = () => {
        const W = escena.clientWidth, H = escena.clientHeight;
        svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
        const d = ruta(W, H);
        camino.setAttribute("d", d);
        mascara.setAttribute("d", d);
      };
      // Con el guion [ESTELA, 2] y offset ESTELA − p se ve de max(0, p − ESTELA) a p (lo de antes del 0 no existe).
      const estela = (p: number) => mascara.setAttribute("stroke-dashoffset", String(ESTELA - p));
      const vuelo = (tl: gsap.core.Timeline) =>
        tl.fromTo(
          nave,
          { opacity: 1 },
          { motionPath: { path: camino, align: camino, alignOrigin: [0.5, 0.5], autoRotate: true }, ease: "none", duration: 1 },
          0,
        );

      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        if (!puedeMover()) return;
        medir();
        const tl = gsap.timeline({
          onUpdate: () => estela(tl.progress()),
          scrollTrigger: {
            trigger: escena,
            start: "clamp(top bottom)",
            end: "clamp(bottom top)",
            scrub: 0.5,
            invalidateOnRefresh: true,
            onRefreshInit: medir,
          },
        });
        vuelo(tl);
        estela(0);
      });
      const quieto = () => {
        medir();
        const tl = vuelo(gsap.timeline({ paused: true }));
        tl.progress(0.5);
        estela(0.5);
      };
      mm.add("(prefers-reduced-motion: reduce)", quieto);
      if (!puedeMover() && window.matchMedia("(prefers-reduced-motion: no-preference)").matches) quieto();
      return () => mm.revert();
    },
    { scope: raiz },
  );

  return (
    <div ref={raiz} className={css.escena}>
      <svg className={css.lienzo} focusable="false" fill="none">
        <defs>
          <mask id={`ruta${uid}`} maskUnits="userSpaceOnUse">
            <path
              data-mascara=""
              stroke="#fff"
              strokeWidth="16"
              strokeLinecap="round"
              fill="none"
              pathLength={1}
              strokeDasharray={GUION}
              strokeDashoffset={ESTELA}
            />
          </mask>
        </defs>
        <path data-ruta="" mask={`url(#ruta${uid})`} stroke="#ede6d6" strokeWidth="2.25" strokeLinecap="round" strokeDasharray="9 8" fill="none" />
        <g data-avion="" style={{ opacity: 0 }}>
          <g className={css.nave} dangerouslySetInnerHTML={{ __html: marcado(avion, `p${uid}`) }} />
        </g>
      </svg>
    </div>
  );
}
