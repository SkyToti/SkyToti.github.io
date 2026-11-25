// «La tira» · viñeta 4: Reviso y despliego. La mano de Diego pasa la lupa por la hoja (cada renglón queda
// palomeado) y un avión de papel despega del escritorio en curva hacia la ventana con luna: en producción.
// Haku, sentado en la orilla, lo sigue con la mirada.
// Último cuadro (sin JS): la hoja revisada y el avión cruzando la ventana con su estela.
import { L, PL, PG, P, E, R, RR, matriz, colocar } from '../kit/formas.mjs';
import { hakuSentado, GESTOS_HAKU, mover } from './haku.mjs';
import { ANCHO, ALTO, fondo, marco, mesa, manoCanonica } from './tira-1.mjs';

const MESA = 300;
const HOJA = { x: 128, y: 142, w: 100, h: 152 };
const RENGLONES = [172, 192, 212, 232, 252];
const LUPA = [196, 250]; // centro final del lente
const AVION = [446, 118]; // dónde se ve el avión en el último cuadro
const RUMBO = -30; // grados
// recorrido del avión (pantalla): de la mesa, en curva, cruza la ventana y sale por la derecha
const VUELO = [[338, 289], [380, 270], [408, 222], [420, 166], AVION, [520, 82], [590, 60]];

function ventana() {
  const x = 318, y = 42, w = 160, h = 124;
  return [
    { nombre: 'ventana', piezas: [
      RR(x, y, w, h, 4, { rol: 'pantalla' }),
      E([446, 80], 34, 34, { trama: 'hueso', op: 0.45 }),
      P('M 452 62 C 432 64 426 92 446 100 C 438 102 424 98 420 84 C 416 68 432 56 452 62 Z', { rol: 'sobre' }),
      P('M 452 62 C 432 64 426 92 446 100 C 438 102 424 98 420 84 C 416 68 432 56 452 62 Z', { linea: 'int' }),
      ...[[350, 70, 5], [384, 140, 4], [462, 142, 4.5], [372, 58, 3]].flatMap(([sx, sy, r]) => [
        L([sx - r, sy], [sx + r, sy], { linea: 'fino', tinta: 'ambar' }),
        L([sx, sy - r], [sx, sy + r], { linea: 'fino', tinta: 'ambar' }),
      ]),
      RR(x, y, w, h, 4, { linea: 'ext' }),
      L([x + w / 2, y], [x + w / 2, y + h], { linea: 'int' }),
      L([x, y + h / 2], [x + w, y + h / 2], { linea: 'int' }),
      R(x - 10, y + h, w + 20, 9, { rol: 'mesa', mueve: [3, 3] }),
      R(x - 10, y + h, w + 20, 9, { linea: 'int' }),
    ] },
  ];
}

function hoja() {
  const { x, y, w, h } = HOJA;
  const piezas = [
    PG([[x + 6, y + h], [x + w + 10, y + h], [x + w + 16, y + h + 6], [x + 10, y + h + 6]], { trama: 'sombra' }),
    RR(x, y, w, h, 5, { rol: 'martillo' }),
    RR(x, y, w, h, 5, { linea: 'ext' }),
    R(x + 8, y + 16, w - 16, h - 24, { rol: 'sobre', mueve: [2, 2] }),
    R(x + 8, y + 16, w - 16, h - 24, { linea: 'int' }),
    RR(x + w / 2 - 18, y - 8, 36, 18, 4, { rol: 'oscuro' }),
    RR(x + w / 2 - 18, y - 8, 36, 18, 4, { linea: 'int' }),
    ...RENGLONES.map((ry, i) => L([x + 16, ry], [x + w - (i % 2 ? 34 : 28), ry], { linea: 'int', tinta: 'noche' })),
  ];
  const palomitas = RENGLONES.map((ry, i) => ({
    nombre: `ok${i + 1}`,
    piezas: [PL([[x + w - 24, ry - 1], [x + w - 20, ry + 3.5], [x + w - 12, ry - 6]], { linea: 'int', tinta: 'ambar', remate: 0, anim: `ok${i + 1}` })],
  }));
  return [{ nombre: 'hoja', piezas }, ...palomitas];
}

