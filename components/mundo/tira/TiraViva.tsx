"use client";
// TiraViva (cliente): «La tira». Los textos de cada paso salen en el HTML (SSR); los cuatro dibujos NO viajan en el
// HTML (pesan ~235 KB): se importan cuando la tira está a menos de una pantalla, en un lienzo ya reservado con su
// proporción (la tira no cambia de alto al llegar). Después los anima:
//  · ≥ 1024 px: la tira se fija (pin) y avanza en horizontal con el scroll (scrub normal, sin pasos por deslizón);
//    cada viñeta corre su escena cuando queda centrada. Pin ≤ 2.8 pantallas. Al crear el pin se reordenan los
//    ScrollTrigger y se refresca, y la línea viva se vuelve a medir sola (ResizeObserver de <main>).
//  · < 1024 px: viñetas apiladas; cada una corre su escena al entrar en vista.
//  · Sin `html.mueve` (menos movimiento o arranque fallido): la historieta quieta, dibujada.
//  · Hervor (los 3 cuadros a 8 por segundo) solo mientras una escena corre.
//  · Las cuatro escenas se arman de una en una en ratos libres (requestIdleCallback), tras leer de una vez las
//    transformaciones de sus piezas: armarlas juntas era una tarea de ~0.6 s con CPU ×4 en plena bajada.
// El tramo vive en un gsap.matchMedia() dentro de useGSAP({ scope }) y las escenas en otro useGSAP (con los dibujos):
// al desmontar o cambiar de modo se revierte todo.
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { gsap, useGSAP } from "@/components/dibujo/gsapDibujo";
import { limpiarId, prefijarIds } from "@/components/dibujo/ids";
import type { DatosDibujo } from "@/components/dibujo/tipos";
import cssDibujo from "@/components/dibujo/dibujo.module.css";
import { ScrollTrigger } from "@/lib/gsap";
import { ESCENAS, pivotes, type MetaVineta } from "./escenas";
import css from "./tira.module.css";

const CUADRO = 125;
const CARGAS = [
  () => import("@/components/dibujo/datos/tira-1.json"),
  () => import("@/components/dibujo/datos/tira-2.json"),
  () => import("@/components/dibujo/datos/tira-3.json"),
  () => import("@/components/dibujo/datos/tira-4.json"),
];

type Vineta = { svg: SVGSVGElement; tl: gsap.core.Timeline; detener: () => void };
export type PasoTira = { titulo: string; texto: string };

