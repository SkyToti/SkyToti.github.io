// «La tira» · viñeta 1: Decido qué se construye. Una mano boceta en una nota adhesiva un plano simple (caja → caja);
// la otra nota, tachada, ya se cayó de la pared. Haku se asoma por la orilla de la mesa y sigue el lápiz.
// Lienzo 520×400 con su marco de viñeta. Aquí viven también las piezas comunes de las cuatro viñetas
// (marco, máscara, mesa, nota adhesiva y la mano), que tira-2/3/4 importan.
//
// El SVG horneado es el ÚLTIMO cuadro (lo que se ve sin JS o con menos movimiento). Lo que la animación necesita
// para empezar desde el principio viaja en `gestos` (tipo «mover»): el componente de la tira lo lee de ahí.
import { L, PL, PG, P, E, R, tubo, rot, matriz, colocar } from '../kit/formas.mjs';
import { cabeza, GESTOS_HAKU } from './haku.mjs';

// ── comunes ──
export const ANCHO = 520, ALTO = 400;
export const X0 = 12, Y0 = 12, X1 = 502, Y1 = 382;
export const CORAL = '#F0776B';

/** el papel de la viñeta: va en la capa de luz para que las tramas de sombra queden encima */
export const fondo = () => ({ nombre: 'fondo', capa: 'luz', piezas: [R(X0, Y0, X1 - X0, Y1 - Y0, { rol: 'marco', mueve: [0, 0] })] });

/** máscara (lo que sale del marco no se ve), sombra corrida del riso y el marco a mano: SIEMPRE al final */
export function marco() {
  return [
    { nombre: 'mascara', piezas: [P(`M -40 -40 L 560 -40 L 560 440 L -40 440 Z M ${X0} ${Y0} L ${X0} ${Y1} L ${X1} ${Y1} L ${X1} ${Y0} Z`, { rol: 'pantalla' })] },
    { nombre: 'marco', piezas: [
      PG([[X1, Y0 + 7], [X1 + 6, Y0 + 7], [X1 + 6, Y1 + 6], [X0 + 7, Y1 + 6], [X0 + 7, Y1], [X1, Y1]], { rol: 'mesa', mueve: [0, 0] }),
      L([X0, Y0], [X1, Y0], { linea: 'ext' }),
      L([X1, Y0], [X1, Y1], { linea: 'ext' }),
      L([X1, Y1], [X0, Y1], { linea: 'ext' }),
      L([X0, Y1], [X0, Y0], { linea: 'ext' }),
    ] },
  ];
}

/** la mesa de frente: canto arriba en y, frente hasta el marco */
export function mesa(y, nombre = 'mesa') {
  return { nombre, piezas: [
    R(X0, y, X1 - X0, Y1 - y + 4, { rol: 'mesa', mueve: [0, 0] }),
    L([X0, y], [X1, y], { linea: 'ext' }),
    L([X0, y + 9], [X1, y + 9], { linea: 'int', tinta: 'viva' }),
  ] };
}

/** punto en un sistema girado: origen o, eje u (unitario) y normal n */
export const sistema = (o, ang) => {
  const r = (ang * Math.PI) / 180, u = [Math.cos(r), Math.sin(r)], n = [Math.sin(r), -Math.cos(r)];
  return (a, b) => [o[0] + a * u[0] + b * n[0], o[1] + a * u[1] + b * n[1]];
};

/** nota adhesiva cuadrada girada (c = centro) */
export function nota(c, lado, giro, extra = {}) {
  const h = lado / 2;
  const q = (x, y) => { const m = rot(giro); return [c[0] + m[0] * x + m[2] * y, c[1] + m[1] * x + m[3] * y]; };
  const borde = [q(-h, -h), q(h, -h), q(h, h), q(-h, h)];
  return { q, piezas: [
    PG([q(-h + 4, h - 2), q(h + 2, h - 2), q(h + 5, h + 7), q(-h + 7, h + 7)], { trama: 'sombra', ...extra }),
    PG(borde, { rol: 'papel', ...extra }),
    PG([q(-h, -h), q(h, -h), q(h, -h + lado * 0.16), q(-h, -h + lado * 0.16)], { rol: 'libro2', mueve: [0, 0], op: 0.55, ...extra }),
    PG(borde, { linea: 'int', ...extra }),
  ] };
}

