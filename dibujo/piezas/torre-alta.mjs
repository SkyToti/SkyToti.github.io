// La Elegía · «La torre alta»: la misma torre de dibujo/piezas/torre.mjs (anillos cónicos con su fila de ventanas,
// castillo con torrecillas y bandera, sol-halo de Aurelion detrás de la cima, agente pequeño para la escala), pero
// en un lienzo ALTO de 400×1600 para el tramo alto del inicio (escenario 6): catorce anillos de la base a la cima.
// Se pinta en el servidor con <Dibujo> (estado final, sin hervor: un solo trazo, `cuadros: 1`); la anima a mano
// components/paginas/inicio/escenarios/vivos-c.tsx (los anillos se arman con el scroll, el castillo rebota, el halo
// gira, el agente trepa). Por eso no declara orden de entrada ni gestos: solo anclas (pivotes y la orilla que trepa).
import { L, PL, PG, P, E, R } from '../kit/formas.mjs';
import { grupo, agentePequeno, girar } from './inventos-comun.mjs';

const ANCHO = 400, ALTO = 1600;
const X = ANCHO / 2; // eje de la torre
const BASE = 1548; // donde la torre toca el suelo
const CIMA = 262; // donde se asienta el castillo
const N = 14; // anillos
const MEDIO_BASE = 150, MEDIO_CIMA = 38;
/** medio ancho del cono a la altura y */
const ancho = (y) => MEDIO_CIMA + ((y - CIMA) / (BASE - CIMA)) * (MEDIO_BASE - MEDIO_CIMA);
// alturas de los anillos: crecen hacia la base (perspectiva), razón constante entre uno y el siguiente
const RAZON = 1.064;
const NIVELES = (() => {
  const h0 = ((BASE - CIMA) * (RAZON - 1)) / (RAZON ** N - 1);
  const ys = [CIMA];
  for (let i = 0; i < N; i++) ys.push(ys.at(-1) + h0 * RAZON ** i);
  return ys.reverse().map((y) => Math.round(y * 10) / 10); // de la base a la cima
})();
const K = 1.3; // el castillo y el halo, un poco más grandes que en la torre chica
const HALO = [X, CIMA - 34 * K];
const RAYOS = 12;

function anillo(i) {
  const yb = NIVELES[i], yt = NIVELES[i + 1];
  const B = ancho(yb) - (i ? 8 : 0), Tt = ancho(yt);
  const rb = B * 0.16, rt = Tt * 0.16, k = 1.33;
  const banda = `M ${X - B} ${yb} C ${X - B} ${yb + rb * k} ${X + B} ${yb + rb * k} ${X + B} ${yb} L ${X + Tt} ${yt} `
    + `C ${X + Tt} ${yt + rt * k} ${X - Tt} ${yt + rt * k} ${X - Tt} ${yt} Z`;
  const ym = (yb + yt) / 2 + 2, wm = (B + Tt) / 2 - 7, rm = wm * 0.16;
  const a = { anim: `anillo${i + 1}` };
  const piezas = [
    P(banda, { rol: i % 2 ? 'auricular' : 'robot', ...a }),
    // sombra del lado de allá (la luz viene del halo, arriba)
    P(`M ${X + Tt * 0.45} ${yt + rt * 0.9} L ${X + Tt} ${yt} L ${X + B} ${yb} C ${X + B} ${yb + rb * 0.7} ${X + B * 0.75} ${yb + rb * 1.05} ${X + B * 0.45} ${yb + rb * 1.15} Z`, { trama: 'sombra', op: 0.6, ...a }),
    P(banda, { linea: 'ext', ...a }),
    E([X, yt], Tt, rt, { linea: 'int', ...a }),
    // fila de ventanas encendidas
    P(`M ${X - wm} ${ym} C ${X - wm} ${ym + rm * k} ${X + wm} ${ym + rm * k} ${X + wm} ${ym}`, { linea: 'int', tinta: 'ambar', punteado: '3 9', ...a }),
  ];
  // cada tres pisos, un portón en arco al frente (rompe la repetición y da escala)
  if (i % 3 === 1) {
    const h = Math.min(30, (yb - yt) * 0.42), w = h * 0.42, y0 = yb + rb * 0.95;
    const arco = `M ${X - w} ${y0} L ${X - w} ${y0 - h + w} C ${X - w} ${y0 - h - w * 0.3} ${X + w} ${y0 - h - w * 0.3} ${X + w} ${y0 - h + w} L ${X + w} ${y0}`;
    piezas.push(P(arco, { rol: 'oscuro', ...a }), P(arco, { linea: 'fino', ...a }));
  }
  return grupo(`anillo${i + 1}`, piezas);
}

