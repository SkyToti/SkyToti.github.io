"use client";
// Lo que se mueve y se toca en los escenarios 6 (La Elegía) y 8 (Tierra de Viajes). Cliente.
//   <TorreQueSube>   envuelve el dibujo `torre-alta` (lo pinta el servidor) y lo arma con el scroll (scrub): en
//                    escritorio la cámara trepa (la torre, de dos pantallas, baja dentro del tablero fijo), los
//                    anillos crecen de la base a la cima, las nubes del tablero cruzan a dos velocidades, un agente
//                    diminuto trepa por la orilla y, al llegar arriba, el castillo sale con rebote y el halo gira.
//                    En celular la torre no se desplaza: solo se arma mientras cruza la pantalla. El halo es un botón
//                    (girar al tocar, al señalar con el ratón o con Enter) y también gira cuando llega la chispa.
//   <RutaDelAvion>   la ruta punteada que cruza todo el escenario 8 por encima, de la maleta (abajo a la derecha) a la
//                    izquierda arriba, con su rizo, hasta el pin sobre la portada. Se calcula con lo que mide cada
//                    pieza (y se rehace si cambia el tamaño); el avión la recorre ligado al scroll (MotionPath, scrub)
//                    y la ruta se traza delante de él y se borra detrás. Tocar el avión le hace dar un rizo.
//   <PinQueRebota>   el pin (la forma del invento AvionDePapel, dibujada en línea) clavado en la portada: rebota al pasar el cursor.
// Sin `html.mueve` (sin JavaScript o con menos movimiento) nada se anima solo: la torre entera y quieta; la ruta
// completa con el avión al final, junto al pin.
import { useId, useRef, type CSSProperties, type ReactNode } from "react";
import { gsap, useGSAP } from "@/components/mundo/gsapMundo";
import cssE from "./LaElegia.module.css";
import cssT from "./TierraDeViajes.module.css";

type Punto = [number, number];
type Vars = CSSProperties & Record<`--${string}`, string | number | undefined>;

const hayMovimiento = () => document.documentElement.classList.contains("mueve");

// ── 6 · La torre que sube ────────────────────────────────────────────────────────────────────────────────────
const LIENZO_TORRE = { ancho: 400, alto: 1600 };
const RADIO_HALO = 150; // alcance de los rayos, en unidades del lienzo
const FIN_ARMADO = 0.8; // el último anillo crece a esta altura del recorrido; luego llega el castillo
const LLEGA_ARRIBA = 0.9;

