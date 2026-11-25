"use client";
// El tramo horizontal de YaContesto (MUNDO.md, «Los escenarios, uno por uno», fila 1–3): los tres escenarios del
// producto (recepcionista, CRM, sitio) son tres pantallas completas LADO A LADO que se recorren de lado con el scroll.
//  · ≥ 1024 px con movimiento (`html.mueve`): la pista (300vw) va en una caja de 100vw × 100svh que se fija (pin) y se
//    corre en horizontal ligada al scroll (scrub, sin snap); ~2.4 pantallas de recorrido con un respiro al entrar y
//    otro al salir. Arriba, fijo, el rótulo «YaContesto · tres piezas de un producto» con su indicador 1/3 · 2/3 · 3/3
//    (tres botones que llevan a cada pantalla).
//  · La línea viva NO entra al tramo (components/mundo/LEEME.md: un tramo fijado se rodea por la orilla): en ese modo
//    las anclas de las tres estaciones se esconden (CSS) y es este archivo el que cumple el contrato de llegada: cuando
//    una pantalla queda centrada, su estación recibe `llego` y despacha `estacion:llega` (una vez), como LineaViva.
//    Cada pantalla deja libres sus 40 px de orilla (ORILLA_FIJADO), por donde la línea rodea el tramo.
//  · Los videos: VideoVivo los arranca a la vista; aquí, además, se pausan los de las pantallas que no están
//    centradas y se reanudan al volver a la suya (solo los que pausó el tramo).
//  · El foco con teclado en una pantalla que no está centrada lleva el scroll hasta ella (si no, quedaría fuera).
//  · Lo que lleva `data-paralaje` se aparta un poco del cursor (solo puntero fino).
//  · < 1024 px, menos movimiento o sin JavaScript: tres bloques apilados a todo el ancho; la línea pasa por sus anclas.
import { useId, useRef, type CSSProperties, type ReactNode } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import type { Idioma } from "@/lib/idioma";
import css from "./TramoYaContesto.module.css";

const TEXTOS = {
  es: { rotulo: "YaContesto · tres piezas de un producto", ir: "Ir a" },
  en: { rotulo: "YaContesto · three parts of one product", ir: "Go to" },
} as const;

/** el modo de lado: igual que el CSS (TramoYaContesto.module.css) */
const MODO_LADO = "(min-width: 1024px) and (prefers-reduced-motion: no-preference)";
/** pantallas de scroll que dura el tramo fijado */
const RECORRIDO = 2.4;
/** respiro (fracción del tramo) quieto en la primera pantalla y en la última */
const RESPIRO = 0.08;
/** qué tan cerca del centro (en pantallas) cuenta como «centrada» */
const CENTRADA = 0.3;

export type PantallaTramo = { clave: string; titulo: string; lang?: string; nodo: ReactNode };

