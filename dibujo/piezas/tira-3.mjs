// «La tira» · viñeta 3: Exijo pruebas. Una máquina de sellos con su rótulo «PRUEBAS»: la pieza entra, sale
// rechazada (tache coral) y rebota hacia atrás; el agente la arregla de un martillazo (le queda un parche); vuelve a
// entrar y sale con la palomita ámbar y el sello estampado. Es el corazón de la tira: se entiende sin leer.
// Último cuadro (sin JS): la pieza parchada y sellada a la salida, la luz ámbar prendida y la aguja en «bien».
// Lo que solo existe durante la animación (tache, chispas, luz coral) lleva data-g propio y la tira lo oculta en quieto.
import { L, PL, PG, P, E, R, RR, T } from '../kit/formas.mjs';
import { agente } from './agente.mjs';
import { mover } from './haku.mjs';
import { ANCHO, ALTO, X0, X1, CORAL, fondo, marco } from './tira-1.mjs';

const BANDA = 300;
const AG = { x: 92, y: 318, s: 1.1 };
const PZ = { w: 56, h: 46, fin: 400 }; // la pieza: ancho, alto y centro x final (bajo el sello)
const X_AGENTE = 172; // centro x de la pieza frente al agente
const X_DENTRO = 282; // centro x de la pieza escondida en la máquina
const MQ = { x: 216, y: 128, w: 130, h: BANDA - 128 };
const SELLO_BAJA = 34;

function banda() {
  const piezas = [
    R(X0, BANDA, X1 - X0, ALTO, { rol: 'mesa', mueve: [0, 0] }),
    R(X0, BANDA, X1 - X0, 11, { rol: 'teclado', mueve: [0, 0] }),
    L([X0, BANDA], [X1, BANDA], { linea: 'ext' }),
    L([X0, BANDA + 11], [X1, BANDA + 11], { linea: 'int' }),
  ];
  for (let x = 52; x < X1 - 10; x += 92) {
    piezas.push(E([x, 346], 12, 12, { rol: 'casquillo', mueve: [3, 2] }), E([x, 346], 12, 12, { linea: 'int' }), E([x, 346], 3, 3, { rol: 'oscuro' }));
  }
  return { nombre: 'banda', piezas };
}

function elAgente() {
  // el agente martillando (misma geometría que la hoja de personajes), con el brazo y el martillo como un ancla
  const ang = Math.atan2(-22, 8), ux = Math.cos(ang), uy = Math.sin(ang), nx = -uy, ny = ux;
  const cab = [26 + ux * 26, -80 + uy * 26];
  const esq = (a, b) => [cab[0] + nx * a + ux * b, cab[1] + ny * a + uy * b];
  const b = { anim: 'brazo' };
  const ag = agente({
    brazoI: [[-17, -46], [-25, -36], [-24, -25]],
    brazoD: [[17, -48], [30, -62], [26, -80]],
    piernaI: [[-7, -22], [-9, -12], [-10, -6]],
    piernaD: [[7, -22], [9, -12], [10, -6]],
    mira: 0.8,
    brazoAnim: true,
    delante: [
      L([26, -80], cab, { linea: 'int', ...b }),
      PG([esq(-7, -6), esq(13, -6), esq(13, 6), esq(-7, 6)], { rol: 'martillo', ...b }),
      PG([esq(-7, -6), esq(13, -6), esq(13, 6), esq(-7, 6)], { linea: 'ext', ...b }),
      PL([esq(-7, -6), esq(-14, -3), esq(-14, 3), esq(-7, 6)], { linea: 'int', ...b }),
    ],
  });
  const p = mover(ag, AG);
  return { grupos: p.grupos.map((g) => ({ ...g, nombre: `ag-${g.nombre}` })), anclas: { brazo: p.anclas.brazo } };
}

