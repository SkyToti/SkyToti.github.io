// Geometría de la línea viva (MUNDO.md, «La línea y la chispa»). Funciones puras: de las anclas medidas a UN
// trazo suave que pasa por todas, con su ondulación a pulso, y las tablas que usa el movimiento. Solo se llama
// al medir (carga, fuentes, cambio de tamaño); nunca en cada cuadro.

export type Punto = { x: number; y: number };
export type Caja = { izq: number; arr: number; der: number; aba: number };

/** Cómo se acerca la línea a un ancla desde su carril (lo decide el CSS con `--forma`). */
export type Forma = "bulto" | "esquina" | "paso" | "fin";

export type Ancla = Punto & {
  /** x del carril vertical por el que corre la línea cerca de esta ancla. */
  carril: number;
  forma: Forma;
  estacion: string;
  /** ancla de un escenario a todo lo ancho (`[data-estacion][data-lado]`): se llega a ella, y se sale de ella, por
   *  una ruta que esquiva obstáculos (`rutear`), no por carriles. */
  ancha?: boolean;
};

/** Lo que el enrutador necesita saber de la página (solo escritorio). `duros`: texto, medios y botones (nunca se
 *  pisan). `blandos`: `[data-obstaculo]` y tramos fijados (un pasillo los puede abrir). `pasillos`: `[data-pasillo]`,
 *  zonas libres declaradas por donde la línea prefiere pasar. `detras`: dibujos decorativos `[data-linea="detras"]`
 *  que la línea PUEDE cruzar (por detrás y atenuada); cuesta un poco más pasar por ellos que por lo vacío. */
export type Mapa = {
  duros: Caja[];
  blandos: Caja[];
  pasillos: Caja[];
  ancho: number;
  alto: number;
  fijados?: Caja[];
  detras?: Caja[];
};

/** Holgura que se respeta alrededor del texto y los medios al buscar por dónde cruzar. */
const HOLGURA_CRUCE = 16;
/** Radio de las vueltas en los cruces y de los bultos hacia un ancla (escritorio). */
const RADIO = 40;

// ── Catmull-Rom centrípeta → Bézier cúbicas ───────────────────────────────────────────────────────────────
type Cubica = [Punto, Punto, Punto, Punto];

function cubicas(p: Punto[]): Cubica[] {
  const fuera: Cubica[] = [];
  if (p.length < 2) return fuera;
  const d = (a: Punto, b: Punto) => Math.max(Math.hypot(b.x - a.x, b.y - a.y) ** 0.5, 1e-4);
  for (let i = 0; i < p.length - 1; i++) {
    const p1 = p[i]!;
    const p2 = p[i + 1]!;
    // En las puntas se refleja el vecino que falta (la curva sale y llega derecha).
    const p0 = p[i - 1] ?? { x: 2 * p1.x - p2.x, y: 2 * p1.y - p2.y };
    const p3 = p[i + 2] ?? { x: 2 * p2.x - p1.x, y: 2 * p2.y - p1.y };
    const d1 = d(p0, p1);
    const d2 = d(p1, p2);
    const d3 = d(p2, p3);
    // Tangentes de Catmull-Rom no uniforme (Barry-Goldman) escaladas al tramo p1→p2.
    const t1 = {
      x: ((p1.x - p0.x) / d1 - (p2.x - p0.x) / (d1 + d2) + (p2.x - p1.x) / d2) * d2,
      y: ((p1.y - p0.y) / d1 - (p2.y - p0.y) / (d1 + d2) + (p2.y - p1.y) / d2) * d2,
    };
    const t2 = {
      x: ((p2.x - p1.x) / d2 - (p3.x - p1.x) / (d2 + d3) + (p3.x - p2.x) / d3) * d2,
      y: ((p2.y - p1.y) / d2 - (p3.y - p1.y) / (d2 + d3) + (p3.y - p2.y) / d3) * d2,
    };
    fuera.push([p1, { x: p1.x + t1.x / 3, y: p1.y + t1.y / 3 }, { x: p2.x - t2.x / 3, y: p2.y - t2.y / 3 }, p2]);
  }
  return fuera;
}