export default function TramoYaContesto({ idioma, pantallas }: { idioma: Idioma; pantallas: PantallaTramo[] }) {
  const raiz = useRef<HTMLDivElement>(null);
  const id = useId();
  const tx = TEXTOS[idioma];
  const n = pantallas.length;

  useGSAP(
    (_c, contextSafe) => {
      const caja = raiz.current;
      if (!caja || !contextSafe || !document.documentElement.classList.contains("mueve")) return;
      const pista = caja.querySelector<HTMLElement>("[data-pista]")!;
      const items = [...caja.querySelectorAll<HTMLElement>("[data-pantalla]")];
      const estaciones = items.map((li) => li.querySelector<HTMLElement>("[data-estacion]"));
      const cuenta = caja.querySelector<HTMLElement>("[data-cuenta]");
      const botones = [...caja.querySelectorAll<HTMLButtonElement>("[data-ir]")];

      /** el contrato de LineaViva: `llego` y `estacion:llega`, una sola vez por estación */
      const llegar = (i: number) => {
        const el = estaciones[i];
        if (!el || el.classList.contains("llego")) return;
        el.classList.add("llego");
        el.dispatchEvent(new CustomEvent("estacion:llega", { bubbles: true, detail: { nombre: el.dataset.estacion ?? "", quieto: false } }));
      };

      const mm = gsap.matchMedia();
      mm.add(MODO_LADO, () => {
        const ultima = n - 1;
        let actual = -1;
        const pausados = new Set<HTMLVideoElement>();

        /** posición en pantallas (0 … n−1) a partir del avance del tramo fijado */
        const posicion = (p: number) => gsap.utils.clamp(0, 1, (p - RESPIRO) / (1 - 2 * RESPIRO)) * ultima;
        /** avance del tramo en el que la pantalla i queda centrada */
        const avanceDe = (i: number) => RESPIRO + (ultima ? i / ultima : 0) * (1 - 2 * RESPIRO);

        const centrar = (k: number) => {
          if (k === actual) return;
          actual = k;
          if (cuenta) cuenta.textContent = `${k + 1}/${n}`;
          botones.forEach((b, i) => (i === k ? b.setAttribute("aria-current", "true") : b.removeAttribute("aria-current")));
          llegar(k);
          // los videos: solo suena la pantalla centrada
          items.forEach((li, i) =>
            li.querySelectorAll("video").forEach((v) => {
              if (i !== k && !v.paused) {
                v.pause();
                pausados.add(v);
              } else if (i === k && pausados.has(v)) {
                pausados.delete(v);
                void v.play().catch(() => {});
              }
            }),
          );
        };

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: caja,
            start: "top top",
            end: () => `+=${Math.round(window.innerHeight * RECORRIDO)}`,
            pin: true,
            scrub: 0.6,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            onUpdate: (st) => {
              const pos = posicion(st.progress);
              const k = Math.round(pos);
              if (Math.abs(pos - k) <= CENTRADA) centrar(k);
            },
            // pasó de largo (un salto con un enlace): todas llegaron
            onLeave: () => items.forEach((_, i) => llegar(i)),
            onRefresh: (st) => {
              if (st.progress >= 1) items.forEach((_, i) => llegar(i));
            },
          },
        });
        tl.to({}, { duration: RESPIRO })
          .to(pista, { x: () => -(pista.scrollWidth - caja.clientWidth), ease: "none", duration: 1 - 2 * RESPIRO })
          .to({}, { duration: RESPIRO });
        const st = tl.scrollTrigger!;

        // la primera pantalla sube desde abajo: llega antes de fijarse, cuando asoma bien
        const asoma = ScrollTrigger.create({ trigger: caja, start: "top 45%", onEnter: () => llegar(0) });

        /** lleva el scroll a la pantalla i (botones del indicador y foco con teclado) */
        const irA = (i: number, suave: boolean) => {
          const y = st.start + avanceDe(i) * (st.end - st.start);
          window.scrollTo({ top: y, behavior: suave ? "smooth" : "instant" });
        };
        const alPulsar = botones.map((b, i) => {
          const f = () => irA(i, true);
          b.addEventListener("click", f);
          return f;
        });
        const alEnfocar = contextSafe((e: FocusEvent) => {
          const t = e.target as HTMLElement | null;
          const li = t?.closest<HTMLElement>("[data-pantalla]");
          if (!t || !li || !t.matches(":focus-visible")) return;
          const i = items.indexOf(li);
          if (i < 0) return;
          const pos = st.isActive ? posicion(st.progress) : st.progress >= 1 ? ultima : 0;
          if (Math.abs(pos - i) > 0.2 || !st.isActive) irA(i, false);
        }) as (e: FocusEvent) => void;
        caja.addEventListener("focusin", alEnfocar);

        // el pin entra cuando ya está todo lo de arriba: lo de más abajo debe contar su espacio
        ScrollTrigger.sort();
        ScrollTrigger.refresh();
        return () => {
          asoma.kill();
          caja.removeEventListener("focusin", alEnfocar);
          botones.forEach((b, i) => b.removeEventListener("click", alPulsar[i]!));
          pausados.clear();
          if (cuenta) cuenta.textContent = `1/${n}`;
        };
      });

      // el cursor: lo que lleva `data-paralaje` (la luna, los números) se aparta unos px, a su profundidad
      mm.add(`${MODO_LADO} and (pointer: fine)`, () => {
        const capas = [...caja.querySelectorAll<HTMLElement>("[data-paralaje]")].map((el) => ({
          f: parseFloat(el.dataset.paralaje ?? "1") || 1,
          x: gsap.quickTo(el, "x", { duration: 0.9, ease: "power3.out" }),
          y: gsap.quickTo(el, "y", { duration: 0.9, ease: "power3.out" }),
        }));
        if (!capas.length) return;
        const mover = (e: PointerEvent) => {
          const dx = e.clientX / window.innerWidth - 0.5;
          const dy = e.clientY / window.innerHeight - 0.5;
          capas.forEach((c) => {
            c.x(-dx * 14 * c.f);
            c.y(-dy * 10 * c.f);
          });
        };
        caja.addEventListener("pointermove", mover, { passive: true });
        return () => caja.removeEventListener("pointermove", mover);
      });
      return () => mm.revert();
    },
    { scope: raiz },
  );

  return (
    <div ref={raiz} className={css.tramo} data-tramo="yacontesto">
      <div className={css.rotulo}>
        <p id={`${id}-rotulo`} className={`rotulo ${css.nombre}`}>
          {tx.rotulo}
        </p>
        <div className={css.indicador}>
          <span data-cuenta="" aria-hidden="true" className={css.cuenta}>
            {`1/${n}`}
          </span>
          {pantallas.map((p, i) => (
            <button
              key={p.clave}
              type="button"
              data-ir={i}
              aria-current={i === 0 ? "true" : undefined}
              className={css.ir}
              aria-label={`${tx.ir} ${i + 1}/${n}: ${p.titulo}`}
            >
              <span aria-hidden="true" className={css.raya} />
            </button>
          ))}
        </div>
      </div>
      <ol data-pista="" className={css.pista} style={{ "--n": n } as CSSProperties} aria-labelledby={`${id}-rotulo`}>
        {pantallas.map((p, i) => (
          <li key={p.clave} data-pantalla={i} lang={p.lang} className={css.pantalla}>
            {p.nodo}
          </li>
        ))}
      </ol>
    </div>
  );
}
