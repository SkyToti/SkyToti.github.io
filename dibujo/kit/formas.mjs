// Geometría limpia: formas con nombre, sin estilo. Todo en coordenadas absolutas (comandos M L C Q Z en
// mayúscula), así una parte se puede mover, girar, escalar o reflejar con `colocar` sin perder nada.
//
// Una pieza:  { tipo, ...forma, linea?, tinta?, rol?, trama?, anim?, capa?, entra?, punteado? }
//   linea:  'ext' (contorno exterior, 3.25) · 'int' (formas interiores, 2.25) · 'fino' (detalle, 1.5) · sin = no se traza
//   tinta:  color del trazo (clave de la paleta; por defecto 'hueso')
//   rol:    relleno plano desfasado (estilo.mjs decide color y registro)
//   trama:  relleno de puntos (SOLO luz y sombra): 'ambar' | 'cielo' | 'sombra' | 'hueso'
//   anim:   nombre del ancla que lo mueve (ojoIzq, oreja, cola…): se envuelve en <g data-anim>
//   capa:   'luz' (debajo de todo) | 'arriba' (encima; sigue visible con la lámpara apagada)
//   entra:  'fade' → aparece con opacidad en vez de trazarse

export const L = (a, b, x = {}) => ({ tipo: 'linea', a, b, ...x });
export const PL = (pts, x = {}) => ({ tipo: 'polilinea', pts, ...x });
export const PG = (pts, x = {}) => ({ tipo: 'poligono', pts, ...x });
export const R = (x0, y0, w, h, x = {}) => ({ tipo: 'poligono', pts: [[x0, y0], [x0 + w, y0], [x0 + w, y0 + h], [x0, y0 + h]], ...x });
export const E = (c, rx, ry, x = {}) => ({ tipo: 'elipse', c, rx, ry, ...x });
export const P = (d, x = {}) => ({ tipo: 'camino', d, ...x });
export const T = (texto, x, y, o = {}) => ({ tipo: 'texto', texto, x, y, ...o });

/** rectángulo de esquinas redondeadas como camino */
export function RR(x, y, w, h, r, extra = {}) {
  const k = r * 0.45;
  return P(`M ${x + r} ${y} L ${x + w - r} ${y} C ${x + w - k} ${y} ${x + w} ${y + k} ${x + w} ${y + r} L ${x + w} ${y + h - r} C ${x + w} ${y + h - k} ${x + w - k} ${y + h} ${x + w - r} ${y + h} L ${x + r} ${y + h} C ${x + k} ${y + h} ${x} ${y + h - k} ${x} ${y + h - r} L ${x} ${y + r} C ${x} ${y + k} ${x + k} ${y} ${x + r} ${y} Z`, extra);
}

// ── matrices afines [a b c d e f]: x' = a·x + c·y + e ; y' = b·x + d·y + f ──
export const M0 = [1, 0, 0, 1, 0, 0];
export const mult = (m, n) => [
  m[0] * n[0] + m[2] * n[1], m[1] * n[0] + m[3] * n[1],
  m[0] * n[2] + m[2] * n[3], m[1] * n[2] + m[3] * n[3],
  m[0] * n[4] + m[2] * n[5] + m[4], m[1] * n[4] + m[3] * n[5] + m[5],
];
export const tras = (x, y) => [1, 0, 0, 1, x, y];
export const esc = (sx, sy = sx) => [sx, 0, 0, sy, 0, 0];
export function rot(grados, [cx, cy] = [0, 0]) {
  const r = (grados * Math.PI) / 180, c = Math.cos(r), s = Math.sin(r);
  return mult(tras(cx, cy), mult([c, s, -s, c, 0, 0], tras(-cx, -cy)));
}
export const aplicar = (m, [x, y]) => [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];

const K = 0.5523;
function elipseCamino({ c: [cx, cy], rx, ry }) {
  return `M ${cx + rx} ${cy} C ${cx + rx} ${cy + ry * K} ${cx + rx * K} ${cy + ry} ${cx} ${cy + ry} C ${cx - rx * K} ${cy + ry} ${cx - rx} ${cy + ry * K} ${cx - rx} ${cy} C ${cx - rx} ${cy - ry * K} ${cx - rx * K} ${cy - ry} ${cx} ${cy - ry} C ${cx + rx * K} ${cy - ry} ${cx + rx} ${cy - ry * K} ${cx + rx} ${cy} Z`;
}

function caminoT(d, m) {
  return d.replace(/(-?\d*\.?\d+(?:e-?\d+)?)[\s,]+(-?\d*\.?\d+(?:e-?\d+)?)/g, (_, x, y) => {
    const [a, b] = aplicar(m, [+x, +y]);
    return `${a.toFixed(2)} ${b.toFixed(2)}`;
  });
}

/** transforma una pieza con la matriz m (las elipses giradas o deformadas pasan a camino) */
export function transformar(p, m) {
  const q = { ...p };
  const s = Math.sqrt(Math.abs(m[0] * m[3] - m[1] * m[2]));
  switch (p.tipo) {
    case 'linea': q.a = aplicar(m, p.a); q.b = aplicar(m, p.b); break;
    case 'polilinea': case 'poligono': q.pts = p.pts.map((pt) => aplicar(m, pt)); break;
    case 'camino': q.d = caminoT(p.d, m); break;
    case 'elipse':
      if (Math.abs(m[1]) < 1e-9 && Math.abs(m[2]) < 1e-9) { q.c = aplicar(m, p.c); q.rx = p.rx * Math.abs(m[0]); q.ry = p.ry * Math.abs(m[3]); }
      else { q.tipo = 'camino'; q.d = caminoT(elipseCamino(p), m); delete q.c; delete q.rx; delete q.ry; }
      break;
    case 'texto': { const [x, y] = aplicar(m, [p.x, p.y]); q.x = x; q.y = y; q.tam = (p.tam || 18) * s; break; }
  }
  return q;
}

