// Geometría del plano: de los datos de una escena (escenas/<nombre>.ts) a posiciones en el SVG, para cada
// composición (`ancho` 12 × 6 y `alto` 4 × N) y cada idioma. Puro y sin dependencias: lo usan Plano (servidor),
// la línea de tiempo (cliente) y `node --test` (por eso aquí solo se importan TIPOS).
//
// - Nodos: caja de esquinas de 6 con su marcador por tipo y la etiqueta en mono; la nota va debajo de la caja.
//   La columna 1 se alinea a la izquierda y la última a la derecha (y entonces su conexión vertical sale del
//   marcador, como un riel); las demás van centradas en su columna.
// - Trazos: ruta ortogonal calculada desde la retícula, con esquinas redondeadas de 8. Trazos con el mismo `via`
//   comparten tramo y se ven como una sola línea.
// - Compuertas: en el tramo de su trazo que más trazos comparten; afectan a todo trazo que pase por ahí.
// - Etiquetas de compuerta, cotas y globos: se prueban lugares alrededor de su ancla y se queda el primero que no
//   se encima con nada.
import type { Accion, Celda, Escena, Nodo, Ruta, Texto } from "../../escenas/tipos";

export type Composicion = "ancho" | "alto";
export type Lengua = "es" | "en";
export type Caja = { x1: number; y1: number; x2: number; y2: number };
export type Punto = { x: number; y: number };

type Medidas = {
  W: number;
  /** tamaño de letra en unidades del viewBox */
  F: number;
  padX: number;
  padY: number;
  marcador: number;
  hueco: number;
  notaHueco: number;
  x0: number;
  pasoCol: number;
  ultimaCol: number;
  filaAlto: number;
  margen: number;
  radio: number;
  barra: number;
  globoCaracteres: number;
  /** a qué ancho real (px) se muestra como mínimo; con él se calcula la letra en pantalla */
  anchoMinimoPx: number;
};

// La letra mide F unidades. `ancho` se muestra con el contenedor ≥ 880 px: 16.5 × 880 / 1200 = 12.1 px.
// `alto` mide 360 de ancho y se muestra a 350–420 px: 13 × 350 / 360 = 12.6 px.
export const MEDIDAS: Record<Composicion, Medidas> = {
  ancho: {
    W: 1200,
    F: 16.5,
    padX: 11,
    padY: 9,
    marcador: 9,
    hueco: 8,
    notaHueco: 5,
    x0: 60,
    pasoCol: 98.18,
    ultimaCol: 12,
    filaAlto: 82,
    margen: 6,
    radio: 8,
    barra: 32,
    globoCaracteres: 24,
    anchoMinimoPx: 880,
  },
  alto: {
    W: 360,
    F: 13,
    padX: 8,
    padY: 7,
    marcador: 7,
    hueco: 6,
    notaHueco: 4,
    x0: 45,
    pasoCol: 90,
    ultimaCol: 4,
    filaAlto: 64,
    margen: 4,
    radio: 8,
    barra: 24,
    globoCaracteres: 18,
    anchoMinimoPx: 350,
  },
};

/** Ancho de contenedor (px) desde el que se muestra `ancho`. Va igual en plano.module.css. */
export const CORTE_ANCHO_PX = MEDIDAS.ancho.anchoMinimoPx;

// Avance de una letra mono (JetBrains Mono y ui-monospace: 0.6 em) y el espaciado de las mayúsculas (0.06 em).
const AVANCE = 0.6;
const TRACKING = 0.06;
export const anchoMayus = (texto: string, F: number) => texto.length * (AVANCE + TRACKING) * F;
export const anchoMinus = (texto: string, F: number) => texto.length * AVANCE * F;

export type NodoL = {
  id: string;
  tipo: Nodo["tipo"];
  ancla: "izq" | "centro" | "der";
  caja: Caja;
  /** caja + nota + palomita: lo que no se puede encimar */
  bloque: Caja;
  /** las mismas piezas por separado (para colocar etiquetas en los huecos) */
  partes: Caja[];
  /** y por donde sale o entra una conexión vertical por abajo */
  abajo: number;
  cy: number;
  /** x por donde entran y salen las conexiones verticales */
  vx: number;
  etiqueta: { x: number; y: number; texto: string };
  nota?: { x: number; y: number; texto: string; anchor: "start" | "middle" | "end" };
  marcador: Punto;
  marca: Punto & { r: number };
};

type Primitiva =
  | { tipo: "L"; a: Punto; b: Punto; largo: number }
  | { tipo: "A"; a: Punto; b: Punto; r: number; barrido: 0 | 1; largo: number };

export type TrazoL = {
  id: string;
  de: string;
  a: string;
  punteado: boolean;
  puntos: Punto[];
  primitivas: Primitiva[];
  d: string;
  largo: number;
  /** compuertas que cruza, con la fracción del largo donde está cada una */
  cortes: { compuerta: string; t: number }[];
};

