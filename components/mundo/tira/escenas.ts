// Las cuatro escenas de «La tira»: una línea de tiempo (en pausa) por viñeta, armada sobre el SVG que ya pintó el
// servidor. El SVG es el ÚLTIMO cuadro; cada escena arranca desde su primer cuadro (con los desplazamientos que
// la ilustración trae en `gestos`) y termina igual al dibujo quieto (salvo el avión, que se va por la ventana).
// Solo transform, opacity y stroke-dashoffset (DrawSVG).
import { gsap } from "@/components/dibujo/gsapDibujo";
import type { Gesto } from "@/components/dibujo/tipos";

export type MetaVineta = { gestos: Record<string, Gesto>; anclas: Record<string, [number, number]> };
type Par = [number, number];

const pares = (meta: MetaVineta, nombre: string): Par[] => {
  const g = meta.gestos[nombre];
  return g && g.tipo === "mover" ? g.valores : [];
};
const numeros = (meta: MetaVineta, nombre: string): { valores: number[]; dur: number[] } => {
  const g = meta.gestos[nombre];
  return g && (g.tipo === "escalaY" || g.tipo === "escala" || g.tipo === "giro" || g.tipo === "opacidad")
    ? { valores: g.valores, dur: g.dur }
    : { valores: [], dur: [] };
};
const duraciones = (meta: MetaVineta, nombre: string): number[] => {
  const g = meta.gestos[nombre];
  return g && "dur" in g ? g.dur : [];
};

function ayudantes(svg: SVGSVGElement) {
  const todos = (s: string) => [...svg.querySelectorAll<SVGGraphicsElement>(s)];
  const a = (...nombres: string[]) => nombres.flatMap((n) => todos(`[data-anim="${n}"]`));
  const g = (...nombres: string[]) => nombres.flatMap((n) => todos(`[data-g="${n}"]`));
  /** trazos de un grupo, con su índice dentro de su cuadro (los tres cuadros se trazan a la par) */
  const trazos = (nombre: string) => {
    const por: SVGPathElement[][] = [];
    g(nombre).forEach((grupo) =>
      grupo.querySelectorAll(":scope > .f0, :scope > .f1, :scope > .f2").forEach((f) =>
        f.querySelectorAll<SVGPathElement>("path.t").forEach((p, k) => (por[k] ??= []).push(p)),
      ),
    );
    return por;
  };
  return { a, g, trazos };
}

/** pivotes: cada ancla gira/escala desde su punto del viewBox */
export function pivotes(svg: SVGSVGElement) {
  svg.querySelectorAll<SVGGElement>("[data-anim][data-o]").forEach((el) => gsap.set(el, { svgOrigin: el.dataset.o }));
}

/** recorre keyframes de desplazamiento (el primero es el arranque: se pone, no se anima) */
function recorrer(tl: gsap.core.Timeline, el: Element[], pts: Par[], durs: number[], t: number, ease = "sine.inOut") {
  let acc = 0;
  pts.forEach(([x, y], i) => {
    if (i === 0) return;
    const d = durs[i] ?? 0.2;
    tl.to(el, { x, y, duration: d, ease }, t + acc);
    acc += d;
  });
  return acc;
}

