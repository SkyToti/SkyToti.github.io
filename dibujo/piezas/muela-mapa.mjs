// «La muela-mapa» (CRM dental): una muela grande y amable (sin cara) con cuatro puntos unidos a sus etiquetas, en la
// pantalla de una tableta que sostiene un agente. Al entrar, los puntos se encienden uno por uno en ámbar y sus
// líneas se trazan; al pasar el cursor por la tableta, laten. Lienzo 640×420; la foto real va arriba a la izquierda.
import { ANCHO, ALTO, PISO, grupo, nombres, base, hueco, agenteEn, PL, P, E, R, RR, T } from './tanda1-comun.mjs';

const TAB = { x: 262, y: 146, w: 340, h: 214 };
const PANT = { x: TAB.x + 16, y: TAB.y + 16, w: TAB.w - 32, h: TAB.h - 32 };
const AG = { x: 200, s: 1.3 };

const MUELA = 'M 312 210 C 310 186 336 180 350 192 C 358 198 370 198 378 192 C 392 180 420 186 418 210 C 416 238 410 254 404 272 C 400 292 400 320 390 324 C 380 328 376 302 372 288 C 368 278 360 278 356 288 C 352 302 348 328 338 324 C 328 320 328 292 324 272 C 318 254 312 238 312 210 Z';

const ROTULOS = {
  es: ['agenda', 'pacientes', 'caja', 'WhatsApp'],
  en: ['schedule', 'patients', 'billing', 'WhatsApp'],
};
// punto en la muela → etiqueta (ordenados de arriba abajo: las líneas no se cruzan)
const PUNTOS = [
  { p: [344, 214], y: 196 },
  { p: [394, 228], y: 240 },
  { p: [352, 262], y: 284 },
  { p: [386, 296], y: 328 },
];

function tableta() {
  const { x, y, w, h } = TAB;
  return [
    grupo('tab-sombra', [E([x + w / 2 + 6, PISO + 1], w / 2 + 8, 4, { trama: 'sombra' })], { capa: 'luz' }),
    grupo('tableta', [
      // patitas del atril (la tableta se apoya en la repisa)
      PL([[x + 60, y + h - 2], [x + 48, PISO]], { linea: 'ext' }),
      PL([[x + w - 60, y + h - 2], [x + w - 48, PISO]], { linea: 'ext' }),
      RR(x, y, w, h, 18, { rol: 'marco' }),
      RR(x, y, w, h, 18, { linea: 'ext' }),
      R(PANT.x, PANT.y, PANT.w, PANT.h, { rol: 'pantalla' }),
      R(PANT.x + 4, PANT.y + 4, PANT.w - 8, PANT.h - 8, { trama: 'cielo', op: 0.32 }),
      R(PANT.x, PANT.y, PANT.w, PANT.h, { linea: 'int', tinta: 'viva' }),
      E([x + w - 8, y + h / 2], 3, 3, { linea: 'fino', tinta: 'viva' }),
    ]),
  ];
}

function muela() {
  return grupo('muela', [
    P(MUELA, { rol: 'sobre' }),
    P(MUELA, { linea: 'ext' }),
    // brillo de esmalte (fino, sin cara)
    P('M 326 206 C 326 198 332 194 338 194', { linea: 'fino', tinta: 'apagado' }),
  ]);
}

function punto(i, idioma) {
  const { p, y } = PUNTOS[i];
  const x0 = 452;
  const fin = [x0 - 6, y - 7];
  const cx = (p[0] + fin[0]) / 2 + 10;
  return [
    grupo(`linea${i + 1}`, [
      P(`M ${p[0]} ${p[1]} C ${cx} ${p[1]} ${cx - 20} ${fin[1]} ${fin[0]} ${fin[1]}`, { linea: 'int', tinta: 'hueso' }),
      E(fin, 2.6, 2.6, { rol: 'brillo' }),
      T(ROTULOS[idioma][i], x0, y, { tam: 21, tinta: 'hueso' }),
    ]),
    grupo(`punto${i + 1}`, [
      E(p, 13, 13, { trama: 'ambar', anim: `halo${i + 1}` }),
      E(p, 6.5, 6.5, { rol: 'foco', mueve: [2, 1.5], anim: `punto${i + 1}` }),
      E(p, 6.5, 6.5, { linea: 'int', anim: `punto${i + 1}` }),
    ]),
  ];
}