function pieza() {
  const x = PZ.fin - PZ.w / 2, y = BANDA - PZ.h, a = { anim: 'pieza' };
  return [
    { nombre: 'pieza', piezas: [
      E([PZ.fin + 2, BANDA + 1], PZ.w / 2 + 4, 3.5, { trama: 'sombra', ...a }),
      RR(x, y, PZ.w, PZ.h, 4, { rol: 'sobre', ...a }),
      RR(x, y, PZ.w, PZ.h, 4, { linea: 'ext', ...a }),
      L([x + 4, y + 9], [x + PZ.w - 4, y + 9], { linea: 'fino', tinta: 'noche', ...a }),
      PL([[x + 12, y + 20], [x + 6, y + 28], [x + 12, y + 36]], { linea: 'int', tinta: 'noche', remate: 0, ...a }),
      L([x + 21, y + 18], [x + 16, y + 38], { linea: 'int', tinta: 'noche', ...a }),
      PL([[x + 25, y + 20], [x + 31, y + 28], [x + 25, y + 36]], { linea: 'int', tinta: 'noche', remate: 0, ...a }),
    ] },
    // el parche que le deja el martillazo (viaja con la pieza; aparece con el golpe)
    { nombre: 'parche', piezas: [
      PG([[x + PZ.w - 22, y - 3], [x + PZ.w + 3, y + 16], [x + PZ.w - 3, y + 24], [x + PZ.w - 28, y + 5]], { rol: 'casquillo', mueve: [2, 2], anim: 'parche' }),
      PG([[x + PZ.w - 22, y - 3], [x + PZ.w + 3, y + 16], [x + PZ.w - 3, y + 24], [x + PZ.w - 28, y + 5]], { linea: 'int', anim: 'parche' }),
      L([x + PZ.w - 19, y + 6], [x + PZ.w - 16, y + 2], { linea: 'fino', tinta: 'noche', anim: 'parche' }),
      L([x + PZ.w - 12, y + 12], [x + PZ.w - 9, y + 8], { linea: 'fino', tinta: 'noche', anim: 'parche' }),
      L([x + PZ.w - 5, y + 17], [x + PZ.w - 2, y + 13], { linea: 'fino', tinta: 'noche', anim: 'parche' }),
    ] },
  ];
}