// ── 1 · Decido qué se construye ──
function vineta1(svg: SVGSVGElement, meta: MetaVineta) {
  const { a, trazos } = ayudantes(svg);
  const tl = gsap.timeline({ paused: true });
  const mano = a("mano");
  const pupilas = a("pupilaIzq", "pupilaDer");
  const A = pares(meta, "trazoA"), F = pares(meta, "trazoF"), B = pares(meta, "trazoB");
  const dA = duraciones(meta, "trazoA"), dF = duraciones(meta, "trazoF"), dB = duraciones(meta, "trazoB");
  const cae = pares(meta, "cae")[0] ?? [0, -150];
  const caeGiro = numeros(meta, "caeGiro").valores[0] ?? 16;
  const planoA = trazos("plano-a").flat(), linea = trazos("plano-flecha")[0] ?? [], punta = trazos("plano-flecha")[1] ?? [], planoB = trazos("plano-b").flat();

  // primer cuadro
  tl.set([...planoA, ...linea, ...punta, ...planoB], { drawSVG: "0%" }, 0);
  tl.set(mano, { x: (A[0]?.[0] ?? 0) + 46, y: (A[0]?.[1] ?? 0) - 34 }, 0);
  tl.set(a("cae"), { x: cae[0], y: cae[1], rotation: caeGiro }, 0);
  tl.set(pupilas, { x: -2, y: -1 }, 0);

  let t = 0.25;
  tl.to(mano, { x: A[0]?.[0] ?? 0, y: A[0]?.[1] ?? 0, duration: 0.45, ease: "power2.out" }, t);
  t += 0.5;
  const tA = dA.slice(1).reduce((s, d) => s + d, 0);
  recorrer(tl, mano, A, dA, t, "none");
  tl.to(planoA, { drawSVG: "100%", duration: tA, ease: "none" }, t);
  tl.to(pupilas, { x: -1, duration: tA, ease: "none" }, t);
  t += tA;
  // salto a la flecha (el lápiz se levanta)
  tl.to(mano, { x: F[0]?.[0] ?? 0, y: (F[0]?.[1] ?? 0) - 8, duration: 0.14, ease: "power1.out" }, t);
  tl.to(mano, { y: F[0]?.[1] ?? 0, duration: 0.08, ease: "power1.in" }, t + 0.14);
  t += 0.24;
  const dLinea = dF[1] ?? 0.15;
  recorrer(tl, mano, F, dF, t, "none");
  tl.to(linea, { drawSVG: "100%", duration: dLinea, ease: "none" }, t);
  tl.to(punta, { drawSVG: "100%", duration: dF.slice(2).reduce((s, d) => s + d, 0), ease: "none" }, t + dLinea);
  t += dF.slice(1).reduce((s, d) => s + d, 0);
  tl.to(mano, { x: B[0]?.[0] ?? 0, y: (B[0]?.[1] ?? 0) - 10, duration: 0.18, ease: "power1.out" }, t);
  tl.to(mano, { y: B[0]?.[1] ?? 0, duration: 0.08, ease: "power1.in" }, t + 0.18);
  t += 0.28;
  const tB = dB.slice(1).reduce((s, d) => s + d, 0);
  recorrer(tl, mano, B, dB, t, "none");
  tl.to(planoB, { drawSVG: "100%", duration: tB, ease: "none" }, t);
  tl.to(pupilas, { x: 0, y: 0, duration: tB, ease: "none" }, t);
  t += tB;
  // el lápiz da un golpecito de «listo»
  tl.to(mano, { y: -7, duration: 0.12, ease: "power1.out" }, t + 0.05);
  tl.to(mano, { y: 0, duration: 0.1, ease: "power1.in" }, t + 0.17);
  t += 0.35;
  // la nota tachada se despega y cae meciéndose
  const notaC = a("cae");
  tl.to(notaC, { rotation: caeGiro + 9, duration: 0.18, ease: "sine.out" }, t);
  tl.to(notaC, { y: 0, duration: 0.95, ease: "power2.in" }, t + 0.16);
  tl.to(notaC, { keyframes: [{ x: cae[0] + 14, rotation: -10 }, { x: cae[0] - 4, rotation: 8 }, { x: 0, rotation: -2 }], duration: 0.95, ease: "sine.inOut" }, t + 0.16);
  tl.to(notaC, { rotation: 0, duration: 0.25, ease: "back.out(3)" }, t + 1.11);
  tl.to(pupilas, { x: -2.6, y: 2.2, duration: 0.2 }, t + 0.25);
  tl.to(pupilas, { x: 0, y: 0, duration: 0.3 }, t + 1.6);
  tl.to(a("oreja"), { keyframes: [{ rotation: 16 }, { rotation: -7 }, { rotation: 0 }], duration: 0.36 }, t + 1.15);
  return tl;
}