export type CompuertaL = {
  id: string;
  en: string;
  punto: Punto;
  /** true si la barra cruza un tramo horizontal (barra vertical) */
  horizontal: boolean;
  caja: Caja;
  etiqueta: { x: number; y: number; texto: string; anchor: "start" | "middle" | "end"; caja: Caja };
};

export type CotaL = {
  id: string;
  caja: Caja;
  valor: { x: number; y: number; F: number };
  etiqueta: { x: number; y: number; texto: string };
  prefijo: string;
  sufijo: string;
  numero: number;
};

export type GloboL = {
  id: string;
  lado: "entra" | "sale";
  caja: Caja;
  lineas: { x: number; y: number; texto: string }[];
  /** contorno de la burbuja con su colita hacia el ancla */
  d: string;
};

export type Plano = {
  composicion: Composicion;
  idioma: Lengua;
  viewBox: [number, number, number, number];
  F: number;
  nodos: NodoL[];
  trazos: TrazoL[];
  compuertas: CompuertaL[];
  cotas: CotaL[];
  globos: GloboL[];
  /** encimados y salidas de cuadro que encontró al componer (vacío si todo cabe) */
  problemas: string[];
};

const caja = (x1: number, y1: number, x2: number, y2: number): Caja => ({ x1, y1, x2, y2 });
const seEnciman = (a: Caja, b: Caja, holgura = 0) =>
  a.x1 < b.x2 + holgura && b.x1 < a.x2 + holgura && a.y1 < b.y2 + holgura && b.y1 < a.y2 + holgura;
const union = (a: Caja, b: Caja): Caja => caja(Math.min(a.x1, b.x1), Math.min(a.y1, b.y1), Math.max(a.x2, b.x2), Math.max(a.y2, b.y2));
const inflar = (c: Caja, n: number): Caja => caja(c.x1 - n, c.y1 - n, c.x2 + n, c.y2 + n);
const r1 = (n: number) => Math.round(n * 10) / 10;

const xCol = (m: Medidas, c: number) => m.x0 + (c - 1) * m.pasoCol;
const yFila = (m: Medidas, f: number) => (f - 1) * m.filaAlto;

// ---------------------------------------------------------------- nodos

function componerNodo(n: Nodo, celda: Celda, m: Medidas, idioma: Lengua, conMarca: boolean, conNota: boolean): NodoL {
  const [col, fila] = celda;
  const etiqueta = n.etiqueta[idioma];
  const nota = conNota ? n.nota?.[idioma] : undefined;
  const w = m.padX + m.marcador + m.hueco + anchoMayus(etiqueta, m.F) + m.padX;
  const h = m.F + 2 * m.padY;
  const wNota = nota ? anchoMinus(nota, m.F) : 0;
  const ancla: NodoL["ancla"] = col <= 1 ? "izq" : col >= m.ultimaCol ? "der" : "centro";
  const cy = yFila(m, fila);
  const rMarca = m.F * 0.55;
  // A la derecha se deja lugar para la palomita (si la lleva), que asoma por la esquina.
  // Los de la última columna siempre la dejan, para que su riel vertical quede alineado.
  const limite = m.W - m.margen - (conMarca || ancla === "der" ? rMarca : 0);

  let x1: number;
  if (ancla === "izq") x1 = m.margen;
  else if (ancla === "der") x1 = limite - w;
  else {
    const cx = xCol(m, col);
    x1 = cx - w / 2;
    // Si la nota o la caja se salen, se recorre todo hacia adentro.
    const mitad = Math.max(w, wNota) / 2;
    const izquierda = cx - mitad;
    const derecha = cx + mitad;
    if (izquierda < m.margen) x1 += m.margen - izquierda;
    if (derecha > limite) x1 -= derecha - limite;
  }
  const c = caja(x1, cy - h / 2, x1 + w, cy + h / 2);
  const cx = (c.x1 + c.x2) / 2;
  const partes: Caja[] = [c];
  if (conMarca) partes.push(caja(c.x2 - rMarca, c.y1 - rMarca, c.x2 + rMarca, c.y1 + rMarca));
  let notaL: NodoL["nota"];
  if (nota) {
    const yBase = c.y2 + m.notaHueco + m.F * 0.9;
    const anchor = ancla === "izq" ? "start" : ancla === "der" ? "end" : "middle";
    // A los lados la nota deja libre el riel vertical (que sale junto al marcador) y se alinea con la etiqueta.
    const xn = anchor === "start" ? c.x1 + m.padX + m.marcador + m.hueco : anchor === "end" ? c.x2 - m.padX - m.marcador - m.hueco : cx;
    const nx1 = anchor === "start" ? xn : anchor === "end" ? xn - wNota : xn - wNota / 2;
    notaL = { x: r1(xn), y: r1(yBase), texto: nota, anchor };
    partes.push(caja(nx1, c.y2, nx1 + wNota, c.y2 + m.notaHueco + m.F * 1.2));
  }
  const bloque = partes.reduce(union);
  // Por abajo, los de los lados salen de la caja (el riel no pasa por la nota); los centrados, debajo de la nota.
  const abajo = ancla === "centro" ? bloque.y2 : c.y2;
  const marcador = { x: c.x1 + m.padX + m.marcador / 2, y: cy };
  const vx = ancla === "izq" ? marcador.x : ancla === "der" ? c.x2 - m.padX - m.marcador / 2 : cx;
  return {
    id: n.id,
    tipo: n.tipo,
    ancla,
    caja: c,
    bloque,
    partes,
    abajo,
    cy,
    vx,
    etiqueta: { x: r1(c.x1 + m.padX + m.marcador + m.hueco), y: r1(cy + m.F * 0.36), texto: etiqueta },
    nota: notaL,
    marcador,
    marca: { x: c.x2, y: c.y1, r: rMarca },
  };
}

