// «El conmutador de noche» (Recepcionista con IA): un teléfono antiguo suena bajo la luna; un agente con diadema
// conecta la clavija en el tablero y salta el globo «¡listo!». Lienzo 640×420; la foto real va arriba a la derecha.
import { ANCHO, ALTO, PISO, grupo, nombres, base, hueco, globo, ondas, estrella, DIADEMA, agenteEn, bordes, L, P, E, R, RR, suaveCordon } from './tanda1-comun.mjs';

const TEL = { x: 115 };
const AG = { x: 330, s: 1.45 };
const JACK = { cols: [424, 484, 544], filas: [226, 268, 309] };
const HOYO = [404, 338]; // de donde sale el cable de la clavija (la repisa del tablero)

function cielo() {
  return grupo('cielo', [
    E([112, 84], 46, 46, { trama: 'hueso', op: 0.35 }),
    P('M 112 52 C 70 52 70 116 112 116 C 92 104 90 64 112 52 Z', { rol: 'sobre' }),
    P('M 112 52 C 70 52 70 116 112 116 C 92 104 90 64 112 52 Z', { linea: 'ext' }),
    ...estrella([196, 46], 10),
    ...estrella([40, 154], 8),
  ]);
}

function telefono() {
  const x = TEL.x, y = PISO;
  const cuerpo = `M ${x - 62} ${y} L ${x + 62} ${y} L ${x + 50} ${y - 50} C ${x + 47} ${y - 60} ${x + 40} ${y - 62} ${x + 30} ${y - 62} L ${x - 30} ${y - 62} C ${x - 40} ${y - 62} ${x - 47} ${y - 60} ${x - 50} ${y - 50} Z`;
  const disco = [x, y - 30];
  const hoyos = [];
  for (let i = 0; i < 7; i++) {
    const a = (-200 + i * 34) * Math.PI / 180;
    hoyos.push(E([disco[0] + 14 * Math.cos(a), disco[1] + 14 * Math.sin(a)], 3.2, 3.2, { rol: 'oscuro', anim: 'telefono' }));
  }
  const tel = [
    P(cuerpo, { rol: 'lampara' }), P(cuerpo, { linea: 'ext' }),
    E(disco, 22, 22, { rol: 'sobre', mueve: [3, 2] }), E(disco, 22, 22, { linea: 'int' }),
    ...hoyos,
    E(disco, 5, 5, { linea: 'fino', tinta: 'noche' }),
    // horquillas donde descansa el auricular
    L([x - 30, y - 62], [x - 34, y - 74], { linea: 'int' }),
    L([x + 30, y - 62], [x + 34, y - 74], { linea: 'int' }),
    // cordón rizado
    suaveCordon([x - 54, y - 64], [x - 58, y - 12], [x - 92, y - 30], 7),
  ].map((p) => ({ ...p, anim: 'telefono' }));
  const aur = 'M -58 -10 C -60 -26 -36 -30 -30 -18 L 30 -18 C 36 -30 60 -26 58 -10 C 56 0 40 2 34 -6 L -34 -6 C -40 2 -56 0 -58 -10 Z';
  const auricular = P(aur.replace(/(-?\d+) (-?\d+)/g, (_, a, b) => `${+a + x} ${+b + y - 70}`), {});
  return [
    grupo('tel-sombra', [E([x + 4, y + 1], 66, 4, { trama: 'sombra' })], { capa: 'luz' }),
    grupo('telefono', tel, { anim: 'telefono' }),
    grupo('auricular', [{ ...auricular, rol: 'lampara' }, { ...auricular, linea: 'ext' }], { anim: 'auricular' }),
    grupo('ring', [...ondas([x - 66, y - 82], -1, { r0: 10, paso: 10 }), ...ondas([x + 66, y - 82], 1, { r0: 10, paso: 10 })], { anim: 'ring' }),
  ];
}