function enCubica([a, b, c, d]: Cubica, t: number): Punto {
  const u = 1 - t;
  return {
    x: u * u * u * a.x + 3 * u * u * t * b.x + 3 * u * t * t * c.x + t * t * t * d.x,
    y: u * u * u * a.y + 3 * u * u * t * b.y + 3 * u * t * t * c.y + t * t * t * d.y,
  };
}

/** Recorre la curva por los puntos y la vuelve a muestrear a pasos (casi) iguales de arco, tramo por tramo: cada
 *  punto de paso queda como muestra (las anclas no se recortan). `fijos[i]` marca las muestras que son anclas. */
function remuestrear(puntos: Punto[], paso: number, esAncla: (p: Punto) => boolean): { muestras: Punto[]; fijos: boolean[] } {
  const muestras: Punto[] = [];
  const fijos: boolean[] = [];
  const c = cubicas(puntos);
  c.forEach((cub, ci) => {
    // Largo acumulado dentro del tramo (32 subdivisiones).
    const denso = Array.from({ length: 33 }, (_, k) => enCubica(cub, k / 32));
    const acum = [0];
    for (let k = 1; k < denso.length; k++) acum.push(acum[k - 1]! + Math.hypot(denso[k]!.x - denso[k - 1]!.x, denso[k]!.y - denso[k - 1]!.y));
    const largo = acum[32]!;
    const n = Math.max(1, Math.round(largo / paso));
    if (ci === 0) {
      muestras.push(cub[0]);
      fijos.push(esAncla(puntos[0]!));
    }
    let k = 1;
    for (let j = 1; j < n; j++) {
      const meta = (largo * j) / n;
      while (k < 32 && acum[k]! < meta) k++;
      const f = (meta - acum[k - 1]!) / (acum[k]! - acum[k - 1]! || 1);
      const a = denso[k - 1]!;
      const b = denso[k]!;
      muestras.push({ x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f });
      fijos.push(false);
    }
    muestras.push(cub[3]);
    fijos.push(esAncla(puntos[ci + 1]!));
  });
  return { muestras, fijos };
}

// ── Ruido con semilla fija (la ondulación «a pulso») ─────────────────────────────────────────────────────
function azar(i: number, semilla: number): number {
  let h = (Math.imul(i | 0, 0x27d4eb2d) ^ Math.imul(semilla, 0x165667b1)) >>> 0;
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  return (((h ^ (h >>> 16)) >>> 0) / 4294967296) * 2 - 1;
}
function ruido(s: number, semilla: number): number {
  const i = Math.floor(s);
  const f = s - i;
  const suave = f * f * (3 - 2 * f);
  return azar(i, semilla) * (1 - suave) + azar(i + 1, semilla) * suave;
}
/** Desvío lateral en px a la distancia `s` del arranque: ±3 px como máximo. */
export const pulso = (s: number) => 2.2 * ruido(s / 170, 7) + 0.8 * ruido(s / 47, 13);

// ── El recorrido ────────────────────────────────────────────────────────────────────────────────────────
const choca = (c: Caja, izq: number, arr: number, der: number, aba: number) =>
  c.izq < der && c.der > izq && c.arr < aba && c.aba > arr;

/** La y más holgada entre `desde` y `hasta` para cruzar en horizontal de x1 a x2 sin tocar nada. */
function yDeCruce(x1: number, x2: number, desde: number, hasta: number, obstaculos: Caja[]): number {
  const izq = Math.min(x1, x2) - 4;
  const der = Math.max(x1, x2) + 4;
  const enCamino = obstaculos.filter((c) => choca(c, izq, desde - HOLGURA_CRUCE, der, hasta + HOLGURA_CRUCE));
  let mejor = { largo: -1, y: (desde + hasta) / 2 };
  let inicio: number | null = null;
  for (let y = desde; y <= hasta + 2; y += 2) {
    const libre = y <= hasta && !enCamino.some((c) => choca(c, izq, y - HOLGURA_CRUCE, der, y + HOLGURA_CRUCE));
    if (libre && inicio === null) inicio = y;
    if (!libre && inicio !== null) {
      if (y - inicio > mejor.largo) mejor = { largo: y - inicio, y: (inicio + y - 2) / 2 };
      inicio = null;
    }
  }
  return mejor.y;
}