function agenteTableta() {
  // pose 3 del kit (cargando) adaptada: las dos manos sostienen el canto izquierdo de la tableta
  return agenteEn({
    brazoI: [[-17, -46], [-4, -36], [12, -36], [47, -34]],
    brazoD: [[17, -46], [30, -56], [47, -62]],
    piernaI: [[-7, -22], [-9, -12], [-11, -6]],
    piernaD: [[7, -22], [10, -13], [12, -6]],
    mira: 1,
  }, { x: AG.x, y: PISO, s: AG.s }, 'ag');
}

export function muelaMapa(idioma = 'es') {
  const foto = hueco({ cx: 130, cy: 94, giro: -3 });
  const ag = agenteTableta();
  const puntos = [0, 1, 2, 3].map((i) => punto(i, idioma));
  const anclas = { ...foto.anclas, ...ag.anclas };
  PUNTOS.forEach(({ p }, i) => { anclas[`halo${i + 1}`] = p; anclas[`punto${i + 1}`] = p; });
  const halos = [1, 2, 3, 4].map((k) => `halo${k}`);
  const latido = (k) => ({ tipo: 'opacidad', anims: [`halo${k}`], valores: [1, 1, 0.15, 1, 0.15, 1], dur: [0.01, (k - 1) * 0.1 + 0.01, 0.16, 0.18, 0.16, 0.18] });
  return {
    nombre: `muela-mapa-${idioma}`,
    titulo: idioma === 'en' ? 'The tooth map' : 'La muela-mapa',
    vb: [0, 0, ANCHO, ALTO],
    grupos: [base(), ...foto.grupos, ...tableta(), ...ag.grupos, muela(), ...puntos.flat()],
    anclas,
    orden: [
      ['base', '!apagarHalos'], ['foto', 'sombra-foto'], ['tableta', 'tab-sombra'], nombres(ag), ['muela'],
      ['punto1', 'linea1', '!enciende1'], ['punto2', 'linea2', '!enciende2'], ['punto3', 'linea3', '!enciende3'], ['punto4', 'linea4', '!enciende4'],
      [], ['!encender', '!latido1', '!latido2', '!latido3', '!latido4'],
    ],
    zonas: [{ ...R(TAB.x, TAB.y, TAB.w, TAB.h), nombre: 'tableta' }],
    gestos: {
      encender: { tipo: 'opacidad', anims: ['brillo'], valores: [0.2, 1, 0.4, 1], dur: [0.05, 0.08, 0.06, 0.1] },
      apagarHalos: { tipo: 'opacidad', anims: halos, valores: [0], dur: [0.01] },
      ...Object.fromEntries([1, 2, 3, 4].map((k) => [`enciende${k}`, { tipo: 'opacidad', anims: [`halo${k}`], valores: [0, 1, 0.25, 1], dur: [0.3, 0.06, 0.08, 0.12] }])),
      ...Object.fromEntries([1, 2, 3, 4].map((k) => [`latido${k}`, latido(k)])),
      ...Object.fromEntries([1, 2, 3, 4].map((k) => [`salto${k}`, { tipo: 'escalaY', anims: [`punto${k}`], valores: [1, 1, 1.45, 1, 1.35, 1], dur: [0.01, (k - 1) * 0.1 + 0.01, 0.16, 0.18, 0.16, 0.18] }])),
    },
    alEntrar: [],
    alPasar: [1, 2, 3, 4].flatMap((k) => [{ zona: 'tableta', gesto: `latido${k}` }, { zona: 'tableta', gesto: `salto${k}` }]),
  };
}

const inventos = () => [muelaMapa('es'), muelaMapa('en')];
export default inventos;
