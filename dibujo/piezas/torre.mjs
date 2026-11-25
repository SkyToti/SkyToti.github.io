// La Elegía · «La torre»: la torre cónica de anillos subiendo entre nubes, el castillo con sus torrecillas en la cima
// y detrás el sol-halo de Aurelion. Un agente diminuto abajo da la escala. Lienzo 640×420.
// Entrada: el halo, las nubes se deslizan, la torre se arma anillo por anillo (de abajo arriba), el castillo sale de un
// salto con rebote y el halo gira. Al pasar por la torre, el halo vuelve a girar.
import { L, PL, PG, P, E, R } from '../kit/formas.mjs';
import { GESTOS_AGENTE } from './agente.mjs';
import { grupo, huecoFoto, rotulos, T, flecha, nube, agentePequeno, SALUDO, girar } from './inventos-comun.mjs';

const X = 250; // eje de la torre
const NIVELES = [380, 334, 293, 257, 226, 199, 176, 156]; // de la base a la cima: 7 anillos
const ancho = (y) => 36 + ((y - 156) / (380 - 156)) * 104; // medio ancho del cono a la altura y
const CIMA = NIVELES.at(-1);
const HALO = [X, CIMA - 30];
const RAYOS = 12;

function anillo(i) {
  const yb = NIVELES[i], yt = NIVELES[i + 1];
  const B = ancho(yb) - (i ? 9 : 0), Tt = ancho(yt);
  const rb = B * 0.16, rt = Tt * 0.16, k = 1.33;
  const banda = `M ${X - B} ${yb} C ${X - B} ${yb + rb * k} ${X + B} ${yb + rb * k} ${X + B} ${yb} L ${X + Tt} ${yt} `
    + `C ${X + Tt} ${yt + rt * k} ${X - Tt} ${yt + rt * k} ${X - Tt} ${yt} Z`;
  const ym = (yb + yt) / 2 + 2, wm = (B + Tt) / 2 - 7, rm = wm * 0.16;
  const a = { anim: `anillo${i + 1}` };
  return grupo(`anillo${i + 1}`, [
    P(banda, { rol: i % 2 ? 'auricular' : 'robot', ...a }),
    // sombra del lado de allá (la luz viene del halo, arriba a la izquierda)
    P(`M ${X + Tt * 0.45} ${yt + rt * 0.9} L ${X + Tt} ${yt} L ${X + B} ${yb} C ${X + B} ${yb + rb * 0.7} ${X + B * 0.75} ${yb + rb * 1.05} ${X + B * 0.45} ${yb + rb * 1.15} Z`, { trama: 'sombra', op: 0.6, ...a }),
    P(banda, { linea: 'ext', ...a }),
    E([X, yt], Tt, rt, { linea: 'int', ...a }),
    // fila de ventanas encendidas
    P(`M ${X - wm} ${ym} C ${X - wm} ${ym + rm * k} ${X + wm} ${ym + rm * k} ${X + wm} ${ym}`, { linea: 'int', tinta: 'ambar', punteado: '3 9', entra: 'fade', ...a }),
  ]);
}

function castillo() {
  const y = CIMA, a = { anim: 'castillo' };
  const torrecilla = (x0, x1, y1, techo) => [
    R(x0, y1, x1 - x0, y - y1, { rol: 'casquillo', ...a }),
    P(`M ${x0} ${y} L ${x0} ${y1} L ${x1} ${y1} L ${x1} ${y}`, { linea: 'ext', ...a }),
    PG([[x0 - 4, y1], [x1 + 4, y1], [(x0 + x1) / 2, techo]], { rol: 'auricular', ...a }),
    PG([[x0 - 4, y1], [x1 + 4, y1], [(x0 + x1) / 2, techo]], { linea: 'ext', ...a }),
  ];
  return grupo('castillo', [
    // muralla con almenas
    PG([[X - 30, y], [X - 30, y - 22], [X - 22, y - 22], [X - 22, y - 28], [X - 14, y - 28], [X - 14, y - 22], [X + 14, y - 22], [X + 14, y - 28], [X + 22, y - 28], [X + 22, y - 22], [X + 30, y - 22], [X + 30, y]], { rol: 'casquillo', ...a }),
    PL([[X - 30, y], [X - 30, y - 22], [X - 22, y - 22], [X - 22, y - 28], [X - 14, y - 28], [X - 14, y - 22], [X + 14, y - 22], [X + 14, y - 28], [X + 22, y - 28], [X + 22, y - 22], [X + 30, y - 22], [X + 30, y]], { linea: 'ext', ...a }),
    ...torrecilla(X - 40, X - 27, y - 40, y - 62),
    ...torrecilla(X + 27, X + 40, y - 40, y - 62),
    ...torrecilla(X - 10, X + 10, y - 52, y - 84),
    // puerta y ventanita
    P(`M ${X - 6} ${y} L ${X - 6} ${y - 10} C ${X - 6} ${y - 16} ${X + 6} ${y - 16} ${X + 6} ${y - 10} L ${X + 6} ${y}`, { rol: 'oscuro', ...a }),
    P(`M ${X - 6} ${y} L ${X - 6} ${y - 10} C ${X - 6} ${y - 16} ${X + 6} ${y - 16} ${X + 6} ${y - 10} L ${X + 6} ${y}`, { linea: 'fino', ...a }),
    R(X - 2.5, y - 44, 5, 8, { rol: 'foco', mueve: [0, 0], ...a }),
    // bandera
    L([X, y - 84], [X, y - 100], { linea: 'int', ...a }),
    PG([[X, y - 100], [X + 15, y - 96], [X, y - 91]], { rol: 'foco', ...a }),
    PG([[X, y - 100], [X + 15, y - 96], [X, y - 91]], { linea: 'fino', ...a }),
  ]);
}