// ---------------------------------------------------------------- trazos

function rutaDe(A: NodoL, B: NodoL, ruta: Ruta | undefined, comp: Composicion, m: Medidas): Punto[] {
  const forma = ruta?.forma ?? (comp === "ancho" ? "hvh" : "vhv");
  const lado = (N: NodoL, haciaX: number): Punto => ({ x: haciaX > (N.caja.x1 + N.caja.x2) / 2 ? N.caja.x2 : N.caja.x1, y: N.cy });
  const vertical = (N: NodoL, haciaY: number): Punto => ({ x: N.vx, y: haciaY > N.cy ? N.abajo : N.caja.y1 });
  const cxA = (A.caja.x1 + A.caja.x2) / 2;
  const cxB = (B.caja.x1 + B.caja.x2) / 2;

  // Extremos alineados: recta.
  if (Math.abs(A.cy - B.cy) < 0.5 && (forma === "hvh" || forma === "hv" || forma === "vh" || forma === "vhv")) {
    const enMismaFila = A.caja.x2 <= B.caja.x1 || B.caja.x2 <= A.caja.x1;
    if (enMismaFila) return [lado(A, cxB), lado(B, cxA)];
  }
  if (Math.abs(A.vx - B.vx) < 0.5 && (forma === "vhv" || forma === "vh" || forma === "hv" || forma === "hvh")) {
    const unoSobreOtro = A.abajo <= B.caja.y1 || B.abajo <= A.caja.y1;
    if (unoSobreOtro) return [vertical(A, B.cy), vertical(B, A.cy)];
  }

  if (forma === "hvh") {
    const p0 = lado(A, cxB);
    const p3 = lado(B, cxA);
    const x = ruta?.via !== undefined ? xCol(m, ruta.via) : (p0.x + p3.x) / 2;
    return [p0, { x, y: p0.y }, { x, y: p3.y }, p3];
  }
  if (forma === "vhv") {
    const p0 = vertical(A, B.cy);
    const p3 = vertical(B, A.cy);
    const y = ruta?.via !== undefined ? yFila(m, ruta.via) : (p0.y + p3.y) / 2;
    return [p0, { x: p0.x, y }, { x: p3.x, y }, p3];
  }
  if (forma === "hv") {
    const p0 = lado(A, B.vx);
    const p2 = vertical(B, A.cy);
    return [p0, { x: p2.x, y: p0.y }, p2];
  }
  // vh
  const p0 = vertical(A, B.cy);
  const p2 = lado(B, A.vx);
  return [p0, { x: p0.x, y: p2.y }, p2];
}

/** Quita puntos repetidos y los que quedan en medio de una recta. */
function limpiar(puntos: Punto[]): Punto[] {
  const sinRepetir = puntos.filter((p, i) => i === 0 || Math.hypot(p.x - puntos[i - 1]!.x, p.y - puntos[i - 1]!.y) > 0.01);
  return sinRepetir.filter((p, i, arr) => {
    if (i === 0 || i === arr.length - 1) return true;
    const a = arr[i - 1]!;
    const b = arr[i + 1]!;
    return Math.abs((p.x - a.x) * (b.y - p.y) - (p.y - a.y) * (b.x - p.x)) > 0.01;
  });
}