// la lupa en la mano: la misma mano de las viñetas 1 y 2 (el mango es su «lápiz»)
const MANO = { s: 1, giro: 53 };
function lupa() {
  const c = manoCanonica(false);
  const lente = [
    PG([[-6, 4], [112, 5.5], [112, -5.5], [-6, -4]], { rol: 'oscuro' }),
    PG([[-6, 4], [112, 5.5], [112, -5.5], [-6, -4]], { linea: 'int' }),
    E([-34, 0], 28, 28, { trama: 'cielo', op: 0.55 }),
    E([-34, 0], 28, 28, { linea: 'ext' }),
    E([-34, 0], 23, 23, { linea: 'fino', tinta: 'apagado' }),
    P('M -50 -10 C -46 -18 -38 -22 -30 -21', { linea: 'int' }),
  ];
  // origen canónico tal que el lente quede en LUPA
  const r = (MANO.giro * Math.PI) / 180;
  const o = [LUPA[0] + 34 * Math.cos(r), LUPA[1] + 34 * Math.sin(r)];
  const m = matriz({ x: o[0], y: o[1], ...MANO });
  const pon = (lista) => colocar({ piezas: lista }, m).piezas.map((p) => ({ ...p, anim: 'lupa' }));
  return [
    { nombre: 'lupa-mano', piezas: pon(c.mano) },
    { nombre: 'lupa', piezas: pon(lente) },
    { nombre: 'lupa-dedos', piezas: pon(c.delante) },
  ];
}

function avion() {
  // avión de papel de perfil apuntando a +x, centrado en (0,0); se gira al rumbo y se pone en AVION
  const a = { anim: 'avion' };
  const ala = [[28, 0], [-26, -16], [-12, -1]];
  const quilla = [[28, 0], [-12, -1], [-20, 11]];
  const m = matriz({ x: AVION[0], y: AVION[1], s: 1.35, giro: RUMBO });
  const piezas = colocar({ piezas: [
    PG(quilla, { rol: 'martillo' }), PG(quilla, { linea: 'int' }),
    PG(ala, { rol: 'sobre' }), PG(ala, { linea: 'ext' }),
    L([26, 0.2], [-10, -1], { linea: 'fino', tinta: 'noche' }),
  ] }, m).piezas.map((p) => ({ ...p, ...a }));
  // estela punteada: rayitas sueltas sobre la curva (se revelan una por una)
  const estela = [];
  const pts = curva(VUELO.slice(0, 5), 14);
  for (let i = 0; i + 1 < pts.length - 2; i += 2) estela.push(L(pts[i], pts[i + 1], { linea: 'fino', tinta: 'apagado', remate: 0 }));
  return [{ nombre: 'estela', piezas: estela }, { nombre: 'avion', piezas }];
}

/** muestrea una Catmull-Rom por los puntos */
function curva(pts, n) {
  const P_ = [pts[0], ...pts, pts.at(-1)], out = [];
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

export function tira4() {
  const haku = mover(hakuSentado({ alza: 1, mira: [2.6, -3.4], inclina: 8 }), { x: 62, y: MESA, s: 0.6 });
  const grupos = [
    fondo(),
    ...ventana(),
    mesa(MESA),
    ...haku.grupos.map((g) => ({ ...g, nombre: `haku-${g.nombre}` })),
    ...hoja(),
    ...avion(),
    ...lupa(),
    ...marco(),
  ];
  const rel = (p) => [Math.round((p[0] - AVION[0]) * 10) / 10, Math.round((p[1] - AVION[1]) * 10) / 10];
  // barrido de la lupa: cada renglón de izquierda a derecha (desplazamientos respecto a su lugar final)
  const barrido = [], dur = [];
  RENGLONES.forEach((ry, i) => {
    const oy = ry - 2 - LUPA[1] + 2;
    barrido.push([-30, oy], [6, oy]);
    dur.push(i === 0 ? 0 : 0.22, 0.42);
  });
  barrido.push([0, 0]); dur.push(0.25);
  return {
    nombre: 'tira-4',
    titulo: 'Una lupa revisa la hoja y un avión de papel despega hacia la ventana con luna; Haku lo sigue con la mirada',
    vb: [0, 0, ANCHO, ALTO],
    grupos,
    anclas: { ...haku.anclas, lupa: LUPA, avion: AVION, ...Object.fromEntries(RENGLONES.map((ry, i) => [`ok${i + 1}`, [HOJA.x + HOJA.w - 18, ry]])) },
    gestos: {
      ...GESTOS_HAKU,
      barrido: { tipo: 'mover', anims: ['lupa'], valores: barrido, dur },
      vuelo: { tipo: 'mover', anims: ['avion'], valores: VUELO.map(rel), dur: [0, 0.4, 0.35, 0.35, 0.35, 0.35, 0.4] },
      rumbo: { tipo: 'giro', anims: ['avion'], valores: [-RUMBO - 12], dur: [0] },
    },
    alEntrar: [],
    alPasar: [],
  };
}

