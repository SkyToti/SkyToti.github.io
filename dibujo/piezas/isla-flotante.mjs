// La Isla · «La isla flotante»: una isla alargada como la barra del escritorio, con roca y raíces debajo y tres
// ventanitas; abajo, los tres bocetos de lo que la isla se vuelve (reproductor, lanzador, control). Lienzo 640×420.
// Entrada: la isla se arma, flota (sube y baja una vez), las ventanitas se encienden una por una y la barra se estira
// y encoge (el cambio de forma). Al pasar por la isla se estira otra vez.
import { L, PL, PG, P, E, R, RR } from '../kit/formas.mjs';
import { grupo, huecoFoto, rotulos, T, flecha, nube } from './inventos-comun.mjs';

const CX = 200, Y0 = 72, Y1 = 118; // la barra: de CX-170 a CX+170, de Y0 a Y1
const BASE = [CX, Y1];
const VENT = [-104, -12, 80]; // centros x de las tres ventanitas (relativos a CX)

function roca() {
  const a = { anim: 'roca' };
  const d = `M ${CX - 160} ${Y1 - 6} C ${CX - 150} ${Y1 + 26} ${CX - 112} ${Y1 + 34} ${CX - 90} ${Y1 + 52} `
    + `C ${CX - 64} ${Y1 + 76} ${CX - 30} ${Y1 + 96} ${CX + 4} ${Y1 + 116} C ${CX + 26} ${Y1 + 96} ${CX + 52} ${Y1 + 80} ${CX + 86} ${Y1 + 54} `
    + `C ${CX + 112} ${Y1 + 36} ${CX + 150} ${Y1 + 28} ${CX + 162} ${Y1 - 6} Z`;
  const sombra = `M ${CX + 30} ${Y1 + 4} C ${CX + 60} ${Y1 + 10} ${CX + 120} ${Y1 + 8} ${CX + 160} ${Y1 + 2} C ${CX + 150} ${Y1 + 28} ${CX + 112} ${Y1 + 36} ${CX + 86} ${Y1 + 54} C ${CX + 52} ${Y1 + 80} ${CX + 26} ${Y1 + 96} ${CX + 4} ${Y1 + 116} C ${CX + 18} ${Y1 + 80} ${CX + 26} ${Y1 + 40} ${CX + 30} ${Y1 + 4} Z`;
  return grupo('roca', [
    P(d, { rol: 'casquillo', ...a }),
    P(sombra, { trama: 'sombra', op: 0.8, ...a }),
    P(d, { linea: 'ext', ...a }),
    // vetas de la roca
    P(`M ${CX - 104} ${Y1 + 22} C ${CX - 80} ${Y1 + 30} ${CX - 60} ${Y1 + 28} ${CX - 44} ${Y1 + 38}`, { linea: 'fino', tinta: 'noche', ...a }),
    P(`M ${CX - 30} ${Y1 + 58} C ${CX - 14} ${Y1 + 62} ${CX} ${Y1 + 60} ${CX + 12} ${Y1 + 68}`, { linea: 'fino', tinta: 'noche', ...a }),
    P(`M ${CX + 50} ${Y1 + 26} C ${CX + 66} ${Y1 + 24} ${CX + 84} ${Y1 + 30} ${CX + 96} ${Y1 + 26}`, { linea: 'fino', tinta: 'noche', ...a }),
    // raíces que cuelgan
    P(`M ${CX + 4} ${Y1 + 114} C ${CX + 2} ${Y1 + 130} ${CX + 12} ${Y1 + 138} ${CX + 6} ${Y1 + 152}`, { linea: 'int', ...a }),
    P(`M ${CX - 46} ${Y1 + 80} C ${CX - 50} ${Y1 + 96} ${CX - 40} ${Y1 + 104} ${CX - 46} ${Y1 + 116}`, { linea: 'int', ...a }),
    P(`M ${CX + 58} ${Y1 + 72} C ${CX + 62} ${Y1 + 86} ${CX + 54} ${Y1 + 92} ${CX + 58} ${Y1 + 102}`, { linea: 'int', ...a }),
    P(`M ${CX - 112} ${Y1 + 38} C ${CX - 116} ${Y1 + 50} ${CX - 108} ${Y1 + 56} ${CX - 112} ${Y1 + 64}`, { linea: 'fino', ...a }),
    // matita en la orilla
    P(`M ${CX + 146} ${Y0 - 2} C ${CX + 130} ${Y0 - 14} ${CX + 128} ${Y0 - 32} ${CX + 136} ${Y0 - 42} C ${CX + 148} ${Y0 - 30} ${CX + 150} ${Y0 - 14} ${CX + 146} ${Y0 - 2} Z`, { rol: 'hoja', ...a }),
    P(`M ${CX + 146} ${Y0 - 2} C ${CX + 130} ${Y0 - 14} ${CX + 128} ${Y0 - 32} ${CX + 136} ${Y0 - 42} C ${CX + 148} ${Y0 - 30} ${CX + 150} ${Y0 - 14} ${CX + 146} ${Y0 - 2} Z`, { linea: 'int', ...a }),
    P(`M ${CX + 150} ${Y0 - 2} C ${CX + 156} ${Y0 - 14} ${CX + 166} ${Y0 - 20} ${CX + 178} ${Y0 - 20} C ${CX + 176} ${Y0 - 8} ${CX + 164} ${Y0 - 2} ${CX + 150} ${Y0 - 2} Z`, { rol: 'hoja', ...a }),
    P(`M ${CX + 150} ${Y0 - 2} C ${CX + 156} ${Y0 - 14} ${CX + 166} ${Y0 - 20} ${CX + 178} ${Y0 - 20} C ${CX + 176} ${Y0 - 8} ${CX + 164} ${Y0 - 2} ${CX + 150} ${Y0 - 2} Z`, { linea: 'int', ...a }),
  ]);
}