function castillo() {
  const y = CIMA, a = { anim: 'castillo' };
  const x = (d) => X + d * K, h = (d) => y - d * K;
  const torrecilla = (x0, x1, y1, techo) => [
    R(x(x0), h(y1), (x1 - x0) * K, y1 * K, { rol: 'casquillo', ...a }),
    P(`M ${x(x0)} ${y} L ${x(x0)} ${h(y1)} L ${x(x1)} ${h(y1)} L ${x(x1)} ${y}`, { linea: 'ext', ...a }),
    PG([[x(x0) - 4, h(y1)], [x(x1) + 4, h(y1)], [x((x0 + x1) / 2), h(techo)]], { rol: 'auricular', ...a }),
    PG([[x(x0) - 4, h(y1)], [x(x1) + 4, h(y1)], [x((x0 + x1) / 2), h(techo)]], { linea: 'ext', ...a }),
  ];
  const muralla = [[-30, 0], [-30, 22], [-22, 22], [-22, 28], [-14, 28], [-14, 22], [14, 22], [14, 28], [22, 28], [22, 22], [30, 22], [30, 0]]
    .map(([dx, dy]) => [x(dx), h(dy)]);
  const puerta = `M ${x(-6)} ${y} L ${x(-6)} ${h(10)} C ${x(-6)} ${h(16)} ${x(6)} ${h(16)} ${x(6)} ${h(10)} L ${x(6)} ${y}`;
  return grupo('castillo', [
    PG(muralla, { rol: 'casquillo', ...a }),
    PL(muralla, { linea: 'ext', ...a }),
    ...torrecilla(-40, -27, 40, 62),
    ...torrecilla(27, 40, 40, 62),
    ...torrecilla(-10, 10, 52, 84),
    P(puerta, { rol: 'oscuro', ...a }),
    P(puerta, { linea: 'fino', ...a }),
    R(x(-2.5), h(44), 5 * K, 8 * K, { rol: 'foco', mueve: [0, 0], ...a }),
    L([X, h(84)], [X, h(100)], { linea: 'int', ...a }),
    PG([[X, h(100)], [x(15), h(96)], [X, h(91)]], { rol: 'foco', ...a }),
    PG([[X, h(100)], [x(15), h(96)], [X, h(91)]], { linea: 'fino', ...a }),
  ]);
}

function halo() {
  const a = { anim: 'halo' };
  const r = 50 * K;
  const piezas = [E(HALO, r, r, { trama: 'ambar', op: 0.75, ...a }), E(HALO, r, r, { linea: 'int', tinta: 'ambar', ...a })];
  for (let i = 0; i < RAYOS; i++) {
    const g = (360 / RAYOS) * i + 15;
    const p = (d, e) => girar([HALO[0] + d * K, HALO[1] + e * K], g, HALO);
    const rayo = [p(62, -9), p(112, -3.5), p(116, 0), p(112, 3.5), p(62, 9)];
    piezas.push(PG(rayo, { trama: 'ambar', op: 0.9, ...a }), PG(rayo, { linea: 'int', tinta: 'ambar', ...a }));
  }
  return grupo('halo', piezas);
}

function torreAlta() {
  const pie = [X - MEDIO_BASE - 26, BASE + 2];
  const ag = agentePequeno({ x: pie[0], y: pie[1], s: 0.5, mira: 1 });
  const anillos = NIVELES.slice(0, -1).map((_, i) => anillo(i));
  const grupos = [
    halo(),
    ...anillos,
    castillo(),
    grupo('suelo', [
      P(`M 6 ${BASE + 4} C 90 ${BASE} 300 ${BASE + 1} 394 ${BASE + 5}`, { linea: 'int', tinta: 'viva' }),
      E([X, BASE + 10], MEDIO_BASE + 30, 7, { trama: 'sombra', op: 0.6 }),
    ]),
    ...ag.grupos,
  ];
  // la orilla izquierda de cada anillo (por donde trepa el agente), de la base a la cima
  const orilla = Object.fromEntries(NIVELES.map((y, i) => [`orilla${i}`, [X - ancho(y) + (i ? 8 : 0), y]]));
  const anclas = {
    ...ag.anclas,
    halo: HALO, castillo: [X, CIMA], pie,
    ...Object.fromEntries(NIVELES.slice(0, -1).map((y, i) => [`anillo${i + 1}`, [X, y]])),
    ...orilla,
  };
  return {
    nombre: 'torre-alta',
    titulo: 'La torre de La Elegía, de la base a la cima, con el castillo arriba y el halo de Aurelion detrás',
    vb: [0, 0, ANCHO, ALTO],
    cuadros: 1,
    tope: 60,
    grupos,
    anclas,
    orden: [],
    gestos: {},
    alEntrar: [],
    alPasar: [],
  };
}

/** se registra sola en dibujo/generar.mjs (piezas con `ilustraciones()`) */
export function ilustraciones() {
  return [torreAlta()];
}
