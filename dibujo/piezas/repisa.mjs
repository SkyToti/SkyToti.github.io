// «La repisa» (Sobre mí): la línea entra y se vuelve repisa; seis objetos, cada uno su propio dibujo (para que se
// toque, se tambalee y suelte su dato), y Haku que llega saltando y se sienta en la orilla.
// Base: repisa-h 900×360 y repisa-v 360×520 (otra colocación, no un escalado). Objetos: repisa-<objeto>, origen =
// donde tocan la repisa. Los `huecos` de cada base dicen, en %, dónde va cada objeto encima.
import { L, PL, PG, P, E, R, RR, T, transformar, matriz } from '../kit/formas.mjs';
import { grupo, prefijar, soloAnim, caja, hueco, nombres } from '../kit/componer.mjs';
import { hakuSentado, hakuSaltando, GESTOS_HAKU, mover } from './haku.mjs';

const sombra = (rx, dx = 0) => grupo('sombra', [E([dx, 1.5], rx, 3.5, { trama: 'sombra' })], { capa: 'luz' });
const fino = (extra = {}) => ({ linea: 'fino', tinta: 'noche', ...extra });

// ── los seis objetos (coordenadas locales: origen al centro de su base) ──

/** libro grueso acostado (diez años en ventas): el canto de páginas al frente, el lomo a la derecha y su listón */
function libro() {
  const banda = (k) => PG([[38, -50 + k], [48, -60 + k], [48, -54 + k], [38, -44 + k]], { rol: 'bloque', mueve: [1, 1] });
  return [sombra(50, 2), grupo('objeto', [
    PG([[-46, -50], [38, -50], [48, -60], [-36, -60]], { rol: 'libro3' }),
    PG([[38, -50], [48, -60], [48, -10], [38, 0]], { rol: 'libro3' }),
    banda(8), banda(36),
    R(-46, -50, 84, 50, { rol: 'libro3' }),
    R(-43, -44, 81, 36, { rol: 'paginas', mueve: [2, 1] }),
    PG([[-18, -52.5], [14, -52.5], [19, -57.5], [-13, -57.5]], { rol: 'bloque', mueve: [1, 1] }),
    PG([[-46, 0], [-46, -50], [-36, -60], [48, -60], [48, -10], [38, 0]], { linea: 'ext' }),
    L([-46, -50], [38, -50], { linea: 'int' }), L([38, -50], [38, 0], { linea: 'int' }), L([38, -50], [48, -60], { linea: 'int' }),
    L([-46, -44], [38, -44], { linea: 'fino' }), L([-46, -8], [38, -8], { linea: 'fino' }),
    ...[-37, -31, -25, -19, -13].map((y, k) => L([-40 + (k % 2) * 3, y], [34 - (k % 3) * 4, y], { linea: 'fino', tinta: 'apagado' })),
    P('M 12 -40 C 15 -26 8 -14 13 6', { linea: 'int', tinta: 'ambar' }),
  ])];
}

/** cuaderno de espiral con su lápiz recargado (estudia dos ingenierías) */
function cuaderno() {
  const B = [40, 0], Tp = [8, -132];
  const dx = Tp[0] - B[0], dy = Tp[1] - B[1], n = Math.hypot(dx, dy), ux = dx / n, uy = dy / n, nx = -uy * 4.6, ny = ux * 4.6;
  const en = (t, k = 1) => [[B[0] + dx * t + nx * k, B[1] + dy * t + ny * k], [B[0] + dx * t - nx * k, B[1] + dy * t - ny * k]];
  const tramo = (t0, t1, rol, k0 = 1, k1 = 1) => { const [a, b] = en(t0, k0), [c, d] = en(t1, k1); return PG([a, c, d, b], { rol, mueve: [1, 1] }); };
  const anillos = [];
  for (let i = 0; i < 7; i++) {
    const x = -24 + i * 8;
    anillos.push(E([x, -98], 1.5, 1.5, { rol: 'oscuro' }), P(`M ${x} -98 C ${x - 3} -104 ${x - 2} -110 ${x + 1} -110 C ${x + 3} -110 ${x + 3} -106 ${x + 2} -103`, { linea: 'fino' }));
  }
  const silueta = [en(0)[0], en(0.8)[0], Tp, en(0.8)[1], en(0)[1]];
  return [sombra(42, 6), grupo('objeto', [
    RR(-30, -104, 60, 104, 4, { rol: 'libro2' }), RR(-30, -104, 60, 104, 4, { linea: 'ext' }),
    L([26, -100], [26, -4], { linea: 'fino', tinta: 'noche' }),
    R(-18, -78, 36, 24, { rol: 'paginas', mueve: [2, 2] }), R(-18, -78, 36, 24, { linea: 'int' }),
    L([-12, -70], [12, -70], fino()), L([-12, -62], [6, -62], fino()),
    ...anillos,
    tramo(0, 0.07, 'martillo'), tramo(0.07, 0.14, 'casquillo'), tramo(0.14, 0.8, 'bloque'), tramo(0.8, 0.94, 'paginas', 1, 0.3),
    PG([en(0.94, 0.3)[0], Tp, en(0.94, 0.3)[1]], { rol: 'oscuro' }),
    PG(silueta, { linea: 'int' }),
    L(en(0.07)[0], en(0.07)[1], { linea: 'fino' }), L(en(0.14)[0], en(0.14)[1], { linea: 'fino' }),
    L([B[0] + dx * 0.16, B[1] + dy * 0.16], [B[0] + dx * 0.78, B[1] + dy * 0.78], fino()),
  ])];
}

