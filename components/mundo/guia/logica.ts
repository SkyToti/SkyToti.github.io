// Cuentas puras del guía (sin DOM): dónde quiere estar Haku, cómo da el siguiente paso, a qué ritmo, qué frase toca
// y dónde cabe el globo. Las prueba `node --test pruebas/guia.test.mjs` (Node quita los tipos solo).

/** `blando`: un dibujo decorativo ([data-obstaculo] que no es texto, botón ni vista): el globo no lo tapa, pero Haku
 *  sentado sí puede quedar delante de él si no hay otro hueco */
export type Caja = { x: number; y: number; w: number; h: number; blando?: boolean };

/** centro objetivo de Haku: del 6 % al 88 % del ancho según el avance (0..1) dentro del escenario actual */
export function objetivoX(avance: number, ancho: number): number {
  const p = Math.min(1, Math.max(0, avance));
  return ancho * (0.06 + 0.82 * p);
}

/**
 * Un paso de la caminata hacia el objetivo, siempre en la dirección del scroll (dir: +1 baja → derecha, −1 sube →
 * izquierda). Si el objetivo quedó del otro lado (cambió de escenario), Haku sale por una orilla y entra por la
 * otra: el mundo da la vuelta con un periodo de ancho + caja. Devuelve la x nueva y si de verdad avanzó.
 */
export function paso(x: number, objetivo: number, dir: 1 | -1, ancho: number, caja: number, zancada: number) {
  const periodo = ancho + caja;
  let d = objetivo - x;
  if (dir > 0 && d < 0) d += periodo;
  if (dir < 0 && d > 0) d -= periodo;
  // ya llegó (o le falta menos de una zancada): no se mueve, así nunca patina
  if (Math.abs(d) < zancada || Math.abs(d) > periodo - zancada) return { x, avanzo: false };
  let nx = x + dir * zancada;
  if (nx > ancho + caja / 2) nx -= periodo;
  if (nx < -caja / 2) nx += periodo;
  return { x: nx, avanzo: true };
}

/** cuadros por segundo de la caminata según la velocidad del scroll (px/ms), con tope */
export function fpsCaminata(velocidad: number): number {
  return Math.round(Math.min(18, Math.max(8, 8 + Math.abs(velocidad) * 5)));
}

/**
 * La siguiente frase: primero las de la estación en orden; al agotarse, las de repuesto (y vuelven a rodar).
 * `vistas` = cuántas ya dijo en esa estación. Sin nada que decir → null (entonces salta).
 */
export function fraseSiguiente(propias: string[] | undefined, repuesto: string[] | undefined, vistas: number): string | null {
  const a = propias ?? [], b = repuesto ?? [];
  if (vistas < a.length) return a[vistas] ?? null;
  if (!b.length) return a.length ? a[vistas % a.length] ?? null : null;
  return b[(vistas - a.length) % b.length] ?? null;
}

/** hacia dónde presenta: el `data-lado` de la estación, o hacia el centro de la ventana */
export function ladoPresentar(lado: string | undefined | null, x: number, ancho: number): "izq" | "der" {
  if (lado === "izq" || lado === "der") return lado;
  return x < ancho / 2 ? "der" : "izq";
}

const cruza = (a: Caja, b: Caja) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

/**
 * Distancia (px, siempre ≥ 0) que le falta a Haku para llegar al objetivo caminando en la dirección `dir`, con la misma
 * vuelta por las orillas que `paso` (periodo = ancho + caja).
 */
export function distanciaRuta(x: number, objetivo: number, dir: 1 | -1, ancho: number, caja: number): number {
  const periodo = ancho + caja;
  let d = (objetivo - x) * dir;
  while (d < 0) d += periodo;
  while (d >= periodo) d -= periodo;
  return d;
}

/**
 * La carrera al parar (scroll muy rápido: Haku se quedó atrás). Corre con el ciclo de caminata al doble de cuadros por
 * segundo y, si aun así tardaría más de `tope` ms, alarga la zancada: llega siempre en ≤ `tope`. Devuelve los cuadros
 * por segundo y los px por cuadro (o null si ya está a menos de dos zancadas: entonces se sienta ahí).
 */
export function carrera(distancia: number, zancada: number, fpsBase: number, tope = 600) {
  if (distancia < zancada * 2) return null;
  const fps = Math.min(36, fpsBase * 2);
  const cuadros = Math.max(1, Math.floor((tope / 1000) * fps));
  return { fps, px: Math.max(zancada, distancia / cuadros) };
}

/**
 * Dónde va el globo (w×h) sobre Haku (caja en pantalla) sin salirse de la ventana ni tapar ninguna de las cajas
 * `evitar` (renglones de texto, botones, vistas y obstáculos). Prueba arriba centrado, corrido a un lado y al otro
 * (abierto hacia el lado libre), y cada vez más arriba; nunca bajo la cabecera fija (`techo`).
 * Devuelve la caja y dónde cae la flecha (px desde la izquierda del globo), o null si no cabe sin tapar nada.
 */
