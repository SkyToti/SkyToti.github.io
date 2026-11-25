// «La bóveda con ventanilla» (minecraft-rcon-mcp): la puerta redonda de una caja fuerte con su volante, una máquina
// de turnos que da un papelito («folio»), un agente en fila con su tarjeta y un sello. Al entrar, una tarjeta rebota
// contra la puerta con un tache; luego baja el sello «aprobado» sobre el folio y el volante gira media vuelta.
// Al pasar el cursor por el volante, gira. Lienzo 640×420; la foto real va arriba a la izquierda.
import { ANCHO, ALTO, PISO, grupo, nombres, base, hueco, caja, agenteEn, L, PG, P, E, R, RR, T } from './tanda1-comun.mjs';

const PUERTA = { c: [512, 254], r: 92 };
const MAQ = { x: 300 };
const FOLIO = { x: 252, y: 248, w: 96, h: 84 };
const MARCA = [300, 306];
const SELLO = [222, PISO]; // en reposo, sobre la repisa
const SUELO_TARJETA = [376, 362];
const ROJO = '#F0776B';
const AG = { x: 140, s: 1.35 };

function boveda() {
  const [cx, cy] = PUERTA.c, r = PUERTA.r;
  const pernos = [];
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 + 0.3;
    const p = [cx + (r - 9) * Math.cos(a), cy + (r - 9) * Math.sin(a)];
    pernos.push(E(p, 4.5, 4.5, { rol: 'oscuro' }), E(p, 4.5, 4.5, { linea: 'fino' }));
  }
  return [
    grupo('muro', [
      R(404, 130, 214, PISO - 130, { rol: 'marco' }),
      R(404, 130, 214, PISO - 130, { linea: 'ext' }),
      ...[[418, 144], [604, 144], [418, 364], [604, 364]].map((c) => E(c, 3.5, 3.5, { linea: 'fino', tinta: 'viva' })),
    ]),
    grupo('puerta', [
      E([cx, cy], r, r, { rol: 'casquillo' }), E([cx, cy], r, r, { linea: 'ext' }),
      E([cx, cy], r - 20, r - 20, { rol: 'robot', mueve: [3, 2] }), E([cx, cy], r - 20, r - 20, { linea: 'int' }),
      ...pernos,
      // bisagras
      RR(cx - r - 10, cy - 52, 16, 26, 3, { rol: 'teclado' }), RR(cx - r - 10, cy - 52, 16, 26, 3, { linea: 'int' }),
      RR(cx - r - 10, cy + 26, 16, 26, 3, { rol: 'teclado' }), RR(cx - r - 10, cy + 26, 16, 26, 3, { linea: 'int' }),
    ]),
  ];
}

function volante() {
  const [cx, cy] = PUERTA.c;
  const piezas = [E([cx, cy], 40, 40, { linea: 'ext' })];
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI + Math.PI / 2;
    const p0 = [cx + 50 * Math.cos(a), cy + 50 * Math.sin(a)], p1 = [cx - 50 * Math.cos(a), cy - 50 * Math.sin(a)];
    piezas.push(L(p0, p1, { linea: 'ext' }));
    for (const p of [p0, p1]) piezas.push(E(p, 7, 7, { rol: 'foco', mueve: [2, 2] }), E(p, 7, 7, { linea: 'int' }));
  }
  piezas.push(E([cx, cy], 13, 13, { rol: 'casquillo', mueve: [2, 2] }), E([cx, cy], 13, 13, { linea: 'int' }));
  return grupo('volante', piezas, { anim: 'volante' });
}