// ── 2 · Dirijo agentes de IA ──
function vineta2(svg: SVGSVGElement, meta: MetaVineta) {
  const { a } = ayudantes(svg);
  const tl = gsap.timeline({ paused: true });
  const batuta = a("batuta"), compas = a("compas");
  for (const i of [1, 2, 3]) tl.set(a(`p${i}`), { x: pares(meta, `entrega${i}`)[0]?.[0] ?? -300, y: pares(meta, `entrega${i}`)[0]?.[1] ?? 0 }, 0);
  tl.set(compas, { opacity: 0 }, 0);
  tl.set(batuta, { rotation: -10 }, 0);

  let t = 0.3;
  // la banda entrega de derecha a izquierda: hoja (3), engrane (2), bloque (1)
  for (const i of [3, 2, 1]) {
    const pts = pares(meta, `entrega${i}`);
    const pieza = a(`p${i}`), ag = a(`ag${i}`);
    const viaje = Math.abs((pts[0]?.[0] ?? 0) - (pts[1]?.[0] ?? 0)) / 340 + 0.25;
    // golpe de batuta: arranca la pieza
    tl.to(batuta, { keyframes: [{ rotation: 6, duration: 0.12, ease: "power2.in" }, { rotation: -4, duration: 0.22, ease: "power2.out" }] }, t);
    tl.fromTo(compas, { opacity: 1 }, { opacity: 0, duration: 0.5, ease: "power1.in" }, t + 0.1);
    tl.to(pieza, { x: pts[1]?.[0] ?? 0, y: pts[1]?.[1] ?? 0, duration: viaje, ease: "power1.inOut" }, t + 0.1);
    t += 0.1 + viaje;
    // la pieza sube a sus brazos y el agente da un pasito
    tl.to(pieza, { x: 0, y: pts[2]?.[1] ?? -14, duration: 0.2, ease: "power2.out" }, t);
    tl.to(pieza, { y: 0, duration: 0.16, ease: "power2.in" }, t + 0.2);
    tl.to([...ag, ...pieza], { keyframes: [{ y: -9, rotation: 4, duration: 0.14, ease: "power1.out" }, { y: 0, rotation: 0, duration: 0.16, ease: "power1.in" }] }, t + 0.38);
    t += 0.72;
  }
  tl.to(batuta, { rotation: 0, duration: 0.4, ease: "back.out(2)" }, t);
  tl.to(compas, { opacity: 1, duration: 0.25 }, t + 0.1);
  return tl;
}