// ── El enrutador (escenarios a todo lo ancho) ─────────────────────────────────────────────────────────────
/** Lado de la celda de la rejilla, holgura que se deja libre alrededor de lo duro y lo blando, franja «cerca» que
 *  cuesta más (la línea va por el centro de los huecos), castigo por vuelta y margen con la orilla de la ventana. */
const CELDA = 12;
const HOLGURA_RUTA = 14;
const CERCA = 34;
const VUELTA = 8;
const ORILLA = 14;
/** Coste de cada celda dentro de un dibujo «detrás»: se cruza si hace falta, pero se prefiere lo vacío. */
const COSTE_DETRAS = 2.2;
/** Alto de la banda de la rejilla por encima y por debajo de los dos puntos de una ruta. */
const BANDA = 320;
/** Radio con que se redondea cada vuelta de una ruta. */
const RADIO_RUTA = 30;

/** Montículo binario mínimo de pares (prioridad, valor). */
class Monticulo {
  private p: number[] = [];
  private v: number[] = [];
  get vacio() {
    return this.p.length === 0;
  }
  meter(prio: number, valor: number) {
    const { p, v } = this;
    let i = p.length;
    p.push(prio);
    v.push(valor);
    while (i > 0) {
      const padre = (i - 1) >> 1;
      if (p[padre]! <= prio) break;
      p[i] = p[padre]!;
      v[i] = v[padre]!;
      i = padre;
    }
    p[i] = prio;
    v[i] = valor;
  }
  sacar(): number {
    const { p, v } = this;
    const arriba = v[0]!;
    const ultP = p.pop()!;
    const ultV = v.pop()!;
    if (p.length) {
      let i = 0;
      for (;;) {
        const a = 2 * i + 1;
        const b = a + 1;
        let m = i;
        let mp = ultP;
        if (a < p.length && p[a]! < mp) {
          m = a;
          mp = p[a]!;
        }
        if (b < p.length && p[b]! < mp) {
          m = b;
          mp = p[b]!;
        }
        if (m === i) break;
        p[i] = p[m]!;
        v[i] = v[m]!;
        i = m;
      }
      p[i] = ultP;
      v[i] = ultV;
    }
    return arriba;
  }
}

/** Una ruta libre de `desde` a `hasta`: A* en una rejilla de 12 px que no pisa lo duro ni lo blando (salvo dentro de
 *  un pasillo), prefiere los pasillos y el centro de los huecos, y castiga las vueltas (sale en tramos rectos). Devuelve
 *  los puntos de en medio, con cada vuelta redondeada, sin `desde` ni `hasta`; o null si no hay paso. */
