// «El cuaderno» (Cuaderno de repaso): un cuaderno abierto de espiral, con una cinta en una esquina, un lápiz, y en la
// hoja derecha un esquema mínimo de una API (cliente → API → base de datos). Lienzo 640×420.
// Entrada: el cuaderno se dibuja; una corriente de aire entra y las hojas de la derecha se levantan (en abanico desde
// la espiral) y vuelven a caer; el lápiz rueda a su lugar. Al pasar, la hoja de encima se levanta.
import { L, PL, PG, P, E, R, RR } from '../kit/formas.mjs';
import { mover } from './haku.mjs';
import { grupo, rotulos, T, flecha } from './inventos-comun.mjs';

// el cuaderno se dibuja derecho (lomo en x=0, de -H a H) y luego se gira un poco
const H = 128, W = 214; // media altura y ancho de cada página
const PIVOTE = [6, 0]; // las hojas de la derecha giran desde la mitad de la espiral (abanico)

function cuaderno() {
  const pastas = grupo('pastas', [
    RR(-W - 12, -H - 10, 2 * W + 24, 2 * H + 22, 10, { rol: 'robot', mueve: [5, 4] }),
    RR(-W - 12, -H - 10, 2 * W + 24, 2 * H + 22, 10, { linea: 'ext' }),
  ]);
  const izq = grupo('pagina-izq', [
    R(-W, -H, W - 6, 2 * H, { rol: 'sobre', mueve: [0, 0] }),
    R(-W, -H, W - 6, 2 * H, { linea: 'int' }),
    // renglones y apuntes
    ...[-60, -30, 0, 30, 60, 90].map((y) => L([-W + 18, y], [-22, y], { linea: 'fino', tinta: 'cielo' })),
    L([-W + 40, -H + 8], [-W + 40, H - 8], { linea: 'fino', tinta: 'ambar' }),
    P(`M ${-W + 50} -38 C ${-W + 70} -46 ${-W + 90} -32 ${-W + 110} -40 C ${-W + 126} -46 ${-W + 140} -34 ${-W + 160} -40`, { linea: 'fino', tinta: 'noche' }),
    P(`M ${-W + 50} -8 C ${-W + 66} -14 ${-W + 82} -2 ${-W + 100} -10 C ${-W + 116} -16 ${-W + 128} -4 ${-W + 142} -10`, { linea: 'fino', tinta: 'noche' }),
    P(`M ${-W + 50} 22 C ${-W + 72} 14 ${-W + 96} 28 ${-W + 120} 20`, { linea: 'fino', tinta: 'noche' }),
    // una palomita y una estrella de repaso
    PL([[-W + 52, 50], [-W + 58, 57], [-W + 70, 43]], { linea: 'int', tinta: 'noche' }),
    P(`M ${-W + 84} 52 C ${-W + 100} 46 ${-W + 118} 58 ${-W + 136} 50`, { linea: 'fino', tinta: 'noche' }),
  ]);
  // tres hojas a la derecha: dos debajo (se asoman sus orillas) y la de encima con el esquema
  const hoja = (n, dx, dy, extra = []) => grupo(`hoja${n}`, [
    R(6 + dx, -H + dy, W, 2 * H, { rol: 'sobre', mueve: [0, 0], anim: `hoja${n}` }),
    R(6 + dx, -H + dy, W, 2 * H, { linea: n === 3 ? 'int' : 'fino', tinta: n === 3 ? 'hueso' : 'apagado', anim: `hoja${n}` }),
    ...extra.map((p) => ({ ...p, anim: `hoja${n}` })),
  ]);
  const caja = (x, y, w, h, rol) => [RR(x, y, w, h, 6, { rol }), RR(x, y, w, h, 6, { linea: 'int', tinta: 'noche' })];
  const esquema = [
    ...caja(34, -46, 52, 34, 'libro1'),
    ...caja(122, -46, 52, 34, 'papel'),
    ...caja(122, 42, 52, 34, 'libro3'),
    ...flecha('M 88 -29 C 100 -33 108 -33 118 -29', [118, -29], 10, 'noche', 'fino'),
    ...flecha('M 148 -10 C 152 6 152 22 148 38', [148, 38], 100, 'noche', 'fino'),
    // las líneas de la hoja (cuadrícula suave)
    ...[-H + 26, H - 26].map((y) => L([22, y], [W - 6, y], { linea: 'fino', tinta: 'cielo' })),
    PL([[44, 60], [52, 68], [66, 52]], { linea: 'int', tinta: 'noche' }),
  ];
  const hojas = [hoja(1, 6, 4), hoja(2, 3, 2), hoja(3, 0, 0, esquema)];
  // la espiral: aros que cruzan el lomo
  const aros = [];
  for (let i = 0; i < 11; i++) {
    const y = -H + 14 + i * ((2 * H - 28) / 10);
    aros.push(E([-16, y], 3.2, 3.2, { rol: 'oscuro' }), E([16, y], 3.2, 3.2, { rol: 'oscuro' }));
    aros.push(P(`M -16 ${y} C -14 ${y - 15} 14 ${y - 15} 16 ${y}`, { linea: 'int', tinta: 'noche' }));
  }
  const espiral = grupo('espiral', aros);
  // cinta adhesiva en la esquina de arriba a la derecha (sujeta la hoja de encima: se va con ella)
  const cinta = [[W - 26, -H - 18], [W + 22, -H + 10], [W + 10, -H + 30], [W - 38, -H + 2]];
  const cintaG = grupo('cinta', [
    PG(cinta, { rol: 'hoja', op: 0.75, anim: 'hoja3' }),
    PG(cinta, { linea: 'fino', anim: 'hoja3' }),
    L([W - 20, -H - 6], [W + 4, -H + 8], { linea: 'fino', tinta: 'noche', anim: 'hoja3' }),
  ]);
  const h3 = { tinta: 'noche', ancla: 'middle', anim: 'hoja3' };
  const textos = rotulos(
    [T('repaso', -W + 34, -H + 44, { tam: 30, tinta: 'noche' }), T('cliente', 60, -24, { tam: 13, ...h3 }), T('API', 148, -23, { tam: 16, ...h3 }), T('BD', 148, 65, { tam: 16, ...h3 })],
    [T('review', -W + 34, -H + 44, { tam: 30, tinta: 'noche' }), T('client', 60, -24, { tam: 13, ...h3 }), T('API', 148, -23, { tam: 16, ...h3 }), T('DB', 148, 65, { tam: 16, ...h3 })],
  );
  const sombraHojas = grupo('hojas-sombra', [R(10, -H + 6, W, 2 * H, { trama: 'sombra', op: 0.9 })]);
  return { grupos: [pastas, izq, sombraHojas, ...hojas, espiral, cintaG, ...textos], anclas: { hoja1: PIVOTE, hoja2: PIVOTE, hoja3: PIVOTE } };
}