const piel = { rol: 'puntas', op: 1, mueve: [3, 2] };

/** antebrazo con manga desde la muñeca w hacia la dirección d (sale del marco); coordenadas de la mano */
function antebrazo(w, d) {
  const k = Math.hypot(...d), u = [d[0] / k, d[1] / k], n = [-u[1], u[0]];
  const p = (t, s = 0) => [w[0] + u[0] * t + n[0] * s, w[1] + u[1] * t + n[1] * s];
  return [
    PG([p(-14, -15), p(40, -16), p(40, 16), p(-14, 15)], piel),
    L(p(-10, -15), p(36, -16), { linea: 'ext' }),
    L(p(-10, 15), p(36, 16), { linea: 'ext' }),
    PG([p(26, -21), p(260, -24), p(260, 24), p(26, 21)], { rol: 'robot' }),
    PL([p(260, -24), p(26, -21), p(22, 0), p(26, 21), p(260, 24)], { linea: 'ext', remate: 0 }),
    L(p(34, -20), p(34, 20), { linea: 'int', tinta: 'noche' }),
    L(p(52, -9), p(150, -11), { linea: 'fino', tinta: 'noche' }),
  ];
}

/** dedo: tubo de la base a la punta, con uña si se ve */
function dedo(pts, w0, w1, una = true) {
  const tb = tubo(pts, w0, w1);
  const out = [PG(tb.cerrado, piel), PL(tb.abierto, { linea: 'int', remate: 0 })];
  if (una) {
    const f = tb.centro.at(-1), pen = tb.centro.at(-4), dx = f[0] - pen[0], dy = f[1] - pen[1], k = Math.hypot(dx, dy);
    const ux = dx / k, uy = dy / k, s = w1 * 0.28;
    out.push(P(`M ${f[0] - ux * 7 - uy * s} ${f[1] - uy * 7 + ux * s} L ${f[0] - ux * 1.5 - uy * s} ${f[1] - uy * 1.5 + ux * s} M ${f[0] - ux * 7 + uy * s} ${f[1] - uy * 7 - ux * s} L ${f[0] - ux * 1.5 + uy * s} ${f[1] - uy * 1.5 - ux * s}`, { linea: 'fino', tinta: 'noche' }));
  }
  return out;
}

/**
 * Mano derecha que escribe, en coordenadas «canónicas»: lápiz horizontal con la punta en (0,0) hacia -x.
 * Índice estirado encima del lápiz, pulgar debajo (pinza), medio/anular/meñique doblados más abajo: 5 dedos.
 * `colocarla` la gira y la pone con la punta en t.
 */
