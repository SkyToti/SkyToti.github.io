"use client";
// DibujoVivo (cliente): le da vida a un SVG que ya pintó el servidor (<Dibujo>), sin volver a pintarlo.
//  · Despertar: si está dentro de una estación ([data-estacion] más cercano), arranca cuando la chispa llega
//    (evento `estacion:llega` o clase `llego`); si no hay estación, o si lleva 1.2 s a la vista (≥ 50 %) sin que
//    llegue, arranca solo. Nunca se queda sin arrancar. Al despertar avisa con `dibujo:desperto` (burbujea).
//  · Entrada: al despertar, los grupos se trazan en el orden que declara la ilustración (stroke-dashoffset sobre
//    pathLength="1", sin medir; se arma al acercarse a la vista) y los
//    rellenos aparecen detrás; «!gesto» en el orden corre un gesto en ese paso. Si hay línea guía, la chispa la
//    recorre (MotionPath).
//  · Cuadros del hervor: el HTML solo trae el f0 de cada trazo (hervor.ts). Al acercarse se piden los otros dos a
//    /hervor/<nombre>.json (una vez por dibujo) y se meten detrás de cada f0 ANTES de armar la entrada; si no llegan,
//    el dibujo entra igual y no hierve.
//  · Hervor: alterna los 3 cuadros a 8 por segundo SOLO mientras está viva (≤ 6 s tras entrar y mientras el cursor
//    está encima); se detiene fuera de pantalla y con la pestaña oculta.
//  · Gestos por nombre (parpadear, moverCola, oreja, pasitos, mirar, secuencia…): cada ilustración los declara.
//  · Tocar: `alTocar` corre gestos al hacer clic o tocar una zona (en táctil sustituye a `alPasar`) y avisa con
//    `dibujo:toca`; con `accesible` la zona es un botón (Tab, Enter, Espacio). Desde fuera: evento `dibujo:gesto`
//    ({ detail: { gesto } }) sobre el contenedor. Con menos movimiento, los gestos saltan a su último cuadro.
//  · Estados iniciales SOLO desde aquí y solo con `html.mueve`; sin eso todo se ve dibujado y quieto.
//  · Solo transform, opacity, stroke-dashoffset y display. Sin filtros.
import { useRef, useState, type ReactNode } from "react";
import { gsap, useGSAP } from "./gsapDibujo";
import { prefijarIds } from "./ids";
import css from "./dibujo.module.css";
import type { Gesto, MetaDibujo } from "./tipos";

const VIVA = 6000;
const CUADRO = 125; // 8 cuadros por segundo
const PASO = 0.42; // s entre pasos de la entrada
const TRAZO = 0.7; // s que tarda un grupo en trazarse
const APAGADO = 0.18;
const ESPERA_CHISPA = 1200; // ms a la vista (≥ 50 %) antes de arrancar sin la chispa

/** los cuadros 2 y 3 de cada dibujo, pedidos una sola vez por página */
const hervores = new Map<string, Promise<string[]>>();
const pedirHervor = (nombre: string): Promise<string[]> => {
  let p = hervores.get(nombre);
  if (!p) {
    p = fetch(`/hervor/${nombre}.json`).then((r) => (r.ok ? (r.json() as Promise<string[]>) : []));
    hervores.set(nombre, p);
  }
  return p;
};

type Api = { alternar: (encender?: boolean) => void; deNuevo: () => void };
type Valor = number | [number, number];

const varsDe = (tipo: string, v: Valor): gsap.TweenVars =>
  tipo === "escalaY" ? { scaleY: v as number }
  : tipo === "escala" ? { scale: v as number }
  : tipo === "giro" ? { rotation: v as number }
  : tipo === "opacidad" ? { opacity: v as number }
  : { x: (v as [number, number])[0], y: (v as [number, number])[1] };

