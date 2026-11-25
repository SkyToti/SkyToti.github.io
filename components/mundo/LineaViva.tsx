"use client";
// La línea viva (MUNDO.md, «La línea y la chispa»): UN <path> que pasa por todas las anclas `[data-ancla]` de las
// estaciones `[data-estacion]` en orden, se dibuja con el scroll y lleva en la punta la chispa ámbar. Cuando la
// chispa pasa por la primera ancla de una estación, la estación recibe la clase `llego` y el evento
// `estacion:llega` (contrato en LEEME.md). Va detrás del contenido de <main>, sin eventos de puntero.
//
// Medir es lo único caro y solo pasa al cargar, con las fuentes, en `load` y al cambiar de tamaño (con espera).
// En cada cuadro solo se lee una tabla y se mueve: stroke-dashoffset (por atributo, sobre pathLength="1"), transform y
// opacity.
// Con menos movimiento (o sin `html.mueve`): la línea entera y tenue, sin chispa, todas las estaciones encendidas.
import { useId, useRef } from "react";
import { recorrer, tablaDeScroll, leerTabla, type Ancla, type Caja, type Forma, type Mapa, type Punto, type Recorrido } from "./geometria";
import { gsap, ScrollTrigger, useGSAP } from "./gsapMundo";

const SVGNS = "http://www.w3.org/2000/svg";
/** Carril de la línea en celular y tableta: a ~10 px del borde izquierdo. */
const CARRIL_ANGOSTO = 9;
/** Separación de la estela detrás de la chispa (px de trazo). */
const PASO_ESTELA = 9;
const TEXTO = "h1,h2,h3,h4,p,li,a,button,dt,dd,figcaption,label,blockquote";
/** TRAZO_LARGO_1: el trazo y los aros llevan pathLength="1" y stroke-dasharray="1 2": con stroke-dashoffset en 1.001
 *  no se ve nada (ni el punto de la punta redonda) y en 0 se ve entero. DrawSVG medía cada uno (getBBox +
 *  getTotalLength) y forzaba un layout por aro. */
const OCULTO = 1.001;
/** Franja de cada orilla de la ventana que un tramo fijado deja libre para la línea (la tira la respeta). */
const ORILLA_FIJADO = 40;

/** Cuánto está corrido en vertical por su animación de entrada (los [data-revelar] empiezan 24 px abajo). */
function corrimiento(el: Element, memo: Map<Element, number>): number {
  const pieza = el.closest("[data-revelar]");
  if (!pieza) return 0;
  if (!memo.has(pieza)) {
    const t = getComputedStyle(pieza).transform;
    memo.set(pieza, t && t !== "none" ? new DOMMatrixReadOnly(t).m42 : 0);
  }
  return memo.get(pieza)!;
}

/** Lo que se ve de una caja: recortada por los ancestros con overflow distinto de visible (una tira que recorta sus
 *  piezas, un escenario que recorta lo que sangra). Igual que scripts/linea.mjs. */
function recortada(el: Element, r: DOMRect, hasta: Element): DOMRect {
  for (let a = el.parentElement; a && a !== hasta && a !== document.body; a = a.parentElement) {
    const o = getComputedStyle(a);
    if (o.overflowX === "visible" && o.overflowY === "visible") continue;
    const c = a.getBoundingClientRect();
    const x0 = Math.max(r.left, c.left);
    const y0 = Math.max(r.top, c.top);
    r = new DOMRect(x0, y0, Math.max(0, Math.min(r.right, c.right) - x0), Math.max(0, Math.min(r.bottom, c.bottom) - y0));
  }
  return r;
}

/** ¿Es parte de un dibujo «detrás» (`[data-linea="detras"]`)? Manda el marcador más cercano: una `Vista` (o un
 *  `data-linea` con otro valor) dentro de un dibujo blando sigue siendo dura. */
function enDetras(el: Element): boolean {
  return el.closest("[data-linea],[data-vista]")?.getAttribute("data-linea") === "detras";
}

/** Texto que no se ve: él o un ancestro (hasta su dibujo «detrás») con opacidad 0, o con `visibility: hidden`. */
function escondido(el: Element): boolean {
  if (getComputedStyle(el).visibility === "hidden") return true;
  for (let a: Element | null = el; a && a.getAttribute("data-linea") !== "detras"; a = a.parentElement)
    if (parseFloat(getComputedStyle(a).opacity) < 0.05) return true;
  return false;
}