function trazar(puntos: Punto[], radio: number): { primitivas: Primitiva[]; d: string; largo: number } {
  const primitivas: Primitiva[] = [];
  let actual = puntos[0]!;
  for (let i = 1; i < puntos.length; i++) {
    const esquina = puntos[i]!;
    const siguiente = puntos[i + 1];
    if (!siguiente) {
      primitivas.push({ tipo: "L", a: actual, b: esquina, largo: Math.hypot(esquina.x - actual.x, esquina.y - actual.y) });
      break;
    }
    const l1 = Math.hypot(esquina.x - puntos[i - 1]!.x, esquina.y - puntos[i - 1]!.y);
    const l2 = Math.hypot(siguiente.x - esquina.x, siguiente.y - esquina.y);
    const r = Math.min(radio, l1 / 2, l2 / 2);
    const d1 = { x: (esquina.x - puntos[i - 1]!.x) / l1, y: (esquina.y - puntos[i - 1]!.y) / l1 };
    const d2 = { x: (siguiente.x - esquina.x) / l2, y: (siguiente.y - esquina.y) / l2 };
    const antes = { x: esquina.x - d1.x * r, y: esquina.y - d1.y * r };
    const despues = { x: esquina.x + d2.x * r, y: esquina.y + d2.y * r };
    primitivas.push({ tipo: "L", a: actual, b: antes, largo: Math.hypot(antes.x - actual.x, antes.y - actual.y) });
    const cruz = d1.x * d2.y - d1.y * d2.x;
    primitivas.push({ tipo: "A", a: antes, b: despues, r, barrido: cruz > 0 ? 1 : 0, largo: (Math.PI * r) / 2 });
    actual = despues;
  }
  const f = (p: Punto) => `${r1(p.x)} ${r1(p.y)}`;
  let d = `M${f(puntos[0]!)}`;
  for (const p of primitivas) d += p.tipo === "L" ? ` L${f(p.b)}` : ` A${r1(p.r)} ${r1(p.r)} 0 0 ${p.barrido} ${f(p.b)}`;
  return { primitivas, d, largo: primitivas.reduce((s, p) => s + p.largo, 0) };
}

const enTramo = (p: Punto, a: Punto, b: Punto, tol = 0.6) =>
  Math.abs((b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x)) / Math.max(Math.hypot(b.x - a.x, b.y - a.y), 1e-9) < tol &&
  p.x >= Math.min(a.x, b.x) - tol &&
  p.x <= Math.max(a.x, b.x) + tol &&
  p.y >= Math.min(a.y, b.y) - tol &&
  p.y <= Math.max(a.y, b.y) + tol;

/** Largo recorrido hasta `p` si está en un tramo recto del trazo; null si no pasa por ahí. */
function largoHasta(t: Pick<TrazoL, "primitivas">, p: Punto): number | null {
  let s = 0;
  for (const pr of t.primitivas) {
    if (pr.tipo === "L" && enTramo(p, pr.a, pr.b)) return s + Math.hypot(p.x - pr.a.x, p.y - pr.a.y);
    s += pr.largo;
  }
  return null;
}

// ---------------------------------------------------------------- colocación de etiquetas, cotas y globos

type Lugar = "arriba" | "abajo" | "derecha" | "izquierda";

function candidatos(ancla: Caja, w: number, h: number, orden: Lugar[], hueco: number): Caja[] {
  const cx = (ancla.x1 + ancla.x2) / 2;
  const cy = (ancla.y1 + ancla.y2) / 2;
  const lista: Caja[] = [];
  for (const lugar of orden) {
    if (lugar === "arriba" || lugar === "abajo") {
      const y1 = lugar === "arriba" ? ancla.y1 - hueco - h : ancla.y2 + hueco;
      for (const x1 of [cx - w / 2, ancla.x1, ancla.x2 - w]) lista.push(caja(x1, y1, x1 + w, y1 + h));
    } else {
      const x1 = lugar === "derecha" ? ancla.x2 + hueco : ancla.x1 - hueco - w;
      for (const y1 of [cy - h / 2, ancla.y1, ancla.y2 - h]) lista.push(caja(x1, y1, x1 + w, y1 + h));
    }
  }
  return lista;
}

class Ocupado {
  cajas: { caja: Caja; quien: string }[] = [];
  tramos: { a: Punto; b: Punto; quien: string }[] = [];
  m: Medidas;
  constructor(m: Medidas) {
    this.m = m;
  }
  libre(c: Caja, ignorar: string[] = [], holgura = 4): boolean {
    if (c.x1 < this.m.margen - 0.01 || c.x2 > this.m.W - this.m.margen + 0.01) return false;
    for (const o of this.cajas) if (!ignorar.includes(o.quien) && seEnciman(c, o.caja, holgura)) return false;
    for (const t of this.tramos) if (!ignorar.includes(t.quien) && tramoCruzaCaja(t.a, t.b, inflar(c, holgura))) return false;
    return true;
  }
  colocar(ancla: Caja, w: number, h: number, orden: Lugar[], hueco: number, quien: string, ignorar: string[] = [], holgura = 4) {
    const lista = candidatos(ancla, w, h, orden, hueco);
    const libre = lista.find((c) => this.libre(c, ignorar, holgura));
    const elegida = libre ?? lista[0]!;
    this.cajas.push({ caja: elegida, quien });
    return { caja: elegida, ok: Boolean(libre) };
  }
}

function tramoCruzaCaja(a: Punto, b: Punto, c: Caja): boolean {
  // Los tramos son horizontales o verticales.
  const x1 = Math.min(a.x, b.x);
  const x2 = Math.max(a.x, b.x);
  const y1 = Math.min(a.y, b.y);
  const y2 = Math.max(a.y, b.y);
  return x1 < c.x2 && x2 > c.x1 && y1 < c.y2 && y2 > c.y1;
}