export function rutear(desde: Punto, hasta: Punto, mapa: Mapa): Punto[] | null {
  const x0 = ORILLA;
  const nx = Math.max(2, Math.floor((mapa.ancho - 2 * ORILLA) / CELDA) + 1);
  const yMin = Math.max(0, Math.min(desde.y, hasta.y) - BANDA);
  const yMax = Math.min(mapa.alto, Math.max(desde.y, hasta.y) + BANDA);
  const ny = Math.max(2, Math.floor((yMax - yMin) / CELDA) + 1);
  const N = nx * ny;
  const bloqueada = new Uint8Array(N);
  const pasillo = new Uint8Array(N);
  const coste = new Float32Array(N).fill(1);
  const cada = (c: Caja, h: number, f: (k: number) => void) => {
    const i0 = Math.max(0, Math.ceil((c.izq - h - x0) / CELDA));
    const i1 = Math.min(nx - 1, Math.floor((c.der + h - x0) / CELDA));
    const j0 = Math.max(0, Math.ceil((c.arr - h - yMin) / CELDA));
    const j1 = Math.min(ny - 1, Math.floor((c.aba + h - yMin) / CELDA));
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) f(j * nx + i);
  };
  const enBanda = (c: Caja) => c.aba + CERCA >= yMin && c.arr - CERCA <= yMax;
  for (const c of mapa.pasillos) if (enBanda(c)) cada(c, 0, (k) => (pasillo[k] = 1));
  for (const c of mapa.duros)
    if (enBanda(c)) {
      cada(c, CERCA, (k) => (coste[k] = Math.max(coste[k]!, 3)));
      cada(c, HOLGURA_RUTA, (k) => (bloqueada[k] = 1));
    }
  for (const c of mapa.blandos)
    if (enBanda(c)) {
      cada(c, CERCA, (k) => pasillo[k] || (coste[k] = Math.max(coste[k]!, 3)));
      cada(c, HOLGURA_RUTA, (k) => pasillo[k] || (bloqueada[k] = 1));
    }
  for (const c of mapa.detras ?? []) if (enBanda(c)) cada(c, 0, (k) => (coste[k] = Math.max(coste[k]!, COSTE_DETRAS)));
  for (let k = 0; k < N; k++) if (pasillo[k]) coste[k] = Math.min(coste[k]!, 0.4);

  /** la celda libre más cercana a un punto (hasta 8 celdas a la redonda) */
  const libreCerca = (q: Punto): number => {
    const ci = Math.round((q.x - x0) / CELDA);
    const cj = Math.round((q.y - yMin) / CELDA);
    let mejor = -1;
    let dist = Infinity;
    for (let dj = -8; dj <= 8; dj++)
      for (let di = -8; di <= 8; di++) {
        const i = ci + di;
        const j = cj + dj;
        if (i < 0 || j < 0 || i >= nx || j >= ny || bloqueada[j * nx + i]) continue;
        const d = Math.hypot(x0 + i * CELDA - q.x, yMin + j * CELDA - q.y);
        if (d < dist) {
          dist = d;
          mejor = j * nx + i;
        }
      }
    return mejor;
  };
  const ini = libreCerca(desde);
  const fin = libreCerca(hasta);
  if (ini < 0 || fin < 0) return null;

  // A* sobre (celda, dirección): 0 →, 1 ↓, 2 ←, 3 ↑.
  const DI = [1, 0, -1, 0];
  const DJ = [0, 1, 0, -1];
  const g = new Float32Array(N * 4).fill(Infinity);
  const previo = new Int32Array(N * 4).fill(-1);
  const fi = fin % nx;
  const fj = (fin / nx) | 0;
  // Heurística de 1 por celda (la mayoría cuesta 1): explora una fracción de lo que exploraba con 0.4 (el mínimo, en
  // un pasillo). Puede dejar de aprovechar un pasillo por poco; nunca pisa nada (lo bloqueado sigue bloqueado).
  const h = (k: number) => Math.abs((k % nx) - fi) + Math.abs(((k / nx) | 0) - fj);
  const abierta = new Monticulo();
  for (let d = 0; d < 4; d++) {
    g[ini * 4 + d] = 0;
    abierta.meter(h(ini), ini * 4 + d);
  }
  let llegada = -1;
  while (!abierta.vacio) {
    const s = abierta.sacar();
    const k = s >> 2;
    const d = s & 3;
    if (k === fin) {
      llegada = s;
      break;
    }
    const i = k % nx;
    const j = (k / nx) | 0;
    for (let e = 0; e < 4; e++) {
      if ((e ^ 2) === d) continue; // no se da media vuelta
      const ii = i + DI[e]!;
      const jj = j + DJ[e]!;
      if (ii < 0 || jj < 0 || ii >= nx || jj >= ny) continue;
      const kk = jj * nx + ii;
      if (bloqueada[kk]) continue;
      const nuevo = g[s]! + coste[kk]! + (e === d ? 0 : VUELTA);
      const t = kk * 4 + e;
      if (nuevo >= g[t]!) continue;
      g[t] = nuevo;
      previo[t] = s;
      abierta.meter(nuevo + h(kk), t);
    }
  }
  if (llegada < 0) return null;

  // De la cadena de celdas a sus vueltas.
  const celdas: number[] = [];
  for (let s = llegada; s >= 0; s = previo[s]!) {
    const k = s >> 2;
    if (celdas[celdas.length - 1] !== k) celdas.push(k);
  }
  celdas.reverse();
  const centro = (k: number): Punto => ({ x: x0 + (k % nx) * CELDA, y: yMin + ((k / nx) | 0) * CELDA });
  const linea: Punto[] = [desde, centro(celdas[0]!)];
  for (let n = 1; n < celdas.length - 1; n++) {
    const a = centro(celdas[n - 1]!);
    const b = centro(celdas[n]!);
    const c = centro(celdas[n + 1]!);
    if (Math.sign(b.x - a.x) !== Math.sign(c.x - b.x) || Math.sign(b.y - a.y) !== Math.sign(c.y - b.y)) linea.push(b);
  }
  if (celdas.length > 1) linea.push(centro(celdas[celdas.length - 1]!));
  linea.push(hasta);
  // Sin puntos repetidos ni pegados (< 2 px).
  const limpia = linea.filter((q, n) => n === 0 || Math.hypot(q.x - linea[n - 1]!.x, q.y - linea[n - 1]!.y) >= 2);
  // Cada vuelta, redondeada: dos puntos a `r` de la esquina, sobre cada tramo.
  const fuera: Punto[] = [];
  for (let n = 1; n < limpia.length - 1; n++) {
    const a = limpia[n - 1]!;
    const b = limpia[n]!;
    const c = limpia[n + 1]!;
    const la = Math.hypot(a.x - b.x, a.y - b.y);
    const lc = Math.hypot(c.x - b.x, c.y - b.y);
    const r = Math.min(RADIO_RUTA, la / 2, lc / 2);
    if (r < 3) {
      fuera.push(b);
      continue;
    }
    fuera.push({ x: b.x + ((a.x - b.x) * r) / la, y: b.y + ((a.y - b.y) * r) / la });
    fuera.push({ x: b.x + ((c.x - b.x) * r) / lc, y: b.y + ((c.y - b.y) * r) / lc });
  }
  return fuera;
}

