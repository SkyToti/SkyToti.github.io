// «La mesa de los seis» (taller-claude): un banco de trabajo con seis agentes pequeños detrás, con sombreros de tres
// tamaños (dos gorras, tres sombreros, una chistera), y una batuta sobre un atril. Al entrar, la batuta da un golpe y
// los seis martillan uno tras otro; al pasar el cursor por la batuta, repiten. Sin rótulos (una sola variante).
// Lienzo 640×420; la foto real va arriba a la izquierda.
import { L, PL, PG, P, E, R } from '../kit/formas.mjs';
import { ANCHO, ALTO, PISO, grupo, nombres, base, hueco, caja, agenteEn, bordes } from './tanda1-comun.mjs';

const S = 0.95;
const PIES = 352; // los agentes están detrás del banco: el frente les tapa las piernas
const BANCO = { x0: 30, x1: 566, y: 326 };
const XS = [62, 148, 234, 320, 406, 492];
const SOMBREROS = ['gorra', 'gorra', 'sombrero', 'sombrero', 'sombrero', 'chistera'];
const BATUTA = { mango: [566, 196], punta: [632, 172] };

const SOMBRERO = {
  gorra: [
    P('M -17 -99 C -17 -119 17 -119 17 -99 Z', { rol: 'libro1' }),
    P('M -17 -99 C -17 -119 17 -119 17 -99 Z', { linea: 'ext' }),
    P('M 12 -101 C 22 -104 31 -101 33 -97 L 12 -97', { rol: 'libro1' }),
    P('M 12 -101 C 22 -104 31 -101 33 -97 L 12 -97', { linea: 'int' }),
    E([0, -116], 2.6, 2.6, { rol: 'oscuro' }),
  ],
  sombrero: [
    P('M -14 -101 C -15 -129 15 -129 14 -101 Z', { rol: 'casquillo' }),
    P('M -14 -101 C -15 -129 15 -129 14 -101 Z', { linea: 'ext' }),
    R(-14.5, -109, 29, 6, { rol: 'oscuro', mueve: [0, 0] }),
    E([0, -101], 24, 4.5, { rol: 'casquillo' }), E([0, -101], 24, 4.5, { linea: 'ext' }),
  ],
  chistera: [
    R(-14, -146, 28, 45, { rol: 'oscuro' }), R(-14, -146, 28, 45, { linea: 'ext' }),
    R(-14, -112, 28, 7, { rol: 'papel', mueve: [1, 1] }),
    E([0, -101], 25, 4.8, { rol: 'oscuro' }), E([0, -101], 25, 4.8, { linea: 'ext' }),
  ],
};

/** el martillo en alto, como en la pose 4 del kit (martillando); devuelve también cuánto girar para el golpe */
function martillo(tope) {
  const ang = Math.atan2(-22, 8), ux = Math.cos(ang), uy = Math.sin(ang), nx = -uy, ny = ux;
  const cab = [26 + ux * 26, -80 + uy * 26];
  const esq = (a, b) => [cab[0] + nx * a + ux * b, cab[1] + ny * a + uy * b];
  const cabeza = [esq(-7, -6), esq(13, -6), esq(13, 6), esq(-7, 6)];
  // giro (horario, desde el hombro) con el que la cabeza toca el banco
  const hombro = [17, -48];
  let giro = 0;
  for (let g = 0; g <= 150; g += 0.5) {
    const r = (g * Math.PI) / 180, c = Math.cos(r), s = Math.sin(r);
    const baja = Math.max(...[...cabeza, esq(-14, 0)].map(([x, y]) => hombro[1] + (x - hombro[0]) * s + (y - hombro[1]) * c));
    if (baja >= tope) { giro = g; break; }
  }
  return {
    piezas: [
      L([26, -80], cab, { linea: 'int' }),
      PG(cabeza, { rol: 'martillo' }), PG(cabeza, { linea: 'ext' }),
      PL([esq(-7, -6), esq(-14, -3), esq(-14, 3), esq(-7, 6)], { linea: 'int' }),
    ],
    giro,
  };
}

function trabajador(i) {
  const tope = (BANCO.y - PIES) / S;
  const m = martillo(tope);
  const k = i + 1;
  const ag = agenteEn({
    brazoI: [[-17, -46], [-24, -38], [-22, -30]],
    brazoD: [[17, -48], [30, -62], [26, -80]],
    piernaI: [[-7, -22], [-8, -12], [-9, -6]],
    piernaD: [[7, -22], [8, -12], [9, -6]],
    mira: 0.6,
    brazoAnim: true,
    cabezaExtra: SOMBRERO[SOMBREROS[i]],
    delante: m.piezas.map((p) => ({ ...p, anim: 'brazo' })),
  }, { x: XS[i], y: PIES, s: S }, `a${k}`, { brazo: `brazo${k}` });
  // detrás del banco las piernas y la sombra no se ven (el frente es opaco): no se dibujan
  return { ag: { ...ag, grupos: ag.grupos.filter((g) => !/-(piernas|sombra)$/.test(g.nombre)) }, giro: m.giro };
}