/** Las cajas de los dibujos «detrás» (recortadas por su overflow), en coordenadas del SVG: la línea puede cruzarlas y
 *  en ellas se dibuja atenuada. */
function zonasDetras(raices: Element[], origen: DOMRect): Caja[] {
  const zonas: Caja[] = [];
  for (const raiz of raices)
    raiz.querySelectorAll('[data-linea="detras"]').forEach((z) => {
      const r = recortada(z, z.getBoundingClientRect(), raiz);
      if (r.width >= 1 && r.height >= 1)
        zonas.push({ izq: r.left - origen.left, der: r.right - origen.left, arr: r.top - origen.top, aba: r.bottom - origen.top });
    });
  return zonas;
}

/** Rectángulos del texto visible, de los medios y de los botones de un dibujo «detrás» (lo duro), y de
 *  `[data-obstaculo]` y los tramos fijados (lo blando, que un `[data-pasillo]` puede abrir), en coordenadas del SVG.
 *  Lo que está dentro de un `[data-linea="detras"]` (salvo texto, botones y `Vista`) no estorba: se cruza por detrás. */
function obstaculos(
  raices: Element[],
  origen: DOMRect,
  memo: Map<Element, number>,
): { duros: Caja[]; blandos: Caja[]; pasillos: Caja[]; fijados: Caja[] } {
  const cajas: Caja[] = [];
  const fijados: Caja[] = [];
  const blandos: Caja[] = [];
  const pasillos: Caja[] = [];
  const caja = (r: DOMRect, dy: number): Caja => ({
    izq: r.left - origen.left,
    der: r.right - origen.left,
    arr: r.top - origen.top - dy,
    aba: r.bottom - origen.top - dy,
  });
  const meter = (r: DOMRect, dy: number) => {
    if (r.width < 1 || r.height < 1) return;
    cajas.push(caja(r, dy));
  };
  const rango = document.createRange();
  const titulos = new Set<Element>();
  for (const raiz of raices) {
    const caminante = document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT);
    for (let n = caminante.nextNode(); n; n = caminante.nextNode()) {
      const el = n.parentElement;
      if (!el || !n.textContent?.trim() || !el.closest(TEXTO) || el.closest(".sr-only,[data-linea-viva]")) continue;
      // En un dibujo «detrás», el texto escondido (la etiqueta de un agente que aún no se enseña) no estorba (igual
      // que en scripts/linea.mjs).
      if (enDetras(el) && escondido(el)) continue;
      // Los títulos que se parten por líneas pueden estar a media entrada: cuenta su caja entera.
      const titulo = el.closest("[data-lineas],[data-entrada]");
      if (titulo) {
        if (!titulos.has(titulo)) meter(titulo.getBoundingClientRect(), corrimiento(titulo, memo));
        titulos.add(titulo);
        continue;
      }
      rango.selectNodeContents(n);
      const dy = corrimiento(el, memo);
      for (const r of rango.getClientRects()) meter(r, dy);
    }
    raiz.querySelectorAll("img,video,canvas,svg:not([data-linea-viva])").forEach((m) => {
      if (m.closest("[data-linea-viva]") || enDetras(m)) return;
      const r = recortada(m, m.getBoundingClientRect(), raiz);
      if (r.width >= 24 && r.height >= 24) meter(r, corrimiento(m, memo));
    });
    // En un dibujo «detrás», sus botones (un agente, un objeto de la repisa) siguen siendo duros.
    raiz.querySelectorAll('[data-linea="detras"] button').forEach((b) => {
      if (!enDetras(b)) return;
      const r = recortada(b, b.getBoundingClientRect(), raiz);
      if (r.width >= 1 && r.height >= 1) meter(r, corrimiento(b, memo));
    });
    raiz.querySelectorAll("[data-obstaculo]").forEach((o) => {
      if (enDetras(o)) return;
      const r = recortada(o, o.getBoundingClientRect(), raiz);
      if (r.width >= 1 && r.height >= 1) blandos.push(caja(r, corrimiento(o, memo)));
    });
    // Un tramo fijado (pin de GSAP): la línea lo rodea por la orilla, nunca lo cruza (su contenido se mueve). Bloquea
    // de orilla a orilla de la ventana menos ORILLA_FIJADO a cada lado; y todo tramo de línea que lo cruce va por ruta.
    raiz.querySelectorAll(".pin-spacer").forEach((o) => {
      const r = o.getBoundingClientRect();
      const izq = Math.max(r.left, ORILLA_FIJADO);
      const der = Math.min(r.right, document.documentElement.clientWidth - ORILLA_FIJADO);
      if (der - izq > 1) blandos.push(caja(new DOMRect(izq, r.top, der - izq, r.height), 0));
      fijados.push(caja(r, 0));
    });
    raiz.querySelectorAll("[data-pasillo]").forEach((o) => {
      const r = o.getBoundingClientRect();
      if (r.width >= 1 && r.height >= 1) pasillos.push(caja(r, corrimiento(o, memo)));
    });
  }
  return { duros: cajas, blandos, pasillos, fijados };
}