/** Envuelve un texto en líneas de hasta `max` caracteres, por palabras. */
export function envolver(texto: string, max: number): string[] {
  const lineas: string[] = [];
  let linea = "";
  for (const palabra of texto.split(/\s+/)) {
    if (!linea) linea = palabra;
    else if ((linea + " " + palabra).length <= max) linea += " " + palabra;
    else {
      lineas.push(linea);
      linea = palabra;
    }
  }
  if (linea) lineas.push(linea);
  return lineas;
}

export const formatoCota = (n: number, idioma: Lengua) => n.toLocaleString(idioma === "es" ? "es-MX" : "en-US");

// ---------------------------------------------------------------- estado final (lo que queda al terminar)

export const lista = (x: string | string[]) => (Array.isArray(x) ? x : [x]);

export type EstadoFinal = {
  marcas: Record<string, "hecho" | "alto">;
  compuertas: Record<string, "abre" | "detiene">;
};

export function estadoFinal(escena: Escena): EstadoFinal {
  const marcas: EstadoFinal["marcas"] = {};
  const compuertas: EstadoFinal["compuertas"] = {};
  for (const paso of escena.pasos)
    for (const a of paso.acciones) {
      if ("marca" in a) marcas[a.marca] = a.como;
      if ("compuerta" in a) compuertas[a.compuerta] = a.estado;
    }
  return { marcas, compuertas };
}

// ---------------------------------------------------------------- composición completa