// ── Caché de rutas por tramo ────────────────────────────────────────────────────────────────────────────
/** Rutas ya calculadas. La clave es el tramo visto desde su propia banda (coordenadas relativas a la y de arriba de la
 *  banda, con lo que la toca): si algo de más arriba cambia de alto y el tramo solo se corre en vertical, se
 *  reutiliza corrida, sin volver a correr el A*. Así, al montarse la tira o un invento, solo se rehacen los tramos que
 *  de verdad cambiaron. */
const RUTAS = new Map<string, Punto[] | null>();
const MAX_RUTAS = 300;

function rutearGuardado(desde: Punto, hasta: Punto, mapa: Mapa): Punto[] | null {
  const yMin = Math.max(0, Math.min(desde.y, hasta.y) - BANDA);
  const yMax = Math.min(mapa.alto, Math.max(desde.y, hasta.y) + BANDA);
  const r = (n: number) => Math.round(n);
  const cerca = (c: Caja) => c.aba + CERCA >= yMin && c.arr - CERCA <= yMax;
  const lista = (cs: Caja[] | undefined) =>
    (cs ?? []).filter(cerca).map((c) => `${r(c.izq)},${r(c.arr - yMin)},${r(c.der)},${r(c.aba - yMin)}`).join(";");
  const clave = [
    mapa.ancho,
    r(yMax - yMin),
    r(desde.x),
    r(desde.y - yMin),
    r(hasta.x),
    r(hasta.y - yMin),
    lista(mapa.duros),
    lista(mapa.blandos),
    lista(mapa.pasillos),
    lista(mapa.detras),
  ].join("|");
  let ruta = RUTAS.get(clave);
  if (ruta === undefined) {
    ruta = rutear({ x: desde.x, y: desde.y - yMin }, { x: hasta.x, y: hasta.y - yMin }, corrido(mapa, -yMin));
    if (RUTAS.size >= MAX_RUTAS) RUTAS.delete(RUTAS.keys().next().value!);
  } else RUTAS.delete(clave);
  RUTAS.set(clave, ruta);
  return ruta && ruta.map((q) => ({ x: q.x, y: q.y + yMin }));
}