export function colocarGlobo(haku: Caja, w: number, h: number, vw: number, vh: number, evitar: Caja[], margen = 8, techo = 0) {
  const cx = haku.x + haku.w / 2;
  // la flecha apunta a la cabeza: el gato sentado ocupa la mitad de abajo de su caja
  const base = haku.y + haku.h * 0.3 - h;
  const xs = [cx - w / 2, cx - w * 0.2, cx - w * 0.8, cx - 22, cx - w + 22, cx + 40, cx - w - 40];
  const ys = [base, base - 40, base - 90, base - 150, base - 220, base - 300, base - 380];
  for (const y0 of ys) {
    for (const x0 of xs) {
      const x = Math.min(vw - w - margen, Math.max(margen, x0));
      const y = Math.min(vh - h - margen, Math.max(margen + techo, y0));
      const c = { x, y, w, h };
      if (evitar.some((e) => cruza(c, e))) continue;
      const flecha = Math.min(w - 18, Math.max(18, cx - x));
      return { ...c, flecha };
    }
  }
  return null;
}

/**
 * Si el globo no cabe donde está Haku: el centro x más cercano (entre `min` y `max`, a saltos de `salto` px) donde sí
 * cabría. Haku camina hasta ahí y entonces habla. null si no hay sitio en toda la ventana. `libre(x)` (opcional) dice
 * si Haku puede sentarse en esa x sin taparle nada a nadie (su cabeza no debe quedar encima de un renglón).
 */
export function buscarSitio(haku: Caja, w: number, h: number, vw: number, vh: number, evitar: Caja[], min: number, max: number, margen = 8, techo = 0, salto = 16, libre?: (x: number) => boolean) {
  const cx = haku.x + haku.w / 2;
  for (let d = salto; d <= vw; d += salto) {
    for (const x of [cx + d, cx - d]) {
      if (x < min || x > max) continue;
      if (libre && !libre(x)) continue;
      const sitio = colocarGlobo({ ...haku, x: x - haku.w / 2 }, w, h, vw, vh, evitar, margen, techo);
      if (sitio) return { x, sitio };
    }
  }
  return null;
}

/**
 * La silueta del gato sentado respecto al centro-abajo de su caja: media anchura y alto, en px a escala 1 (el gato
 * se puede voltear: la media anchura es la del lado más ancho, así vale para los dos).
 */
export type Silueta = { medio: number; alto: number; pie: number };

/** la caja en pantalla del gato sentado con su caja centrada en `cx`, a escala `e` (crece desde el piso) */
export function cajaGato(cx: number, s: Silueta, vh: number, e = 1): Caja {
  return { x: cx - s.medio * e, y: vh - (s.pie + s.alto) * e, w: 2 * s.medio * e, h: s.alto * e };
}

const encimado = (a: Caja, b: Caja) =>
  Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)) * Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));

/**
 * Dónde se sienta Haku sin taparle nada a nadie: la x (centro de su caja) más cercana a `x`, entre `min` y `max`, en la
 * que el gato sentado no se encima con ninguna caja de `evitar` (renglones, botones, vistas, obstáculos). Si a tamaño
 * completo no hay hueco, lo busca al 70 %; y si tampoco, se va a la orilla más libre al 70 %, asomándose (hasta la
 * mitad del gato fuera de la ventana) para tapar lo menos posible. `libre` = no tapa nada.
 */
export function sitioSentado(x: number, s: Silueta, vw: number, vh: number, evitar: Caja[], min: number, max: number, salto = 8) {
  const franja = evitar.filter((c) => c.y + c.h > vh - (s.pie + s.alto) - 2 && c.y < vh);
  // lo duro (texto, botones, vistas) pesa mil veces más que un dibujo decorativo
  const tapa = (cx: number, e: number, soloDuro = false) =>
    franja.reduce((t, c) => (soloDuro && c.blando ? t : t + encimado(cajaGato(cx, s, vh, e), c) * (c.blando ? 1 : 1000)), 0);
  // primero un hueco limpio; si no, uno donde solo quede delante de un dibujo (nunca de lo que se lee)
  for (const soloDuro of [false, true]) {
    for (const e of [1, 0.7]) {
      const lo = Math.max(min, s.medio * e), hi = Math.min(max, vw - s.medio * e);
      const x0 = Math.min(hi, Math.max(lo, x));
      for (let d = 0; d <= vw; d += salto) {
        for (const cx of d ? [x0 + d, x0 - d] : [x0]) {
          if (cx < lo || cx > hi) continue;
          if (!tapa(cx, e, soloDuro)) return { x: cx, escala: e, libre: true };
        }
      }
    }
  }
  // sin hueco: la orilla más libre, al 70 % y asomándose (si ni así cabe sin tapar lo que se lee, se esconde tras la
  // orilla hasta que vuelva el scroll)
  const e = 0.7, m = s.medio * e;
  let mejor = { x: Math.max(min, m), escala: e, libre: false }, menos = Infinity;
  for (let k = 0; k <= 20; k++) {
    for (const cx of [Math.max(min, m) - (m * k) / 10, vw - m + (m * k) / 10]) {
      const t = tapa(cx, e);
      // a igual tapado gana lo que menos se esconde (el primero que se probó)
      if (t < menos - 0.5) {
        menos = t;
        mejor = { x: cx, escala: e, libre: tapa(cx, e, true) === 0 };
      }
    }
    if (menos === 0) break;
  }
  return mejor;
}
