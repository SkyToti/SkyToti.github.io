// El agente: robotito con cabeza de foco que se enciende en ámbar. Cuerpo simple, dos puntitos por ojos
// (nada de cara humana). Origen = el suelo entre los pies; mira hacia +x cuando camina.
import { L, PL, PG, P, E, RR } from '../kit/formas.mjs';
import { juntar, mover } from './haku.mjs';

const FOCO = 'M -8 -62 C -8 -67 -19 -72 -19 -84 C -19 -95 -10 -103 0 -103 C 10 -103 19 -95 19 -84 C 19 -72 8 -67 8 -62 Z';

export const GESTOS_AGENTE = {
  encender: { tipo: 'opacidad', anims: ['brillo'], valores: [0.2, 1, 0.4, 1], dur: [0.05, 0.08, 0.06, 0.1] },
  saludar: { tipo: 'giro', anims: ['brazo'], valores: [-18, 10, -10, 0], dur: [0.16, 0.18, 0.16, 0.2] },
};

function brazo(pts, extra = {}) {
  const fin = pts.at(-1);
  return [
    PL(pts, { linea: 'ext', ...extra }),
    E(fin, 4, 4, { rol: 'casquillo', ...extra }),
    E(fin, 4, 4, { linea: 'int', ...extra }),
  ];
}
function pierna(pts, extra = {}) {
  const [x] = pts.at(-1);
  const d = pts.at(-1)[0] - pts[0][0] >= 0 ? 1 : -1;
  return [
    PL(pts, { linea: 'ext', ...extra }),
    RR(x - 6 + d * 2, -6, 13, 6, 2.5, { rol: 'robot', ...extra }),
    RR(x - 6 + d * 2, -6, 13, 6, 2.5, { linea: 'int', ...extra }),
  ];
}

/**
 * Un agente con sus extremidades como polilíneas (hombros en ±17,-46; caderas en ±7,-22).
 * atras/delante: grupos de piezas detrás del cuerpo o delante de todo. anim: envuelve todo (p. ej. «agente»).
 */
export function agente({ brazoI, brazoD, piernaI, piernaD, mira = 0, atras = [], delante = [], cabezaExtra = [], anim = null, brazoAnim = false, brillo = true }) {
  const a = anim ? { anim } : {};
  const ojo = (dx) => E([dx + mira * 4, -84], 2.4, 3.1, { rol: 'oscuro', ...a });
  const grupos = [
    { nombre: 'sombra', capa: 'luz', piezas: [E([0, 1.5], 24, 3.5, { trama: 'sombra', ...a })] },
  ];
  if (brillo) grupos.push({ nombre: 'brillo', capa: 'luz', piezas: [E([0, -84], 31, 31, { trama: 'ambar', anim: anim || 'brillo' })] });
  if (atras.length) grupos.push({ nombre: 'atras', piezas: atras.map((p) => ({ ...p, ...a })) });
  grupos.push(
    { nombre: 'piernas', piezas: [...pierna(piernaI, a), ...pierna(piernaD, a)] },
    { nombre: 'cuerpo', piezas: [
      RR(-17, -55, 34, 33, 7, { rol: 'robot', ...a }),
      RR(-17, -55, 34, 33, 7, { linea: 'ext', ...a }),
      E([0, -42], 4.2, 4.2, { rol: 'foco', mueve: [1, 1], ...a }),
      E([0, -42], 4.2, 4.2, { linea: 'fino', ...a }),
      L([-9, -31], [-3, -31], { linea: 'fino', ...a }),
      L([3, -31], [9, -31], { linea: 'fino', ...a }),
      RR(-8.5, -63, 17, 9, 2, { rol: 'casquillo', ...a }),
      RR(-8.5, -63, 17, 9, 2, { linea: 'int', ...a }),
      L([-8, -59.5], [8, -57.5], { linea: 'fino', tinta: 'noche', ...a }),
    ] },
    { nombre: 'cabeza', piezas: [
      P(FOCO, { rol: 'foco', ...a }),
      P(FOCO, { linea: 'ext', ...a }),
      P('M -13 -87 C -13 -93 -9 -97 -4 -98.5', { linea: 'fino', ...a }),
      ojo(-5), ojo(5),
      ...cabezaExtra.map((p) => ({ ...p, ...a })),
    ] },
    { nombre: 'brazos', piezas: [...brazo(brazoI, a), ...brazo(brazoD, brazoAnim ? { anim: 'brazo' } : a)] },
  );
  if (delante.length) grupos.push({ nombre: 'delante', piezas: delante.map((p) => ({ ...p, ...a })) });
  const anclas = { brillo: [0, -84], brazo: brazoD[0], ...(anim ? { [anim]: [0, 0] } : {}) };
  return { grupos, anclas };
}

const BLOQUE = (x, y, w = 28, h = 26) => [
  RR(x, y, w, h, 3, { rol: 'bloque' }),
  RR(x, y, w, h, 3, { linea: 'ext' }),
  PL([[x + w * 0.3, y + h * 0.32], [x + w * 0.18, y + h * 0.5], [x + w * 0.3, y + h * 0.68]], { linea: 'fino', tinta: 'noche' }),
  L([x + w * 0.56, y + h * 0.26], [x + w * 0.44, y + h * 0.74], { linea: 'fino', tinta: 'noche' }),
  PL([[x + w * 0.7, y + h * 0.32], [x + w * 0.82, y + h * 0.5], [x + w * 0.7, y + h * 0.68]], { linea: 'fino', tinta: 'noche' }),
];