function maquina(idioma) {
  const x = MAQ.x, f = FOLIO;
  return [
    grupo('maq-sombra', [E([x + 2, PISO + 1], 30, 3.5, { trama: 'sombra' })], { capa: 'luz' }),
    grupo('maquina', [
      // poste con su pie
      R(x - 5, 250, 10, PISO - 254, { rol: 'teclado' }), L([x - 5, 250], [x - 5, PISO - 6], { linea: 'int' }), L([x + 5, 250], [x + 5, PISO - 6], { linea: 'int' }),
      P(`M ${x - 26} ${PISO} C ${x - 24} ${PISO - 8} ${x + 24} ${PISO - 8} ${x + 26} ${PISO} Z`, { rol: 'teclado' }),
      P(`M ${x - 26} ${PISO} C ${x - 24} ${PISO - 8} ${x + 24} ${PISO - 8} ${x + 26} ${PISO} Z`, { linea: 'ext' }),
      // la caja de turnos
      RR(x - 44, 178, 88, 72, 12, { rol: 'lampara' }), RR(x - 44, 178, 88, 72, 12, { linea: 'ext' }),
      R(x - 28, 190, 56, 30, { rol: 'pantalla' }), R(x - 28, 190, 56, 30, { linea: 'int' }),
      T('07', x, 213, { tam: 22, ancla: 'middle', tinta: 'cielo' }),
      R(x - 30, 238, 60, 6, { rol: 'oscuro' }),
    ]),
    grupo('folio', [
      R(f.x, f.y, f.w, f.h, { rol: 'sobre', op: 1 }),
      R(f.x, f.y, f.w, f.h, { linea: 'int' }),
      T(idioma === 'en' ? 'ticket' : 'folio', x, f.y + 22, { tam: 17, ancla: 'middle', tinta: 'noche' }),
      L([f.x + 14, f.y + 32], [f.x + f.w - 14, f.y + 32], { linea: 'fino', tinta: 'apagado', punteado: '4 4' }),
    ]),
  ];
}

function marca(idioma) {
  const pts = caja(MARCA[0], MARCA[1] + 2, 86, 30, -6);
  return grupo('marca', [
    PG(pts, { linea: 'int', tinta: 'ambar' }),
    T(idioma === 'en' ? 'approved' : 'aprobado', MARCA[0], MARCA[1] + 8, { tam: 13, ancla: 'middle', tinta: 'ambar', peso: 800 }),
  ], { anim: 'marca' });
}

function sello() {
  const [x, y] = SELLO;
  return grupo('sello', [
    RR(x - 30, y - 24, 60, 18, 4, { rol: 'libro3' }), RR(x - 30, y - 24, 60, 18, 4, { linea: 'ext' }),
    R(x - 27, y - 6, 54, 6, { rol: 'papel', mueve: [1, 1] }), L([x - 27, y], [x + 27, y], { linea: 'int' }),
    P(`M ${x - 7} ${y - 24} C ${x - 6} ${y - 30} ${x - 9} ${y - 34} ${x - 9} ${y - 38} L ${x + 9} ${y - 38} C ${x + 9} ${y - 34} ${x + 6} ${y - 30} ${x + 7} ${y - 24} Z`, { rol: 'libro2' }),
    P(`M ${x - 7} ${y - 24} C ${x - 6} ${y - 30} ${x - 9} ${y - 34} ${x - 9} ${y - 38} L ${x + 9} ${y - 38} C ${x + 9} ${y - 34} ${x + 6} ${y - 30} ${x + 7} ${y - 24} Z`, { linea: 'int' }),
    E([x, y - 49], 15, 12, { rol: 'libro2' }), E([x, y - 49], 15, 12, { linea: 'ext' }),
  ], { anim: 'sello' });
}

function tarjeta(c, giro, extra = {}, w = 36, h = 24) {
  const pts = caja(c[0], c[1], w, h, giro);
  const banda = caja(c[0], c[1] - h * 0.12, w, h * 0.2, giro);
  return [PG(pts, { rol: 'libro1', ...extra }), PG(pts, { linea: 'int', ...extra }), PG(banda, { rol: 'oscuro', ...extra })];
}

function agenteFila() {
  // en fila, mirando a la ventanilla, con su tarjeta en la mano (pose 1 del kit con el brazo adelante)
  return agenteEn({
    brazoI: [[-17, -46], [-25, -36], [-25, -25]],
    brazoD: [[17, -46], [29, -46], [38, -52]],
    piernaI: [[-7, -22], [-8, -12], [-9, -6]],
    piernaD: [[7, -22], [8, -12], [9, -6]],
    mira: 1,
    delante: tarjeta([47, -61], -10, {}, 26, 17),
  }, { x: AG.x, y: PISO, s: AG.s }, 'ag');
}

