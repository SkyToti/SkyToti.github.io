"use client";
// PlanoVivo (cliente): pone a trabajar el plano. Solo si `html.mueve` (hay JavaScript y no se pidió menos
// movimiento) lleva el SVG visible a su estado inicial y arma UNA línea de tiempo con una etiqueta por paso
// (`paso-1`, `paso-2`…). Empieza al entrar en vista, se pausa fuera de pantalla y con la pestaña oculta, corre una
// vez y se queda en el estado final. En `completo` trae reproducir/pausa, «ver de nuevo» y los pasos clicables.
//
// La composición visible (`ancho` o `alto`) la decide CSS por el ancho del contenedor; aquí se observa cuál quedó
// visible y, si cambia, el contexto de useGSAP se revierte y se arma de nuevo en el mismo punto (sin fugas).
//
// Se arma (estado inicial con DrawSVG, que mide cada trazo) solo a una pantalla de verse y en un rato libre: armar
// al hidratar costaba ~0.9 s de hilo principal en celular (CPU ×4) con planos que están muy abajo. Hasta entonces el
// plano sigue escondido por CSS (`.vivo:not([data-listo])`), igual que antes de armarse.
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { Escena } from "@/escenas/tipos";
import type { Idioma } from "@/lib/idioma";
import { gsap, ScrollTrigger, useGSAP } from "./gsapPlano";
import { planificar, type TrazoMedido } from "./guion";
import css from "./plano.module.css";
import { TEXTOS_PLANO } from "./textos";

type Props = {
  escena: Escena;
  idioma: Idioma;
  modo: "completo" | "mini";
  totalPasos: number;
  plano: ReactNode;
  pasos: ReactNode | null;
};

type Ui = { activo: boolean; corriendo: boolean; terminado: boolean; paso: number };

const SVGNS = "http://www.w3.org/2000/svg";
const MAXIMO = { completo: 14, mini: 6 } as const;
/** retraso de la estela detrás del pulso (s) */
const ESTELA = 0.06;
/** radio del pulso en px de pantalla */
const RADIO_PULSO = 4;

function durTrazoCss(): number {
  const v = getComputedStyle(document.documentElement).getPropertyValue("--dur-trazo").trim();
  const n = parseFloat(v);
  if (!Number.isFinite(n) || n <= 0) return 1.2;
  return v.endsWith("ms") ? n / 1000 : n;
}

const textoCota = (el: SVGElement, n: number) =>
  `${el.dataset.prefijo ?? ""}${n.toLocaleString(el.dataset.idioma === "es" ? "es-MX" : "en-US")}${el.dataset.sufijo ?? ""}`;

