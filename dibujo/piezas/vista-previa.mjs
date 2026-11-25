// «Vista previa del enlace» (Open Graph, 1200×630): la mitad derecha del lienzo con el escritorio de noche en chico.
// La línea sale de debajo del nombre (que pone lib/imagenOg.tsx con letra de verdad, a la izquierda), cruza con su
// chispa y se vuelve la orilla del escritorio; encima, la lámpara con su cono en trama, el agente cargando su bloque
// y Haku sentado de frente (pose 1, la de la hoja de personajes, sin cambios). Lienzo en coordenadas de la imagen:
// lo que se dibuja aquí cae justo donde se ve en la tarjeta. No se anima: solo se usa el cuadro f0.
import { L, P, E, PG } from '../kit/formas.mjs';
import { grupo, prefijar } from '../kit/componer.mjs';
import { hakuSentado, mover } from './haku.mjs';
import { agenteCargando } from './agente.mjs';

// la lámpara de brazo del escritorio (misma geometría que piezas/escritorio.mjs; origen = base, el cono cae en T)
export function lampara({ E: codo, J, T: Tt, abre }) {
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1]], sum = (a, b) => [a[0] + b[0], a[1] + b[1]], mul = (a, k) => [a[0] * k, a[1] * k];
  const d = sub(Tt, J), n0 = Math.hypot(...d), u = mul(d, 1 / n0), n = [-u[1], u[0]];
  const A = sum(J, mul(u, 2)), C = sum(J, mul(u, 46));
  const N1 = sum(A, mul(n, 9)), N2 = sum(A, mul(n, -9)), W1 = sum(C, mul(n, 27)), W2 = sum(C, mul(n, -27));
  const foco = sum(C, mul(u, 9));
  const [Wi, Wd] = W1[0] < W2[0] ? [W1, W2] : [W2, W1];
  const cono = [sum(Wi, mul(u, 2)), sum(Wd, mul(u, 2)), [Tt[0] + abre, 0], [Tt[0] - abre, 0]];
  return {
    grupos: [
      grupo('luz', [
        PG(cono, { trama: 'ambar', op: 0.7 }),
        E(Tt, abre * 0.95, 6.5, { trama: 'ambar', op: 1 }),
        E(foco, 14, 14, { trama: 'ambar', op: 1 }),
        E(foco, 6, 6, { rol: 'foco', mueve: [0, 0] }),
      ], { capa: 'luz' }),
      grupo('lampara', [
        P('M -28 0 C -26 -12 26 -12 28 0 Z', { rol: 'lampara' }),
        P('M -28 0 C -26 -12 26 -12 28 0 Z', { linea: 'ext' }),
        L([0, -9], codo, { linea: 'ext' }),
        L(codo, J, { linea: 'ext' }),
        PG([N1, N2, W2, W1], { rol: 'lampara' }),
        PG([N1, N2, W2, W1], { linea: 'ext' }),
        E(codo, 5, 5, { rol: 'oscuro' }), E(codo, 5, 5, { linea: 'int' }),
        E(J, 4.5, 4.5, { rol: 'oscuro' }), E(J, 4.5, 4.5, { linea: 'int' }),
        P(`M ${sum(C, mul(n, 12)).join(' ')} C ${sum(sum(C, mul(n, 12)), mul(u, 12)).join(' ')} ${sum(sum(C, mul(n, -12)), mul(u, 12)).join(' ')} ${sum(C, mul(n, -12)).join(' ')}`, { linea: 'int' }),
      ]),
    ],
    anclas: {},
  };
}

const W = 1200, H = 630;
const MESA = 500; // y de la cubierta del escritorio
const ORILLA = 640; // x donde empieza la mesa (la línea llega ahí)
// la chispa, debajo del nombre (lib/imagenOg.tsx la usa para nada: solo vive en el dibujo)
const CHISPA = [356, 343];

function escritorio() {
  return [
    grupo('mesa', [
      PG([[ORILLA, MESA], [W + 40, MESA], [W + 40, MESA + 26], [ORILLA, MESA + 26]], { rol: 'mesa' }),
      L([ORILLA, MESA + 26], [W + 40, MESA + 26], { linea: 'int', tinta: 'viva' }),
      L([ORILLA, MESA], [ORILLA, MESA + 26], { linea: 'ext' }),
      // la pata sale por abajo del cuadro: toca el suelo fuera de la tarjeta
      PG([[ORILLA + 34, MESA + 26], [ORILLA + 56, MESA + 26], [ORILLA + 56, H + 20], [ORILLA + 34, H + 20]], { rol: 'mesa' }),
      L([ORILLA + 34, MESA + 26], [ORILLA + 34, H + 20], { linea: 'int' }),
      L([ORILLA + 56, MESA + 26], [ORILLA + 56, H + 20], { linea: 'int' }),
    ]),
  ];
}

// la línea: sale de debajo del nombre, baja junto al titular y se vuelve la orilla de arriba de la mesa
const LINEA = `M 72 340 C 200 349 300 336 420 341 C 520 345 586 352 604 400 C 616 440 606 486 ${ORILLA} ${MESA} L ${W + 40} ${MESA}`;

export function ilustraciones() {
  const haku = prefijar(mover(hakuSentado(), { x: 948, y: MESA, s: 1.78 }), 'haku');
  const agente = prefijar(mover(agenteCargando(), { x: 790, y: MESA, s: 1.42 }), 'agente');
  const lamp = mover(lampara({ E: [-24, -118], J: [52, -214], T: [236, 0], abre: 112 }), { x: 700, y: MESA, s: 1.12 });
  const grupos = [
    ...lamp.grupos.filter((g) => g.nombre === 'luz'),
    ...escritorio(),
    grupo('linea', [P(LINEA, { linea: 'ext' })]),
    grupo('chispa', [
      E(CHISPA, 22, 22, { trama: 'ambar', op: 1 }),
      E(CHISPA, 8, 8, { rol: 'foco', mueve: [0, 0] }),
    ]),
    ...lamp.grupos.filter((g) => g.nombre !== 'luz'),
    ...agente.grupos,
    ...haku.grupos,
  ];
  return [{
    nombre: 'vista-previa',
    titulo: 'Haku sentado en el escritorio de noche, junto a un agente y la lámpara',
    vb: [0, 0, W, H],
    tope: 120,
    grupos,
    orden: [],
    anclas: {},
  }];
}