export default function DibujoVivo({
  meta,
  prefijo = "",
  children,
  className,
  controles = false,
  retraso = 0,
  etiquetas,
}: {
  meta: MetaDibujo;
  /** el prefijo de ids con que <Dibujo> pintó el SVG (para prefijar igual los cuadros del hervor) */
  prefijo?: string;
  children: ReactNode;
  className?: string;
  controles?: boolean;
  /** s entre despertar y empezar a trazarse */
  retraso?: number;
  /** nombre accesible de cada zona tocable (gana a la `etiqueta` de los datos) */
  etiquetas?: Record<string, string>;
}) {
  const raiz = useRef<HTMLDivElement>(null);
  const api = useRef<Api | null>(null);
  const [encendida, setEncendida] = useState(true);
  const [mueve, setMueve] = useState(false);

  useGSAP(
    (_contexto, contextSafe) => {
      const el = raiz.current;
      const svg = el?.querySelector<SVGSVGElement>("svg[data-dibujo]");
      if (!el || !svg || !contextSafe) return;
      const puedeMover = document.documentElement.classList.contains("mueve");
      const todos = <T extends Element = SVGElement>(s: string, r: ParentNode = svg) => [...r.querySelectorAll<T>(s)] as T[];
      const anims = (nombres: string[]) => nombres.flatMap((n) => todos(`[data-anim="${n}"]`));
      const grupos = (nombres: string[]) => nombres.flatMap((n) => todos(`[data-g="${n}"]`));
      const limpiar: (() => void)[] = [];
      const escucha = (objetivo: EventTarget, tipo: string, f: (ev: Event) => void) => {
        objetivo.addEventListener(tipo, f);
        limpiar.push(() => objetivo.removeEventListener(tipo, f));
      };

      // ── la lámpara funciona con o sin movimiento (es un control, no una animación)
      const luces = todos('[data-anim="luz"]');
      const atenuables = todos('[data-capa="base"], [data-capa="luz"]');
      let prendida = true;
      const alternar = contextSafe((encender?: boolean) => {
        prendida = encender ?? !prendida;
        const d = puedeMover ? 1 : 0;
        if (luces.length) gsap.to(luces, { opacity: prendida ? 1 : 0, duration: 0.12 * d, overwrite: "auto" });
        gsap.to(atenuables, { opacity: prendida ? 1 : APAGADO, duration: 0.45 * d, ease: "power2.out", overwrite: "auto" });
        setEncendida(prendida);
      });
      api.current = { alternar, deNuevo: () => {} };

      // ── gestos (pivote: cada ancla gira/escala desde su punto, svgOrigin en coordenadas del viewBox)
      const conPivote = new WeakSet<Element>();
      const pivote = (els: Element[]) => els.forEach((g) => {
        if (conPivote.has(g)) return;
        conPivote.add(g);
        const o = (g as SVGGElement).dataset?.o;
        if (o) gsap.set(g, { svgOrigin: o });
      });
      const ponGesto = (tl: gsap.core.Timeline, nombre: string, t: number, prof = 0): number => {
        const g: Gesto | undefined = meta.gestos[nombre];
        if (!g || prof > 8) return 0;
        if (g.tipo === "secuencia") {
          let cursor = 0, total = 0;
          for (const p of g.pasos) {
            const ini = Math.max(0, cursor + (p.espera ?? 0));
            cursor = ini + ponGesto(tl, p.gesto, t + ini, prof + 1);
            total = Math.max(total, cursor);
          }
          return total;
        }
        if (g.tipo === "mirar") return 0;
        const objetivos = [...anims(g.anims), ...(g.tipo === "pasos" ? [] : grupos(g.grupos ?? []))];
        if (!objetivos.length) return 0;
        pivote(objetivos);
        if (g.tipo === "pasos") {
          tl.set(objetivos, { x: -g.paso * g.n, y: 0 }, 0);
          for (let k = 0; k < g.n; k++) {
            tl.to(objetivos, { x: -g.paso * (g.n - k) + g.paso / 2, y: -4, duration: 0.15, ease: "power1.out" }, t + k * 0.34);
            tl.to(objetivos, { x: -g.paso * (g.n - k - 1), y: 0, duration: 0.15, ease: "power1.in" }, t + k * 0.34 + 0.15);
          }
          return g.n * 0.34;
        }
        if (g.desde !== undefined) {
          // el estado al empezar (queda puesto desde ya: lo que aparece por un gesto no asoma antes)
          const v = varsDe(g.tipo, g.desde);
          gsap.set(objetivos, v);
          tl.set(objetivos, v, 0);
        }
        let acc = 0;
        (g.valores as Valor[]).forEach((v, i) => {
          const dur = g.dur[i] ?? 0.15;
          tl.to(objetivos, { ...varsDe(g.tipo, v), duration: dur, ease: g.ease ?? "sine.inOut" }, t + acc);
          acc += dur;
        });
        return acc;
      };
      const gesto = contextSafe((nombre: string) => {
        const tl = gsap.timeline();
        ponGesto(tl, nombre, 0);
        if (!puedeMover) tl.progress(1); // menos movimiento: el último cuadro
        return tl;
      });

      // ── tocar (con o sin movimiento; siempre avisa con `dibujo:toca`)
      const conToque = new Set<string>();
      for (const t of meta.alTocar ?? []) {
        conToque.add(t.zona);
        const lista = Array.isArray(t.gesto) ? t.gesto : [t.gesto];
        let corriendo: gsap.core.Timeline[] = [];
        const correr = () => {
          el.dispatchEvent(new CustomEvent("dibujo:toca", { bubbles: true, detail: { zona: t.zona, dibujo: meta.nombre } }));
          if (corriendo.some((x) => x.isActive())) return;
          corriendo = lista.map((n) => gesto(n));
        };
        todos<SVGElement>(`[data-zona="${t.zona}"]`).forEach((z) => {
          z.setAttribute("data-tocable", "");
          escucha(z, "click", correr);
          if (!t.accesible) return;
          z.setAttribute("role", "button");
          z.setAttribute("tabindex", "0");
          z.setAttribute("aria-label", etiquetas?.[t.zona] ?? t.etiqueta ?? t.zona);
          escucha(z, "keydown", (ev) => {
            const k = (ev as KeyboardEvent).key;
            if (k === "Enter" || k === " ") { ev.preventDefault(); correr(); }
          });
        });
      }
      // desde fuera: el contenedor recibe `dibujo:gesto` con { gesto }
      escucha(el, "dibujo:gesto", (ev) => {
        const n = (ev as CustomEvent<{ gesto?: string }>).detail?.gesto;
        if (n) gesto(n);
      });
      const soltar = () => limpiar.forEach((f) => f());
      // `data-entro`: la entrada terminó (todo dibujado). Sin movimiento no hay entrada: ya está como al final.
      if (!puedeMover) {
        el.dataset.entro = "";
        return soltar;
      }
      setMueve(true);

      // ── entrada: se arma solo cuando el dibujo está a menos de una pantalla de verse (y se ve: la composición que
      // el CSS esconde nunca se arma), o al despertar. Hasta entonces el SVG sigue como lo pintó el servidor.
      let entrada: gsap.core.Timeline | null = null;
      const armar = contextSafe((): gsap.core.Timeline => {
        // primero todas las lecturas: GSAP guarda la transformación de cada pieza que se mueve y ya no pide
        // getComputedStyle pieza por pieza entre escrituras (un recálculo de estilo forzado por pieza)
        todos("[data-anim]").forEach((g) => gsap.getProperty(g, "x"));
        // al terminar la entrada avisa (`dibujo:entro`, burbujea): el guía no se convierte en el Haku de una estación
        // hasta que ese Haku ya está dibujado
        const tl = gsap.timeline({
          paused: true,
          onComplete: () => {
            if (el.dataset.entro !== undefined) return;
            el.dataset.entro = "";
            el.dispatchEvent(new CustomEvent("dibujo:entro", { bubbles: true, detail: { dibujo: meta.nombre } }));
          },
        });
        const pasos = meta.orden.length ? meta.orden : [[...new Set(todos<SVGGElement>("[data-g]").map((g) => g.dataset.g!))]];
        const nombrados = new Set(pasos.flat());
        const sueltos = [...new Set(todos<SVGGElement>("[data-g]").map((g) => g.dataset.g!))].filter((n) => !nombrados.has(n));
        const lista = sueltos.length ? [...pasos, sueltos] : pasos;
        let fin = 0;
        lista.forEach((paso, i) => {
          const t = i * PASO;
          const nombres = Array.isArray(paso) ? paso : [paso];
          for (const n of nombres) {
            if (n.startsWith("!")) { fin = Math.max(fin, t + ponGesto(tl, n.slice(1), t)); continue; }
            const grupos = todos<SVGGElement>(`[data-g="${n}"]`);
            // los tres cuadros se trazan a la par: el escalonado va por índice dentro de su cuadro
            const indice = new Map<Element, number>();
            grupos.forEach((g) => todos(":scope > .f0, :scope > .f1, :scope > .f2", g).forEach((f) => todos("path.t:not(.tf)", f).forEach((p, k) => indice.set(p, k))));
            const trazos = [...indice.keys()];
            const n0 = Math.max(1, ...indice.values());
            const escalon = (_k: number, p: Element) => (indice.get(p) ?? 0) * Math.min(0.05, 0.5 / n0);
            // Trazar sin medir: con pathLength="1" el largo de cada trazo vale 1 y basta mover stroke-dashoffset por
            // atributo (DrawSVG pedía getBBox + getTotalLength + getComputedStyle por trazo y forzaba un recálculo de
            // estilo en cada uno: ~5 s de CPU ×4 con los ~700 trazos de la portada). Raya 1 y hueco 2: a 1.001 no
            // asoma ni el punto de la punta redonda; a 0, el trazo entero (igual que sin raya). Los punteados ya
            // traen su propio stroke-dasharray (pathLength lo escalaría): esos pocos siguen con DrawSVG.
            const lisos = trazos.filter((p) => !p.hasAttribute("stroke-dasharray"));
            const rayados = trazos.filter((p) => p.hasAttribute("stroke-dasharray"));
            lisos.forEach((p) => {
              p.setAttribute("pathLength", "1");
              p.setAttribute("stroke-dasharray", "1 2");
            });
            if (lisos.length)
              tl.fromTo(lisos, { attr: { "stroke-dashoffset": 1.001 } }, { attr: { "stroke-dashoffset": 0 }, duration: TRAZO, ease: "power2.inOut", stagger: escalon }, t);
            if (rayados.length)
              tl.fromTo(rayados, { drawSVG: "0%" }, { drawSVG: "100%", duration: TRAZO, ease: "power2.inOut", stagger: escalon }, t);
            // opacidad por atributo: GSAP no tiene que leer el estilo calculado de cada pieza para arrancar
            const rellenos = grupos.flatMap((g) => todos(":scope > .rel", g));
            if (rellenos.length) tl.fromTo(rellenos, { attr: { opacity: 0 } }, { attr: { opacity: 1 }, duration: 0.35, ease: "power1.out" }, t + TRAZO * 0.5);
            const aparecen = grupos.flatMap((g) => todos(".tf", g));
            if (aparecen.length) tl.fromTo(aparecen, { attr: { opacity: 0 } }, { attr: { opacity: 1 }, duration: 0.3, ease: "power1.out" }, t + TRAZO * 0.4);
            fin = Math.max(fin, t + TRAZO);
          }
        });
        meta.alEntrar.forEach((n) => { fin += ponGesto(tl, n, fin + 0.15) + 0.2; });

        // la chispa recorre la línea guía con su estela
        const guia = svg.querySelector<SVGPathElement>("[data-guia]");
        const chispa = svg.querySelector<SVGGElement>("[data-chispa]");
        const estela = svg.querySelector<SVGPathElement>("[data-estela]");
        if (guia && chispa) {
          const meta_ = parseFloat(guia.dataset.fin ?? "1");
          const t0 = Math.max(0.6, fin - 2.4);
          const viaje = { v: 0 };
          tl.fromTo(chispa, { opacity: 0 }, { opacity: 1, duration: 0.15 }, t0);
          tl.fromTo(chispa, { motionPath: { path: guia, start: 0, end: 0 } }, { motionPath: { path: guia, start: 0, end: meta_ }, duration: 2.2, ease: "none" }, t0);
          if (estela) {
            // la estela: el tramo [v − 0.07, v] de la guía, por atributo y con pathLength="1" (sin medir en cada cuadro)
            estela.setAttribute("pathLength", "1");
            const tramo = () => {
              const a = Math.max(0, viaje.v - 0.07);
              estela.setAttribute("stroke-dasharray", `${Math.max(1e-4, viaje.v - a)} 3`);
              estela.setAttribute("stroke-dashoffset", String(-a));
            };
            tl.set(estela, { opacity: 1 }, t0);
            tl.fromTo(viaje, { v: 0 }, { v: meta_, duration: 2.2, ease: "none", onUpdate: tramo }, t0);
            tl.to(estela, { opacity: 0, duration: 0.25 }, t0 + 2.2);
          }
        }
        return tl;
      });
      const preparar = (): gsap.core.Timeline => (entrada ??= armar());

      // ── hervor: solo mientras está viva y se ve
      let cuadro = 0, reloj = 0, encima = false, viva = false, enVista = false, plazo = 0, entro = false, corre = false;
      let esperaVista = 0, esperaRetraso = 0, pendiente = false, ocioso = 0, conCuadros = false, activo = true;
      const pon = (n: number) => { cuadro = n; svg.dataset.f = String(n); };
      const hervir = () => {
        const quiere = conCuadros && (encima || viva) && enVista && !document.hidden;
        if (quiere && !reloj) reloj = window.setInterval(() => pon((cuadro + 1) % 3), CUADRO);
        if (!quiere && reloj) { window.clearInterval(reloj); reloj = 0; pon(0); }
      };
      const avivar = () => {
        viva = true; hervir();
        window.clearTimeout(plazo);
        plazo = window.setTimeout(() => { viva = false; hervir(); }, VIVA);
      };

      // ── despertar: con la chispa (estación) o solo
      const estacion = el.closest<HTMLElement>("[data-estacion]");
      const arrancar = () => {
        if (entro) return;
        entro = true;
        window.clearTimeout(esperaVista);
        el.dataset.desperto = "";
        el.dispatchEvent(new CustomEvent("dibujo:desperto", { bubbles: true, detail: { dibujo: meta.nombre } }));
        // si todavía no se armó (no ha estado cerca de la vista, o el CSS lo esconde), arranca cuando se arme
        const empezar = () => { if (entrada) ir(); else pendiente = true; };
        if (retraso > 0) esperaRetraso = window.setTimeout(empezar, retraso * 1000);
        else empezar();
      };
      const ir = () => { corre = true; preparar().play(0); avivar(); };
      const vista = new IntersectionObserver(([e]) => {
        if (!e) return;
        enVista = e.isIntersecting;
        const alto = e.intersectionRect.height, vh = window.innerHeight || 1;
        if (!entro) {
          if (!estacion) { if (enVista && (e.intersectionRatio >= 0.2 || alto >= vh * 0.2)) arrancar(); }
          else if (enVista && (e.intersectionRatio >= 0.5 || alto >= vh * 0.5)) { if (!esperaVista) esperaVista = window.setTimeout(arrancar, ESPERA_CHISPA); }
          else { window.clearTimeout(esperaVista); esperaVista = 0; }
        } else if (enVista && corre && entrada && entrada.progress() < 1) entrada.resume();
        else if (!enVista && entrada?.isActive()) entrada.pause();
        hervir();
      }, { threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.75, 1] });
      vista.observe(svg);
      const cerca = new IntersectionObserver((entradas) => {
        if (!entradas.some((e) => e.isIntersecting)) return;
        cerca.disconnect();
        // en un rato libre (no en la misma tarea que el scroll o que otros dibujos); si despierta antes, se arma ahí
        const armarYa = () => { preparar(); if (pendiente) { pendiente = false; ir(); } };
        const luego = () => {
          if (!activo) return;
          if ("requestIdleCallback" in window) ocioso = window.requestIdleCallback(armarYa, { timeout: 250 });
          else armarYa();
        };
        // primero los cuadros del hervor (deben estar antes de armar: se trazan a la par que el f0)
        pedirHervor(meta.nombre)
          .then((cuadros) => {
            if (!activo || entrada) return;
            // ya metidos (el efecto volvió a correr): no se duplican
            if (svg.querySelector("g.f1, g.f2")) return void (conCuadros = true);
            const ceros = todos<SVGGElement>("g.f0");
            if (cuadros.length !== ceros.length) return;
            const n = prefijo.length + 1;
            const conocidos = todos("[id]").map((e) => e.id).filter((id) => id.startsWith(`${prefijo}-`)).map((id) => id.slice(n));
            ceros.forEach((g, i) => {
              const c = cuadros[i];
              if (c) g.insertAdjacentHTML("afterend", prefijo ? prefijarIds(c, prefijo, conocidos) : c);
            });
            conCuadros = true;
          })
          .catch(() => {})
          .finally(luego);
      }, { rootMargin: "100% 0px" });
      cerca.observe(svg);
      if (estacion) {
        escucha(estacion, "estacion:llega", arrancar);
        if (estacion.classList.contains("llego")) arrancar();
      }
      const alCambiarPestana = () => hervir();
      document.addEventListener("visibilitychange", alCambiarPestana);

      // ── cursor: hervor encima, ojos que lo siguen, gestos por zona
      const seguir = meta.sigue ? meta.gestos[meta.sigue] : undefined;
      const pupilas = seguir && seguir.tipo !== "secuencia" ? anims(seguir.anims) : [];
      const mirar = contextSafe((ev: PointerEvent | null) => {
        if (!seguir || seguir.tipo !== "mirar") return;
        const ctm = svg.getScreenCTM();
        if (!ctm) return;
        const p = ev ? new DOMPoint(ev.clientX, ev.clientY).matrixTransform(ctm.inverse()) : null;
        pupilas.forEach((g) => {
          let x = 0, y = 0;
          const o = (g as SVGGElement).dataset.o?.split(" ").map(Number);
          if (p && o) {
            const dx = p.x - o[0]!, dy = p.y - o[1]!, d = Math.hypot(dx, dy) || 1;
            const k = Math.min(1, d / 90) * seguir.radio;
            x = (dx / d) * k; y = (dy / d) * k * 0.85;
          }
          gsap.to(g, { x, y, duration: 0.18, ease: "power2.out", overwrite: "auto" });
        });
      });
      const alEntrarCursor = () => { encima = true; hervir(); };
      const alSalirCursor = () => { encima = false; hervir(); mirar(null); };
      const alMover = (ev: PointerEvent) => { if (!entrada || entrada.progress() === 1 || !entro) mirar(ev); };
      el.addEventListener("pointerenter", alEntrarCursor);
      el.addEventListener("pointerleave", alSalirCursor);
      el.addEventListener("pointermove", alMover);
      const zonas: [Element, (ev: Event) => void][] = [];
      let enCurso: gsap.core.Timeline | null = null;
      for (const { zona, gesto: nombre } of meta.alPasar) {
        todos(`[data-zona="${zona}"]`).forEach((z) => {
          const f = (ev: Event) => {
            if ((ev as PointerEvent).pointerType === "touch" && conToque.has(zona)) return; // en táctil manda alTocar
            if (!enCurso?.isActive()) enCurso = gesto(nombre);
          };
          z.addEventListener("pointerenter", f);
          zonas.push([z, f]);
        });
      }

      api.current = {
        alternar,
        deNuevo: () => { alternar(true); preparar().restart(); avivar(); },
      };

      return () => {
        activo = false;
        soltar();
        vista.disconnect();
        cerca.disconnect();
        if (ocioso) window.cancelIdleCallback(ocioso);
        document.removeEventListener("visibilitychange", alCambiarPestana);
        el.removeEventListener("pointerenter", alEntrarCursor);
        el.removeEventListener("pointerleave", alSalirCursor);
        el.removeEventListener("pointermove", alMover);
        zonas.forEach(([z, f]) => z.removeEventListener("pointerenter", f));
        window.clearInterval(reloj);
        window.clearTimeout(plazo);
        window.clearTimeout(esperaVista);
        window.clearTimeout(esperaRetraso);
        delete svg.dataset.f;
      };
    },
    { scope: raiz },
  );

  const l = meta.lampara;
  return (
    <div ref={raiz} className={`${css.vivo} ${className ?? ""}`}>
      {children}
      {controles && l && (
        <button
          type="button"
          data-lampara=""
          className={css.lampara}
          style={{ left: `${l.x}%`, top: `${l.y}%`, width: `${l.w}%`, height: `${l.h}%` }}
          aria-pressed={encendida}
          aria-label="Lámpara encendida"
          onClick={() => api.current?.alternar()}
        />
      )}
      {controles && mueve && (
        <button type="button" className={css.deNuevo} onClick={() => api.current?.deNuevo()}>
          ver de nuevo
        </button>
      )}
    </div>
  );
}