/** `notas: false` es el modo mini: sin notas, y las conexiones verticales salen de la caja. */
export function componer(escena: Escena, composicion: Composicion, idioma: Lengua, { notas = true }: { notas?: boolean } = {}): Plano {
  const m = MEDIDAS[composicion];
  const problemas: string[] = [];
  const { marcas } = estadoFinal(escena);
  const conMarca = new Set(escena.pasos.flatMap((p) => p.acciones.flatMap((a) => ("marca" in a ? [a.marca] : []))));
  void marcas;
  const nodos = escena.nodos.map((n) => componerNodo(n, n[composicion], m, idioma, conMarca.has(n.id), notas));
  const porId = new Map(nodos.map((n) => [n.id, n]));

  // Nodos que se enciman o se salen.
  for (let i = 0; i < nodos.length; i++) {
    const a = nodos[i]!;
    if (a.bloque.x1 < 0 || a.bloque.x2 > m.W) problemas.push(`${composicion}/${idioma}: el nodo «${a.id}» se sale del cuadro`);
    for (let j = i + 1; j < nodos.length; j++) {
      const b = nodos[j]!;
      if (seEnciman(a.bloque, b.bloque, 6)) problemas.push(`${composicion}/${idioma}: los nodos «${a.id}» y «${b.id}» se enciman`);
    }
  }

  const trazos: TrazoL[] = [];
  for (const t of escena.trazos) {
    const A = porId.get(t.de);
    const B = porId.get(t.a);
    if (!A || !B) continue;
    const puntos = limpiar(rutaDe(A, B, t[composicion], composicion, m));
    const { primitivas, d, largo } = trazar(puntos, m.radio);
    trazos.push({ id: t.id, de: t.de, a: t.a, punteado: Boolean(t.punteado), puntos, primitivas, d, largo, cortes: [] });
    // Un trazo no cruza nodos que no son sus extremos.
    for (let k = 1; k < puntos.length; k++)
      for (const n of nodos)
        if (n.id !== t.de && n.id !== t.a && tramoCruzaCaja(puntos[k - 1]!, puntos[k]!, inflar(n.bloque, 2)))
          problemas.push(`${composicion}/${idioma}: el trazo «${t.id}» cruza el nodo «${n.id}»`);
    if (largo < 24) problemas.push(`${composicion}/${idioma}: el trazo «${t.id}» es demasiado corto (${Math.round(largo)})`);
  }

  const ocupado = new Ocupado(m);
  for (const n of nodos) for (const parte of n.partes) ocupado.cajas.push({ caja: parte, quien: n.id });
  for (const t of trazos) for (let k = 1; k < t.puntos.length; k++) ocupado.tramos.push({ a: t.puntos[k - 1]!, b: t.puntos[k]!, quien: t.id });

  // Compuertas: en el tramo recto de su trazo que comparten más trazos (el más largo si empatan).
  const compuertas: CompuertaL[] = [];
  for (const c of escena.compuertas ?? []) {
    const t = trazos.find((x) => x.id === c.en);
    if (!t) continue;
    let mejor: { punto: Punto; cuenta: number; largo: number; horizontal: boolean } | null = null;
    for (const pr of t.primitivas) {
      if (pr.tipo !== "L" || pr.largo < 12) continue;
      const horizontal = Math.abs(pr.a.y - pr.b.y) < 0.01;
      // corridas de igual cuenta a lo largo del tramo
      const pasos = Math.max(2, Math.floor(pr.largo / 2));
      let inicio = 0;
      let cuentaPrevia = -1;
      for (let k = 0; k <= pasos; k++) {
        const f = k / pasos;
        const p = { x: pr.a.x + (pr.b.x - pr.a.x) * f, y: pr.a.y + (pr.b.y - pr.a.y) * f };
        const cuenta = k === pasos ? -2 : trazos.filter((o) => o.primitivas.some((q) => q.tipo === "L" && enTramo(p, q.a, q.b, 0.3))).length;
        if (cuenta !== cuentaPrevia) {
          if (cuentaPrevia > 0) {
            const largo = ((k - inicio) / pasos) * pr.largo;
            const fm = (inicio + k - 1) / 2 / pasos;
            const pm = { x: pr.a.x + (pr.b.x - pr.a.x) * fm, y: pr.a.y + (pr.b.y - pr.a.y) * fm };
            if (!mejor || cuentaPrevia > mejor.cuenta || (cuentaPrevia === mejor.cuenta && largo > mejor.largo))
              mejor = { punto: pm, cuenta: cuentaPrevia, largo, horizontal };
          }
          inicio = k;
          cuentaPrevia = cuenta;
        }
      }
    }
    if (!mejor) {
      problemas.push(`${composicion}/${idioma}: la compuerta «${c.id}» no tiene dónde ir`);
      continue;
    }
    const { punto, horizontal } = mejor;
    const media = m.barra / 2;
    const barra = horizontal ? caja(punto.x - 2, punto.y - media, punto.x + 2, punto.y + media) : caja(punto.x - media, punto.y - 2, punto.x + media, punto.y + 2);
    ocupado.cajas.push({ caja: barra, quien: `compuerta:${c.id}` });
    const texto = c.etiqueta[idioma];
    const w = anchoMayus(texto, m.F);
    const h = m.F * 1.15;
    const orden: Lugar[] = horizontal ? ["arriba", "abajo", "derecha", "izquierda"] : ["derecha", "izquierda", "arriba", "abajo"];
    const { caja: lugar, ok } = ocupado.colocar(barra, w, h, orden, 4, `etiqueta:${c.id}`, [c.en], 2);
    if (!ok) problemas.push(`${composicion}/${idioma}: la etiqueta de la compuerta «${c.id}» no cabe sin encimarse`);
    compuertas.push({
      id: c.id,
      en: c.en,
      punto,
      horizontal,
      caja: barra,
      etiqueta: { x: r1(lugar.x1), y: r1(lugar.y1 + m.F * 0.85), texto, anchor: "start", caja: lugar },
    });
    for (const o of trazos) {
      const s = largoHasta(o, punto);
      if (s !== null) o.cortes.push({ compuerta: c.id, t: s / o.largo });
    }
  }

  // Cotas: número grande en mono y su etiqueta debajo.
  const cotas: CotaL[] = [];
  const Fv = m.F * 1.45;
  for (const c of escena.cotas ?? []) {
    const anclaNodo = porId.get(c.junto);
    const anclaCompuerta = compuertas.find((x) => x.id === c.junto);
    const ancla = anclaNodo?.bloque ?? (anclaCompuerta ? union(anclaCompuerta.caja, anclaCompuerta.etiqueta.caja) : null);
    if (!ancla) continue;
    const valor = `${c.prefijo ?? ""}${formatoCota(c.valor, idioma)}${c.sufijo ?? ""}`;
    const texto = c.etiqueta[idioma];
    const w = Math.max(anchoMinus(valor, Fv), anchoMinus(texto, m.F));
    const h = Fv * 1.05 + m.F * 1.25;
    const orden: Lugar[] = ["abajo", "derecha", "arriba", "izquierda"];
    const ignorar = anclaCompuerta ? [anclaCompuerta.en] : [];
    const { caja: lugar, ok } = ocupado.colocar(ancla, w, h, orden, 10, `cota:${c.id}`, ignorar);
    if (!ok) problemas.push(`${composicion}/${idioma}: la cota «${c.id}» no cabe sin encimarse`);
    cotas.push({
      id: c.id,
      caja: lugar,
      valor: { x: r1(lugar.x1), y: r1(lugar.y1 + Fv * 0.85), F: r1(Fv) },
      etiqueta: { x: r1(lugar.x1), y: r1(lugar.y1 + Fv * 1.05 + m.F * 0.95), texto },
      prefijo: c.prefijo ?? "",
      sufijo: c.sufijo ?? "",
      numero: c.valor,
    });
  }

  // Globos: burbuja con colita hacia el nodo.
  const globos: GloboL[] = [];
  for (const g of escena.globos ?? []) {
    const n = porId.get(g.junto);
    if (!n) continue;
    const lineas = envolver(g.texto[idioma], m.globoCaracteres);
    const pad = m.F * 0.7;
    const alto = m.F * 1.3;
    const w = Math.max(...lineas.map((l) => anchoMinus(l, m.F))) + 2 * pad;
    const h = lineas.length * alto + 2 * pad - (alto - m.F);
    const orden: Lugar[] = g.lado === "entra" ? ["arriba", "derecha", "abajo", "izquierda"] : ["abajo", "derecha", "arriba", "izquierda"];
    const { caja: c, ok } = ocupado.colocar(n.bloque, w, h, orden, 14, `globo:${g.id}`);
    if (!ok) problemas.push(`${composicion}/${idioma}: el globo «${g.id}» no cabe sin encimarse`);
    globos.push({
      id: g.id,
      lado: g.lado,
      caja: c,
      lineas: lineas.map((texto, i) => ({ x: r1(c.x1 + pad), y: r1(c.y1 + pad + m.F * 0.82 + i * alto), texto })),
      d: contornoGlobo(c, n.caja, 8),
    });
  }

  // viewBox: todo el ancho y el alto que ocupe el contenido.
  let todo = nodos.reduce((acc, n) => union(acc, n.bloque), nodos[0]?.bloque ?? caja(0, 0, m.W, 0));
  for (const t of trazos) for (const p of t.puntos) todo = union(todo, caja(p.x, p.y, p.x, p.y));
  for (const c of compuertas) todo = union(union(todo, c.caja), c.etiqueta.caja);
  for (const c of cotas) todo = union(todo, c.caja);
  for (const g of globos) todo = union(todo, g.caja);
  const y0 = Math.floor(todo.y1 - 12);
  const alto = Math.ceil(todo.y2 + 12) - y0;

  return { composicion, idioma, viewBox: [0, y0, m.W, alto], F: m.F, nodos, trazos, compuertas, cotas, globos, problemas };
}