export function manoCanonica(conLapiz = true) {
  const mano = [
    ...antebrazo([116, 34], [0.64, 0.77]),
    P('M 64 -12 C 76 -26 108 -30 124 -16 C 134 -4 134 20 126 36 L 98 46 C 82 47 62 40 56 26 Z', piel),
    P('M 64 -12 C 76 -26 108 -30 124 -16 C 134 -4 134 20 126 36', { linea: 'ext' }),
    P('M 88 -21 C 98 -24 108 -22 115 -17', { linea: 'fino', tinta: 'noche' }),
    // meñique, anular y medio doblados (del de atrás al de adelante)
    ...[[90, 37, 8.5], [74, 34, 9.5], [58, 29, 10]].flatMap(([x, y, r]) => [
      E([x, y], r, r * 0.92, piel), E([x, y], r, r * 0.92, { linea: 'int' }),
      P(`M ${x - r * 0.5} ${y + r * 0.35} C ${x - r * 0.1} ${y + r * 0.6} ${x + r * 0.3} ${y + r * 0.5} ${x + r * 0.55} ${y + r * 0.2}`, { linea: 'fino', tinta: 'noche' }),
    ]),
  ];
  const lapiz = conLapiz ? [
    PG([[22, 6], [112, 6], [112, -6], [22, -6]], { rol: 'bloque' }),
    PG([[22, 6], [22, -6], [8, -2.6], [8, 2.6]], { rol: 'sobre' }),
    PG([[8, 2.6], [8, -2.6], [0, 0]], { rol: 'oscuro' }),
    PG([[112, 6.5], [121, 6.5], [121, -6.5], [112, -6.5]], { rol: 'casquillo' }),
    PG([[121, 6], [133, 5], [133, -5], [121, -6]], { rol: 'lejos' }),
    PG([[22, 6], [112, 6], [112, -6], [22, -6]], { linea: 'ext' }),
    PL([[22, 6], [8, 2.6], [0, 0], [8, -2.6], [22, -6]], { linea: 'int' }),
    L([30, 0], [106, 0], { linea: 'fino', tinta: 'noche' }),
    PG([[112, 6.5], [121, 6.5], [121, -6.5], [112, -6.5]], { linea: 'int' }),
    PL([[121, 6], [133, 5], [133, -5], [121, -6]], { linea: 'int' }),
  ] : [];
  const delante = [
    ...dedo([[100, 16], [72, 15], [44, 11]], 16, 13),   // pulgar, debajo del lápiz
    ...dedo([[84, -12], [60, -10], [34, -7]], 14, 11.5), // índice, encima
  ];
  return { mano, lapiz, delante };
}

/** la mano con lápiz puesta en la viñeta: punta en t, lápiz girado ang° (negativo = la goma hacia arriba) */
export function manoConLapiz(t, ang = -30, s = 1.2, anim = 'mano') {
  const m = matriz({ x: t[0], y: t[1], s, giro: ang });
  const pon = (lista) => colocar({ piezas: lista }, m).piezas.map((p) => ({ ...p, anim }));
  const c = manoCanonica(true);
  return { mano: pon(c.mano), lapiz: pon(c.lapiz), delante: pon(c.delante), m };
}

// ── la viñeta ──
const NOTA = { c: [232, 158], lado: 176, giro: -2 };
const CAE = { c: [96, 262], lado: 92, giro: -11, desde: [84, 112], giroDesde: 5 };
const T = [306, 168]; // donde descansa la punta del lápiz al terminar

// el plano: tres trazos en el orden en que los dibuja el lápiz
const A = [[164, 128], [212, 128], [212, 168], [164, 168], [164, 128]];
const F = [[218, 148], [250, 148]];
const FP = [[241, 140], [251, 148], [241, 156]];
const B = [[306, 168], [306, 128], [258, 128], [258, 168], [306, 168]];