/** taza humeante con una luna (trabaja de noche) */
function taza() {
  return [sombra(34, 6), grupo('objeto', [
    P('M -26 -74 L -23 -3 C -23 1 23 1 23 -3 L 26 -74 Z', { rol: 'taza' }),
    E([0, -74], 22, 4, { rol: 'oscuro', mueve: [0, 0] }),
    P('M -26 -74 L -23 -3 C -23 1 23 1 23 -3 L 26 -74', { linea: 'ext' }),
    E([0, -74], 26, 6, { linea: 'int' }),
    P('M 25 -60 C 49 -60 49 -24 23 -24', { linea: 'ext' }),
    P('M 24 -51 C 37 -51 37 -33 23 -33', { linea: 'int' }),
    P('M 1 -52 C -12 -51 -15 -32 -3 -28 C 0 -27 3 -27 6 -29 C -3 -32 -6 -44 1 -52 Z', { rol: 'bloque', mueve: [1, 1] }),
    P('M 1 -52 C -12 -51 -15 -32 -3 -28 C 0 -27 3 -27 6 -29 C -3 -32 -6 -44 1 -52 Z', fino()),
    L([12, -50], [12, -42], { linea: 'fino', tinta: 'ambar' }), L([8, -46], [16, -46], { linea: 'fino', tinta: 'ambar' }),
    L([10, -22], [10, -17], { linea: 'fino', tinta: 'ambar' }), L([7.5, -19.5], [12.5, -19.5], { linea: 'fino', tinta: 'ambar' }),
    P('M -9 -84 C -16 -92 -1 -97 -8 -108', { linea: 'int', tinta: 'apagado', anim: 'vapor' }),
    P('M 4 -86 C -3 -95 12 -100 5 -114', { linea: 'int', tinta: 'apagado', anim: 'vapor' }),
    P('M 15 -83 C 10 -90 20 -94 16 -102', { linea: 'fino', tinta: 'apagado', anim: 'vapor' }),
  ])];
}

/** diccionario delgado con índice de uñeros y dos banderines lisos de separador (español e inglés) */
function diccionario() {
  const unero = (y) => P(`M 24 ${y - 5} C 19 ${y - 5} 19 ${y + 5} 24 ${y + 5} Z`, { rol: 'oscuro', mueve: [0, 0] });
  return [sombra(34, 2), grupo('banderines', [
    L([-8, -104], [-18, -152], { linea: 'int' }),
    P('M -18 -151 C -25 -155 -32 -147 -42 -150 L -42 -134 C -32 -131 -25 -139 -15 -136 Z', { rol: 'bloque' }),
    P('M -18 -151 C -25 -155 -32 -147 -42 -150 L -42 -134 C -32 -131 -25 -139 -15 -136', { linea: 'ext' }),
    L([8, -104], [16, -148], { linea: 'int' }),
    P('M 16 -147 C 23 -151 30 -143 40 -146 L 40 -130 C 30 -127 23 -135 13 -132 Z', { rol: 'taza' }),
    P('M 16 -147 C 23 -151 30 -143 40 -146 L 40 -130 C 30 -127 23 -135 13 -132', { linea: 'ext' }),
  ]), grupo('objeto', [
    PG([[-24, 0], [-24, -102], [-31, -108], [-31, -6]], { rol: 'lejos' }),
    PG([[-24, -102], [24, -102], [17, -108], [-31, -108]], { rol: 'paginas' }),
    PG([[-24, 0], [-24, -102], [24, -102], [24, 0]], { rol: 'paginas' }),
    ...[-84, -66, -48, -30, -12].map(unero),
    PG([[-24, 0], [-31, -6], [-31, -108], [17, -108], [24, -102], [24, 0]], { linea: 'ext' }),
    L([-24, 0], [-24, -102], { linea: 'int' }), L([-24, -102], [24, -102], { linea: 'int' }),
    R(-16, -88, 30, 4, { rol: 'libro3', mueve: [1, 1] }), R(-16, -20, 30, 4, { rol: 'libro3', mueve: [1, 1] }),
    T('A–Z', -1, -46, { tam: 17, ancla: 'middle', tinta: 'noche' }),
  ])];
}