function lapiz() {
  const a = { anim: 'lapiz' };
  // de lado, en diagonal: cuerpo de x=0 a 150, punta a la derecha (origen = medio de la goma)
  const cuerpo = [[0, -8], [128, -8], [128, 8], [0, 8]];
  return {
    grupos: [grupo('lapiz', [
      PG(cuerpo, { rol: 'papel', ...a }), PG(cuerpo, { linea: 'ext', ...a }),
      L([6, -2.5], [124, -2.5], { linea: 'fino', tinta: 'noche', ...a }),
      L([6, 3], [124, 3], { linea: 'fino', tinta: 'noche', ...a }),
      PG([[-18, -8], [0, -8], [0, 8], [-18, 8]], { rol: 'casquillo', ...a }), PG([[-18, -8], [0, -8], [0, 8], [-18, 8]], { linea: 'ext', ...a }),
      L([-9, -8], [-9, 8], { linea: 'fino', tinta: 'noche', ...a }),
      PG([[128, -8], [158, 0], [128, 8]], { rol: 'sobre', mueve: [2, 2], ...a }), PG([[128, -8], [158, 0], [128, 8]], { linea: 'ext', ...a }),
      PG([[150, -2], [158, 0], [150, 2]], { rol: 'oscuro', ...a }),
    ])],
    anclas: { lapiz: [70, 0] },
  };
}

export function cuadernoDeRepaso() {
  const cu = mover(cuaderno(), { x: 300, y: 200, giro: -3 });
  const la = mover(lapiz(), { x: 410, y: 368, giro: -16 });
  const viento = grupo('viento', [
    P('M 640 132 C 600 128 572 136 556 150 C 546 160 556 172 566 164', { linea: 'int', tinta: 'cielo', anim: 'viento' }),
    P('M 640 214 C 612 212 590 218 574 226', { linea: 'int', tinta: 'cielo', anim: 'viento' }),
    P('M 640 268 C 616 266 598 274 590 286 C 586 296 598 302 604 292', { linea: 'int', tinta: 'cielo', anim: 'viento' }),
  ]);
  const grupos = [
    grupo('sombra', [RR(76, 82, 470, 274, 12, { trama: 'sombra', op: 0.6 })], { capa: 'luz' }),
    ...cu.grupos,
    ...la.grupos,
    viento,
  ];
  return {
    nombre: 'cuaderno',
    titulo: 'Un cuaderno de repaso abierto, de espiral, con cinta, un lápiz y el esquema de una API',
    vb: [0, 0, 640, 420],
    grupos,
    anclas: { ...cu.anclas, ...la.anclas, viento: [600, 210] },
    orden: [
      ['pastas', 'sombra'], ['pagina-izq', 'hojas-sombra', 'hoja1', 'hoja2'], ['hoja3', 'espiral'], ['cinta', 'rotulos-es', 'rotulos-en'],
      ['viento', '!viento', '!vientoOp'], ['!rafaga1', '!rafaga2', '!rafaga3', 'lapiz', '!rueda'],
    ],
    zonas: [P('M 300 60 L 540 60 L 540 350 L 300 350 Z', { nombre: 'hojas' })],
    gestos: {
      viento: { tipo: 'mover', anims: ['viento'], valores: [[70, 0], [0, 0], [-40, -4]], dur: [0.001, 0.45, 0.6] },
      vientoOp: { tipo: 'opacidad', anims: ['viento'], valores: [0, 1, 1, 0], dur: [0.001, 0.25, 0.45, 0.4] },
      rafaga1: { tipo: 'giro', anims: ['hoja1'], valores: [0, -2.5, -4, 1, -1, 0], dur: [0.12, 0.2, 0.18, 0.24, 0.16, 0.16] },
      rafaga2: { tipo: 'giro', anims: ['hoja2'], valores: [0, -4, -6, 1, -1.5, 0], dur: [0.06, 0.2, 0.18, 0.26, 0.16, 0.16] },
      rafaga3: { tipo: 'giro', anims: ['hoja3'], valores: [-5, -8, 1.5, -2, 0], dur: [0.2, 0.2, 0.28, 0.16, 0.16] },
      rueda: { tipo: 'mover', anims: ['lapiz'], valores: [[-10, -34], [-10, -34], [0, 0], [-2, -5], [0, 0]], dur: [0.001, 0.2, 0.5, 0.12, 0.14] },
      levanta: { tipo: 'giro', anims: ['hoja3'], valores: [-7, 1.2, 0], dur: [0.28, 0.3, 0.16] },
    },
    alEntrar: [],
    alPasar: [{ zona: 'hojas', gesto: 'levanta' }],
  };
}