export function tira1() {
  const papel = nota(NOTA.c, NOTA.lado, NOTA.giro);
  const { q } = papel;
  const cae = nota(CAE.c, CAE.lado, CAE.giro, { anim: 'cae' });
  const cq = cae.q;
  const noche = { linea: 'int', tinta: 'noche' };

  const haku = cabeza({ x: 424, y: 292, s: 0.94, alza: 1, mira: [-2.6, -3.4], inclina: -7, orejaAnim: true });
  const { mano, lapiz, delante } = manoConLapiz(T, -30, 1.2);

  const grupos = [
    fondo(),
    { nombre: 'sombra-pared', capa: 'luz', piezas: [E([96, 318], 50, 4.5, { trama: 'sombra', anim: 'cae' })] },
    { nombre: 'nota', piezas: [
      ...papel.piezas,
      L(q(-70, -58), q(-14, -58), { linea: 'fino', tinta: 'noche' }),
      L(q(-70, -48), q(-34, -48), { linea: 'fino', tinta: 'noche' }),
      L(q(-70, 62), q(30, 62), { linea: 'fino', tinta: 'noche' }),
      L(q(-70, 72), q(6, 72), { linea: 'fino', tinta: 'noche' }),
    ] },
    { nombre: 'plano-a', piezas: [PL(A, { ...noche, remate: 0 })] },
    { nombre: 'plano-flecha', piezas: [PL(F, { ...noche, remate: 0 }), PL(FP, { ...noche, remate: 0 })] },
    { nombre: 'plano-b', piezas: [PL(B, { ...noche, remate: 0 })] },
    { nombre: 'cae', piezas: [
      ...cae.piezas,
      P(`M ${cq(-28, -8).join(' ')} C ${cq(-18, -22).join(' ')} ${cq(4, -20).join(' ')} ${cq(6, -6).join(' ')} C ${cq(8, 8).join(' ')} ${cq(-12, 16).join(' ')} ${cq(-22, 6).join(' ')}`, { linea: 'fino', tinta: 'noche', anim: 'cae' }),
      L(cq(-26, 24), cq(22, 24), { linea: 'fino', tinta: 'noche', anim: 'cae' }),
      L(cq(-32, -30), cq(30, 32), { linea: 'ext', tinta: CORAL, anim: 'cae' }),
      L(cq(30, -32), cq(-30, 30), { linea: 'ext', tinta: CORAL, anim: 'cae' }),
    ] },
    ...haku.grupos.map((g) => ({ ...g, nombre: `haku-${g.nombre}` })),
    mesa(316),
    { nombre: 'haku-patas', piezas: [
      ...[398, 446].flatMap((x) => [
        E([x, 318], 12, 6.5, { rol: 'puntas' }), E([x, 318], 12, 6.5, { linea: 'int' }),
        L([x - 4, 320], [x - 4, 323.5], { linea: 'fino', tinta: 'noche' }), L([x + 4, 320], [x + 4, 323.5], { linea: 'fino', tinta: 'noche' }),
      ]),
    ] },
    { nombre: 'mano', piezas: mano },
    { nombre: 'lapiz', piezas: lapiz },
    { nombre: 'dedos', piezas: delante },
    ...marco(),
  ];

  // recorrido del lápiz: desplazamientos de la mano respecto a su lugar final (T)
  const rel = (pts) => pts.map(([x, y]) => [Math.round((x - T[0]) * 10) / 10, Math.round((y - T[1]) * 10) / 10]);
  const durs = (pts, s) => pts.map((p, i) => (i === 0 ? 0.28 : Math.max(0.08, Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]) / s)));
  const V = 230; // px/s del lápiz
  return {
    nombre: 'tira-1',
    titulo: 'Una mano boceta un plano en una nota adhesiva; la nota tachada se cayó; Haku mira',
    vb: [0, 0, ANCHO, ALTO],
    grupos,
    anclas: { ...haku.anclas, mano: T, cae: CAE.c },
    gestos: {
      ...GESTOS_HAKU,
      trazoA: { tipo: 'mover', anims: ['mano'], valores: rel(A), dur: durs(A, V) },
      trazoF: { tipo: 'mover', anims: ['mano'], valores: rel([...F, ...FP]), dur: durs([...F, ...FP], V) },
      trazoB: { tipo: 'mover', anims: ['mano'], valores: rel(B), dur: durs(B, V) },
      // la nota tachada: de la pared (desplazamiento y giro relativos) a la mesa
      cae: { tipo: 'mover', anims: ['cae'], valores: [[CAE.desde[0] - CAE.c[0], CAE.desde[1] - CAE.c[1]], [0, 0]], dur: [0, 0.9] },
      caeGiro: { tipo: 'giro', anims: ['cae'], valores: [CAE.giroDesde - CAE.giro, 0], dur: [0, 0.9] },
    },
    alEntrar: [],
    alPasar: [],
  };
}