function maquina() {
  const { x, y, w, h } = MQ, a = { anim: 'maquina' };
  const cx = x + w / 2;
  const gauge = [x + 38, y + 44];
  const piezas = [
    RR(x, y, w, h + 4, 10, { rol: 'robot', ...a }),
    RR(x, y, w, h + 4, 10, { linea: 'ext', ...a }),
    // patas del rótulo
    L([cx - 34, y], [cx - 34, y - 22], { linea: 'int', ...a }),
    L([cx + 34, y], [cx + 34, y - 22], { linea: 'int', ...a }),
    // carátula con su escala
    E(gauge, 21, 21, { rol: 'sobre', mueve: [2, 2], ...a }),
    E(gauge, 21, 21, { linea: 'int', ...a }),
    P(`M ${gauge[0] - 14} ${gauge[1] + 4} C ${gauge[0] - 12} ${gauge[1] - 12} ${gauge[0] - 4} ${gauge[1] - 15} ${gauge[0]} ${gauge[1] - 15}`, { linea: 'int', tinta: CORAL, ...a }),
    P(`M ${gauge[0]} ${gauge[1] - 15} C ${gauge[0] + 4} ${gauge[1] - 15} ${gauge[0] + 12} ${gauge[1] - 12} ${gauge[0] + 14} ${gauge[1] + 4}`, { linea: 'int', tinta: 'ambar', ...a }),
    // focos: coral (apagado) y ámbar
    E([x + 86, y + 36], 10, 10, { rol: 'oscuro', ...a }), E([x + 86, y + 36], 10, 10, { linea: 'int', ...a }),
    E([x + 110, y + 36], 10, 10, { rol: 'oscuro', ...a }), E([x + 110, y + 36], 10, 10, { linea: 'int', ...a }),
    // rejilla y tornillos
    ...[0, 1, 2].map((k) => L([x + 74, y + 66 + k * 10], [x + 120, y + 66 + k * 10], { linea: 'fino', tinta: 'noche', ...a })),
    ...[[x + 10, y + 10], [x + w - 10, y + 10]].map((c) => E(c, 2.6, 2.6, { rol: 'oscuro', ...a })),
    // la boca: cortinas a la entrada y a la salida (la pieza pasa por detrás)
    R(x + 8, BANDA - 54, w - 16, 54, { rol: 'pantalla', ...a }),
    L([x + 8, BANDA - 54], [x + w - 8, BANDA - 54], { linea: 'int', ...a }),
    ...[0, 1, 2, 3, 4].flatMap((k) => [
      L([x + 2 + k * 4, BANDA - 52], [x + 2 + k * 4, BANDA - 2], { linea: 'fino', tinta: 'apagado', ...a }),
      L([x + w - 2 - k * 4, BANDA - 52], [x + w - 2 - k * 4, BANDA - 2], { linea: 'fino', tinta: 'apagado', ...a }),
    ]),
    // brazo del sello
    PL([[x + w, y + 22], [PZ.fin, y + 22], [PZ.fin, y + 46]], { linea: 'ext', remate: 0, ...a }),
  ];
  const rotulo = [
    RR(cx - 62, y - 62, 124, 42, 6, { rol: 'oscuro', mueve: [3, 3], ...a }),
    RR(cx - 62, y - 62, 124, 42, 6, { linea: 'ext', ...a }),
  ];
  const s = { anim: 'sello' };
  const sello = [
    E([PZ.fin, y + 54], 9, 7, { rol: 'casquillo', ...s }), E([PZ.fin, y + 54], 9, 7, { linea: 'int', ...s }),
    R(PZ.fin - 4, y + 60, 8, 10, { rol: 'casquillo', ...s }), R(PZ.fin - 4, y + 60, 8, 10, { linea: 'fino', ...s }),
    RR(PZ.fin - 21, y + 69, 42, 17, 3, { rol: 'libro3', ...s }), RR(PZ.fin - 21, y + 69, 42, 17, 3, { linea: 'ext', ...s }),
    R(PZ.fin - 18, y + 86, 36, 6, { rol: 'libro2', mueve: [0, 0], ...s }), L([PZ.fin - 18, y + 92], [PZ.fin + 18, y + 92], { linea: 'int', ...s }),
  ];
  return {
    grupos: [
      { nombre: 'maquina', piezas },
      { nombre: 'rotulo', piezas: rotulo },
      { nombre: 'rotulo-es', piezas: [T('PRUEBAS', cx, y - 33, { tam: 25, ancla: 'middle', tinta: 'ambar', anim: 'maquina' })] },
      { nombre: 'rotulo-en', piezas: [T('TESTS', cx, y - 33, { tam: 27, ancla: 'middle', tinta: 'ambar', anim: 'maquina' })] },
      { nombre: 'aguja', piezas: [L(gauge, [gauge[0] + 11, gauge[1] - 9], { linea: 'int', tinta: 'noche', anim: 'aguja' }), E(gauge, 3, 3, { rol: 'oscuro', anim: 'aguja' })] },
      { nombre: 'luz-mal', piezas: [
        E([x + 86, y + 36], 7, 7, { linea: 'ext', tinta: CORAL, anim: 'luzMal' }),
        E([x + 86, y + 36], 3, 3, { linea: 'ext', tinta: CORAL, anim: 'luzMal' }),
      ] },
      { nombre: 'luz-bien', capa: 'arriba', piezas: [
        E([x + 110, y + 36], 17, 17, { trama: 'ambar', anim: 'luzBien' }),
        E([x + 110, y + 36], 7.5, 7.5, { rol: 'foco', mueve: [0, 0], anim: 'luzBien' }),
      ] },
      // el vástago entre el brazo y el sello: se estira cuando el sello baja
      { nombre: 'piston', piezas: [R(PZ.fin - 3, y + 44, 6, 6, { rol: 'casquillo', mueve: [0, 0], anim: 'piston' }), R(PZ.fin - 3, y + 44, 6, 6, { linea: 'fino', anim: 'piston' })] },
      { nombre: 'sello', piezas: sello },
    ],
    anclas: { aguja: gauge, maquina: [x + w / 2, BANDA], sello: [PZ.fin, y + 70], piston: [PZ.fin, y + 44] },
  };
}