/** globo terráqueo de escritorio con un pin de mapa (Cuernavaca; remoto, híbrido o presencial) */
function globo() {
  const pin = [
    P('M 0 0 C -4 -9 -11 -15 -11 -26 C -11 -33 -6 -37 0 -37 C 6 -37 11 -33 11 -26 C 11 -15 4 -9 0 0 Z', { rol: 'bloque' }),
    P('M 0 0 C -4 -9 -11 -15 -11 -26 C -11 -33 -6 -37 0 -37 C 6 -37 11 -33 11 -26 C 11 -15 4 -9 0 0 Z', { linea: 'ext' }),
    E([0, -26], 4.2, 4.2, { rol: 'paginas', mueve: [0, 0] }), E([0, -26], 4.2, 4.2, { linea: 'fino' }),
  ].map((p) => transformar(p, matriz({ x: -8, y: -91, giro: -12 })));
  return [sombra(30), grupo('objeto', [
    P('M -26 0 C -26 -10 26 -10 26 0 Z', { rol: 'poste' }), P('M -26 0 C -26 -10 26 -10 26 0 Z', { linea: 'ext' }),
    L([0, -7], [0, -26], { linea: 'ext' }),
    E([0, -62], 31, 31, { rol: 'oceano' }),
    P('M -20 -80 C -10 -90 6 -86 4 -74 C 2 -64 -10 -68 -14 -60 C -18 -54 -27 -62 -25 -70 C -24 -75 -22 -78 -20 -80 Z', { rol: 'tierra' }),
    P('M -20 -80 C -10 -90 6 -86 4 -74 C 2 -64 -10 -68 -14 -60 C -18 -54 -27 -62 -25 -70 C -24 -75 -22 -78 -20 -80 Z', { linea: 'fino' }),
    P('M 8 -52 C 16 -57 25 -51 22 -42 C 20 -36 12 -36 9 -42 C 7 -46 5 -50 8 -52 Z', { rol: 'tierra' }),
    P('M 8 -52 C 16 -57 25 -51 22 -42 C 20 -36 12 -36 9 -42 C 7 -46 5 -50 8 -52 Z', { linea: 'fino' }),
    P('M -30 -60 C -14 -52 14 -52 30 -60', { linea: 'fino', tinta: 'noche' }),
    E([0, -62], 31, 31, { linea: 'ext' }),
    P('M 2 -26 C 54 -30 54 -96 2 -97', { linea: 'ext' }),
    ...pin,
  ])];
}

/** el plato de Haku: croquetas y una huella */
function plato() {
  const dedo = (x, y) => E([x, y], 2.5, 2.8, { rol: 'almohadilla' });
  return [sombra(40), grupo('objeto', [
    P('M -34 -29 C -26 -44 26 -44 34 -29 Z', { rol: 'papel' }),
    P('M -34 -29 C -26 -44 26 -44 34 -29', { linea: 'int' }),
    ...[[-16, -33], [-5, -37], [7, -35], [17, -32], [0, -31]].map(([x, y]) => E([x, y], 3.2, 2.3, fino())),
    P('M -40 -28 L -32 -3 C -31 1 31 1 32 -3 L 40 -28 Z', { rol: 'plato' }),
    P('M -40 -28 L -32 -3 C -31 1 31 1 32 -3 L 40 -28', { linea: 'ext' }),
    E([0, -28], 40, 6, { linea: 'int' }),
    E([0, -11], 5.5, 4.5, { rol: 'almohadilla' }), dedo(-7.5, -19), dedo(0, -21.5), dedo(7.5, -19),
  ])];
}

const OBJETOS = [
  ['ventas', 'libro', libro, 'Un libro grueso acostado'],
  ['estudios', 'cuaderno', cuaderno, 'Un cuaderno de clase con su lápiz'],
  ['noche', 'taza', taza, 'Una taza humeante con una luna'],
  ['idiomas', 'diccionario', diccionario, 'Un diccionario con dos banderines'],
  ['lugar', 'globo', globo, 'Un globo terráqueo con un pin'],
  ['haku', 'plato', plato, 'El plato de Haku'],
];