function barra() {
  const a = { anim: 'barra' };
  const piezas = [
    RR(CX - 170, Y0, 340, Y1 - Y0, 22, { rol: 'marco', ...a }),
    RR(CX - 170, Y0, 340, Y1 - Y0, 22, { linea: 'ext', ...a }),
    // brillo de la barra (luz de arriba)
    P(`M ${CX - 150} ${Y0 + 8} C ${CX - 60} ${Y0 + 5} ${CX + 60} ${Y0 + 5} ${CX + 120} ${Y0 + 8}`, { linea: 'fino', tinta: 'cielo', ...a }),
  ];
  for (const vx of VENT) {
    piezas.push(RR(CX + vx - 26, Y0 + 11, 52, 25, 7, { rol: 'pantalla', ...a }), RR(CX + vx - 26, Y0 + 11, 52, 25, 7, { linea: 'int', tinta: 'viva', ...a }));
  }
  return grupo('barra', piezas);
}

/** la luz de cada ventanita (aparte, para encenderse una por una); cada una con su dibujito */
function luz(i) {
  const vx = CX + VENT[i], a = { anim: `luz${i + 1}` }, y = Y0 + 23.5;
  const dibujito = [
    // ♪ · reloj · tres puntitos
    [P(`M ${vx - 4} ${y + 6} L ${vx - 4} ${y - 7} L ${vx + 7} ${y - 9} L ${vx + 7} ${y + 4}`, { linea: 'fino', tinta: 'noche', ...a }), E([vx - 7, y + 6], 3, 2.4, { rol: 'oscuro', ...a }), E([vx + 4, y + 4], 3, 2.4, { rol: 'oscuro', ...a })],
    [E([vx, y], 7.5, 7.5, { linea: 'fino', tinta: 'noche', ...a }), PL([[vx, y - 5], [vx, y], [vx + 4, y + 2]], { linea: 'fino', tinta: 'noche', ...a })],
    [E([vx - 9, y], 2.6, 2.6, { rol: 'oscuro', ...a }), E([vx, y], 2.6, 2.6, { rol: 'oscuro', ...a }), E([vx + 9, y], 2.6, 2.6, { rol: 'oscuro', ...a })],
  ][i];
  return grupo(`luz${i + 1}`, [
    E([vx, y], 34, 20, { trama: 'ambar', op: 0.5, ...a, capa: 'luz' }),
    RR(vx - 26, Y0 + 11, 52, 25, 7, { rol: 'foco', mueve: [2, 2], ...a }),
    RR(vx - 26, Y0 + 11, 52, 25, 7, { linea: 'int', ...a }),
    ...dibujito,
  ]);
}