export function agenteCargando(o = {}) {
  return agente({
    brazoI: [[-17, -46], [-6, -58], [6, -62]],
    brazoD: [[17, -46], [30, -42], [37, -50]],
    piernaI: [[-7, -22], [-10, -12], [-13, -6]],
    piernaD: [[7, -22], [11, -13], [13, -6]],
    mira: 1,
    delante: BLOQUE(8, -68, 30, 27),
    ...o,
  });
}

const S = 1.4; // en la hoja, el agente se dibuja a 1.4×

export function poses() {
  const hoja = (p) => mover(p, { s: S });
  const parado = agente({
    brazoI: [[-17, -46], [-25, -36], [-25, -25]],
    brazoD: [[17, -46], [25, -36], [25, -25]],
    piernaI: [[-7, -22], [-8, -12], [-9, -6]],
    piernaD: [[7, -22], [8, -12], [9, -6]],
    brazoAnim: true,
  });
  const caminando = agente({
    brazoI: [[-17, -46], [-25, -40], [-31, -32]],
    brazoD: [[17, -46], [26, -44], [32, -36]],
    piernaI: [[-6, -22], [-12, -13], [-17, -6]],
    piernaD: [[6, -22], [13, -14], [17, -6]],
    mira: 1,
    atras: [
      L([-46, -60], [-34, -60], { linea: 'int', tinta: 'apagado' }),
      L([-50, -46], [-36, -46], { linea: 'int', tinta: 'apagado' }),
      L([-44, -32], [-36, -32], { linea: 'fino', tinta: 'apagado' }),
    ],
  });
  const ang = Math.atan2(-22, 8), ux = Math.cos(ang), uy = Math.sin(ang), nx = -uy, ny = ux;
  const cab = [26 + ux * 26, -80 + uy * 26];
  const esq = (a, b) => [cab[0] + nx * a + ux * b, cab[1] + ny * a + uy * b];
  const martillando = agente({
    brazoI: [[-17, -46], [-25, -36], [-24, -25]],
    brazoD: [[17, -48], [30, -62], [26, -80]],
    piernaI: [[-7, -22], [-9, -12], [-10, -6]],
    piernaD: [[7, -22], [9, -12], [10, -6]],
    mira: 0.8,
    delante: [
      L([26, -80], cab, { linea: 'int' }),
      PG([esq(-7, -6), esq(13, -6), esq(13, 6), esq(-7, 6)], { rol: 'martillo' }),
      PG([esq(-7, -6), esq(13, -6), esq(13, 6), esq(-7, 6)], { linea: 'ext' }),
      PL([esq(-7, -6), esq(-14, -3), esq(-14, 3), esq(-7, 6)], { linea: 'int' }),
      RR(26, -9, 46, 9, 2, { rol: 'mesa' }),
      RR(26, -9, 46, 9, 2, { linea: 'ext' }),
      L([49, -9], [49, -24], { linea: 'int' }),
      L([44, -24], [54, -24], { linea: 'int' }),
      L([40, -30], [35, -36], { linea: 'fino', tinta: 'ambar' }),
      L([49, -32], [49, -40], { linea: 'fino', tinta: 'ambar' }),
      L([58, -30], [63, -36], { linea: 'fino', tinta: 'ambar' }),
    ],
  });
  const cargando = agenteCargando();
  const diadema = agente({
    brazoI: [[-17, -46], [-25, -36], [-25, -25]],
    brazoD: [[17, -46], [32, -58], [27, -76]],
    piernaI: [[-7, -22], [-8, -12], [-9, -6]],
    piernaD: [[7, -22], [8, -12], [9, -6]],
    mira: -0.3,
    cabezaExtra: [
      P('M -21 -84 C -23 -116 23 -116 21 -84', { linea: 'int' }),
      E([-21, -84], 4.8, 8.5, { rol: 'auricular' }), E([-21, -84], 4.8, 8.5, { linea: 'int' }),
      E([21, -84], 4.8, 8.5, { rol: 'auricular' }), E([21, -84], 4.8, 8.5, { linea: 'int' }),
      P('M 22 -76 C 23 -66 16 -62 8 -64', { linea: 'fino' }),
      E([7, -64], 3, 3, { rol: 'oscuro' }), E([7, -64], 3, 3, { linea: 'fino' }),
    ],
    delante: [
      P('M -36 -94 C -40 -88 -40 -80 -36 -74', { linea: 'fino', tinta: 'cielo' }),
      P('M -42 -98 C -48 -88 -48 -76 -42 -70', { linea: 'fino', tinta: 'cielo' }),
    ],
  });
  const gestos = GESTOS_AGENTE;
  return [
    { nombre: 'agente-parado', titulo: 'El agente, parado', ...hoja(parado), gestos, alEntrar: ['encender', 'saludar'] },
    { nombre: 'agente-caminando', titulo: 'El agente caminando', ...hoja(caminando), gestos, alEntrar: ['encender'] },
    { nombre: 'agente-cargando', titulo: 'El agente cargando un bloque', ...hoja(cargando), gestos, alEntrar: ['encender'] },
    { nombre: 'agente-martillando', titulo: 'El agente martillando', ...hoja(martillando), gestos, alEntrar: ['encender'] },
    { nombre: 'agente-diadema', titulo: 'El agente con diadema de telefonista', ...hoja(diadema), gestos, alEntrar: ['encender'] },
  ];
}

export { juntar };
