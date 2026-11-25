"use client";
// Cruce `moneda` (una vez, por tiempo, al entrar la banda al 80 % de la ventana): la moneda hexagonal de la
// colmena-caja rueda de izquierda a derecha (rueda de verdad: gira sobre sus vértices y su centro sube y baja),
// choca con la orilla derecha, rebota hacia atrás de un brinco y cae acostada con un temblor. Es lo único tocable
// del tráfico: al tocarla se levanta, salta dando una vuelta y vuelve a caer. Menos movimiento: quieta, de pie, a la
// mitad (tocarla no hace nada).
import { useId, useRef, type CSSProperties } from "react";
import moneda from "@/components/dibujo/datos/trafico-moneda.json";
import suelo from "@/components/dibujo/datos/trafico-suelo.json";
import { limpiarId } from "@/components/dibujo/ids";
import { gsap, ScrollTrigger, useGSAP } from "../../gsapMundo";
import { RADIO_MONEDA, marcado, puedeMover } from "../comun";
import css from "../trafico.module.css";

const LADO = 62; // ancho del viewBox de la moneda (unidades)
const ACOSTADA = 0.3; // escalaY cuando cae de lado

export default function Moneda() {
  const raiz = useRef<HTMLDivElement>(null);
  const uid = limpiarId(useId());

  useGSAP(
    (_c, contextSafe) => {
      const escena = raiz.current!;
      const ficha = escena.querySelector<HTMLElement>("[data-ficha]")!;
      const giro = escena.querySelector<HTMLElement>("[data-giro]")!;
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        if (!puedeMover()) return;
        let W = 0, D = 0, R = 0;
        const medir = () => {
          W = escena.clientWidth;
          D = ficha.offsetWidth;
          R = (RADIO_MONEDA / LADO) * D; // radio en px
        };
        medir();
        const apotema = Math.cos(Math.PI / 6);
        /** rodar: girar lo que avanza (60° por lado) y subir el centro cuando apoya en un vértice */
        const rodar = (x: number, x0: number) => {
          const grados = ((x - x0) / R) * 60;
          const fi = (((grados % 60) + 60) % 60) - 30;
          const alza = R * (Math.cos((fi * Math.PI) / 180) - apotema);
          gsap.set(ficha, { x, y: -alza });
          gsap.set(giro, { rotation: grados });
        };
        gsap.set(ficha, { x: -D * 1.2 });
        const rueda = { x: -D * 1.2 };
        let tl: gsap.core.Timeline | null = null;
        const caer = (t: gsap.core.Timeline) =>
          t.to(ficha, { rotation: 7, duration: 0.12, ease: "sine.out" })
            .to(ficha, { rotation: -5, duration: 0.14, ease: "sine.inOut" })
            .to(ficha, { rotation: 0, scaleY: ACOSTADA, duration: 0.22, ease: "power2.in" })
            .to(ficha, { scaleY: ACOSTADA + 0.08, duration: 0.07, ease: "power1.out" })
            .to(ficha, { scaleY: ACOSTADA, duration: 0.09, ease: "power1.in" });
        const correr = () => {
          medir();
          const x0 = -D * 1.2, xFin = W - D * 0.92; // la orilla derecha la detiene
          rueda.x = x0;
          tl = gsap.timeline();
          tl.to(rueda, { x: xFin, duration: Math.min(3.2, 1.2 + W / 900), ease: "power1.in", onUpdate: () => rodar(rueda.x, x0) });
          // rebota hacia atrás de un brinco y queda de plano
          const atras = xFin - Math.min(160, W * 0.12);
          const vuelta = Math.round((xFin - x0) / R) * 60;
          tl.to(ficha, { x: atras, duration: 0.5, ease: "power1.out" });
          tl.to(ficha, { y: -36, duration: 0.25, ease: "power2.out" }, "<");
          tl.to(ficha, { y: 0, duration: 0.25, ease: "power2.in" }, ">");
          tl.to(giro, { rotation: vuelta - 60, duration: 0.5, ease: "power1.out" }, "<-0.25");
          caer(tl);
        };
        const disparo = ScrollTrigger.create({ trigger: escena, start: "top 80%", once: true, onEnter: () => correr() });
        const tocar = contextSafe!(() => {
          if (!tl || tl.isActive()) return;
          tl = gsap.timeline();
          tl.to(ficha, { scaleY: 1, rotation: 0, duration: 0.12, ease: "power2.out" })
            .to(ficha, { y: -64, duration: 0.32, ease: "power2.out" })
            .to(giro, { rotation: "+=360", duration: 0.62, ease: "power1.inOut" }, "<")
            .to(ficha, { y: 0, duration: 0.3, ease: "power2.in" }, ">");
          caer(tl);
        });
        ficha.addEventListener("click", tocar);
        return () => {
          ficha.removeEventListener("click", tocar);
          disparo.kill();
        };
      });
      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set(ficha, { x: escena.clientWidth / 2 - ficha.offsetWidth / 2 });
      });
      if (!puedeMover() && window.matchMedia("(prefers-reduced-motion: no-preference)").matches)
        gsap.set(ficha, { x: escena.clientWidth / 2 - ficha.offsetWidth / 2 });
      return () => mm.revert();
    },
    { scope: raiz },
  );

  return (
    <div ref={raiz} className={css.escena}>
      <svg className={css.suelo} viewBox="0 -8 3200 16" focusable="false" dangerouslySetInnerHTML={{ __html: marcado(suelo, `s${uid}`) }} />
      <div data-ficha="" className={css.ficha} style={{ "--h": "clamp(64px, 3vw + 46px, 84px)" } as CSSProperties}>
        <div data-giro="" style={{ width: "100%", height: "100%", transformOrigin: "48.4% 48.4%" }}>
          <svg viewBox="-30 -30 62 62" focusable="false" dangerouslySetInnerHTML={{ __html: marcado(moneda, `m${uid}`) }} />
        </div>
      </div>
    </div>
  );
}