export function boveda_(idioma = 'es') {
  const foto = hueco({ cx: 128, cy: 94, giro: -3 });
  const ag = agenteFila();
  const mano = [AG.x + 47 * AG.s, PISO - 61 * AG.s];
  const S = SUELO_TARJETA;
  const rel = ([x, y]) => [Math.round(x - S[0]), Math.round(y - S[1])];
  // la tarjeta que vuela: sale de junto a la mano, pasa por arriba de la máquina, pega en la puerta y cae
  const viaje = [rel([mano[0] + 6, mano[1] - 6]), rel([300, 150]), rel([428, 262]), rel([394, 226]), [0, 0]];
  const durViaje = [0.01, 0.22, 0.2, 0.16, 0.26];
  const sube = [SELLO[0], SELLO[1]];
  const enFolio = [MARCA[0] - sube[0], MARCA[1] + 18 - sube[1]];
  const grupos = [
    base(), ...foto.grupos, ...boveda(), volante(), ...maquina(idioma), marca(idioma), sello(),
    grupo('tarjeta', tarjeta(S, 16, { anim: 'tarjeta' })),
    grupo('tache', [L([S[0] - 12, S[1] - 11], [S[0] + 12, S[1] + 11], { linea: 'ext', tinta: ROJO }), L([S[0] + 12, S[1] - 11], [S[0] - 12, S[1] + 11], { linea: 'ext', tinta: ROJO })], { anim: 'tache' }),
    ...ag.grupos,
  ];
  return {
    nombre: `boveda-${idioma}`,
    titulo: idioma === 'en' ? 'The vault with a service window' : 'La bóveda con ventanilla',
    vb: [0, 0, ANCHO, ALTO],
    grupos,
    anclas: { ...foto.anclas, ...ag.anclas, volante: PUERTA.c, tarjeta: S, tache: S, sello: SELLO, marca: MARCA },
    orden: [
      ['base', '!tarjetaEnMano', '!tacheEnMano', '!sinMarca'], ['foto', 'sombra-foto'], ['muro'], ['puerta', 'volante'],
      ['maquina', 'maq-sombra', 'folio'], ['sello', 'marca'], nombres(ag), ['tarjeta', 'tache'],
      ['!vuelaTarjeta', '!vuelaTache', '!tache'], [], [], ['!sellar', '!marcar'], [], [], ['!medioGiro'],
    ],
    zonas: [{ ...E(PUERTA.c, 56, 56), nombre: 'volante' }],
    gestos: {
      tarjetaEnMano: { tipo: 'mover', anims: ['tarjeta'], valores: [viaje[0]], dur: [0.01] },
      tacheEnMano: { tipo: 'opacidad', anims: ['tache'], valores: [0], dur: [0.01] },
      sinMarca: { tipo: 'opacidad', anims: ['marca'], valores: [0], dur: [0.01] },
      vuelaTarjeta: { tipo: 'mover', anims: ['tarjeta'], valores: viaje, dur: durViaje },
      vuelaTache: { tipo: 'mover', anims: ['tache'], valores: viaje, dur: durViaje },
      tache: { tipo: 'opacidad', anims: ['tache'], valores: [0, 1], dur: [0.43, 0.03] },
      sellar: {
        tipo: 'mover', anims: ['sello'],
        valores: [[enFolio[0], enFolio[1] - 56], [enFolio[0], enFolio[1]], [enFolio[0], enFolio[1]], [enFolio[0], enFolio[1] - 50], [0, 0]],
        dur: [0.3, 0.09, 0.14, 0.14, 0.3],
      },
      marcar: { tipo: 'opacidad', anims: ['marca'], valores: [0, 1], dur: [0.39, 0.02] },
      medioGiro: { tipo: 'giro', anims: ['volante'], valores: [180, 0], dur: [0.9, 0.001] },
    },
    alEntrar: [],
    alPasar: [{ zona: 'volante', gesto: 'medioGiro' }],
  };
}

const inventos = () => [boveda_('es'), boveda_('en')];
export default inventos;
