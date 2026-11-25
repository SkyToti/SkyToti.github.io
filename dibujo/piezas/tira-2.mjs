// «La tira» · viñeta 2: Dirijo agentes de IA. Tres agentes detrás de una banda reciben cada uno una pieza distinta
// (un bloque de código, un engrane, una hoja); arriba, la mano de Diego marca el compás con una batuta.
// Último cuadro: cada agente con su pieza en brazos. La banda entrega de derecha a izquierda (la primera pieza
// viaja más lejos), así ninguna pieza pasa por delante de otra ya entregada.
import { L, PL, PG, P, E, R, RR, matriz, colocar } from '../kit/formas.mjs';
import { agente } from './agente.mjs';
import { mover } from './haku.mjs';
import { ANCHO, ALTO, X0, X1, fondo, marco, manoCanonica } from './tira-1.mjs';

const PIE = 338; // los pies quedan detrás de la banda
const S = 1.15;
const XS = [140, 262, 384];
const BANDA = 322; // cara de arriba de la banda

// piezas en coordenadas del agente (donde las sostiene: x 8..38, y -68..-41)
function bloque(anim) {
  const x = 8, y = -68, w = 30, h = 27, a = { anim };
  return [
    RR(x, y, w, h, 3, { rol: 'bloque', ...a }),
    RR(x, y, w, h, 3, { linea: 'ext', ...a }),
    PL([[x + w * 0.3, y + h * 0.32], [x + w * 0.18, y + h * 0.5], [x + w * 0.3, y + h * 0.68]], { linea: 'fino', tinta: 'noche', ...a }),
    L([x + w * 0.56, y + h * 0.26], [x + w * 0.44, y + h * 0.74], { linea: 'fino', tinta: 'noche', ...a }),
    PL([[x + w * 0.7, y + h * 0.32], [x + w * 0.82, y + h * 0.5], [x + w * 0.7, y + h * 0.68]], { linea: 'fino', tinta: 'noche', ...a }),
  ];
}
function engrane(anim) {
  const c = [23, -54.5], a = { anim }, pts = [];
  for (let i = 0; i < 32; i++) {
    const t = (i / 32) * Math.PI * 2 + 0.1, r = (i % 4 < 2) ? 16.5 : 12.5;
    pts.push([c[0] + Math.cos(t) * r, c[1] + Math.sin(t) * r]);
  }
  return [
    PG(pts, { rol: 'taza', ...a }),
    PG(pts, { linea: 'ext', ...a }),
    E(c, 5, 5, { rol: 'oscuro', ...a }),
    E(c, 5, 5, { linea: 'int', ...a }),
  ];
}
function hoja(anim) {
  const a = { anim };
  const borde = [[10, -71], [30, -73], [38, -65], [39, -39], [11, -38]];
  return [
    PG(borde, { rol: 'sobre', ...a }),
    PG(borde, { linea: 'ext', ...a }),
    PL([[30, -73], [30.5, -64.5], [38, -65]], { linea: 'int', ...a }),
    L([15, -60], [33, -60.5], { linea: 'fino', tinta: 'noche', ...a }),
    L([15, -53], [34, -53.5], { linea: 'fino', tinta: 'noche', ...a }),
    L([15, -46], [27, -46.3], { linea: 'fino', tinta: 'noche', ...a }),
  ];
}
const PIEZAS = [bloque, engrane, hoja];

function unAgente(i) {
  const ag = agente({
    brazoI: [[-17, -46], [-6, -58], [6, -62]],
    brazoD: [[17, -46], [30, -42], [37, -50]],
    piernaI: [[-7, -22], [-10, -12], [-13, -6]],
    piernaD: [[7, -22], [11, -13], [13, -6]],
    mira: 1,
    anim: `ag${i + 1}`,
  });
  const m = { x: XS[i], y: PIE, s: S };
  const puesto = mover(ag, m);
  const pieza = mover({ grupos: [{ nombre: 'pieza', piezas: PIEZAS[i](`p${i + 1}`) }], anclas: { [`p${i + 1}`]: [23, -54.5] } }, m);
  const pre = (g) => ({ ...g, nombre: `a${i + 1}-${g.nombre}` });
  return { agente: { grupos: puesto.grupos.map(pre), anclas: puesto.anclas }, pieza: { grupos: pieza.grupos.map(pre), anclas: pieza.anclas } };
}