// ── 3 · Exijo pruebas ──
function vineta3(svg: SVGSVGElement, meta: MetaVineta) {
  const { a } = ayudantes(svg);
  const tl = gsap.timeline({ paused: true });
  const [frente, dentro, boca] = pares(meta, "recorrido").map((p) => p[0]) as [number, number, number];
  const pieza = a("pieza", "parche"), parche = a("parche");
  const maquina = a("maquina", "aguja", "sello", "piston", "luzMal", "luzBien");
  const aguja = a("aguja"), brazo = a("brazo"), sello = a("sello"), piston = a("piston");
  const tache = a("tache"), chispas = a("chispas"), marca = a("marca"), palomita = a("palomita");
  const luzMal = a("luzMal"), luzBien = a("luzBien");
  const baja = pares(meta, "sello")[0]?.[1] ?? 34;

  tl.set(pieza, { x: frente, y: 0, scaleY: 1 }, 0);
  tl.set(parche, { opacity: 0 }, 0);
  tl.set([marca, palomita, tache, chispas, luzMal, luzBien].flat(), { opacity: 0 }, 0);
  tl.set(palomita, { scale: 0.4 }, 0);
  tl.set(aguja, { rotation: -51 }, 0);

  let t = 0.35;
  // entra
  tl.to(pieza, { x: dentro, duration: 0.8, ease: "power1.inOut" }, t);
  t += 0.85;
  // la máquina piensa… y rechaza
  tl.to(aguja, { keyframes: [{ rotation: -66 }, { rotation: -40 }, { rotation: -100 }], duration: 0.55, ease: "sine.inOut" }, t);
  tl.to(maquina, { keyframes: [{ x: -2 }, { x: 2 }, { x: -2 }, { x: 0 }], duration: 0.3 }, t + 0.25);
  tl.to(luzMal, { keyframes: [{ opacity: 1 }, { opacity: 0.2 }, { opacity: 1 }], duration: 0.3 }, t + 0.45);
  t += 0.75;
  // sale disparada hacia atrás, rebota y cae frente al agente
  tl.to(pieza, { x: boca, duration: 0.1, ease: "power2.out" }, t);
  tl.to(pieza, { x: frente - 6, duration: 0.6, ease: "power2.out" }, t + 0.12);
  tl.to(pieza, { keyframes: [{ y: -34, duration: 0.24, ease: "power2.out" }, { y: 0, duration: 0.2, ease: "power2.in" }, { y: -9, duration: 0.1, ease: "power1.out" }, { y: 0, duration: 0.1, ease: "power1.in" }] }, t + 0.06);
  tl.to(pieza, { x: frente, duration: 0.15 }, t + 0.72);
  tl.fromTo(tache, { opacity: 0, scale: 0.3 }, { opacity: 1, scale: 1, duration: 0.3, ease: "back.out(3)" }, t + 0.5);
  tl.to(tache, { keyframes: [{ rotation: -8 }, { rotation: 8 }, { rotation: 0 }], duration: 0.3 }, t + 0.8);
  tl.to(luzMal, { opacity: 0, duration: 0.3 }, t + 0.9);
  tl.to(aguja, { rotation: -51, duration: 0.4 }, t + 0.9);
  t += 1.25;
  // martillazos: dos golpes; con el primero aparece el parche y se va el tache
  const golpe = numeros(meta, "golpe");
  for (let k = 0; k < 2; k++) {
    let acc = 0;
    golpe.valores.forEach((v, i) => {
      const d = golpe.dur[i] ?? 0.15;
      tl.to(brazo, { rotation: v, duration: d, ease: i === 1 ? "power3.in" : "sine.out" }, t + acc);
      acc += d;
    });
    const impacto = t + (golpe.dur[0] ?? 0.16) + (golpe.dur[1] ?? 0.09);
    tl.fromTo(chispas, { opacity: 1, scale: 0.7 }, { opacity: 0, scale: 1.25, duration: 0.3, ease: "power1.out" }, impacto);
    tl.to(pieza, { keyframes: [{ scaleY: 0.86, duration: 0.05 }, { scaleY: 1, duration: 0.18, ease: "back.out(3)" }] }, impacto);
    if (k === 0) {
      tl.to(parche, { opacity: 1, duration: 0.08 }, impacto);
      tl.to(tache, { opacity: 0, scale: 0.6, duration: 0.25 }, impacto + 0.05);
    }
    t += acc + 0.08;
  }
  t += 0.3;
  // vuelve a entrar…
  tl.to(pieza, { x: dentro, duration: 0.8, ease: "power1.inOut" }, t);
  t += 0.85;
  tl.to(aguja, { keyframes: [{ rotation: -60 }, { rotation: -30 }, { rotation: 0 }], duration: 0.5, ease: "sine.inOut" }, t);
  tl.to(luzBien, { keyframes: [{ opacity: 1 }, { opacity: 0.3 }, { opacity: 1 }], duration: 0.3 }, t + 0.4);
  t += 0.6;
  // …y sale por la derecha hasta el sello
  tl.to(pieza, { x: 0, duration: 0.65, ease: "power2.out" }, t);
  t += 0.75;
  tl.to(sello, { y: baja, duration: 0.13, ease: "power3.in" }, t);
  tl.to(piston, { scaleY: (6 + baja) / 6, duration: 0.13, ease: "power3.in" }, t);
  tl.to(piston, { scaleY: 1, duration: 0.35, ease: "power2.out" }, t + 0.2);
  tl.to(pieza, { keyframes: [{ scaleY: 0.9, duration: 0.05 }, { scaleY: 1, duration: 0.2, ease: "back.out(3)" }] }, t + 0.13);
  tl.fromTo(marca, { opacity: 0, scale: 1.4 }, { opacity: 1, scale: 1, duration: 0.18, ease: "power2.out" }, t + 0.13);
  tl.to(sello, { y: 0, duration: 0.35, ease: "power2.out" }, t + 0.2);
  tl.to(palomita, { opacity: 1, scale: 1, duration: 0.45, ease: "back.out(3)" }, t + 0.35);
  return tl;
}