/** Rectángulo redondeado con una colita de 8 que apunta al nodo. */
function contornoGlobo(c: Caja, ancla: Caja, r: number): string {
  const f = (x: number, y: number) => `${r1(x)} ${r1(y)}`;
  const cola = 8;
  const debajo = c.y1 >= ancla.y2;
  const encima = c.y2 <= ancla.y1;
  const aLaDerecha = c.x1 >= ancla.x2;
  const objetivoX = Math.min(Math.max((ancla.x1 + ancla.x2) / 2, c.x1 + r + cola), c.x2 - r - cola);
  const objetivoY = Math.min(Math.max((ancla.y1 + ancla.y2) / 2, c.y1 + r + cola), c.y2 - r - cola);
  let d = `M${f(c.x1 + r, c.y1)}`;
  if (debajo) d += ` L${f(objetivoX - cola, c.y1)} L${f(objetivoX, c.y1 - cola)} L${f(objetivoX + cola, c.y1)}`;
  d += ` L${f(c.x2 - r, c.y1)} A${r} ${r} 0 0 1 ${f(c.x2, c.y1 + r)}`;
  if (!debajo && !encima && !aLaDerecha) d += ` L${f(c.x2, objetivoY - cola)} L${f(c.x2 + cola, objetivoY)} L${f(c.x2, objetivoY + cola)}`;
  d += ` L${f(c.x2, c.y2 - r)} A${r} ${r} 0 0 1 ${f(c.x2 - r, c.y2)}`;
  if (encima) d += ` L${f(objetivoX + cola, c.y2)} L${f(objetivoX, c.y2 + cola)} L${f(objetivoX - cola, c.y2)}`;
  d += ` L${f(c.x1 + r, c.y2)} A${r} ${r} 0 0 1 ${f(c.x1, c.y2 - r)}`;
  if (aLaDerecha && !debajo && !encima) d += ` L${f(c.x1, objetivoY + cola)} L${f(c.x1 - cola, objetivoY)} L${f(c.x1, objetivoY - cola)}`;
  d += ` L${f(c.x1, c.y1 + r)} A${r} ${r} 0 0 1 ${f(c.x1 + r, c.y1)} Z`;
  return d;
}

// ---------------------------------------------------------------- validación (pruebas y build)

const ID_TEXTOS: [keyof typeof TOPES_LOCALES, (e: Escena) => [string, Texto | undefined][]][] = [
  ["etiqueta", (e) => e.nodos.map((n) => [`nodo ${n.id}`, n.etiqueta])],
  ["nota", (e) => e.nodos.map((n) => [`nota de ${n.id}`, n.nota])],
  ["globo", (e) => (e.globos ?? []).map((g) => [`globo ${g.id}`, g.texto])],
  ["compuerta", (e) => (e.compuertas ?? []).map((c) => [`compuerta ${c.id}`, c.etiqueta])],
  ["cota", (e) => (e.cotas ?? []).map((c) => [`cota ${c.id}`, c.etiqueta])],
];
// Copia de TOPES (escenas/tipos.ts) para no importar valores desde aquí.
const TOPES_LOCALES = { etiqueta: 18, nota: 26, globo: 60, compuerta: 18, cota: 26 } as const;