// los tres bocetos (línea apagada, sin relleno): reproductor, lanzador, control
function bocetos() {
  const y = 344, b = { linea: 'int', tinta: 'apagado' }, f = { linea: 'fino', tinta: 'apagado' };
  const rep = (x) => [
    RR(x - 62, y - 28, 124, 56, 14, b),
    R(x - 52, y - 18, 30, 30, f),
    PG([[x - 12, y - 14], [x - 12, y + 2], [x + 2, y - 6]], f),
    L([x + 10, y - 6], [x + 50, y - 6], f), L([x - 12, y + 16], [x + 50, y + 16], f), E([x + 14, y + 16], 3.5, 3.5, f),
  ];
  const lan = (x) => {
    const p = [RR(x - 46, y - 38, 92, 76, 14, b)];
    for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) p.push(RR(x - 34 + i * 25, y - 26 + j * 27, 18, 18, 5, f));
    return p;
  };
  const con = (x) => [
    RR(x - 46, y - 38, 92, 76, 14, b),
    RR(x - 32, y - 26, 30, 14, 7, f), E([x - 10, y - 19], 4.5, 4.5, f),
    RR(x + 4, y - 26, 30, 14, 7, f), E([x + 12, y - 19], 4.5, 4.5, f),
    L([x - 32, y + 4], [x + 32, y + 4], f), E([x + 8, y + 4], 5, 5, f),
    L([x - 32, y + 22], [x + 32, y + 22], f), E([x - 14, y + 22], 5, 5, f),
  ];
  return [grupo("boceto1", rep(116)), grupo("boceto2", lan(318)), grupo("boceto3", con(506))];
}

export function islaFlotante() {
  const foto = huecoFoto({ cx: 518, cy: 140, giro: -3 });
  const luces = [0, 1, 2].map(luz);
  const grupos = [
    grupo('nubes', [...nube(572, 262, 80), ...nube(46, 196, 62)]),
    roca(),
    barra(),
    ...luces,
    ...foto.grupos,
    ...bocetos(),
    grupo('flecha', [
      ...flecha('M 222 276 C 196 280 170 286 150 302', [150, 302], 140, 'apagado', 'fino'),
      ...flecha('M 230 278 C 262 280 296 284 316 298', [316, 298], 40, 'apagado', 'fino'),
      ...flecha('M 236 272 C 330 262 440 262 494 296', [494, 296], 32, 'apagado', 'fino'),
    ].map((p) => ({ ...p, punteado: '5 5', entra: 'fade' }))),
    ...rotulos(
      [T('se vuelve…', 34, 268, { tam: 20 })],
      [T('becomes…', 44, 268, { tam: 20 })],
    ),
  ];
  const todos = ['barra', 'roca', 'luz1', 'luz2', 'luz3'];
  const estirables = ['barra', 'luz1', 'luz2', 'luz3'];
  return {
    nombre: 'isla-flotante',
    titulo: 'La isla flotante: una barra con tres ventanitas sobre una roca con raíces, y los bocetos de lo que se vuelve',
    vb: [0, 0, 640, 420],
    grupos,
    anclas: { ...foto.anclas, roca: BASE, barra: BASE, luz1: BASE, luz2: BASE, luz3: BASE },
    orden: [
      ['nubes', 'foto', 'foto-sombra'], ['roca'], ['barra', '!flota'],
      ['luz1', '!enciende1'], ['luz2', '!enciende2'], ['luz3', '!enciende3'],
      ['!estira'],
      ['flecha', 'rotulos-es', 'rotulos-en'], ['boceto1'], ['boceto2'], ['boceto3'],
    ],
    zonas: [P(`M ${CX - 180} ${Y0 - 50} L ${CX + 184} ${Y0 - 50} L ${CX + 184} ${Y1 + 120} L ${CX - 180} ${Y1 + 120} Z`, { nombre: 'isla' })],
    gestos: {
      flota: { tipo: 'mover', anims: todos, valores: [[0, -16], [0, 5], [0, 0]], dur: [0.6, 0.55, 0.4] },
      enciende1: { tipo: 'opacidad', anims: ['luz1'], valores: [0, 1, 0.25, 1], dur: [0.001, 0.07, 0.07, 0.1] },
      enciende2: { tipo: 'opacidad', anims: ['luz2'], valores: [0, 1, 0.25, 1], dur: [0.001, 0.07, 0.07, 0.1] },
      enciende3: { tipo: 'opacidad', anims: ['luz3'], valores: [0, 1, 0.25, 1], dur: [0.001, 0.07, 0.07, 0.1] },
      estira: { tipo: 'escalaY', anims: estirables, valores: [1.9, 0.7, 1.15, 1], dur: [0.24, 0.2, 0.14, 0.14] },
    },
    alEntrar: [],
    alPasar: [{ zona: 'isla', gesto: 'estira' }],
  };
}