/** coloca un conjunto { piezas, anclas } con [x, y, escala, giro°, espejo] */
export function matriz({ x = 0, y = 0, s = 1, giro = 0, espejo = false } = {}) {
  return mult(tras(x, y), mult(rot(giro), esc(espejo ? -s : s, s)));
}
export function colocar(parte, o) {
  const m = Array.isArray(o) ? o : matriz(o);
  const anclas = Object.fromEntries(Object.entries(parte.anclas || {}).map(([k, v]) => [k, aplicar(m, v)]));
  return { ...parte, piezas: parte.piezas.map((p) => transformar(p, m)), anclas };
}

/** refleja en x (espejo) una pieza: útil para pares izquierda/derecha */
export const espejo = (p) => transformar(p, esc(-1, 1));
export const par = (p) => [p, espejo(p)];

// ── curvas y tubos (patas, colas): una línea central suave con grosor ──
function catmull(pts, n = 10) {
  if (pts.length < 3) {
    const [a, b] = pts; const out = [];
    for (let i = 0; i <= n; i++) out.push([a[0] + ((b[0] - a[0]) * i) / n, a[1] + ((b[1] - a[1]) * i) / n]);
    return out;
  }
  const out = [];
  const P_ = [pts[0], ...pts, pts.at(-1)];
  for (let i = 1; i < P_.length - 2; i++) {
    const [p0, p1, p2, p3] = [P_[i - 1], P_[i], P_[i + 1], P_[i + 2]];
    for (let k = 0; k < n; k++) {
      const t = k / n, t2 = t * t, t3 = t2 * t;
      out.push([0, 1].map((j) => 0.5 * (2 * p1[j] + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3)));
    }
  }
  out.push(pts.at(-1));
  return out;
}

/**
 * Un tubo con línea central suave: devuelve los dos lados, el contorno cerrado (relleno) y un camino abierto
 * que sube por un lado, rodea la punta y baja por el otro (la base queda abierta: va escondida bajo el cuerpo).
 * `corte(t0, t1)` da el contorno de un tramo (la punta de la cola, la pata).
 */
export function tubo(pts, w0, w1, n = 5) {
  const c = catmull(pts, n);
  const largo = [0];
  for (let i = 1; i < c.length; i++) largo.push(largo[i - 1] + Math.hypot(c[i][0] - c[i - 1][0], c[i][1] - c[i - 1][1]));
  const total = largo.at(-1) || 1;
  const izq = [], der = [], ts = [];
  c.forEach((p, i) => {
    const a = c[Math.max(0, i - 1)], b = c[Math.min(c.length - 1, i + 1)];
    const dx = b[0] - a[0], dy = b[1] - a[1], k = Math.hypot(dx, dy) || 1;
    const t = largo[i] / total, w = (w0 + (w1 - w0) * t) / 2;
    const nx = -dy / k, ny = dx / k;
    izq.push([p[0] + nx * w, p[1] + ny * w]); der.push([p[0] - nx * w, p[1] - ny * w]); ts.push(t);
  });
  // punta redonda
  const fin = c.at(-1), pen = c.at(-2), dx = fin[0] - pen[0], dy = fin[1] - pen[1], k = Math.hypot(dx, dy) || 1;
  const ux = dx / k, uy = dy / k, wr = w1 / 2;
  const punta = [];
  for (let i = 1; i < 6; i++) {
    const a = Math.PI * (i / 6); // de izq a der rodeando la punta
    const nx = -uy, ny = ux; // normal (lado izq)
    punta.push([fin[0] + nx * wr * Math.cos(a) + ux * wr * Math.sin(a), fin[1] + ny * wr * Math.cos(a) + uy * wr * Math.sin(a)]);
  }
  const abierto = [...izq, ...punta, ...der.slice().reverse()];
  const corte = (t0, t1 = 1) => {
    const i0 = ts.findIndex((t) => t >= t0), i1 = t1 >= 1 ? ts.length - 1 : ts.findIndex((t) => t >= t1);
    const L_ = izq.slice(i0, i1 + 1), D_ = der.slice(i0, i1 + 1).reverse();
    return t1 >= 1 ? [...L_, ...punta, ...D_] : [...L_, ...D_];
  };
  const en = (t) => { const i = ts.findIndex((v) => v >= t); return { izq: izq[i], der: der[i], c: c[i] }; };
  return { izq, der, abierto, cerrado: [...abierto], corte, en, centro: c };
}

/** rayita que cruza un tubo en t (recortada para no tocar el contorno) */
export function raya(tb, t, f = 0.72, extra = {}) {
  const { izq, der } = tb.en(t);
  const m = [(izq[0] + der[0]) / 2, (izq[1] + der[1]) / 2];
  const a = [m[0] + (izq[0] - m[0]) * f, m[1] + (izq[1] - m[1]) * f];
  const b = [m[0] + (der[0] - m[0]) * f, m[1] + (der[1] - m[1]) * f];
  return L(a, b, { linea: 'fino', ...extra });
}

/** polilínea suave (Catmull-Rom) como camino de curvas */
export function suave(pts, extra = {}) {
  const c = catmull(pts, 6);
  return PL(c, extra);
}