/** El mapa corrido `dy` en vertical (para rutear un tramo en coordenadas de su banda). */
function corrido(mapa: Mapa, dy: number): Mapa {
  const mover = (cs: Caja[] | undefined) => (cs ?? []).map((c) => ({ izq: c.izq, der: c.der, arr: c.arr + dy, aba: c.aba + dy }));
  return {
    duros: mover(mapa.duros),
    blandos: mover(mapa.blandos),
    pasillos: mover(mapa.pasillos),
    detras: mover(mapa.detras),
    ancho: mapa.ancho,
    alto: mapa.alto + dy,
  };
}

/** Los puntos de paso: el arranque, cada ancla con su acercamiento y los cruces entre carriles. */
function puntosDePaso(
  inicio: Punto,
  anclas: Ancla[],
  obstaculos: Caja[],
  angosto: boolean,
  mapa?: Mapa,
  sinRuta: string[] = [],
): Punto[] {
  const p: Punto[] = [inicio];
  const r = angosto ? 26 : RADIO;
  let carril = inicio.x;
  let y = inicio.y;
  anclas.forEach((a, i) => {
    const lejos = Math.abs(a.x - a.carril) > 3;
    // Hacia un escenario ancho, o saliendo de uno: ruta que esquiva (a un ancla de carril se entra por su carril).
    let ruteada = false;
    // También todo tramo que cruce un tramo fijado (pin): lo rodea por la orilla.
    const desdeY = p[p.length - 1]!.y;
    const cruzaFijado = mapa?.fijados?.some((f) => f.arr < a.y && f.aba > desdeY) ?? false;
    if (mapa && i > 0 && (a.ancha || anclas[i - 1]!.ancha || cruzaFijado)) {
      const entrada = a.ancha ? a : { x: a.carril, y: lejos && a.forma !== "paso" ? a.y - r : a.y };
      const ruta = rutearGuardado(p[p.length - 1]!, entrada, mapa);
      if (ruta) {
        p.push(...ruta);
        ruteada = true;
      } else sinRuta.push(a.estacion);
    }
    // Cruce horizontal si el carril cambia (solo después de la primera ancla).
    if (!ruteada && i > 0 && Math.abs(a.carril - carril) > 4) {
      const antes = a.forma === "bulto" && lejos ? a.y - r : a.y;
      const yc = yDeCruce(carril, a.carril, y + r, antes - r, obstaculos);
      const h = Math.min(r, Math.max(8, (antes - y) / 3));
      const s = Math.sign(a.carril - carril);
      p.push({ x: carril, y: yc - h }, { x: carril + s * h, y: yc }, { x: a.carril - s * h, y: yc }, { x: a.carril, y: yc + h });
    }
    if (i === 0 || a.forma === "esquina") {
      // Un punto más sobre la recta de llegada: la vuelta hacia abajo no levanta la línea antes del ancla.
      const previo = p[p.length - 1]!;
      const largo = Math.hypot(previo.x - a.x, previo.y - a.y);
      if (largo > 60) {
        const f = Math.min(40, largo / 3) / largo;
        p.push({ x: a.x + (previo.x - a.x) * f, y: a.y + (previo.y - a.y) * f });
      }
      p.push(a);
      if (lejos && a.forma !== "fin") p.push({ x: a.carril, y: a.y + (angosto ? 22 : 24) });
    } else if (a.forma === "bulto" && lejos) {
      p.push({ x: a.carril, y: a.y - (angosto ? 30 : r) }, a, { x: a.carril + (angosto ? 2 : 0), y: a.y + (angosto ? 12 : r) });
    } else if (a.forma === "fin" && lejos) {
      p.push({ x: a.carril, y: a.y - (angosto ? 30 : r) }, a);
    } else {
      p.push(a);
    }
    carril = a.carril;
    y = p[p.length - 1]!.y;
  });
  // Los tramos largos por un carril van derechos: dos puntos más cerca de cada punta, sobre la misma vertical,
  // para que la curvatura de las vueltas no se reparta por todo el tramo (la línea se ladeaba hasta la orilla).
  const fuera: Punto[] = [p[0]!];
  for (let i = 1; i < p.length; i++) {
    const a = p[i - 1]!;
    const b = p[i]!;
    const dy = b.y - a.y;
    const dx = b.x - a.x;
    if (Math.abs(dx) < 3 && Math.abs(dy) > 4 * r) {
      const d = Math.sign(dy) * Math.min(60, Math.abs(dy) / 4);
      fuera.push({ x: a.x, y: a.y + d }, { x: b.x, y: b.y - d });
    } else if (mapa && Math.abs(dy) < 3 && Math.abs(dx) > 4 * r) {
      // lo mismo para los tramos horizontales de las rutas
      const d = Math.sign(dx) * Math.min(60, Math.abs(dx) / 4);
      fuera.push({ x: a.x + d, y: a.y }, { x: b.x - d, y: b.y });
    }
    fuera.push(b);
  }
  return fuera;
}