/** `cabeza`: lo que va fijo arriba durante el tramo (el título de la sección); se pinta dentro del escenario fijado. */
export default function TiraViva({ idioma, pasos, cabeza }: { idioma: "es" | "en"; pasos: PasoTira[]; cabeza?: ReactNode }) {
  const raiz = useRef<HTMLDivElement>(null);
  const uid = limpiarId(useId());
  const [datos, setDatos] = useState<DatosDibujo[] | null>(null);

  useEffect(() => {
    const el = raiz.current;
    if (!el) return;
    let vivo = true;
    const vista = new IntersectionObserver(
      (entradas) => {
        if (!entradas.some((e) => e.isIntersecting)) return;
        vista.disconnect();
        Promise.all(CARGAS.map((c) => c()))
          .then((ms) => vivo && setDatos(ms.map((m) => m.default as unknown as DatosDibujo)))
          .catch(() => {});
      },
      { rootMargin: "100% 0px" },
    );
    vista.observe(el);
    return () => {
      vivo = false;
      vista.disconnect();
    };
  }, []);

  /** las escenas ya armadas (las pone el bloque 2 cuando llegan los dibujos); el pin y los disparos las piden */
  const escenas = useRef<{ correr: (i: number) => void } | null>(null);
  /** viñetas que tocaba correr antes de que llegaran los dibujos */
  const pedidas = useRef(new Set<number>());

  // 1 · El tramo (pin u orden de disparos): cuando llegan los dibujos, en su propia tarea, aparte de las escenas.
  useGSAP(
    () => {
      const caja = raiz.current;
      // con los dibujos: el pin creado al cargar dejaba la línea viva cruzando un invento en 1440 (scripts/linea.mjs)
      if (!datos || !caja || !document.documentElement.classList.contains("mueve")) return;
      const escenario = caja.querySelector<HTMLElement>(`.${css.escenario}`);
      const pista = caja.querySelector<HTMLElement>(`.${css.pista}`);
      const items = [...caja.querySelectorAll<HTMLElement>("[data-vineta]")];
      if (!escenario || !pista || items.length === 0) return;
      const correr = (i: number) => {
        if (escenas.current) escenas.current.correr(i);
        else pedidas.current.add(i);
      };

      const mm = gsap.matchMedia();
      // en su propia tarea, justo después de la hidratación (no en el mismo commit que todos los demás bloques)
      const montar = () => mm.add(
        { ancho: "(min-width: 1024px) and (prefers-reduced-motion: no-preference)", angosto: "(max-width: 1023.98px) and (prefers-reduced-motion: no-preference)" },
        (contexto) => {
          const { ancho } = contexto.conditions as { ancho: boolean; angosto: boolean };
          caja.dataset.modo = ancho ? "pin" : "pila";

          if (!ancho) {
            const disparos = items.map((li, i) => ScrollTrigger.create({ trigger: li, start: "top 72%", onEnter: () => correr(i) }));
            return () => {
              disparos.forEach((d) => d.kill());
              delete caja.dataset.modo;
            };
          }

          // casi a todo lo ancho de la ventana (sin barra de scroll), aunque la sección tenga su margen: deja 40 px en
          // cada orilla para que la línea viva rodee el tramo fijado (ORILLA_FIJADO en LineaViva.tsx)
          const ORILLA = 40;
          const sangrar = () => {
            caja.style.marginLeft = "0px";
            caja.style.width = "";
            const izq = caja.getBoundingClientRect().left;
            caja.style.marginLeft = `${ORILLA - izq}px`;
            caja.style.width = `${document.documentElement.clientWidth - 2 * ORILLA}px`;
          };
          sangrar();
          ScrollTrigger.addEventListener("refreshInit", sangrar);

          const distancia = () => Math.max(0, pista.scrollWidth - escenario.clientWidth);
          const n = items.length - 1;
          let activa = -1;
          const avanza = gsap.to(pista, {
            x: () => -distancia(),
            ease: "none",
            scrollTrigger: {
              trigger: escenario,
              start: "top top",
              end: () => `+=${Math.round(Math.min(window.innerHeight * 2.8, distancia() * 1.15))}`,
              pin: true,
              scrub: 0.5,
              anticipatePin: 1,
              invalidateOnRefresh: true,
              onUpdate: (st) => {
                const pos = st.progress * n, k = Math.round(pos), lejos = Math.abs(pos - k);
                if (lejos < 0.22 && activa !== k) { activa = k; caja.dataset.paso = String(k + 1); correr(k); }
                else if (lejos > 0.42) activa = -1;
              },
            },
          });
          // el pin llega tarde (con los dibujos): los ScrollTrigger de más abajo deben contar su espacio
          ScrollTrigger.sort();
          ScrollTrigger.refresh();
          return () => {
            ScrollTrigger.removeEventListener("refreshInit", sangrar);
            avanza.scrollTrigger?.kill();
            avanza.kill();
            caja.style.marginLeft = "";
            caja.style.width = "";
            delete caja.dataset.modo;
          };
        },
      );
      const espera = window.setTimeout(montar, 0);
      return () => {
        window.clearTimeout(espera);
        mm.revert();
      };
    },
    { scope: raiz, dependencies: [datos] },
  );

  // 2 · Las escenas, cuando llegan los dibujos: de una en una en ratos libres (una tarea por viñeta, no las cuatro
  // juntas); la que se pide antes de tiempo se arma en ese momento.
  useGSAP(
    (_contexto, contextSafe) => {
      const caja = raiz.current;
      if (!datos || !caja || !contextSafe || !document.documentElement.classList.contains("mueve")) return;
      if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const metas: MetaVineta[] = datos.map((d) => ({ gestos: d.gestos, anclas: d.anclas }));
      const items = [...caja.querySelectorAll<HTMLElement>("[data-vineta]")];

      /** arma la escena de UNA viñeta (primer cuadro puesto) y su hervor */
      const armarUna = (li: HTMLElement, i: number): Vineta => {
        const svg = li.querySelector<SVGSVGElement>("svg[data-dibujo]")!;
        pivotes(svg);
        let reloj = 0, cuadro = 0;
        const detener = () => { window.clearInterval(reloj); reloj = 0; svg.dataset.f = "0"; };
        const hervir = () => {
          if (reloj) return;
          reloj = window.setInterval(() => { cuadro = (cuadro + 1) % 3; svg.dataset.f = String(cuadro); }, CUADRO);
        };
        const tl = ESCENAS[i]!(svg, metas[i]!);
        tl.eventCallback("onStart", hervir);
        tl.eventCallback("onComplete", () => window.setTimeout(detener, 500));
        // registra los valores de arranque de cada tween y deja puesto el primer cuadro
        tl.progress(1, true).progress(0, true);
        return { svg, tl, detener };
      };
      /** Lee de una vez (sin escribir nada en medio) la transformación de cada pieza que las escenas van a mover: GSAP
       *  la guarda y ya no pide getComputedStyle pieza por pieza entre escritura y escritura (un recálculo de estilo
       *  forzado por pieza). */
      const calentar = () =>
        items.forEach((li) => li.querySelectorAll("svg[data-dibujo] [data-anim]").forEach((el) => gsap.getProperty(el, "x")));

      const vinetas: (Vineta | null)[] = items.map(() => null);
      // dentro del contexto de useGSAP aunque se arme después: así se revierte al desmontar
      const una = contextSafe((i: number): Vineta => (vinetas[i] ??= armarUna(items[i]!, i)));
      const conIdle = "requestIdleCallback" in window;
      let espera = 0;
      const pedir = (f: () => void) => (espera = conIdle ? window.requestIdleCallback(f, { timeout: 300 }) : window.setTimeout(f, 16));
      let caliente = false;
      const siguiente = () => {
        const k = vinetas.findIndex((v) => !v);
        if (k < 0) return;
        if (!caliente) {
          // las lecturas, en su propio rato libre: no en el commit que acaba de meter los cuatro SVG
          caliente = true;
          calentar();
        } else una(k);
        pedir(siguiente);
      };
      pedir(siguiente);
      escenas.current = {
        correr: (i) => {
          const v = una(i);
          if (!v.tl.isActive()) v.tl.restart();
        },
      };
      pedidas.current.forEach((i) => escenas.current?.correr(i));
      pedidas.current.clear();
      return () => {
        escenas.current = null;
        if (conIdle) window.cancelIdleCallback(espera);
        else window.clearTimeout(espera);
        vinetas.forEach((v) => { if (v) { v.detener(); delete v.svg.dataset.f; } }); // las escenas las revierte el contexto
      };
    },
    { scope: raiz, dependencies: [datos] },
  );

  return (
    <div ref={raiz} className={css.tira} data-idioma={idioma} data-listo={datos ? "" : undefined}>
      <div className={css.escenario}>
        {cabeza}
        {/* indicador 1–4 del tramo fijado (decorativo: los pasos ya van numerados en la lista) */}
        <p className={css.indicador} aria-hidden="true">
          {pasos.map((_, i) => (
            <span key={i} className={css.marca}>{String(i + 1).padStart(2, "0")}</span>
          ))}
        </p>
        <ol className={css.pista}>
          {pasos.map((paso, i) => {
            const d = datos?.[i];
            return (
              <li key={i} className={css.vineta} data-vineta={i + 1}>
                <div className={css.lienzo}>
                  {d && (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className={cssDibujo.svg}
                      viewBox={d.vb}
                      data-dibujo={d.nombre}
                      data-tipo={d.tipo}
                      focusable="false"
                      aria-hidden="true"
                      dangerouslySetInnerHTML={{ __html: prefijarIds(d.svg, `t${uid}${i}`) }}
                    />
                  )}
                </div>
                <div className={css.pie}>
                  <span className={css.numero} aria-hidden="true">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h3 className={css.titulo}>{paso.titulo}</h3>
                    <p className={css.texto}>{paso.texto}</p>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