// ── 4 · Reviso y despliego ──
const RUMBO_DIBUJO = 30; // el avión ya viene dibujado a -30°: autoRotate suma esto para que apunte por la curva
function vineta4(svg: SVGSVGElement, meta: MetaVineta) {
  const { a, trazos } = ayudantes(svg);
  const tl = gsap.timeline({ paused: true });
  const lupa = a("lupa"), avion = a("avion"), pupilas = a("pupilaIzq", "pupilaDer");
  const barrido = pares(meta, "barrido"), dBarrido = duraciones(meta, "barrido");
  const vuelo = pares(meta, "vuelo");
  const rumbo = numeros(meta, "rumbo").valores[0] ?? 22;
  const oks = [1, 2, 3, 4, 5].map((i) => a(`ok${i}`));
  const rayas = trazos("estela");
  const estela = rayas.flat();

  tl.set(lupa, { x: (barrido[0]?.[0] ?? 0) + 40, y: (barrido[0]?.[1] ?? 0) + 60 }, 0);
  tl.set(oks.flat(), { opacity: 0, scale: 0.4 }, 0);
  tl.set(avion, { x: vuelo[0]?.[0] ?? 0, y: vuelo[0]?.[1] ?? 0, rotation: rumbo, scale: 1, opacity: 1 }, 0);
  tl.set(estela, { opacity: 0 }, 0);
  tl.set(pupilas, { x: -1.5, y: 3.4 }, 0);

  let t = 0.25;
  tl.to(lupa, { x: barrido[0]?.[0] ?? 0, y: barrido[0]?.[1] ?? 0, duration: 0.45, ease: "power2.out" }, t);
  t += 0.5;
  // barrido renglón por renglón; cada renglón queda palomeado
  let acc = 0;
  barrido.forEach(([x, y], i) => {
    if (i === 0) return;
    const d = dBarrido[i] ?? 0.3;
    tl.to(lupa, { x, y, duration: d, ease: "sine.inOut" }, t + acc);
    acc += d;
    const ok = oks[(i - 1) / 2];
    if (i % 2 === 1 && ok) tl.to(ok, { opacity: 1, scale: 1, duration: 0.25, ease: "back.out(3)" }, t + acc - 0.05);
  });
  tl.to(pupilas, { x: 1, y: 3.4, duration: acc, ease: "none" }, t);
  t += acc + 0.15;
  // el avión se prepara (se mece) y despega en curva; la estela aparece detrás
  tl.to(avion, { keyframes: [{ rotation: rumbo - 5 }, { rotation: rumbo + 3 }, { rotation: rumbo }], duration: 0.35 }, t);
  t += 0.4;
  const camino = vuelo.map(([x, y]) => ({ x, y }));
  const dVuelo = 2.1;
  tl.to(avion, { motionPath: { path: camino, curviness: 1.2, autoRotate: RUMBO_DIBUJO }, duration: dVuelo, ease: "power1.in" }, t);
  tl.to(avion, { scale: 0.8, duration: 0.6, ease: "power1.in" }, t + dVuelo - 0.6);
  rayas.forEach((r, k) => tl.to(r, { opacity: 1, duration: 0.06 }, t + 0.15 + (k * dVuelo * 0.62) / Math.max(1, rayas.length)));
  tl.to(pupilas, { keyframes: [{ x: 3, y: 1, duration: dVuelo * 0.4 }, { x: 2.6, y: -3.4, duration: dVuelo * 0.35 }, { x: 3.4, y: -2.6, duration: dVuelo * 0.25 }], ease: "sine.inOut" }, t);
  t += dVuelo;
  tl.to(a("cola"), { keyframes: [{ rotation: -11 }, { rotation: 8 }, { rotation: -3 }, { rotation: 0 }], duration: 0.9 }, t - 0.3);
  tl.to(a("ojoIzq", "ojoDer", "pupilaIzq", "pupilaDer"), { keyframes: [{ scaleY: 0.1, duration: 0.07 }, { scaleY: 1, duration: 0.11 }] }, t + 0.2);
  tl.to(pupilas, { x: 0, y: 0, duration: 0.4 }, t + 0.5);
  return tl;
}

export const ESCENAS = [vineta1, vineta2, vineta3, vineta4];