function tablero() {
  const piezas = [
    R(390, 176, 214, 12, { rol: 'teclado' }), R(390, 176, 214, 12, { linea: 'ext' }),
    R(398, 188, 198, 148, { rol: 'marco' }), R(398, 188, 198, 148, { linea: 'ext' }),
    // la repisa de los cables y el mueble de abajo
    R(386, 336, 222, 13, { rol: 'teclado' }), R(386, 336, 222, 13, { linea: 'ext' }),
    R(398, 349, 198, PISO - 349, { rol: 'marco' }), L([398, 349], [398, PISO], { linea: 'ext' }), L([596, 349], [596, PISO], { linea: 'ext' }),
    L([497, 356], [497, PISO - 6], { linea: 'fino', tinta: 'viva' }),
    E([472, 364], 3, 3, { rol: 'casquillo', mueve: [1, 1] }), E([522, 364], 3, 3, { rol: 'casquillo', mueve: [1, 1] }),
  ];
  for (const y of JACK.filas) for (const x of JACK.cols) {
    piezas.push(E([x, y], 7.5, 7.5, { rol: 'oscuro' }), E([x, y], 7.5, 7.5, { linea: 'int' }));
    const prendido = (x === 484 && y === 226) || (x === 544 && y === 268);
    if (!(x === 424 && y === 309)) piezas.push(E([x, y - 17], 4, 4, { rol: prendido ? 'foco' : 'oscuro', mueve: [1, 1] }), E([x, y - 17], 4, 4, { linea: 'fino', tinta: prendido ? 'hueso' : 'viva' }));
  }
  for (const [x] of [[404], [472], [560]]) piezas.push(E([x, 338], 5, 2.2, { rol: 'oscuro' }));
  const otros = [
    E([484, 226], 6, 6, { rol: 'casquillo', mueve: [2, 1] }), E([484, 226], 6, 6, { linea: 'int' }),
    P('M 484 232 C 486 270 462 300 472 338', { linea: 'int', tinta: 'cielo' }),
    E([544, 268], 6, 6, { rol: 'casquillo', mueve: [2, 1] }), E([544, 268], 6, 6, { linea: 'int' }),
    P('M 544 274 C 540 300 566 314 560 338', { linea: 'int', tinta: 'ambar' }),
  ];
  return [grupo('tablero', piezas), grupo('cables', otros)];
}

function agenteDiadema() {
  // pose 5 del kit (diadema) con el brazo derecho estirado hacia el tablero; la clavija va en la mano
  const plug = [
    RR(43, -51.5, 11, 7, 2, { rol: 'casquillo', anim: 'brazo' }), RR(43, -51.5, 11, 7, 2, { linea: 'int', anim: 'brazo' }),
    L([54, -48], [60, -48], { linea: 'int', anim: 'brazo' }),
  ];
  return agenteEn({
    brazoI: [[-17, -46], [-25, -36], [-25, -25]],
    brazoD: [[17, -46], [30, -47], [42, -48]],
    piernaI: [[-7, -22], [-8, -12], [-9, -6]],
    piernaD: [[7, -22], [8, -12], [9, -6]],
    mira: 0.7,
    brazoAnim: true,
    cabezaExtra: DIADEMA,
    delante: plug,
  }, { x: AG.x, y: PISO, s: AG.s }, 'ag');
}