export default function PlanoVivo({ escena, idioma, modo, totalPasos, plano, pasos }: Props) {
  const raiz = useRef<HTMLDivElement>(null);
  const [composicion, setComposicion] = useState<string | null>(null);
  const [cerca, setCerca] = useState(false);
  const [ui, setUi] = useState<Ui>({ activo: false, corriendo: false, terminado: false, paso: -1 });
  const control = useRef<{ alternar: () => void; deNuevo: () => void } | null>(null);
  // Sobrevive al cambio de composición: dónde iba y si el usuario la pausó.
  const memoria = useRef({ progreso: 0, pausaUsuario: false });
  const t = TEXTOS_PLANO[idioma];

  // Cuál de las dos composiciones dejó visible el CSS.
  useEffect(() => {
    const el = raiz.current;
    if (!el) return;
    const medir = () => {
      const visible = [...el.querySelectorAll<SVGSVGElement>("svg[data-composicion]")].find((s) => s.getBoundingClientRect().width > 0);
      setComposicion(visible?.dataset.composicion ?? null);
    };
    medir();
    const observador = new ResizeObserver(medir);
    observador.observe(el);
    return () => observador.disconnect();
  }, []);

  // A una pantalla de verse, en un rato libre: entonces se arma.
  useEffect(() => {
    const el = raiz.current;
    if (!el) return;
    let ocioso = 0;
    const vigia = new IntersectionObserver(
      (e) => {
        if (!e.some((x) => x.isIntersecting)) return;
        vigia.disconnect();
        if ("requestIdleCallback" in window) ocioso = window.requestIdleCallback(() => setCerca(true), { timeout: 250 });
        else setCerca(true);
      },
      { rootMargin: "100% 0px" },
    );
    vigia.observe(el);
    return () => {
      vigia.disconnect();
      if (ocioso) window.cancelIdleCallback(ocioso);
    };
  }, []);

  useGSAP(
    (_contexto, contextSafe) => {
      const el = raiz.current;
      if (!el || !composicion || !contextSafe) return;
      const svg = el.querySelector<SVGSVGElement>(`svg[data-composicion="${composicion}"]`);
      if (!document.documentElement.classList.contains("mueve") || !svg) {
        el.dataset.listo = "";
        return;
      }
      if (!cerca) return;

      const anchoVb = svg.viewBox.baseVal.width || 1;
      const px = svg.getBoundingClientRect().width / anchoVb || 1;
      const caminos = [...svg.querySelectorAll<SVGPathElement>("path[data-trazo]")];
      const porTrazo = new Map(caminos.map((p) => [p.dataset.trazo!, p]));
      const medidos: Record<string, TrazoMedido> = {};
      for (const p of caminos)
        medidos[p.dataset.trazo!] = { largo: Number(p.dataset.largo), cortes: p.dataset.cortes ? JSON.parse(p.dataset.cortes) : [] };
      const guion = planificar(escena, medidos, { pxPorUnidad: px, durTrazo: durTrazoCss(), maximo: MAXIMO[modo] });

      // ---- estado inicial (lo revierte el contexto al desmontar: vuelve el estado final)
      const solidos = caminos.filter((p) => !p.dataset.punteado);
      const punteados = caminos.filter((p) => p.dataset.punteado);
      // Solo si hay a quién (GSAP avisa en consola por una lista vacía).
      const poner = (objetivos: ArrayLike<Element>, vars: gsap.TweenVars) => objetivos.length && gsap.set(objetivos, vars);
      poner(solidos, { drawSVG: "0%" });
      poner(punteados, { opacity: 0 });
      poner(svg.querySelectorAll("[data-viva]"), { opacity: 0 });
      poner(svg.querySelectorAll("[data-marca]"), { opacity: 0, scale: 0.4, transformOrigin: "50% 50%" });
      poner(svg.querySelectorAll("[data-barra]"), { rotation: 0, transformOrigin: "50% 50%" });
      poner(svg.querySelectorAll("[data-alto], [data-abierta]"), { opacity: 0 });
      poner(svg.querySelectorAll("[data-globo]"), { opacity: 0, y: 8 });
      const cotas = [...svg.querySelectorAll<SVGTextElement>("[data-cota] [data-valor]")];
      const finalesCota = cotas.map((c) => c.textContent);
      for (const c of cotas) c.textContent = textoCota(c, 0);

      // ---- pulsos: un punto ámbar (o en alto) con su estela al 35 %
      const capa = svg.querySelector("[data-pulsos]")!;
      const creados: Element[] = [];
      const r = RADIO_PULSO / px;
      const punto = (opacidad: number) => {
        const g = document.createElementNS(SVGNS, "g");
        g.setAttribute("style", "opacity:0");
        const circulo = (clase: string, visible: boolean) => {
          const c = document.createElementNS(SVGNS, "circle");
          c.setAttribute("r", String(r));
          c.setAttribute("class", clase);
          if (!visible) c.setAttribute("style", "opacity:0");
          g.appendChild(c);
          return c;
        };
        const ambar = circulo(css.pulsoAmbar!, true);
        const alto = circulo(css.pulsoAlto!, false);
        capa.appendChild(g);
        creados.push(g);
        return { g, ambar, alto, opacidad };
      };

      const q = (sel: string) => svg.querySelector(sel);
      const tl = gsap.timeline({ paused: true });
      guion.pasos.forEach((inicio, i) => tl.addLabel(`paso-${i + 1}`, inicio));

      for (const ev of guion.eventos) {
        if (ev.tipo === "dibuja") {
          const es = ev.ids.map((id) => porTrazo.get(id)).filter((p): p is SVGPathElement => Boolean(p));
          const s = es.filter((p) => !p.dataset.punteado);
          const d = es.filter((p) => p.dataset.punteado);
          if (s.length) tl.fromTo(s, { drawSVG: "0%" }, { drawSVG: "100%", duration: ev.d, ease: "power2.inOut", immediateRender: false }, ev.t);
          if (d.length) tl.fromTo(d, { opacity: 0 }, { opacity: 1, duration: ev.d, ease: "power1.inOut", immediateRender: false }, ev.t);
        } else if (ev.tipo === "enciende") {
          const vivas = ev.ids.map((id) => q(`[data-nodo="${id}"] [data-viva]`)).filter(Boolean);
          tl.to(vivas, { opacity: 1, duration: ev.d, stagger: ev.escalon, ease: "power2.out" }, ev.t);
        } else if (ev.tipo === "pulso") {
          const camino = porTrazo.get(ev.trazo);
          if (!camino) continue;
          const fin = ev.tramos.reduce((s, x) => s + x.d, 0);
          for (const [p, retraso] of [
            [punto(1), 0],
            [punto(0.35), ESTELA],
          ] as const) {
            const t0 = ev.t + retraso;
            tl.set(p.g, { opacity: p.opacidad }, t0);
            for (const tramo of ev.tramos) {
              const enAlto = tramo.color === "alto";
              tl.set(p.ambar, { opacity: enAlto ? 0 : 1 }, t0 + tramo.t0);
              tl.set(p.alto, { opacity: enAlto ? 1 : 0 }, t0 + tramo.t0);
              tl.to(
                p.g,
                { motionPath: { path: camino, start: tramo.de, end: tramo.a }, duration: tramo.d, ease: "none", immediateRender: false },
                t0 + tramo.t0,
              );
            }
            // El que se queda en una compuerta cerrada espera un momento y se apaga.
            tl.to(p.g, { opacity: 0, duration: ev.queda ? 0.35 : 0.15 }, t0 + fin + (ev.queda && retraso === 0 ? 0.6 : 0));
          }
        } else if (ev.tipo === "compuerta") {
          const barra = q(`[data-compuerta="${ev.id}"] [data-barra]`);
          if (!barra) continue;
          const alto = barra.querySelector("[data-alto]");
          const abierta = barra.querySelector("[data-abierta]");
          if (ev.estado === "detiene") {
            tl.to(alto, { opacity: 1, duration: 0.15 }, ev.t);
            tl.fromTo(barra, { scale: 1 }, { scale: 1.3, duration: 0.15, yoyo: true, repeat: 1, ease: "power2.out", immediateRender: false }, ev.t);
          } else {
            tl.to(barra, { rotation: 90, duration: ev.d, ease: "power2.inOut" }, ev.t);
            tl.to(alto, { opacity: 0, duration: ev.d }, ev.t);
            tl.to(abierta, { opacity: 1, duration: ev.d }, ev.t);
          }
        } else if (ev.tipo === "cuenta") {
          const valor = q(`[data-cota="${ev.id}"] [data-valor]`) as SVGTextElement | null;
          if (!valor) continue;
          const o = { v: 0 };
          const meta = Number(valor.dataset.numero);
          tl.to(o, { v: meta, duration: ev.d, ease: "power1.out", onUpdate: () => void (valor.textContent = textoCota(valor, Math.round(o.v))) }, ev.t);
        } else if (ev.tipo === "globo") {
          tl.to(q(`[data-globo="${ev.id}"]`), { opacity: 1, y: 0, duration: ev.d, ease: "expo.out" }, ev.t);
        } else if (ev.tipo === "marca") {
          tl.to(q(`[data-nodo="${ev.id}"] [data-viva]`), { opacity: 1, duration: 0.2 }, ev.t);
          tl.to(q(`[data-nodo="${ev.id}"] [data-marca]`), { opacity: 1, scale: 1, duration: ev.d, ease: "back.out(2)" }, ev.t);
        }
      }
      tl.set({}, {}, guion.duracion);
      tl.timeScale(guion.escala);

      // ---- paso activo, para la lista (aria-current="step") y el «Paso N de M»
      const items = [...el.querySelectorAll<HTMLLIElement>("[data-paso]")];
      let pasoActual = -2;
      const avisar = () => {
        const ahora = tl.time();
        let i = -1;
        if (ahora > 0 && tl.progress() < 1) guion.pasos.forEach((inicio, k) => ahora >= inicio - 1e-6 && (i = k));
        if (i === pasoActual) return;
        pasoActual = i;
        items.forEach((li, k) => (k === i ? li.setAttribute("aria-current", "step") : li.removeAttribute("aria-current")));
        setUi((u) => ({ ...u, paso: i }));
      };
      const estadoUi = () =>
        setUi((u) => ({ ...u, activo: true, corriendo: !tl.paused() && tl.progress() < 1, terminado: tl.progress() >= 1 }));
      tl.eventCallback("onUpdate", avisar);
      tl.eventCallback("onComplete", () => {
        avisar();
        estadoUi();
        el.dataset.terminado = "";
      });
      // Para las capturas de prueba: cuánto dura de verdad (ya con timeScale).
      el.dataset.duracion = (guion.duracion / guion.escala).toFixed(2);

      // ---- cuándo corre: en vista, pestaña visible y sin pausa del usuario
      let visible = false;
      let tramoPaso: gsap.core.Tween | null = null;
      const actualizar = () => {
        if (tramoPaso?.isActive()) return estadoUi();
        if (visible && !document.hidden && !memoria.current.pausaUsuario && tl.progress() < 1) tl.play();
        else tl.pause();
        estadoUi();
      };
      if (memoria.current.progreso > 0) tl.progress(memoria.current.progreso);
      ScrollTrigger.create({
        trigger: svg,
        start: "top 90%",
        end: "bottom 10%",
        onToggle: (st) => {
          visible = st.isActive;
          actualizar();
        },
      });
      document.addEventListener("visibilitychange", actualizar);

      const irAPaso = contextSafe((i: number) => {
        if (i >= guion.pasos.length) return;
        tramoPaso?.kill();
        memoria.current.pausaUsuario = true;
        tl.pause();
        const hasta = i + 1 < guion.pasos.length ? `paso-${i + 2}` : tl.duration();
        tramoPaso = tl.tweenFromTo(`paso-${i + 1}`, hasta, { onComplete: estadoUi });
        setUi((u) => ({ ...u, corriendo: true, terminado: false }));
      });
      control.current = {
        alternar: contextSafe(() => {
          tramoPaso?.kill();
          if (tl.progress() >= 1) {
            memoria.current.pausaUsuario = false;
            tl.restart();
          } else if (!tl.paused()) {
            memoria.current.pausaUsuario = true;
            tl.pause();
          } else {
            memoria.current.pausaUsuario = false;
            tl.play();
          }
          estadoUi();
        }),
        deNuevo: contextSafe(() => {
          tramoPaso?.kill();
          memoria.current.pausaUsuario = false;
          tl.restart();
          estadoUi();
        }),
      };

      const botones = [...el.querySelectorAll<HTMLButtonElement>("[data-paso-boton]")];
      const alTocar = (e: Event) => irAPaso(Number((e.currentTarget as HTMLElement).dataset.pasoBoton));
      for (const b of botones) {
        b.disabled = false;
        b.addEventListener("click", alTocar);
      }

      el.dataset.listo = "";
      estadoUi();

      return () => {
        memoria.current.progreso = tl.progress();
        document.removeEventListener("visibilitychange", actualizar);
        for (const b of botones) {
          b.removeEventListener("click", alTocar);
          b.disabled = true;
        }
        for (const li of items) li.removeAttribute("aria-current");
        for (const g of creados) g.remove();
        cotas.forEach((c, i) => (c.textContent = finalesCota[i] ?? c.textContent));
        control.current = null;
        setUi({ activo: false, corriendo: false, terminado: false, paso: -1 });
      };
    },
    { scope: raiz, dependencies: [composicion, cerca], revertOnUpdate: true },
  );

  return (
    <div ref={raiz} className={`${css.escena} ${css.vivo}`} data-modo={modo} data-escena={escena.nombre}>
      {plano}
      {modo === "completo" && (
        <div className={css.controles} data-activo={ui.activo || undefined} role="group" aria-label={t.controles}>
          <button type="button" className={css.boton} onClick={() => control.current?.alternar()} disabled={!ui.activo}>
            <svg className={css.icono} viewBox="0 0 10 10" aria-hidden="true">
              {ui.corriendo ? <path d="M1 0h3v10H1zM6 0h3v10H6z" /> : <path d="M1 0l9 5-9 5z" />}
            </svg>
            {ui.corriendo ? t.pausa : t.reproducir}
          </button>
          <button type="button" className={css.boton} onClick={() => control.current?.deNuevo()} disabled={!ui.activo}>
            {t.deNuevo}
          </button>
          <span className={css.estado}>{ui.paso >= 0 ? t.pasoDe(ui.paso + 1, totalPasos) : ""}</span>
        </div>
      )}
      {pasos}
    </div>
  );
}