export function tira3() {
  const ag = elAgente();
  const mq = maquina();
  const marcaC = [PZ.fin + 13, BANDA - 19];
  const grupos = [
    fondo(),
    ...ag.grupos,
    banda(),
    ...pieza(),
    ...mq.grupos,
    { nombre: 'marca', piezas: [
      E(marcaC, 10.5, 10.5, { linea: 'int', tinta: 'ambar', anim: 'marca' }),
      PL([[marcaC[0] - 5, marcaC[1]], [marcaC[0] - 1, marcaC[1] + 4.5], [marcaC[0] + 6, marcaC[1] - 5]], { linea: 'int', tinta: 'ambar', remate: 0, anim: 'marca' }),
    ] },
    { nombre: 'palomita', piezas: [
      E([462, 232], 26, 26, { trama: 'ambar', op: 0.5, anim: 'palomita' }),
      PL([[448, 232], [459, 245], [479, 214]], { linea: 'ext', tinta: 'ambar', anim: 'palomita' }),
    ] },
    // solo durante la animación
    { nombre: 'tache', piezas: [
      L([X_AGENTE - 14, 214], [X_AGENTE + 14, 242], { linea: 'ext', tinta: CORAL, anim: 'tache' }),
      L([X_AGENTE + 14, 214], [X_AGENTE - 14, 242], { linea: 'ext', tinta: CORAL, anim: 'tache' }),
    ] },
    { nombre: 'chispas', piezas: [
      L([X_AGENTE - 30, 246], [X_AGENTE - 40, 238], { linea: 'int', tinta: 'ambar', anim: 'chispas' }),
      L([X_AGENTE - 4, 236], [X_AGENTE - 4, 224], { linea: 'int', tinta: 'ambar', anim: 'chispas' }),
      L([X_AGENTE + 22, 246], [X_AGENTE + 32, 238], { linea: 'int', tinta: 'ambar', anim: 'chispas' }),
    ] },
    ...marco(),
  ];
  const dx = (xc) => xc - PZ.fin;
  return {
    nombre: 'tira-3',
    titulo: 'La máquina de pruebas: la pieza sale rechazada, la arreglan a martillazos y sale sellada',
    vb: [0, 0, ANCHO, ALTO],
    grupos,
    anclas: { ...ag.anclas, ...mq.anclas, pieza: [PZ.fin, BANDA], tache: [X_AGENTE, 228], palomita: [462, 230], marca: marcaC },
    gestos: {
      // posiciones de la pieza (desplazamiento x respecto a su lugar final)
      recorrido: { tipo: 'mover', anims: ['pieza', 'parche'], valores: [[dx(X_AGENTE), 0], [dx(X_DENTRO), 0], [dx(MQ.x - PZ.w / 2), 0]], dur: [0, 0.7, 0] },
      golpe: { tipo: 'giro', anims: ['brazo'], valores: [-14, 62, 0], dur: [0.16, 0.09, 0.22] },
      sello: { tipo: 'mover', anims: ['sello'], valores: [[0, SELLO_BAJA], [0, 0]], dur: [0.12, 0.3] },
      aguja: { tipo: 'giro', anims: ['aguja'], valores: [-130, -40, 0], dur: [0, 0.3, 0.3] },
    },
    alEntrar: [],
    alPasar: [],
  };
}