function banco() {
  const { x0, x1, y } = BANCO;
  return [
    grupo('banco-sombra', [E([(x0 + x1) / 2 + 6, PISO + 1], (x1 - x0) / 2, 4, { trama: 'sombra' })], { capa: 'luz' }),
    grupo('banco', [
      R(x0 + 12, y + 14, x1 - x0 - 24, PISO - y - 14, { rol: 'marco' }),
      L([x0 + 12, y + 14], [x0 + 12, PISO], { linea: 'ext' }), L([x1 - 12, y + 14], [x1 - 12, PISO], { linea: 'ext' }),
      L([x0 + 12, y + 26], [x1 - 12, y + 26], { linea: 'fino', tinta: 'viva' }),
      R(x0, y, x1 - x0, 14, { rol: 'mesa' }),
      R(x0, y, x1 - x0, 14, { linea: 'ext' }),
    ]),
  ];
}

function lampara() {
  const x = 448, y = 118;
  return [
    grupo('luz', [
      PG([[x - 26, y + 22], [x + 26, y + 22], [x + 120, BANCO.y], [x - 120, BANCO.y]], { trama: 'ambar', op: 0.45 }),
      E([x, y + 26], 9, 9, { rol: 'foco', mueve: [0, 0] }),
    ], { capa: 'luz', anim: 'luz' }),
    grupo('lampara', [
      L([x, 0], [x, y - 4], { linea: 'int' }),
      P(`M ${x - 30} ${y + 24} C ${x - 28} ${y - 6} ${x + 28} ${y - 6} ${x + 30} ${y + 24} Z`, { rol: 'lampara' }),
      P(`M ${x - 30} ${y + 24} C ${x - 28} ${y - 6} ${x + 28} ${y - 6} ${x + 30} ${y + 24} Z`, { linea: 'ext' }),
    ]),
  ];
}

function atril() {
  const desk = caja(598, 170, 72, 46, 0);
  return [
    grupo('atril', [
      PL([[574, PISO], [598, 346], [622, PISO]], { linea: 'int' }),
      L([598, 346], [598, 196], { linea: 'ext' }),
      PG(desk, { rol: 'teclado' }), PG(desk, { linea: 'ext' }),
      ...[[572, 160], [572, 170], [572, 180]].map(([x, yy]) => L([x, yy], [x + 34, yy], { linea: 'fino', tinta: 'apagado' })),
      E([616, 170], 4, 3, { rol: 'brillo', mueve: [0, 0] }),
      R(558, 193, 80, 6, { rol: 'mesa' }), R(558, 193, 80, 6, { linea: 'int' }),
    ]),
    grupo('batuta', [
      L(BATUTA.mango, BATUTA.punta, { linea: 'ext' }),
      E(BATUTA.mango, 8, 6, { rol: 'papel', mueve: [2, 1.5] }), E(BATUTA.mango, 8, 6, { linea: 'int' }),
    ], { anim: 'batuta' }),
  ];
}

export function mesaDeLosSeis() {
  const foto = hueco({ cx: 126, cy: 92, giro: -3 });
  const seis = XS.map((_, i) => trabajador(i));
  const [atrilG, batuta] = atril();
  const grupos = [base(), ...foto.grupos, ...lampara(), atrilG, batuta, ...seis.flatMap((t) => t.ag.grupos), ...banco()];
  const anclas = { ...foto.anclas, batuta: BATUTA.mango };
  seis.forEach((t) => Object.assign(anclas, t.ag.anclas));
  delete anclas.brazo;
  const gestos = {
    batuta: { tipo: 'giro', anims: ['batuta'], valores: [-52, 0, -22, 0], dur: [0.2, 0.08, 0.13, 0.09] },
  };
  for (let i = 0; i < 6; i++) {
    const k = i + 1, espera = 0.34 + i * 0.13;
    const g = seis[i].giro;
    gestos[`martillo${k}`] = { tipo: 'giro', anims: [`brazo${k}`], valores: [0, -10, g, g, 0, g, g, 0], dur: [espera, 0.08, 0.1, 0.05, 0.16, 0.1, 0.05, 0.2] };
  }
  const golpe = ['!batuta', ...seis.map((_, i) => `!martillo${i + 1}`)];
  const zona = { ...bordes([...atrilG.piezas, ...batuta.piezas], 8), nombre: 'batuta' };
  return {
    nombre: 'mesa-de-los-seis',
    titulo: 'La mesa de los seis',
    vb: [0, 0, ANCHO, ALTO],
    grupos,
    anclas,
    orden: [
      ['base'], ['foto', 'sombra-foto'], ['lampara', 'luz'], ['atril', 'batuta'],
      ...[0, 2, 4].map((i) => [...nombres(seis[i].ag), ...nombres(seis[i + 1].ag)]),
      ['banco', 'banco-sombra'],
      [], golpe,
    ],
    zonas: [zona],
    gestos,
    alEntrar: [],
    alPasar: golpe.map((g) => ({ zona: 'batuta', gesto: g.slice(1) })),
  };
}

const inventos = () => [mesaDeLosSeis()];
export default inventos;