function banda() {
  const piezas = [
    R(X0, BANDA, X1 - X0, ALTO, { rol: 'mesa', mueve: [0, 0] }),
    R(X0, BANDA, X1 - X0, 11, { rol: 'teclado', mueve: [0, 0] }),
    L([X0, BANDA], [X1, BANDA], { linea: 'ext' }),
    L([X0, BANDA + 11], [X1, BANDA + 11], { linea: 'int' }),
  ];
  for (let x = 52; x < X1 - 10; x += 92) {
    piezas.push(E([x, 356], 12, 12, { rol: 'casquillo', mueve: [3, 2] }), E([x, 356], 12, 12, { linea: 'int' }));
    piezas.push(E([x, 356], 3, 3, { rol: 'oscuro' }));
  }
  // flechitas de avance sobre la banda
  const marcas = [];
  for (let x = 62; x < X1 - 30; x += 96) marcas.push(PL([[x, BANDA + 3.5], [x + 6, BANDA + 5.5], [x, BANDA + 7.5]], { linea: 'fino', tinta: 'apagado', remate: 0, anim: 'avance' }));
  return [{ nombre: 'banda', piezas }, { nombre: 'avance', piezas: marcas }];
}

// la batuta: la mano canónica (la misma de la viñeta 1) con una batuta en vez del lápiz
const MANO = { x: 200, y: 140, s: 0.9, giro: 212 };
function batuta() {
  const c = manoCanonica(false);
  const vara = [
    PG([[-56, 1.6], [112, 3.6], [112, -3.6], [-56, -1.6]], { rol: 'sobre' }),
    PG([[-56, 1.6], [112, 3.6], [112, -3.6], [-56, -1.6]], { linea: 'int' }),
    E([116, 0], 10, 7.5, { rol: 'casquillo' }), E([116, 0], 10, 7.5, { linea: 'int' }),
  ];
  const m = matriz(MANO);
  const pon = (lista) => colocar({ piezas: lista }, m).piezas.map((p) => ({ ...p, anim: 'batuta' }));
  const punta = colocar({ piezas: [], anclas: { k: [-56, 0] } }, m).anclas.k;
  const muneca = colocar({ piezas: [], anclas: { k: [118, 30] } }, m).anclas.k;
  // rayitas del compás junto a la punta
  const golpes = [
    P(`M ${punta[0] + 12} ${punta[1] - 22} C ${punta[0] + 20} ${punta[1] - 16} ${punta[0] + 22} ${punta[1] - 8} ${punta[0] + 20} ${punta[1]}`, { linea: 'int', tinta: 'ambar', anim: 'compas' }),
    P(`M ${punta[0] + 22} ${punta[1] - 30} C ${punta[0] + 33} ${punta[1] - 21} ${punta[0] + 35} ${punta[1] - 9} ${punta[0] + 32} ${punta[1] + 3}`, { linea: 'int', tinta: 'ambar', anim: 'compas' }),
  ];
  return {
    grupos: [
      { nombre: 'mano', piezas: pon(c.mano) },
      { nombre: 'batuta', piezas: pon(vara) },
      { nombre: 'dedos', piezas: pon(c.delante) },
      { nombre: 'compas', piezas: golpes },
    ],
    anclas: { batuta: muneca, compas: punta },
  };
}

export function tira2() {
  const ags = XS.map((_, i) => unAgente(i));
  const bat = batuta();
  const grupos = [
    fondo(),
    ...ags.flatMap((a) => a.agente.grupos),
    ...banda(),
    ...ags.flatMap((a) => a.pieza.grupos),
    ...bat.grupos,
    ...marco(),
  ];
  const anclas = Object.assign({}, ...ags.flatMap((a) => [a.agente.anclas, a.pieza.anclas]), bat.anclas);
  // cada pieza: entra por la izquierda sobre la banda, viaja hasta su agente y sube a sus brazos
  const gestos = {};
  XS.forEach((x, i) => {
    const fin = [x + 23 * S, PIE - 54.5 * S];
    const enBanda = BANDA - (PIE - 41 * S) - 1; // cuánto baja para apoyarse en la banda
    gestos[`entrega${i + 1}`] = { tipo: 'mover', anims: [`p${i + 1}`], valores: [[-fin[0] - 10, enBanda], [0, enBanda], [0, -14], [0, 0]], dur: [0, 1.1, 0.2, 0.16] };
  });
  return {
    nombre: 'tira-2',
    titulo: 'Tres agentes reciben cada uno una pieza por una banda; una batuta marca el compás',
    vb: [0, 0, ANCHO, ALTO],
    grupos,
    anclas,
    gestos: {
      ...gestos,
      compas: { tipo: 'giro', anims: ['batuta'], valores: [-7, 5, 0], dur: [0.14, 0.16, 0.14] },
    },
    alEntrar: [],
    alPasar: [],
  };
}
