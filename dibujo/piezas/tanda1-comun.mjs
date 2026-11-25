// Piezas comunes de los inventos de la tanda 1 (conmutador, muela-mapa, folioscopio, bóveda, mesa de los seis).
// Lienzo 640×420; todo apoya en una repisa (`base`); cada invento reserva el hueco de su foto real (`hueco`).
import { L, PL, PG, P, E, R, RR, T, rot, aplicar } from '../kit/formas.mjs';
import { agente } from './agente.mjs';
import { mover } from './haku.mjs';

export const ANCHO = 640, ALTO = 420;
export const PISO = 378; // la cara de arriba de la repisa

export const grupo = (nombre, piezas, extra = {}) => ({ nombre, piezas, ...extra });
export const prefijar = (p, pre) => ({ ...p, grupos: p.grupos.map((g) => ({ ...g, nombre: `${pre}-${g.nombre}` })) });
export const nombres = (p) => p.grupos.map((g) => g.nombre);

/** renombra anclas animables (brazo → brazo3) en una parte ya hecha */
export function renombrar(parte, mapa) {
  const r = (a) => (a && mapa[a]) || a;
  return {
    grupos: parte.grupos.map((g) => ({ ...g, ...(g.anim ? { anim: r(g.anim) } : {}), piezas: g.piezas.map((p) => (p.anim ? { ...p, anim: r(p.anim) } : p)) })),
    anclas: Object.fromEntries(Object.entries(parte.anclas || {}).map(([k, v]) => [r(k), v])),
  };
}

/** a todas las piezas de una parte les pone la misma ancla */
export function animar(parte, anim) {
  return { ...parte, grupos: parte.grupos.map((g) => ({ ...g, piezas: g.piezas.map((p) => ({ ...p, anim })) })) };
}

/** puntos de un rectángulo girado alrededor de su centro */
export function caja(cx, cy, w, h, giro = 0) {
  const m = rot(giro, [cx, cy]);
  return [[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]].map(([x, y]) => aplicar(m, [cx + x, cy + y]));
}

/** la repisa donde se apoya el invento */
export function base(x0 = 22, x1 = 618, y = PISO, g = 14) {
  return grupo('base', [
    R(x0, y, x1 - x0, g, { rol: 'mesa' }),
    L([x0, y], [x1, y], { linea: 'ext' }),
    L([x0, y + g], [x1, y + g], { linea: 'int' }),
    L([x0, y], [x0, y + g], { linea: 'int' }),
    L([x1, y], [x1, y + g], { linea: 'int' }),
  ]);
}

/**
 * El hueco de la foto real: un marco vacío, ligeramente girado, con dos trozos de cinta en las esquinas de arriba
 * y su sombra en L (riso). Por dentro no se rellena: el sitio pone la captura DETRÁS del dibujo, así el borde y la
 * cinta le quedan encima. Ancla `foto` = centro.
 */
export const FOTO = { w: 200, h: 125 };
export function hueco({ cx, cy, giro = -3 }) {
  const { w, h } = FOTO;
  const m = rot(giro, [cx, cy]);
  const q = (x, y) => aplicar(m, [cx + x, cy + y]);
  const s = 7;
  const sombra = [q(w / 2, -h / 2 + s), q(w / 2 + s, -h / 2 + s), q(w / 2 + s, h / 2 + s), q(-w / 2 + s, h / 2 + s), q(-w / 2 + s, h / 2), q(w / 2, h / 2)];
  const cinta = (x, y, g) => {
    const c = q(x, y);
    const pts = caja(c[0], c[1], 54, 17, giro + g);
    return [PG(pts, { rol: 'sobre', op: 0.6, mueve: [2, 2] }), PG(pts, { linea: 'fino', tinta: 'apagado' })];
  };
  return {
    grupos: [
      grupo('sombra-foto', [PG(sombra, { trama: 'sombra' })], { capa: 'luz' }),
      grupo('foto', [
        PG([q(-w / 2, -h / 2), q(w / 2, -h / 2), q(w / 2, h / 2), q(-w / 2, h / 2)], { linea: 'int' }),
        ...cinta(-w / 2 + 8, -h / 2 + 4, -36),
        ...cinta(w / 2 - 8, -h / 2 + 4, 36),
      ]),
    ],
    anclas: { foto: [cx, cy] },
  };
}