function halo() {
  const a = { anim: 'halo' };
  const piezas = [E(HALO, 50, 50, { trama: 'ambar', op: 0.75, ...a }), E(HALO, 50, 50, { linea: 'int', tinta: 'ambar', ...a })];
  for (let i = 0; i < RAYOS; i++) {
    const g = (360 / RAYOS) * i + 15;
    const p = (r, d) => girar([HALO[0] + r, HALO[1] + d], g, HALO);
    const rayo = [p(62, -9), p(112, -3.5), p(116, 0), p(112, 3.5), p(62, 9)];
    piezas.push(PG(rayo, { trama: 'ambar', op: 0.9, ...a }), PG(rayo, { linea: 'int', tinta: 'ambar', ...a }));
  }
  return grupo('halo', piezas);
}

export function torre() {
  const foto = huecoFoto({ cx: 520, cy: 282, giro: 3 });
  const ag = agentePequeno({ x: 56, y: 404, s: 0.52, mira: 1 });
  const anillos = NIVELES.slice(0, -1).map((_, i) => anillo(i));
  const grupos = [
    halo(),
    grupo('nube-c', nube(368, 182, 86), { anim: 'nubeC' }),
    ...anillos,
    castillo(),
    grupo('nube-b', nube(132, 262, 128), { anim: 'nubeB' }),
    grupo('suelo', [P('M 8 405 C 40 401 90 401 128 406', { linea: 'int', tinta: 'viva' })]),
    grupo('nube-a', [...nube(270, 412, 250), ...nube(420, 414, 120)], { anim: 'nubeA' }),
    ...foto.grupos,
    ...ag.grupos,
    ...rotulos(
      [T('100 pisos', 28, 120, { tam: 24 })],
      [T('100 floors', 24, 120, { tam: 24 })],
    ),
    grupo('flecha', flecha('M 78 132 C 100 164 150 182 192 180', [192, 180], 2)),
  ];
  const anclas = {
    ...foto.anclas, ...ag.anclas,
    halo: HALO, castillo: [X, CIMA], nubeA: [270, 400], nubeB: [132, 250], nubeC: [368, 170],
    ...Object.fromEntries(NIVELES.slice(0, -1).map((y, i) => [`anillo${i + 1}`, [X, y + 6]])),
  };
  const crece = Object.fromEntries(NIVELES.slice(0, -1).map((_, i) => [`crece${i + 1}`, {
    tipo: 'escalaY', anims: [`anillo${i + 1}`], valores: [0, 1.16, 0.95, 1], dur: [0.001, 0.17, 0.11, 0.1],
  }]));
  const nombresAg = ag.grupos.map((g) => g.nombre);
  return {
    nombre: 'torre',
    titulo: 'La torre de La Elegía entre nubes, con el castillo en la cima y el halo de Aurelion detrás',
    vb: [0, 0, 640, 420],
    grupos,
    anclas,
    orden: [
      ['halo', 'foto', 'foto-sombra'],
      ['nube-a', 'nube-b', 'nube-c', 'suelo', '!nubes', '!nubesB'],
      ...anillos.map((g, i) => [g.nombre, `!crece${i + 1}`]),
      ['castillo', '!salto', '!saltoY'],
      ['!girarHalo', ...nombresAg],
      ['rotulos-es', 'rotulos-en', 'flecha'],
    ],
    zonas: [P('M 120 0 L 380 0 L 380 380 L 120 380 Z', { nombre: 'torre' })],
    gestos: {
      ...crece,
      salto: { tipo: 'mover', anims: ['castillo'], valores: [[0, -30], [0, 0], [0, -8], [0, 0]], dur: [0.17, 0.15, 0.09, 0.09] },
      saltoY: { tipo: 'escalaY', anims: ['castillo'], valores: [0, 1.25, 0.86, 1.06, 1], dur: [0.001, 0.17, 0.13, 0.1, 0.1] },
      girarHalo: { tipo: 'giro', anims: ['halo'], valores: [30, 0], dur: [1.4, 0.001] },
      nubes: { tipo: 'mover', anims: ['nubeA', 'nubeC'], valores: [[-34, 0], [0, 0]], dur: [0.001, 1.6] },
      nubesB: { tipo: 'mover', anims: ['nubeB'], valores: [[30, 0], [0, 0]], dur: [0.001, 1.6] },
      encender: GESTOS_AGENTE.encender,
      saludar: SALUDO,
    },
    alEntrar: ['encender', 'saludar'],
    alPasar: [{ zona: 'torre', gesto: 'girarHalo' }],
  };
}