// ── la base: línea → repisa, y Haku ──
const COMP = {
  h: {
    ancho: 900, alto: 360,
    linea: 'M -6 110 C 30 110 22 262 40 262 L 860 262 C 884 262 890 300 894 330 C 897 350 900 360 906 366',
    tablas: [{ x0: 40, x1: 860, y: 262, soportes: [120, 780] }],
    objetos: { ventas: [120, 262], estudios: [238, 262], noche: [352, 262], idiomas: [462, 262], lugar: [574, 262], haku: [684, 262] },
    s: 1, haku: { x: 794, y: 262, s: 0.7 }, desde: [110, 130], medio: [40, -52],
  },
  v: {
    ancho: 360, alto: 520,
    linea: 'M -6 70 C 18 70 2 214 14 214 L 346 214 C 356 214 358 300 354 350 C 350 400 356 452 346 452 L 14 452 C 0 452 -4 490 -6 526',
    tablas: [{ x0: 14, x1: 346, y: 214, soportes: [60, 300] }, { x0: 14, x1: 346, y: 452, soportes: [60, 300] }],
    objetos: { ventas: [64, 214], estudios: [162, 214], noche: [266, 214], idiomas: [50, 452], lugar: [132, 452], haku: [212, 452] },
    s: 0.72, haku: { x: 298, y: 452, s: 0.52 }, desde: [80, 96], medio: [30, -40],
  },
};

function tabla({ x0, x1, y, soportes }) {
  return [
    R(x0, y, x1 - x0, 14, { rol: 'mesa' }),
    L([x0, y + 14], [x1, y + 14], { linea: 'int' }),
    L([x0, y], [x0, y + 14], { linea: 'ext' }), L([x1, y], [x1, y + 14], { linea: 'ext' }),
    ...soportes.flatMap((x) => [PL([[x, y + 14], [x, y + 48], [x + 32, y + 14]], { linea: 'int', tinta: 'viva' })]),
  ];
}

function base(id, cajas) {
  const c = COMP[id];
  const sentado = prefijar(mover(hakuSentado(), c.haku), 'haku');
  const salto = soloAnim(prefijar(mover(hakuSaltando(), { ...c.haku, espejo: true }), 'salto'), 'hakuSalto', [c.haku.x, c.haku.y]);
  // en el aire no lleva su sombra (flotaría bajo él); aparece y se va solo por gesto
  salto.grupos = salto.grupos.filter((g) => !g.nombre.endsWith('-sombra')).map((g) => ({ ...g, opacidad: 0 }));
  const hk = nombres(sentado), sl = nombres(salto);
  const h = c.haku;
  return {
    nombre: `repisa-${id}`,
    titulo: 'La repisa',
    vb: [0, 0, c.ancho, c.alto],
    tope: 130,
    grupos: [
      grupo('linea', [P(c.linea, { linea: 'ext' })]),
      grupo('repisa', c.tablas.flatMap(tabla)),
      ...salto.grupos,
      ...sentado.grupos,
    ],
    anclas: { ...sentado.anclas, ...salto.anclas },
    orden: [['linea'], ['repisa'], [...hk, ...sl]],
    zonas: [E([h.x, h.y - 96 * h.s], 64 * h.s, 100 * h.s, { nombre: 'haku' })],
    huecos: Object.fromEntries(OBJETOS.map(([clave]) => {
      const [x, y] = c.objetos[clave];
      return [clave, hueco(cajas[clave], { x, y, s: c.s }, c.ancho, c.alto)];
    })),
    gestos: {
      ...GESTOS_HAKU,
      saltoAparece: { tipo: 'opacidad', anims: ['hakuSalto'], valores: [1], dur: [0.04] },
      saltoVuela: { tipo: 'mover', anims: ['hakuSalto'], desde: c.desde, valores: [c.medio, [0, 0]], dur: [0.24, 0.2], ease: 'sine.out' },
      saltoSeVa: { tipo: 'opacidad', anims: ['hakuSalto'], valores: [0], dur: [0.04] },
      hakuAparece: { tipo: 'opacidad', anims: [], grupos: hk, desde: 0, valores: [1], dur: [0.04] },
      llega: { tipo: 'secuencia', pasos: [
        { gesto: 'saltoAparece', espera: 0.7 }, { gesto: 'saltoVuela', espera: -0.04 }, { gesto: 'saltoSeVa' },
        { gesto: 'hakuAparece', espera: -0.04 }, { gesto: 'oreja', espera: 0.08 }, { gesto: 'moverCola', espera: -0.3 },
        { gesto: 'parpadear', espera: 0.25 },
      ] },
    },
    alEntrar: ['llega'],
    alPasar: [{ zona: 'haku', gesto: 'oreja' }],
    alTocar: [{ zona: 'haku', gesto: ['parpadear', 'moverCola'] }],
    sigue: 'mirar',
  };
}

export function ilustraciones() {
  const objetos = OBJETOS.map(([clave, nombre, f, titulo]) => {
    const grupos = f();
    return { clave, def: { nombre: `repisa-${nombre}`, titulo, grupos, vb: caja(grupos, 8), tipo: 'objeto', tope: 40 } };
  });
  const cajas = Object.fromEntries(objetos.map(({ clave, def }) => [clave, def.vb]));
  return [...objetos.map((o) => o.def), base('h', cajas), base('v', cajas)];
}