/** globo de diálogo con colita hacia `cola` (sale del borde de abajo) */
export function globo({ x, y, w, h, cola, texto, tam = 28, anim }) {
  const r = 16, k = r * 0.45, [tx, ty] = cola;
  const b0 = Math.max(x + r + 4, Math.min(x + w - r - 34, tx - 8)), b1 = b0 + 26;
  const d = `M ${x + r} ${y} L ${x + w - r} ${y} C ${x + w - k} ${y} ${x + w} ${y + k} ${x + w} ${y + r} L ${x + w} ${y + h - r} C ${x + w} ${y + h - k} ${x + w - k} ${y + h} ${x + w - r} ${y + h} L ${b1} ${y + h} L ${tx} ${ty} L ${b0} ${y + h} L ${x + r} ${y + h} C ${x + k} ${y + h} ${x} ${y + h - k} ${x} ${y + h - r} L ${x} ${y + r} C ${x} ${y + k} ${x + k} ${y} ${x + r} ${y} Z`;
  const a = anim ? { anim } : {};
  return [
    P(d, { rol: 'marco', ...a }),
    P(d, { linea: 'ext', ...a }),
    T(texto, x + w / 2, y + h / 2 + tam * 0.36, { tam, ancla: 'middle', ...a }),
  ];
}

/** ondas de sonido (arcos) a un lado de un punto */
export function ondas(c, lado = 1, { n = 2, r0 = 12, paso = 9, abre = 0.75, tinta = 'cielo', anim } = {}) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const r = r0 + i * paso;
    const a0 = -abre, a1 = abre;
    const p = (a) => [c[0] + lado * r * Math.cos(a), c[1] + r * Math.sin(a)];
    const m = (a0 + a1) / 2;
    const ctl = [c[0] + lado * (r / Math.cos(abre)) * Math.cos(m) * 1.02, c[1]];
    out.push(P(`M ${p(a0).join(' ')} Q ${ctl.join(' ')} ${p(a1).join(' ')}`, { linea: 'int', tinta, ...(anim ? { anim } : {}) }));
  }
  return out;
}

/** estrellita de cuatro puntas */
export function estrella([cx, cy], r = 9, extra = {}) {
  const pts = [];
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4 - Math.PI / 2, rr = i % 2 ? r * 0.36 : r;
    pts.push([cx + rr * Math.cos(a), cy + rr * Math.sin(a)]);
  }
  return [PG(pts, { rol: 'papel', mueve: [2, 2], ...extra }), PG(pts, { linea: 'int', ...extra })];
}

/** la diadema de telefonista del kit (pose 5), para ponerla en cualquier agente */
export const DIADEMA = [
  P('M -21 -84 C -23 -116 23 -116 21 -84', { linea: 'int' }),
  E([-21, -84], 4.8, 8.5, { rol: 'auricular' }), E([-21, -84], 4.8, 8.5, { linea: 'int' }),
  E([21, -84], 4.8, 8.5, { rol: 'auricular' }), E([21, -84], 4.8, 8.5, { linea: 'int' }),
  P('M 22 -76 C 23 -66 16 -62 8 -64', { linea: 'fino' }),
  E([7, -64], 3, 3, { rol: 'oscuro' }), E([7, -64], 3, 3, { linea: 'fino' }),
];

/** un agente del kit colocado y con sus grupos prefijados (y sus anclas renombradas si hace falta) */
export function agenteEn(opciones, colocacion, pre, renombres = {}) {
  return prefijar(renombrar(mover(agente(opciones), colocacion), renombres), pre);
}

/** cordón rizado que cuelga de a a b (curva cuadrática por c) con n vueltas (teléfono) */
export function suaveCordon(a, b, c, n = 6, r = 4.5, extra = {}) {
  const q = (t) => [0, 1].map((k) => (1 - t) * (1 - t) * a[k] + 2 * (1 - t) * t * c[k] + t * t * b[k]);
  const pts = [];
  const N = n * 12;
  for (let i = 0; i <= N; i++) {
    const t = i / N, f = 2 * Math.PI * n * t;
    const p0 = q(Math.max(0, t - 0.01)), p1 = q(Math.min(1, t + 0.01));
    const dx = p1[0] - p0[0], dy = p1[1] - p0[1], k = Math.hypot(dx, dy) || 1, ux = dx / k, uy = dy / k;
    const [x, y] = q(t);
    pts.push([x + ux * r * 0.9 * Math.sin(f) - uy * r * (1 - Math.cos(f)) * 0.5, y + uy * r * 0.9 * Math.sin(f) + ux * r * (1 - Math.cos(f)) * 0.5]);
  }
  return PL(pts, { linea: 'fino', ...extra });
}

/** caja que envuelve unas piezas (para las zonas de cursor) */
export function bordes(piezas, pad = 6) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  const pon = ([x, y]) => { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); };
  for (const p of piezas) {
    if (p.a) { pon(p.a); pon(p.b); }
    if (p.pts) p.pts.forEach(pon);
    if (p.c) { pon([p.c[0] - p.rx, p.c[1] - p.ry]); pon([p.c[0] + p.rx, p.c[1] + p.ry]); }
    if (p.d) { const n = p.d.match(/-?\d*\.?\d+/g).map(Number); for (let i = 0; i + 1 < n.length; i += 2) pon([n[i], n[i + 1]]); }
  }
  return R(x0 - pad, y0 - pad, x1 - x0 + 2 * pad, y1 - y0 + 2 * pad);
}

export { L, PL, PG, P, E, R, RR, T };