export type Recorrido = {
  /** atributo `d` del <path> */
  d: string;
  /** puntos del trazo final (cada ~24 px de arco) y su distancia acumulada */
  puntos: Punto[];
  largos: number[];
  total: number;
  /** fracción del trazo (0–1) donde queda cada ancla */
  fracciones: number[];
  /** estaciones a las que no se encontró ruta libre (se llegó por carril; `scripts/linea.mjs` lo reporta) */
  sinRuta: string[];
};

/** De las anclas medidas al trazo final, con su ondulación y sus tablas. */
export function recorrer(inicio: Punto, anclas: Ancla[], obstaculos: Caja[], angosto: boolean, mapa?: Mapa): Recorrido {
  const conjunto = new Set<Punto>(anclas);
  const sinRuta: string[] = [];
  const paso = puntosDePaso(inicio, anclas, obstaculos, angosto, angosto ? undefined : mapa, sinRuta);
  const { muestras: base, fijos } = remuestrear(paso, angosto ? 16 : 24, (p) =>
    conjunto.has(p as Ancla),
  );
  // Distancia (en muestras) a la ancla más cercana: ahí la ondulación se apaga y la línea pasa justo por el ancla.
  const cerca = fijos.map(() => Infinity);
  let ultima = -Infinity;
  for (let i = 0; i < fijos.length; i++) {
    if (fijos[i]) ultima = i;
    cerca[i] = i - ultima;
  }
  ultima = Infinity;
  for (let i = fijos.length - 1; i >= 0; i--) {
    if (fijos[i]) ultima = i;
    cerca[i] = Math.min(cerca[i]!, ultima - i);
  }
  // Ondulación a pulso: cada punto se corre por su normal; en las puntas y en las anclas se apaga.
  let s = 0;
  const puntos = base.map((q, i) => {
    if (i > 0) s += Math.hypot(q.x - base[i - 1]!.x, q.y - base[i - 1]!.y);
    const a = base[Math.max(0, i - 1)]!;
    const b = base[Math.min(base.length - 1, i + 1)]!;
    const l = Math.hypot(b.x - a.x, b.y - a.y) || 1;
    const apagado = Math.min(1, i / 3, (base.length - 1 - i) / 3, cerca[i]! / 2);
    const n = pulso(s) * apagado;
    return { x: q.x + (-(b.y - a.y) / l) * n, y: q.y + ((b.x - a.x) / l) * n };
  });
  const largos = [0];
  for (let i = 1; i < puntos.length; i++)
    largos.push(largos[i - 1]! + Math.hypot(puntos[i]!.x - puntos[i - 1]!.x, puntos[i]!.y - puntos[i - 1]!.y));
  const total = largos[largos.length - 1] || 1;
  const r = (n: number) => Math.round(n * 10) / 10;
  const d = cubicas(puntos)
    .map(([a, b, c, e], i) => `${i ? "" : `M${r(a.x)} ${r(a.y)}`}C${r(b.x)} ${r(b.y)} ${r(c.x)} ${r(c.y)} ${r(e.x)} ${r(e.y)}`)
    .join("");
  // Cada ancla, en orden: el punto más cercano a partir de donde quedó la anterior.
  let desde = 0;
  const fracciones = anclas.map((a) => {
    let mejor = desde;
    let dist = Infinity;
    for (let i = desde; i < puntos.length; i++) {
      const q = puntos[i]!;
      const dd = Math.hypot(q.x - a.x, q.y - a.y);
      if (dd < dist) {
        dist = dd;
        mejor = i;
      }
      // Ya se alejó mucho después de pasar cerca: no seguir buscando.
      if (dist < 12 && dd > 200) break;
    }
    desde = mejor;
    return largos[mejor]! / total;
  });
  return { d, puntos, largos, total, fracciones, sinRuta };
}