export function TorreQueSube({
  anclas,
  etiquetaHalo,
  className,
  children,
}: {
  /** anclas del dibujo `torre-alta` (pivotes de los anillos, el castillo y el halo; la orilla por donde se trepa) */
  anclas: Record<string, [number, number]>;
  etiquetaHalo: string;
  className?: string;
  children: ReactNode;
}) {
  const raiz = useRef<HTMLDivElement>(null);
  const api = useRef<{ gira: () => void } | null>(null);
  const halo = anclas.halo ?? [200, 218];

  useGSAP(
    (_c, contextSafe) => {
      const el = raiz.current;
      const svg = el?.querySelector<SVGSVGElement>("svg[data-dibujo]");
      const seccion = el?.closest("section");
      if (!el || !svg || !seccion || !contextSafe) return;
      const subida = el.closest<HTMLElement>("[data-subida]") ?? seccion;
      const tablero = el.closest<HTMLElement>("[data-tablero]") ?? seccion;
      const uno = (anim: string) => svg.querySelector<SVGGElement>(`[data-anim="${anim}"]`);
      const gHalo = uno("halo");
      const gCastillo = uno("castillo");
      const agente = [...svg.querySelectorAll<SVGGElement>('[data-g^="agente-"]')];
      // anillos de la base a la cima, con su altura (y de su base) en el lienzo
      const anillos = Object.keys(anclas)
        .filter((k) => /^anillo\d+$/.test(k))
        .map((k) => ({ g: uno(k), y: anclas[k]![1], o: anclas[k]! }))
        .filter((a): a is { g: SVGGElement; y: number; o: [number, number] } => Boolean(a.g))
        .sort((a, b) => b.y - a.y);
      const orilla = Object.keys(anclas)
        .filter((k) => /^orilla\d+$/.test(k))
        .map((k) => anclas[k]!)
        .sort((a, b) => b[1] - a[1]);
      const cima = anclas.castillo?.[1] ?? 262;
      const base = orilla[0]?.[1] ?? 1548;
      const pie = anclas.pie ?? [24, 1550];

      const estado = { haloScroll: 0, haloExtra: 0 };
      const pintaHalo = () => {
        if (gHalo) gsap.set(gHalo, { rotation: estado.haloScroll + estado.haloExtra, svgOrigin: `${halo[0]} ${halo[1]}` });
      };
      api.current = {
        gira: contextSafe(() => {
          if (!hayMovimiento()) {
            estado.haloExtra += 30;
            pintaHalo();
            return;
          }
          gsap.to(estado, { haloExtra: estado.haloExtra + 180, duration: 1.6, ease: "power3.out", overwrite: true, onUpdate: pintaHalo });
        }),
      };
      const alLlegar = () => api.current?.gira();
      seccion.addEventListener("estacion:llega", alLlegar);

      /** pone al agente con los pies en la orilla izquierda, a la altura y del lienzo (con un saltito por piso) */
      const trepa = (y: number) => {
        if (!agente.length || orilla.length < 2) return;
        let k = 0;
        while (k < orilla.length - 2 && y < orilla[k + 1]![1]) k++;
        const [x0, y0] = orilla[k]!;
        const [x1, y1] = orilla[k + 1]!;
        const f = Math.max(0, Math.min(1, (y - y0) / (y1 - y0 || -1)));
        const x = x0 + (x1 - x0) * f - 12;
        const salto = -9 * Math.sin(Math.PI * f);
        gsap.set(agente, { x: x - pie[0], y: y - pie[1] + salto });
      };

      const mm = gsap.matchMedia();
      // Se arma a pantalla y media de verse, en un rato libre: armar la línea de tiempo inicializa ~100 anillos con
      // svgOrigin (getBBox + estilo calculado por pieza: ~0.6 s de hilo principal en celular al cargar el inicio, con
      // la torre muy abajo). Hasta entonces la torre queda como la pintó el servidor (entera), fuera de la vista.
      const armar = () => mm.add(
        { esc: "(min-width: 1024px)", cel: "(max-width: 1023.98px)", quieto: "(prefers-reduced-motion: reduce)" },
        (ctx) => {
          const { esc, quieto } = ctx.conditions as { esc: boolean; cel: boolean; quieto: boolean };
          if (quieto || !hayMovimiento()) return;
          let arriba = false;
          if (gCastillo) gsap.set(gCastillo, { scaleY: 0, svgOrigin: `${anclas.castillo?.[0] ?? 200} ${cima}` });
          const salta = () => {
            if (!gCastillo) return;
            gsap
              .timeline()
              .fromTo(gCastillo, { scaleY: 0, y: 0 }, { scaleY: 1.25, y: -30, duration: 0.17, ease: "power2.out" })
              .to(gCastillo, { scaleY: 0.86, y: 0, duration: 0.14, ease: "power2.in" })
              .to(gCastillo, { scaleY: 1.06, y: -8, duration: 0.1, ease: "power1.out" })
              .to(gCastillo, { scaleY: 1, y: 0, duration: 0.1, ease: "power1.in" });
            api.current?.gira();
          };
          const tl = gsap.timeline({
            defaults: { ease: "none" },
            scrollTrigger: {
              trigger: esc ? subida : el,
              start: esc ? "top 70%" : "top 85%",
              end: esc ? "bottom bottom" : "bottom 40%",
              scrub: 0.8,
              invalidateOnRefresh: true,
              onUpdate: (st) => {
                if (!arriba && st.progress >= LLEGA_ARRIBA) {
                  arriba = true;
                  salta();
                } else if (arriba && st.progress < LLEGA_ARRIBA - 0.1) {
                  arriba = false;
                  if (gCastillo) gsap.to(gCastillo, { scaleY: 0, y: 0, duration: 0.25, ease: "power2.in", overwrite: true });
                }
              },
            },
          });
          tl.set({}, {}, 1); // el recorrido mide 1
          // El frente de obra: la altura (en el lienzo) donde crece el anillo de turno, según el recorrido p. En
          // escritorio va a un tercio de la ventana desde arriba (los anillos se arman a la vista mientras la cámara
          // trepa); en celular la torre entera está a la vista y el frente sube parejo.
          const H = el.offsetHeight || 1;
          const P = tablero.clientHeight;
          const k = LIENZO_TORRE.alto / H;
          const y0 = P - H;
          const y1 = -0.05 * H;
          const frente = esc
            ? (p: number) => -(y0 + (y1 - y0) * p) * k + 0.3 * P * k
            : (p: number) => base - (p / FIN_ARMADO) * (base - cima);
          const cuando = (yr: number) =>
            Math.max(0, Math.min(LLEGA_ARRIBA - 0.05, esc ? (-y0 * k + 0.3 * P * k - yr) / ((y1 - y0) * k) : (1 - (yr - cima) / (base - cima)) * FIN_ARMADO));
          if (esc) {
            // la cámara trepa: al empezar se ve la base (abajo del tablero), al terminar la cima con el halo cortado
            tl.fromTo(
              el,
              { y: () => tablero.clientHeight - el.offsetHeight },
              { y: () => -0.05 * el.offsetHeight, duration: 1 },
              0,
            );
            // el banco de nubes sube desde abajo en el último tramo y tapa el corte de la torre
            const banco = tablero.querySelector<HTMLElement>("[data-banco]");
            if (banco) tl.fromTo(banco, { yPercent: 120 }, { yPercent: 0, duration: 0.4 }, 0.6);
            const nubes = [...tablero.querySelectorAll<HTMLElement>("[data-nube]")];
            for (const n of nubes) {
              const cerca = n.dataset.nube === "cerca";
              tl.fromTo(
                n,
                { xPercent: cerca ? 40 : 20, y: () => -(cerca ? 0.5 : 0.18) * tablero.clientHeight },
                { xPercent: cerca ? -190 : -70, y: () => (cerca ? 0.75 : 0.3) * tablero.clientHeight, duration: 1 },
                0,
              );
            }
          }
          for (const a of anillos) {
            // el anillo crece cuando el frente llega a su base (se arma de abajo arriba)
            tl.fromTo(
              a.g,
              { scaleY: 0, svgOrigin: `${a.o[0]} ${a.o[1]}` },
              { scaleY: 1, svgOrigin: `${a.o[0]} ${a.o[1]}`, duration: 0.08, ease: "back.out(2)" },
              Math.min(LLEGA_ARRIBA - 0.08, Math.max(0, cuando(a.y) - 0.02)),
            );
          }
          // el agente trepa un poco por detrás del frente
          const sube = { p: 0 };
          tl.fromTo(
            sube,
            { p: 0 },
            { p: 1, duration: 1, onUpdate: () => trepa(Math.max(cima + 34, Math.min(base, frente(sube.p) + 40))) },
            0,
          );
          const giro = { v: 0 };
          tl.fromTo(
            giro,
            { v: 0 },
            {
              v: 150,
              duration: 1,
              onUpdate: () => {
                estado.haloScroll = giro.v;
                pintaHalo();
              },
            },
            0,
          );
          trepa(base);
          return () => {
            estado.haloScroll = 0;
            gsap.set(agente, { clearProps: "transform" });
          };
        },
      );
      let ocioso = 0;
      const vigia = new IntersectionObserver(
        (e) => {
          if (!e.some((x) => x.isIntersecting)) return;
          vigia.disconnect();
          if ("requestIdleCallback" in window) ocioso = window.requestIdleCallback(armar, { timeout: 250 });
          else armar();
        },
        { rootMargin: "150% 0px" },
      );
      vigia.observe(seccion);
      return () => {
        seccion.removeEventListener("estacion:llega", alLlegar);
        vigia.disconnect();
        if (ocioso) window.cancelIdleCallback(ocioso);
        mm.revert();
      };
    },
    { scope: raiz },
  );

  const r = RADIO_HALO;
  const caja: Vars = {
    left: `${((halo[0] - r) / LIENZO_TORRE.ancho) * 100}%`,
    top: `${((halo[1] - r) / LIENZO_TORRE.alto) * 100}%`,
    width: `${((2 * r) / LIENZO_TORRE.ancho) * 100}%`,
    height: `${((2 * r) / LIENZO_TORRE.alto) * 100}%`,
  };
  return (
    <div ref={raiz} className={className} data-obstaculo="">
      {children}
      <button
        type="button"
        className={cssE.halo}
        aria-label={etiquetaHalo}
        style={caja}
        onClick={() => api.current?.gira()}
        onPointerEnter={(e) => e.pointerType === "mouse" && api.current?.gira()}
      />
    </div>
  );
}