/** Errores de datos de una escena (referencias, topes, que todo se active) y de composición (encimados). */
export function validarEscena(e: Escena): string[] {
  const errores: string[] = [];
  const nodos = new Set(e.nodos.map((n) => n.id));
  const trazos = new Set(e.trazos.map((t) => t.id));
  const compuertas = new Set((e.compuertas ?? []).map((c) => c.id));
  const cotas = new Set((e.cotas ?? []).map((c) => c.id));
  const globos = new Set((e.globos ?? []).map((g) => g.id));
  const todos = [...e.nodos.map((n) => n.id), ...e.trazos.map((t) => t.id), ...compuertas, ...cotas, ...globos];
  const repetido = todos.find((id, i) => todos.indexOf(id) !== i);
  if (repetido) errores.push(`id repetido «${repetido}»`);

  for (const t of e.trazos) {
    if (!nodos.has(t.de)) errores.push(`el trazo «${t.id}» sale de «${t.de}», que no existe`);
    if (!nodos.has(t.a)) errores.push(`el trazo «${t.id}» llega a «${t.a}», que no existe`);
  }
  for (const c of e.compuertas ?? []) if (!trazos.has(c.en)) errores.push(`la compuerta «${c.id}» va en «${c.en}», que no es un trazo`);
  for (const c of e.cotas ?? [])
    if (!nodos.has(c.junto) && !compuertas.has(c.junto)) errores.push(`la cota «${c.id}» va junto a «${c.junto}», que no existe`);
  for (const g of e.globos ?? []) if (!nodos.has(g.junto)) errores.push(`el globo «${g.id}» va junto a «${g.junto}», que no es un nodo`);

  for (const [tope, sacar] of ID_TEXTOS)
    for (const [donde, texto] of sacar(e))
      for (const idioma of ["es", "en"] as const) {
        const s = texto?.[idioma];
        if (texto && !s?.trim()) errores.push(`${donde}: falta el texto en ${idioma}`);
        if (s && s.length > TOPES_LOCALES[tope]) errores.push(`${donde} (${idioma}) pasa el tope de ${TOPES_LOCALES[tope]}: «${s}»`);
      }

  // Cada acción apunta a algo que existe, y todo lo dibujado en el estado final se activa en algún paso.
  const usados = { nodos: new Set<string>(), trazos: new Set<string>(), compuertas: new Set<string>(), cotas: new Set<string>(), globos: new Set<string>() };
  const pide = (conjunto: Set<string>, usado: Set<string>, id: string, que: string) => {
    if (!conjunto.has(id)) errores.push(`una acción usa ${que} «${id}», que no existe`);
    usado.add(id);
  };
  const dibujados = new Set<string>();
  e.pasos.forEach((paso, i) => {
    if (!paso.acciones.length) errores.push(`el paso ${i + 1} no tiene acciones`);
    for (const a of paso.acciones as Accion[]) {
      if ("dibuja" in a)
        for (const id of lista(a.dibuja)) {
          pide(trazos, usados.trazos, id, "el trazo");
          dibujados.add(id);
        }
      else if ("enciende" in a) for (const id of lista(a.enciende)) pide(nodos, usados.nodos, id, "el nodo");
      else if ("pulso" in a || "pulsos" in a)
        for (const id of "pulso" in a ? [a.pulso] : a.pulsos) {
          if (!trazos.has(id)) errores.push(`una acción usa el trazo «${id}», que no existe`);
          else if (!dibujados.has(id)) errores.push(`un pulso viaja por «${id}» antes de dibujarlo`);
        }
      else if ("compuerta" in a) pide(compuertas, usados.compuertas, a.compuerta, "la compuerta");
      else if ("cuenta" in a) pide(cotas, usados.cotas, a.cuenta, "la cota");
      else if ("globo" in a) pide(globos, usados.globos, a.globo, "el globo");
      else if ("marca" in a) pide(nodos, usados.nodos, a.marca, "el nodo");
      else if ("espera" in a && !(a.espera > 0)) errores.push(`una espera debe ser mayor que 0`);
    }
  });
  for (const id of nodos) if (!usados.nodos.has(id)) errores.push(`el nodo «${id}» nunca se enciende ni se marca`);
  for (const id of trazos) if (!usados.trazos.has(id)) errores.push(`el trazo «${id}» nunca se dibuja`);
  for (const id of cotas) if (!usados.cotas.has(id)) errores.push(`la cota «${id}» nunca cuenta`);
  for (const id of globos) if (!usados.globos.has(id)) errores.push(`el globo «${id}» nunca aparece`);

  // Composición: si las referencias están bien, que nada se encime en ninguna composición ni idioma.
  if (!errores.length)
    for (const comp of ["ancho", "alto"] as const)
      for (const idioma of ["es", "en"] as const)
        for (const notas of [true, false]) errores.push(...componer(e, comp, idioma, { notas }).problemas.map((x) => (notas ? x : `mini ${x}`)));
  return errores;
}
