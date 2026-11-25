"use client";
// Cruce `nubes` (scrub + una vez): dos capas de nubes más anchas que la ventana se corren de derecha a izquierda con
// el scroll a distinta velocidad (la cercana cruza 1.2 ventanas; la lejana, 0.7). Cuando la banda va por el 30 % de su
// paso, tres estrellas titilan una sola vez. Menos movimiento: las capas quietas a la mitad, las estrellas encendidas.
import { useId, useRef } from "react";
import cercaA from "@/components/dibujo/datos/trafico-nube-cerca-a.json";
import cercaB from "@/components/dibujo/datos/trafico-nube-cerca-b.json";
import lejos from "@/components/dibujo/datos/trafico-nube-lejos.json";
import estrella from "@/components/dibujo/datos/trafico-estrella.json";
import type { DatosDibujo } from "@/components/dibujo/tipos";
import { limpiarId } from "@/components/dibujo/ids";
import { gsap, useGSAP } from "../../gsapMundo";
import { marcado, puedeMover } from "../comun";
import css from "../trafico.module.css";

type Nube = { d: unknown; x: number; y: number; alto: number; celular?: boolean };
// x en % del ancho de su capa, y en % del alto de la banda, alto en px
const CERCA: Nube[] = [
  { d: cercaA, x: 6, y: 22, alto: 96 },
  { d: cercaB, x: 31, y: 44, alto: 74, celular: false },
  { d: cercaA, x: 52, y: 30, alto: 84 },
  { d: cercaB, x: 76, y: 16, alto: 90, celular: false },
  { d: cercaB, x: 92, y: 40, alto: 70 },
];
const LEJOS: Nube[] = [
  { d: lejos, x: 4, y: 8, alto: 44 },
  { d: lejos, x: 24, y: 30, alto: 36, celular: false },
  { d: lejos, x: 47, y: 6, alto: 48 },
  { d: lejos, x: 70, y: 26, alto: 40, celular: false },
  { d: lejos, x: 88, y: 10, alto: 44 },
];
const ESTRELLAS = [
  { x: 14, y: 14 },
  { x: 47, y: 72 },
  { x: 81, y: 22 },
];

export default function Nubes() {
  const raiz = useRef<HTMLDivElement>(null);
  const uid = limpiarId(useId());

  useGSAP(
    () => {
      const escena = raiz.current!;
      const cerca = escena.querySelector<HTMLElement>("[data-capa='cerca']")!;
      const lejana = escena.querySelector<HTMLElement>("[data-capa='lejos']")!;
      const estrellas = [...escena.querySelectorAll<SVGSVGElement>("[data-estrella]")];
      // xPercent de cada capa: la cercana (220 %) se corre 120 % de la ventana; la lejana (170 %), 70 %
      const CERCA_X = [0, -54.5], LEJOS_X = [0, -41];
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        if (!puedeMover()) return;
        let titilo = false;
        gsap.set(estrellas, { scale: 0.45, opacity: 0.35, transformOrigin: "50% 50%" });
        const titilar = () =>
          gsap.timeline()
            .to(estrellas, { scale: 1.4, opacity: 1, duration: 0.22, ease: "power2.out", stagger: 0.28 })
            .to(estrellas, { scale: 1, opacity: 0.8, duration: 0.35, ease: "sine.inOut", stagger: 0.28 }, 0.22);
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: escena,
            start: "clamp(top bottom)",
            end: "clamp(bottom top)",
            scrub: 0.6,
            onUpdate: (st) => {
              if (!titilo && st.progress > 0.3) { titilo = true; titilar(); }
            },
          },
        });
        tl.fromTo(cerca, { xPercent: CERCA_X[0] }, { xPercent: CERCA_X[1], ease: "none", duration: 1 }, 0);
        tl.fromTo(lejana, { xPercent: LEJOS_X[0] }, { xPercent: LEJOS_X[1], ease: "none", duration: 1 }, 0);
      });
      const quieto = () => {
        gsap.set(cerca, { xPercent: CERCA_X[1]! / 2 });
        gsap.set(lejana, { xPercent: LEJOS_X[1]! / 2 });
      };
      mm.add("(prefers-reduced-motion: reduce)", quieto);
      if (!puedeMover() && window.matchMedia("(prefers-reduced-motion: no-preference)").matches) quieto();
      return () => mm.revert();
    },
    { scope: raiz },
  );

  const nube = (n: Nube, i: number, capa: string) => {
    const d = n.d as DatosDibujo;
    return (
      <svg
        key={i}
        className={`${css.nube} ${n.celular === false ? css.sinCelular : ""}`}
        viewBox={d.vb}
        focusable="false"
        style={{ left: `${n.x}%`, top: `${n.y}%`, height: n.alto, width: (n.alto * d.ancho) / d.alto }}
        dangerouslySetInnerHTML={{ __html: marcado(d, `${capa}${uid}${i}`) }}
      />
    );
  };
  return (
    <div ref={raiz} className={css.escena}>
      <div data-capa="lejos" className={`${css.capa} ${css.capaLejos}`}>
        {LEJOS.map((n, i) => nube(n, i, "l"))}
      </div>
      {ESTRELLAS.map((e, i) => (
        <svg
          key={i}
          data-estrella=""
          className={css.estrella}
          viewBox={(estrella as DatosDibujo).vb}
          focusable="false"
          style={{ left: `${e.x}%`, top: `${e.y}%` }}
          dangerouslySetInnerHTML={{ __html: marcado(estrella, `e${uid}${i}`) }}
        />
      ))}
      <div data-capa="cerca" className={`${css.capa} ${css.capaCerca}`}>
        {CERCA.map((n, i) => nube(n, i, "c"))}
      </div>
    </div>
  );
}