export function conmutador(idioma = 'es') {
  const foto = hueco({ cx: 508, cy: 98, giro: 3 });
  const tel = telefono();
  const [tab, otros] = tablero();
  const ag = agenteDiadema();
  const hombro = ag.anclas.brazo;
  // el cable de la clavija: sube del hoyo de la repisa a la mano (se estira desde el hoyo)
  const cable = grupo('cable', [P(`M ${HOYO[0]} ${HOYO[1]} C ${HOYO[0] + 2} ${HOYO[1] - 12} ${hombro[0] + 44} ${hombro[1] + 10} ${hombro[0] + 37} ${hombro[1] + 1}`, { linea: 'int', tinta: 'hueso' })], { anim: 'cable' });
  const foquito = grupo('foquito', [
    E([424, 292], 11, 11, { trama: 'ambar' }),
    E([424, 292], 4, 4, { rol: 'foco', mueve: [1, 1] }), E([424, 292], 4, 4, { linea: 'fino' }),
  ], { anim: 'foquito' });
  const listo = grupo('globo', globo({ x: 222, y: 112, w: 156, h: 62, cola: [338, 206], texto: idioma === 'en' ? 'done!' : '¡listo!', tam: 30 }), { anim: 'globo' });

  const grupos = [base(), ...foto.grupos, cielo(), ...tel, tab, otros, cable, foquito, ...ag.grupos, listo];
  const zonaTel = { ...bordes([...tel[1].piezas, ...tel[2].piezas], 10), nombre: 'telefono' };
  return {
    nombre: `conmutador-${idioma}`,
    titulo: idioma === 'en' ? 'The night switchboard' : 'El conmutador de noche',
    vb: [0, 0, ANCHO, ALTO],
    grupos,
    anclas: {
      ...foto.anclas, ...ag.anclas,
      telefono: [TEL.x, PISO], auricular: [TEL.x, PISO - 76], ring: [TEL.x, PISO - 82],
      cable: HOYO, foquito: [424, 292], globo: [338, 206],
    },
    orden: [
      ['base', '!brazoAbajo', '!cableFlojo', '!foquitoApagado'],
      ['foto', 'sombra-foto', 'cielo'],
      ['telefono', 'tel-sombra', 'auricular'],
      ['tablero', 'cables'],
      nombres(ag), ['cable', 'foquito'],
      ['ring', '!sonar', '!saltaAuricular', '!timbre'],
      [], [], ['!conectar', '!tensar', '!prender', '!encender'],
      [], ['globo', '!saltaGlobo'],
    ],
    zonas: [zonaTel],
    gestos: {
      encender: { tipo: 'opacidad', anims: ['brillo'], valores: [0.2, 1, 0.4, 1], dur: [0.05, 0.08, 0.06, 0.1] },
      sonar: { tipo: 'giro', anims: ['telefono'], valores: [-5, 5, -5, 5, -4, 4, -2, 0], dur: [0.05, 0.07, 0.07, 0.07, 0.07, 0.07, 0.07, 0.06] },
      saltaAuricular: { tipo: 'mover', anims: ['auricular'], valores: [[0, -10], [0, 0], [0, -8], [0, 0], [0, -5], [0, 0]], dur: [0.08, 0.08, 0.08, 0.08, 0.07, 0.07] },
      timbre: { tipo: 'opacidad', anims: ['ring'], valores: [0.15, 1, 0.15, 1, 0.15, 1], dur: [0.08, 0.08, 0.08, 0.08, 0.08, 0.08] },
      brazoAbajo: { tipo: 'giro', anims: ['brazo'], valores: [18], dur: [0.01] },
      cableFlojo: { tipo: 'escalaY', anims: ['cable'], valores: [0.68], dur: [0.01] },
      foquitoApagado: { tipo: 'opacidad', anims: ['foquito'], valores: [0], dur: [0.01] },
      conectar: { tipo: 'giro', anims: ['brazo'], valores: [22, 0, 1.5, 0], dur: [0.12, 0.3, 0.06, 0.08] },
      tensar: { tipo: 'escalaY', anims: ['cable'], valores: [0.6, 1, 1.05, 1], dur: [0.12, 0.3, 0.06, 0.08] },
      prender: { tipo: 'opacidad', anims: ['foquito'], valores: [0, 1, 0.3, 1], dur: [0.44, 0.04, 0.07, 0.08] },
      saltaGlobo: { tipo: 'escalaY', anims: ['globo'], valores: [0.15, 1.2, 0.92, 1], dur: [0.01, 0.16, 0.1, 0.1] },
    },
    alEntrar: [],
    alPasar: [{ zona: 'telefono', gesto: 'sonar' }, { zona: 'telefono', gesto: 'saltaAuricular' }, { zona: 'telefono', gesto: 'timbre' }],
  };
}

const inventos = () => [conmutador('es'), conmutador('en')];
export default inventos;