/** Medidas de la ventana para la tabla del scroll: alto visible, scroll máximo y dónde empieza el SVG. */
export type Vista = { alto: number; max: number; arriba: number };

/** Tabla del scroll al trazo. La chispa sigue una «línea de lectura» en la pantalla: al cargar está en la punta
 *  del subrayado, en la primera pantalla de scroll baja (o sube) al 55 % del alto, ahí se queda, y en la última
 *  pantalla baja hasta el final del pie. Los cruces de lado a lado ocupan un poco de scroll propio (12 % de su
 *  largo) para que la chispa no salte. Va de `desde` (fracción ya dibujada al cargar) a 1; devuelve pares
 *  [scroll 0–1, trazo 0–1] crecientes. */
export function tablaDeScroll(rec: Recorrido, desde: number, vista: Vista): { scroll: number[]; trazo: number[] } {
  const { puntos, largos, total } = rec;
  const primero = Math.max(0, largos.findIndex((l) => l / total >= desde - 1e-9));
  const max = Math.max(1, vista.max);
  const docY = (i: number) => puntos[i]!.y + vista.arriba;
  const r0 = docY(primero);
  const rFin = docY(puntos.length - 1) - max;
  const medio = vista.alto * 0.55;
  const suave = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
  /** dónde va la chispa en la pantalla con el scroll en `s` */
  const lectura = (s: number) => {
    if (max < 2 * vista.alto) return r0 + (rFin - r0) * (s / max);
    if (s < vista.alto) return r0 + (medio - r0) * suave(s / vista.alto);
    if (s > max - vista.alto) return medio + (rFin - medio) * suave((s - (max - vista.alto)) / vista.alto);
    return medio;
  };
  // f(s) = s + lectura(s) es creciente: se tabula y se invierte por búsqueda.
  const paso = 4;
  const n = Math.ceil(max / paso);
  const fs = Array.from({ length: n + 1 }, (_, k) => Math.min(k * paso, max) + lectura(Math.min(k * paso, max)));
  for (let k = 1; k <= n; k++) fs[k] = Math.max(fs[k]!, fs[k - 1]!);
  const scrollDeY = (y: number) => {
    if (y <= fs[0]!) return 0;
    if (y >= fs[n]!) return max;
    let lo = 0;
    let hi = n;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (fs[mid]! <= y) lo = mid;
      else hi = mid;
    }
    const f = fs[hi]! > fs[lo]! ? (y - fs[lo]!) / (fs[hi]! - fs[lo]!) : 0;
    return Math.min(max, (lo + f) * paso);
  };
  const scroll: number[] = [0];
  const trazo: number[] = [largos[primero]! / total];
  let yMax = r0;
  let s = 0;
  for (let i = primero + 1; i < puntos.length; i++) {
    yMax = Math.max(yMax, docY(i));
    s = Math.min(max, Math.max(scrollDeY(yMax), s + 0.12 * (largos[i]! - largos[i - 1]!)));
    scroll.push(s / max);
    trazo.push(largos[i]! / total);
  }
  scroll[scroll.length - 1] = 1;
  return { scroll, trazo };
}

/** Busca en la tabla (binaria) e interpola. */
export function leerTabla(t: number, tabla: { scroll: number[]; trazo: number[] }): number {
  const { scroll, trazo } = tabla;
  if (!scroll.length) return t;
  if (t <= 0) return trazo[0]!;
  if (t >= 1) return trazo[trazo.length - 1]!;
  let lo = 0;
  let hi = scroll.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (scroll[mid]! <= t) lo = mid;
    else hi = mid;
  }
  const a = scroll[lo]!;
  const b = scroll[hi]!;
  const f = b > a ? (t - a) / (b - a) : 1;
  return trazo[lo]! + (trazo[hi]! - trazo[lo]!) * f;
}