// ── 8 · La ruta del avión ────────────────────────────────────────────────────────────────────────────────────
/** del recorte de la maleta (lienzo del invento, 640×420): dónde queda el asa, en fracción de la caja */
export const ASA_MALETA: Punto = [0.4, 0.14];
/** del recorte del pin: dónde aterriza el avión (sobre la cabeza del pin), en fracción de la caja */
export const CABEZA_PIN: Punto = [0.3, -0.22];

/** Catmull-Rom → curvas cúbicas (M … C …): una curva suave que pasa por todos los puntos */
function curva(p: Punto[]): string {
  const f = (n: number) => Math.round(n * 10) / 10;
  let d = `M ${f(p[0]![0])} ${f(p[0]![1])}`;
  for (let i = 0; i < p.length - 1; i++) {
    const p0 = p[Math.max(0, i - 1)]!;
    const p1 = p[i]!;
    const p2 = p[i + 1]!;
    const p3 = p[Math.min(p.length - 1, i + 2)]!;
    const c1: Punto = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2: Punto = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C ${f(c1[0])} ${f(c1[1])} ${f(c2[0])} ${f(c2[1])} ${f(p2[0])} ${f(p2[1])}`;
  }
  return d;
}

/** el rizo: entra por la derecha yendo a la izquierda, sube, pasa por arriba hacia atrás, baja y sigue */
const rizo = (cx: number, cy: number, r: number): Punto[] => [
  [cx + 2.2 * r, cy + r],
  [cx, cy + r],
  [cx - r, cy],
  [cx, cy - r],
  [cx + r, cy],
  [cx + 0.1 * r, cy + r],
  [cx - 1.8 * r, cy + 1.1 * r],
];

/** los puntos de la ruta en coordenadas de la sección, a partir de lo que mide cada pieza */
function puntosRuta(seccion: HTMLElement): Punto[] | null {
  const b = seccion.getBoundingClientRect();
  const caja = (s: string) => seccion.querySelector(s)?.getBoundingClientRect();
  const maleta = caja("[data-maleta]");
  const portada = caja("[data-portada]");
  const pin = caja("[data-pin]");
  const telefono = caja("[data-telefono]");
  if (!maleta || !portada || !pin) return null;
  const x = (v: number) => v - b.left;
  const y = (v: number) => v - b.top;
  const S: Punto = [x(maleta.left + maleta.width * ASA_MALETA[0]), y(maleta.top + maleta.height * ASA_MALETA[1])];
  const F: Punto = [x(pin.left + pin.width * CABEZA_PIN[0]), y(pin.top + pin.height * CABEZA_PIN[1])];
  const W = b.width;
  const lerp = (a: number, c: number, t: number) => a + (c - a) * t;
  if (W >= 1024) {
    // escritorio: sube por el pasillo entre la portada y el teléfono, cruza la franja de arriba con su rizo y baja
    const pasillo = telefono && telefono.left > portada.right ? x((portada.right + telefono.left) / 2) : x(portada.right) + 28;
    const franja = y(portada.top) / 2 + 6;
    const r = Math.max(26, Math.min(54, y(portada.top) * 0.3));
    const cx = x(portada.left) + portada.width * 0.52;
    return [
      S,
      [lerp(S[0], pasillo, 0.55), lerp(S[1], franja, 0.18)],
      [pasillo, lerp(S[1], franja, 0.55)],
      [pasillo - 0.03 * W, franja + 10],
      ...rizo(cx, franja - 0.15 * r, r),
      [lerp(cx - 1.8 * r, F[0], 0.55), lerp(franja + r, F[1], 0.35)],
      F,
    ];
  }
  // celular y tableta: sube por la orilla derecha, da el rizo sobre la esquina de la portada y baja al pin
  const orilla = W - 12;
  const r = 24;
  const cx = x(portada.right) - Math.min(90, portada.width * 0.28);
  const cy = y(portada.top) + r * 0.6;
  return [
    S,
    [orilla, lerp(S[1], y(portada.bottom), 0.4)],
    [orilla, y(portada.top) + 3 * r],
    ...rizo(cx, cy, r),
    [lerp(cx - 1.8 * r, F[0], 0.5), lerp(cy + r, F[1], 0.4)],
    F,
  ];
}

export function RutaDelAvion({ etiqueta, children }: { etiqueta: string; children: ReactNode }) {
  const raiz = useRef<HTMLDivElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const ruta = useRef<SVGPathElement>(null);
  const trazo = useRef<SVGPathElement>(null);
  const avion = useRef<HTMLButtonElement>(null);
  const giro = useRef<HTMLSpanElement>(null);
  const api = useRef<{ rizo: () => void } | null>(null);
  const id = `mascara-${useId().replace(/[^A-Za-z0-9_-]/g, "")}`;

  useGSAP(
    (_c, contextSafe) => {
      const el = raiz.current;
      const seccion = el?.closest("section");
      if (!el || !seccion || !svg.current || !ruta.current || !trazo.current || !avion.current || !contextSafe) return;
      const camino = ruta.current;
      const mascara = trazo.current;
      const boton = avion.current;
      let ctx: gsap.Context | null = null;
      let medida = "";

      const arma = contextSafe(() => {
        const W = Math.round(seccion.clientWidth);
        const H = Math.round(seccion.clientHeight);
        const pts = puntosRuta(seccion);
        const clave = pts ? `${W}x${H}:${pts.map((p) => p.map(Math.round).join(",")).join(" ")}` : "";
        if (!pts || clave === medida) return;
        medida = clave;
        ctx?.revert();
        const d = curva(pts);
        svg.current?.setAttribute("viewBox", `0 0 ${W} ${H}`);
        camino.setAttribute("d", d);
        mascara.setAttribute("d", d);
        el.dataset.lista = "";
        ctx = gsap.context(() => {
          const vuelo = { path: camino, align: camino, alignOrigin: [0.5, 0.5] as [number, number], autoRotate: 180 };
          if (!hayMovimiento() || matchMedia("(prefers-reduced-motion: reduce)").matches) {
            // quieto: la ruta completa y el avión al final, junto al pin
            gsap.set(mascara, { drawSVG: "0% 100%" });
            gsap.to(boton, { motionPath: { ...vuelo, start: 0, end: 1 }, duration: 1, paused: true }).progress(1);
            return;
          }
          const tl = gsap.timeline({
            defaults: { ease: "none" },
            scrollTrigger: { trigger: seccion, start: "top bottom", end: "bottom bottom", scrub: 0.8 },
          });
          tl.to(boton, { motionPath: vuelo, duration: 1 }, 0);
          // la ruta se traza delante del avión y se borra detrás
          tl.fromTo(mascara, { drawSVG: "0% 7%" }, { drawSVG: "74% 100%", duration: 1 }, 0);
        });
      });

      api.current = {
        rizo: contextSafe(() => {
          const g = giro.current;
          if (!g || gsap.isTweening(g)) return;
          if (!hayMovimiento()) return;
          gsap.fromTo(g, { rotation: 0 }, { rotation: 360, duration: 1.1, ease: "power2.inOut", transformOrigin: "50% -110%" });
        }),
      };

      arma();
      let espera = 0;
      const ro = new ResizeObserver(() => {
        window.clearTimeout(espera);
        espera = window.setTimeout(arma, 120);
      });
      ro.observe(seccion);
      const portada = seccion.querySelector("[data-portada]");
      if (portada) ro.observe(portada);
      return () => {
        ro.disconnect();
        window.clearTimeout(espera);
        ctx?.revert();
      };
    },
    { scope: raiz },
  );

  return (
    // `data-linea-viva`: la línea viva no cuenta esta capa como obstáculo (es decoración que cruza todo por encima y
    // el avión se mueve); la ruta misma evita el texto.
    <div ref={raiz} className={cssT.ruta} data-linea-viva="">
      <svg ref={svg} className={cssT.rutaSvg} aria-hidden="true" focusable="false" preserveAspectRatio="none">
        <defs>
          <mask id={id} maskUnits="userSpaceOnUse" x="-100%" y="-100%" width="300%" height="300%">
            <path ref={trazo} fill="none" stroke="#fff" strokeWidth="16" strokeLinecap="round" />
          </mask>
        </defs>
        <path ref={ruta} className={cssT.rutaTrazo} mask={`url(#${id})`} />
      </svg>
      <button ref={avion} type="button" className={cssT.avion} aria-label={etiqueta} onClick={() => api.current?.rizo()}>
        <span ref={giro} className={cssT.rizo}>
          <span className={cssT.espejo}>{children}</span>
        </span>
      </button>
    </div>
  );
}

// ── 8 · El pin sobre la portada ──────────────────────────────────────────────────────────────────────────────
// La misma forma que el pin del invento (dibujo/piezas/avion-de-papel.mjs): gota ámbar con el registro del riso corrido
// abajo a la derecha, contorno hueso y el ojo oscuro; de pie sobre una raya de suelo. Va en línea (no espera a que el
// invento se cargue y se dibuje): el avión aterriza junto a él desde el primer momento.
const GOTA =
  "M 574 330 C 566 314 554 302 554 286 C 554 272 564 264 574 264 C 584 264 594 272 594 286 C 594 302 582 314 574 330 Z";

export function PinQueRebota({ className }: { className?: string }) {
  const cuerpo = useRef<SVGGElement>(null);
  const rebota = () => {
    const g = cuerpo.current;
    if (!g || !hayMovimiento() || gsap.isTweening(g)) return;
    // brinca, cae con rebote y se aplasta un poco al tocar el suelo
    gsap
      .timeline()
      .to(g, { y: -22, scaleY: 1.06, svgOrigin: "574 330", duration: 0.2, ease: "power2.out" })
      .to(g, { y: 0, scaleY: 1, duration: 0.7, ease: "bounce.out" })
      .to(g, { scaleY: 0.82, duration: 0.07, ease: "power1.out" }, 0.42)
      .to(g, { scaleY: 1, duration: 0.3, ease: "back.out(3)" }, 0.49);
  };
  return (
    <div className={className} data-pin="" aria-hidden="true" onPointerEnter={rebota} onPointerDown={rebota}>
      <svg viewBox="530 250 100 90" className={cssT.pinSvg} focusable="false">
        <path className={cssT.pinSuelo} d="M 536 333 C 562 331 590 332 622 334" />
        <g ref={cuerpo}>
          <path className={cssT.pinRelleno} d={GOTA} transform="translate(5 4)" />
          <path className={cssT.pinContorno} d={GOTA} />
          <circle className={cssT.pinOjo} cx="574" cy="286" r="7.5" />
        </g>
      </svg>
    </div>
  );
}
