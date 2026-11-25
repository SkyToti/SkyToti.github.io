"use client";
// Las marcas del ambiente (trozo aparte, entra cuando la página está ociosa). Diez marcas a mano repartidas por las
// orillas de la ventana (seis en < 640 px). Cada una tiene dos capas de transform:
//  · la de fuera se desplaza con el scroll de toda la página (paralaje: ±12 px × profundidad ≤ 1 → ≤ 24 px en total);
//  · la de dentro se aparta del ratón 6–10 px cuando pasa a menos de 170 px (gsap.quickTo; solo con puntero fino).
// Un solo ScrollTrigger (todo el documento). Menos movimiento: quietas.
import { useId, useRef, type CSSProperties } from "react";
import registro from "@/components/dibujo/datos/ambiente-registro.json";
import cota96 from "@/components/dibujo/datos/ambiente-cota-96.json";
import cota24 from "@/components/dibujo/datos/ambiente-cota-24.json";
import flecha from "@/components/dibujo/datos/ambiente-flecha.json";
import esquina from "@/components/dibujo/datos/ambiente-esquina.json";
import mas from "@/components/dibujo/datos/ambiente-mas.json";
import type { DatosDibujo } from "@/components/dibujo/tipos";
import { limpiarId } from "@/components/dibujo/ids";
import { gsap, ScrollTrigger, useGSAP } from "../gsapMundo";
import { marcado, puedeMover } from "./comun";
import css from "./trafico.module.css";

type Marca = { d: unknown; x: number; y: number; giro?: number; prof: number; celular?: false };
// x, y: % de la ventana (esquina de arriba a la izquierda de la marca); prof: 0.4–1 (cuánto paralaje)
const MARCAS: Marca[] = [
  { d: registro, x: 2.2, y: 9, prof: 0.6 },
  { d: cota96, x: 1.4, y: 46, giro: -90, prof: 1, celular: false },
  { d: mas, x: 4.5, y: 72, prof: 0.4 },
  { d: esquina, x: 1.6, y: 90, giro: -90, prof: 0.7 },
  { d: flecha, x: 9, y: 93, giro: -8, prof: 0.5, celular: false },
  { d: esquina, x: 96, y: 12, giro: 90, prof: 0.7 },
  { d: cota24, x: 94.5, y: 34, giro: 90, prof: 0.9, celular: false },
  { d: registro, x: 96.2, y: 63, prof: 0.5 },
  { d: mas, x: 92.5, y: 84, prof: 0.8 },
  { d: flecha, x: 82, y: 4, giro: 172, prof: 0.6, celular: false },
];
const PARALAJE = 12; // px a cada lado (×prof): recorrido total ≤ 24 px
const RADIO = 170; // px: a esta distancia del ratón empieza a apartarse
const EMPUJE = 10; // px como mucho (6 en el borde del radio… 10 encima)

export default function AmbienteMarcas() {
  const raiz = useRef<HTMLDivElement>(null);
  const uid = limpiarId(useId());

  useGSAP(
    () => {
      const capa = raiz.current!;
      const fuera = [...capa.querySelectorAll<HTMLElement>("[data-marca]")];
      const dentro = fuera.map((m) => m.firstElementChild as HTMLElement);
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        if (!puedeMover()) return;
        const prof = fuera.map((m) => Number(m.dataset.prof) || 0.5);
        const ponY = fuera.map((m) => gsap.quickSetter(m, "y", "px"));
        const paralaje = (p: number) => ponY.forEach((f, i) => f((0.5 - p) * 2 * PARALAJE * prof[i]!));
        ScrollTrigger.create({ start: 0, end: "max", onUpdate: (st) => paralaje(st.progress) });
        paralaje(0);
      });
      // el ratón (solo puntero fino que se puede posar)
      mm.add("(prefers-reduced-motion: no-preference) and (hover: hover) and (pointer: fine)", () => {
        if (!puedeMover()) return;
        const vaX = dentro.map((m) => gsap.quickTo(m, "x", { duration: 0.5, ease: "power3.out" }));
        const vaY = dentro.map((m) => gsap.quickTo(m, "y", { duration: 0.5, ease: "power3.out" }));
        let centros: [number, number][] = [];
        const medir = () => {
          centros = dentro.map((m) => {
            const r = m.getBoundingClientRect();
            return [r.left + r.width / 2 - (gsap.getProperty(m, "x") as number), r.top + r.height / 2 - (gsap.getProperty(m, "y") as number)];
          });
        };
        const ahora = dentro.map(() => [0, 0]);
        let px = -1e4, py = -1e4, cuadro = 0, medido = false;
        const mover = () => {
          cuadro = 0;
          if (!medido) { medir(); medido = true; }
          centros.forEach(([cx, cy], i) => {
            const dx = cx - px, dy = cy - py, d = Math.hypot(dx, dy) || 1;
            const k = d < RADIO ? 6 + (EMPUJE - 6) * (1 - d / RADIO) : 0;
            const x = (dx / d) * k, y = (dy / d) * k;
            if (Math.abs(x - ahora[i]![0]!) < 0.3 && Math.abs(y - ahora[i]![1]!) < 0.3) return;
            ahora[i] = [x, y];
            vaX[i]!(x);
            vaY[i]!(y);
          });
        };
        const alMover = (ev: PointerEvent) => {
          if (ev.pointerType !== "mouse") return;
          px = ev.clientX; py = ev.clientY;
          if (!cuadro) cuadro = requestAnimationFrame(mover);
        };
        const alSalir = () => { px = -1e4; py = -1e4; if (!cuadro) cuadro = requestAnimationFrame(mover); };
        const remedir = () => { medido = false; };
        window.addEventListener("pointermove", alMover, { passive: true });
        document.documentElement.addEventListener("pointerleave", alSalir);
        window.addEventListener("resize", remedir);
        ScrollTrigger.addEventListener("refresh", remedir);
        return () => {
          cancelAnimationFrame(cuadro);
          window.removeEventListener("pointermove", alMover);
          document.documentElement.removeEventListener("pointerleave", alSalir);
          window.removeEventListener("resize", remedir);
          ScrollTrigger.removeEventListener("refresh", remedir);
        };
      });
      return () => mm.revert();
    },
    { scope: raiz },
  );

  return (
    <div ref={raiz} className={css.marcas}>
      {MARCAS.map((m, i) => {
        const d = m.d as DatosDibujo;
        return (
          <div key={i} data-marca="" data-prof={m.prof} className={`${css.marca} ${m.celular === false ? css.sinCelular : ""}`} style={{ left: `${m.x}%`, top: `${m.y}%` }}>
            <div>
              <svg
                viewBox={d.vb}
                width={d.ancho}
                height={d.alto}
                focusable="false"
                style={{ rotate: m.giro ? `${m.giro}deg` : undefined } as CSSProperties}
                dangerouslySetInnerHTML={{ __html: marcado(d, `am${uid}${i}`) }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