/** Pinta en la máscara del trazo las zonas «detrás»: ahí la línea queda al 35 % (el resto, entera). */
function pintarMascara(mascara: SVGMaskElement, zonas: Caja[], ancho: number, alto: number) {
  const fondo = mascara.querySelector("rect")!;
  fondo.setAttribute("width", String(ancho));
  fondo.setAttribute("height", String(alto));
  const grupo = mascara.querySelector("g")!;
  grupo.replaceChildren(
    ...zonas.map((z) => {
      const r = document.createElementNS(SVGNS, "rect");
      r.setAttribute("x", String(Math.round(z.izq)));
      r.setAttribute("y", String(Math.round(z.arr)));
      r.setAttribute("width", String(Math.round(z.der - z.izq)));
      r.setAttribute("height", String(Math.round(z.aba - z.arr)));
      return r;
    }),
  );
}

export default function LineaViva() {
  const raiz = useRef<SVGSVGElement>(null);
  /** capa de delante (encima del contenido): la chispa y su estela se ven también al pasar por detrás de un dibujo */
  const frente = useRef<SVGSVGElement>(null);
  const idMascara = `linea-detras${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;

  useGSAP(
    (_contexto, contextSafe) => {
      const svg = raiz.current;
      const delante = frente.current;
      const main = svg?.closest("main") ?? svg?.parentElement;
      if (!svg || !delante || !main || !contextSafe) return;
      const trazoEl = svg.querySelector<SVGPathElement>("[data-trazo]")!;
      const mascara = svg.querySelector<SVGMaskElement>("mask")!;
      const aros = svg.querySelector<SVGGElement>("[data-aros]")!;
      const chispa = delante.querySelector<SVGGElement>("[data-chispa]")!;
      const halo = delante.querySelector<SVGCircleElement>("[data-halo]")!;
      const estela = delante.querySelector<SVGGElement>("[data-estela]")!;
      const puntosEstela = [...estela.querySelectorAll<SVGCircleElement>("circle")];
      const quieto =
        !document.documentElement.classList.contains("mueve") || matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (quieto) {
        svg.dataset.quieto = "";
        delante.dataset.quieto = "";
      }

      let vivo = true;
      let primera = true;
      let trazo: gsap.core.Timeline | null = null;
      let tabla: { scroll: number[]; trazo: number[] } | null = null;
      let fracciones: number[] = [];
      let estacionDe: (HTMLElement | null)[] = [];
      let circulos: SVGCircleElement[] = [];
      let siguiente = 0;
      let ultimo = -1;
      const prox = { t: 0 };
      /** Tope del dibujo durante la entrada (el subrayado del nombre se traza solo al cargar). */
      const entrada = { v: 1 };
      const encendidas = new Set<HTMLElement>();
      /** recorridos ya calculados, por lo medido (anclas, obstáculos y tamaño) */
      const recorridos = new Map<string, Recorrido>();
      /** alto de scroll con el que se refrescó ScrollTrigger la última vez */
      let maxRefrescado = -1;

      const encender = (el: HTMLElement) => {
        if (encendidas.has(el)) return;
        encendidas.add(el);
        el.classList.add("llego");
        el.dispatchEvent(
          new CustomEvent("estacion:llega", { bubbles: true, detail: { nombre: el.dataset.estacion ?? "", quieto } }),
        );
      };

      // La estela se ve mientras la chispa avanza; quieta, el halo late dos veces y se queda.
      const verEstela = gsap.quickTo(estela, "opacity", { duration: 0.2, ease: "power1.out" });
      let latido: gsap.core.Tween | null = null;
      const quieta = gsap.delayedCall(0.3, () => {
        verEstela(0);
        latido?.kill();
        latido = gsap.fromTo(
          halo,
          { scale: 1 },
          { scale: 1.75, duration: 0.85, ease: "sine.inOut", yoyo: true, repeat: 3, transformOrigin: "50% 50%" },
        );
      }).pause();
      const moverse = () => {
        if (latido) {
          latido.kill();
          latido = null;
          gsap.set(halo, { scale: 1 });
        }
        verEstela(1);
        quieta.restart(true);
      };

      const llegar = (i: number) => {
        const aro = circulos[i];
        if (aro)
          gsap.fromTo(aro, { attr: { "stroke-dashoffset": OCULTO } }, { attr: { "stroke-dashoffset": 0 }, duration: 0.5, ease: "power2.inOut" });
        const el = estacionDe[i];
        if (el) encender(el);
      };

      const pintar = () => {
        if (!trazo || !tabla) return;
        const l = Math.min(leerTabla(prox.t, tabla), entrada.v);
        trazo.time(l);
        while (siguiente < fracciones.length && l >= fracciones[siguiente]! - 1e-4) llegar(siguiente++);
        if (ultimo >= 0 && Math.abs(l - ultimo) > 1e-6) moverse();
        ultimo = l;
      };

      const medir = contextSafe(() => {
        if (!vivo) return;
        const caja = main.getBoundingClientRect();
        const pie = document.querySelector('[data-estacion="pie"]');
        const alto = Math.round((pie ?? main).getBoundingClientRect().bottom - caja.top);
        const ancho = Math.round(caja.width);
        if (alto < 10 || ancho < 10) return;
        for (const capa of [svg, delante]) {
          capa.setAttribute("width", String(ancho));
          capa.setAttribute("height", String(alto));
          capa.setAttribute("viewBox", `0 0 ${ancho} ${alto}`);
        }

        const angosto = !matchMedia("(min-width: 1024px)").matches;
        const memo = new Map<Element, number>();
        const centro = (el: Element): Punto => {
          const r = el.getBoundingClientRect();
          return { x: r.left + r.width / 2 - caja.left, y: r.top + r.height / 2 - caja.top - corrimiento(el, memo) };
        };
        const visible = (el: Element) => el.getClientRects().length > 0;

        const anclas: Ancla[] = [];
        const duenas: (HTMLElement | null)[] = [];
        const vistas = new Set<HTMLElement>();
        document.querySelectorAll<HTMLElement>("[data-estacion]").forEach((estacion) => {
          estacion.querySelectorAll<HTMLElement>("[data-ancla]").forEach((el) => {
            if (!visible(el)) return;
            const p = centro(el);
            const estilo = getComputedStyle(el);
            // Escenario a todo lo ancho (`data-lado`): en escritorio se llega por ruta, no por carril.
            const ancha = estacion.hasAttribute("data-lado");
            const forma = ancha && !angosto ? "paso" : ((estilo.getPropertyValue("--forma").trim() || "bulto") as Forma);
            const carril = angosto
              ? CARRIL_ANGOSTO
              : ancha
                ? p.x
                : p.x + (parseFloat(estilo.getPropertyValue("--carril")) || 0);
            anclas.push({ ...p, carril, forma, estacion: estacion.dataset.estacion ?? "", ancha });
            // La estación se enciende en su primera ancla; las demás solo dibujan su aro.
            duenas.push(vistas.has(estacion) ? null : estacion);
            vistas.add(estacion);
          });
        });
        if (anclas.length < 2) return;
        const marca = [...document.querySelectorAll("[data-linea-inicio]")].find(visible);
        const inicio = marca ? centro(marca) : anclas[0]!;
        const raices = [main, ...(pie ? [pie] : [])];
        const detras = zonasDetras(raices, caja);
        const obs = angosto ? null : obstaculos(raices, caja, memo);
        const mapa: Mapa | undefined = obs ? { ...obs, detras, ancho, alto } : undefined;
        // Lo caro (rutear con A* cada escenario ancho) solo si cambió algo de lo medido: al cargar se mide hasta tres
        // veces (montaje, fuentes, `load`) y casi siempre con lo mismo. Se recuerdan las últimas mediciones.
        const clave = JSON.stringify([inicio, anclas, obs, angosto, ancho, alto]);
        const rec = recorridos.get(clave) ?? recorrer(inicio, anclas, obs?.duros ?? [], angosto, mapa);
        recorridos.delete(clave);
        recorridos.set(clave, rec);
        if (recorridos.size > 4) recorridos.delete(recorridos.keys().next().value!);
        trazoEl.setAttribute("d", rec.d);
        // Donde cruza un dibujo «detrás», el trazo va al 35 % (máscara); sin zonas, sin máscara.
        pintarMascara(mascara, detras, ancho, alto);
        if (detras.length) trazoEl.setAttribute("mask", `url(#${idMascara})`);
        else trazoEl.removeAttribute("mask");
        if (rec.sinRuta.length) svg.dataset.sinRuta = rec.sinRuta.join(" ");
        else delete svg.dataset.sinRuta;
        svg.dataset.listo = "";

        // Un aro por ancla (se traza al llegar la chispa).
        aros.replaceChildren();
        circulos = anclas.map((a, i) => {
          const c = document.createElementNS(SVGNS, "circle");
          c.setAttribute("cx", String(a.x));
          c.setAttribute("cy", String(a.y));
          c.setAttribute("r", "8");
          c.setAttribute("transform", `rotate(${-90 + ((i * 137) % 360)} ${a.x} ${a.y})`);
          c.setAttribute("class", "linea-viva-aro");
          // largo 1 (pathLength): se traza moviendo stroke-dashoffset, sin medir nada (ver TRAZO_LARGO_1)
          c.setAttribute("pathLength", "1");
          c.setAttribute("stroke-dasharray", "1 2");
          aros.append(c);
          return c;
        });
        estacionDe = duenas;
        fracciones = rec.fracciones;

        if (quieto) {
          estacionDe.forEach((el) => el && encender(el));
          return;
        }

        // El dibujo: una línea de tiempo pausada en «fracción del trazo» (0–1). La estela va unos px detrás.
        const yaPasadas = siguiente;
        trazo?.kill();
        const arranque = rec.puntos[0]!;
        gsap.set([chispa, ...puntosEstela], { x: arranque.x, y: arranque.y });
        const tl = gsap.timeline({ paused: true });
        trazoEl.setAttribute("pathLength", "1");
        trazoEl.setAttribute("stroke-dasharray", "1 2");
        tl.fromTo(trazoEl, { attr: { "stroke-dashoffset": OCULTO } }, { attr: { "stroke-dashoffset": 0 }, duration: 1, ease: "none" }, 0);
        tl.to(chispa, { motionPath: { path: trazoEl }, duration: 1, ease: "none" }, 0);
        puntosEstela.forEach((p, k) =>
          tl.to(p, { motionPath: { path: trazoEl }, duration: 1, ease: "none" }, ((k + 1) * PASO_ESTELA) / rec.total),
        );
        trazo = tl;
        tabla = tablaDeScroll(rec, fracciones[0] ?? 0, {
          alto: innerHeight,
          max: ScrollTrigger.maxScroll(window),
          arriba: caja.top + scrollY,
        });

        // Lo ya encendido se queda encendido; los aros ya pasados, completos.
        siguiente = 0;
        const actual = Math.min(leerTabla(prox.t, tabla), entrada.v);
        while (siguiente < fracciones.length && actual >= fracciones[siguiente]! - 1e-4) siguiente++;
        siguiente = Math.max(siguiente, Math.min(yaPasadas, fracciones.length));
        circulos.forEach((c, i) => c.setAttribute("stroke-dashoffset", i < siguiente ? "0" : String(OCULTO)));
        estacionDe.slice(0, siguiente).forEach((el) => el && encender(el));

        // Al cargar arriba, el subrayado del nombre se traza solo (1.3 s) y la chispa se queda en su punta.
        if (primera && scrollY < 40) {
          entrada.v = 0;
          gsap.to(entrada, {
            v: fracciones[0] ?? 0,
            duration: 1.3,
            delay: 0.2,
            ease: "power2.inOut",
            onUpdate: pintar,
            onComplete: () => {
              entrada.v = 1;
              pintar();
            },
          });
        }
        primera = false;
        ultimo = -1;
        pintar();
        // El SVG va detrás y no mueve nada: solo hace falta refrescar ScrollTrigger (todos sus disparadores) si cambió el
        // alto de scroll; si no, basta con poner el conductor donde toca.
        const max = ScrollTrigger.maxScroll(window);
        if (Math.abs(max - maxRefrescado) > 1) {
          maxRefrescado = max;
          ScrollTrigger.refresh();
        } else sincronizar();
      });

      // El scroll de toda la página (de la portada al final del pie) mueve `prox.t`; `pintar` lo lleva al trazo.
      const conductor = quieto
        ? null
        : gsap.to(prox, { t: 1, ease: "none", onUpdate: pintar, scrollTrigger: { start: 0, end: "max", scrub: 0.8 } });
      // Tras volver a medir (cambio de ancho, imágenes, fuentes) el scrub no se entera hasta el siguiente scroll: si
      // no se está moviendo, se pone ya en el avance que toca. Mientras se mueve, el scrub lo alcanza solo.
      const sincronizar = () => {
        const st = conductor?.scrollTrigger;
        if (!conductor || !st) return;
        const tw = st.getTween();
        if (tw && tw.isActive()) return;
        conductor.progress(st.progress);
        pintar();
      };
      ScrollTrigger.addEventListener("refresh", sincronizar);

      medir();
      document.fonts?.ready.then(() => vivo && medir());
      const alCargar = () => medir();
      if (document.readyState !== "complete") window.addEventListener("load", alCargar, { once: true });
      let espera = 0;
      let primeraVez = true;
      const vigia = new ResizeObserver(() => {
        // La primera notificación llega al observar: ya se midió.
        if (primeraVez) return void (primeraVez = false);
        window.clearTimeout(espera);
        // Tras 150 ms sin cambios, en el siguiente rato libre del hilo principal (no a media bajada): rutear es lo
        // más caro de la línea. Sin requestIdleCallback, directo.
        espera = window.setTimeout(() => {
          if ("requestIdleCallback" in window) requestIdleCallback(() => medir(), { timeout: 700 });
          else medir();
        }, 150);
      });
      vigia.observe(main);
      const pie = document.querySelector('[data-estacion="pie"]');
      if (pie) vigia.observe(pie);
      // También la caja que coloca cada ancla: en la portada (alto fijo de 100svh) el nombre puede cambiar de
      // alto sin que <main> lo haga.
      new Set([...document.querySelectorAll("[data-ancla], [data-linea-inicio]")].map((a) => a.parentElement)).forEach(
        (p) => p && vigia.observe(p),
      );

      return () => {
        vivo = false;
        ScrollTrigger.removeEventListener("refresh", sincronizar);
        window.removeEventListener("load", alCargar);
        window.clearTimeout(espera);
        vigia.disconnect();
      };
    },
    { scope: raiz },
  );

  return (
    <>
      {/* Detrás del contenido (z-index −1): el trazo y los aros. */}
      <svg ref={raiz} data-linea-viva="" aria-hidden="true" focusable="false" className="linea-viva" width="0" height="0">
        <defs>
          {/* Luminancia: blanco = trazo entero; las zonas «detrás», negro al 65 % = trazo al 35 %. */}
          <mask id={idMascara} maskUnits="userSpaceOnUse" x="0" y="0" width="100%" height="100%">
            <rect x="0" y="0" fill="#fff" />
            <g fill="#000" opacity="0.65" />
          </mask>
        </defs>
        <path data-trazo="" className="linea-viva-trazo" />
        <g data-aros="" />
      </svg>
      {/* Delante del contenido: la chispa y su estela (se ven aunque el trazo pase por detrás de un dibujo). */}
      <svg
        ref={frente}
        data-linea-viva=""
        data-linea-frente=""
        aria-hidden="true"
        focusable="false"
        className="linea-viva"
        style={{ zIndex: 1 }}
        width="0"
        height="0"
      >
        <g data-estela="" className="linea-viva-estela" opacity="0">
          <circle r="2.6" opacity="0.5" />
          <circle r="2.1" opacity="0.3" />
          <circle r="1.6" opacity="0.15" />
        </g>
        <g data-chispa="" className="linea-viva-chispa">
          <circle data-halo="" r="9" opacity="0.25" />
          <circle r="3.5" />
        </g>
      </svg>
    </>
  );
}
