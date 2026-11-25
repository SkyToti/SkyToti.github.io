// «El escritorio de noche»: la portada. Composiciones: h 900×640 (tableta) y v 360×440 (celular), y la ANCHA de
// escritorio (≥ 1024), que son tres dibujos que se colocan a todo lo ancho de la ventana (16 u = 1vw):
//   escritorio-mesa (1248×528: el escritorio, sale por la izquierda), escritorio-cajonera (368×528: la mesita de la
//   lámpara y Haku, sale por la derecha) y escritorio-ventana (300×340: la ventana con luna, arriba a la derecha).
// Entre la mesa y la cajonera queda un hueco de 5vw: por ahí baja la línea viva (sale «por la orilla de la mesa»).
// Ya no traen línea ni chispa propias: la única línea es la línea viva de la página.
// Cada parte vive en coordenadas locales (origen = donde toca la mesa) y la composición solo la coloca.
import { L, PL, PG, P, E, R, RR, T, transformar, rot } from '../kit/formas.mjs';
import { hakuSentado, GESTOS_HAKU, mover } from './haku.mjs';
import { agenteCargando, GESTOS_AGENTE } from './agente.mjs';

const grupo = (nombre, piezas, extra = {}) => ({ nombre, piezas, ...extra });
const parte = (grupos, anclas = {}) => ({ grupos, anclas });
const prefijar = (p, pre) => ({ ...p, grupos: p.grupos.map((g) => ({ ...g, nombre: `${pre}-${g.nombre}` })) });

function nota(c, lado, giro) {
  const h = lado / 2, m = rot(giro, [0, 0]);
  const pt = ([x, y]) => { const q = transformar({ tipo: 'linea', a: [x, y], b: [0, 0] }, m).a; return [q[0] + c[0], q[1] + c[1]]; };
  return [
    PG([[-h, -h], [h, -h], [h, h], [-h, h]].map(pt), { rol: 'papel' }),
    PG([[-h, -h], [h, -h], [h, h], [-h, h]].map(pt), { linea: 'int' }),
    L(pt([-h + 6, -h + 10]), pt([h - 7, -h + 10]), { linea: 'fino', tinta: 'noche' }),
    L(pt([-h + 6, -h + 18]), pt([h - 12, -h + 18]), { linea: 'fino', tinta: 'noche' }),
  ];
}

function monitor() {
  return parte([
    grupo('sombra-monitor', [E([0, 1.5], 64, 4, { trama: 'sombra' })], { capa: 'luz' }),
    grupo('monitor', [
      RR(-120, -232, 240, 166, 8, { rol: 'marco' }),
      R(-106, -218, 212, 138, { rol: 'pantalla' }),
      R(-102, -214, 204, 130, { trama: 'cielo', op: 0.42 }),
      RR(-120, -232, 240, 166, 8, { linea: 'ext' }),
      R(-106, -218, 212, 138, { linea: 'int', tinta: 'viva' }),
      L([-10, -66], [-10, -12], { linea: 'int' }),
      L([10, -66], [10, -12], { linea: 'int' }),
      PG([[-42, 0], [42, 0], [26, -12], [-26, -12]], { rol: 'marco' }),
      PG([[-42, 0], [42, 0], [26, -12], [-26, -12]], { linea: 'ext' }),
      PL([[-38, -172], [-58, -150], [-38, -128]], { linea: 'ext', tinta: 'cielo' }),
      L([12, -184], [-12, -116], { linea: 'ext', tinta: 'cielo' }),
      PL([[38, -172], [58, -150], [38, -128]], { linea: 'ext', tinta: 'cielo' }),
      L([70, -206], [88, -192], { linea: 'fino', tinta: 'cielo' }),
      L([82, -207], [91, -199], { linea: 'fino', tinta: 'cielo' }),
      ...nota([110, -226], 34, 9),
      ...nota([-100, -78], 28, -7),
    ]),
  ]);
}

function teclado() {
  return parte([grupo('teclado', [
    PG([[-92, 0], [92, 0], [84, -16], [-84, -16]], { rol: 'teclado' }),
    PG([[-92, 0], [92, 0], [84, -16], [-84, -16]], { linea: 'int' }),
    L([-74, -11], [74, -11], { linea: 'fino', tinta: 'apagado', punteado: '7 4', entra: 'fade' }),
    L([-80, -5.5], [80, -5.5], { linea: 'fino', tinta: 'apagado', punteado: '7 4', entra: 'fade' }),
  ])]);
}

function taza() {
  return parte([
    grupo('sombra-taza', [E([2, 1.5], 28, 3.5, { trama: 'sombra' })], { capa: 'luz' }),
    grupo('taza', [
      P('M -18 -50 L -16 -2 C -16 1 16 1 16 -2 L 18 -50 Z', { rol: 'taza' }),
      P('M -18 -50 L -16 -2 C -16 1 16 1 16 -2 L 18 -50', { linea: 'ext' }),
      E([0, -50], 18, 4.5, { linea: 'int' }),
      P('M -17 -41 C -33 -41 -33 -16 -16 -16', { linea: 'ext' }),
      P('M -4 -60 C -10 -67 2 -71 -4 -80', { linea: 'int', tinta: 'apagado', anim: 'vapor' }),
      P('M 7 -62 C 1 -69 13 -73 7 -83', { linea: 'int', tinta: 'apagado', anim: 'vapor' }),
    ]),
  ], { vapor: [0, -70] });
}

// lámpara de brazo: el cono sale de la pantalla y cae en T (origen = base)
function lampara({ E: codo, J, T: Tt, abre }) {
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1]], sum = (a, b) => [a[0] + b[0], a[1] + b[1]], mul = (a, k) => [a[0] * k, a[1] * k];
  const d = sub(Tt, J), n0 = Math.hypot(...d), u = mul(d, 1 / n0), n = [-u[1], u[0]];
  const A = sum(J, mul(u, 2)), C = sum(J, mul(u, 46));
  const N1 = sum(A, mul(n, 9)), N2 = sum(A, mul(n, -9)), W1 = sum(C, mul(n, 27)), W2 = sum(C, mul(n, -27));
  const foco = sum(C, mul(u, 9));
  const [Wi, Wd] = W1[0] < W2[0] ? [W1, W2] : [W2, W1];
  const cono = [sum(Wi, mul(u, 2)), sum(Wd, mul(u, 2)), [Tt[0] + abre, 0], [Tt[0] - abre, 0]];
  return parte([
    grupo('luz', [
      PG(cono, { trama: 'ambar', op: 0.7 }),
      E(Tt, abre * 0.95, 6.5, { trama: 'ambar', op: 1 }),
      E(foco, 14, 14, { trama: 'ambar', op: 1 }),
      E(foco, 6, 6, { rol: 'foco', mueve: [0, 0] }),
    ], { capa: 'luz', anim: 'luz' }),
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
  ], { luz: foco });
}

function repisa(ancho = 300, objetos = 3) {
  const piezas = [
    R(0, 0, ancho, 10, { rol: 'mesa' }),
    R(0, 0, ancho, 10, { linea: 'int' }),
    PL([[36, 10], [36, 34], [58, 10]], { linea: 'int', tinta: 'viva' }),
    PL([[ancho - 36, 10], [ancho - 36, 34], [ancho - 58, 10]], { linea: 'int', tinta: 'viva' }),
    // libros
    RR(22, -58, 18, 58, 2, { rol: 'libro1' }), RR(22, -58, 18, 58, 2, { linea: 'ext' }),
    L([26, -46], [36, -46], { linea: 'fino', tinta: 'noche' }), L([26, -12], [36, -12], { linea: 'fino', tinta: 'noche' }),
    RR(42, -48, 16, 48, 2, { rol: 'libro2' }), RR(42, -48, 16, 48, 2, { linea: 'ext' }),
    L([46, -38], [54, -38], { linea: 'fino', tinta: 'noche' }),
    PG([[60, 0], [76, 0], [98, -52], [82, -58]], { rol: 'libro3' }), PG([[60, 0], [76, 0], [98, -52], [82, -58]], { linea: 'ext' }),
    // maceta con su mata
    P('M 150 -98 C 138 -88 134 -72 142 -60 C 154 -70 156 -86 150 -98 Z', { rol: 'hoja' }),
    P('M 150 -98 C 138 -88 134 -72 142 -60 C 154 -70 156 -86 150 -98 Z', { linea: 'int' }),
    P('M 168 -84 C 182 -80 190 -66 184 -56 C 172 -58 164 -70 168 -84 Z', { rol: 'hoja' }),
    P('M 168 -84 C 182 -80 190 -66 184 -56 C 172 -58 164 -70 168 -84 Z', { linea: 'int' }),
    P('M 160 -30 C 158 -46 152 -60 146 -68', { linea: 'fino' }),
    P('M 162 -30 C 166 -44 174 -54 180 -60', { linea: 'fino' }),
    PG([[144, 0], [176, 0], [180, -24], [140, -24]], { rol: 'maceta' }), PG([[144, 0], [176, 0], [180, -24], [140, -24]], { linea: 'ext' }),
    R(137, -32, 46, 8, { rol: 'maceta' }), R(137, -32, 46, 8, { linea: 'int' }),
  ];
  if (objetos >= 3) piezas.push(
    RR(220, -46, 42, 46, 3, { rol: 'marco' }), RR(220, -46, 42, 46, 3, { linea: 'ext' }),
    PL([[228, -8], [238, -24], [246, -14], [252, -20], [256, -8]], { linea: 'fino', tinta: 'cielo' }),
    E([248, -34], 4, 4, { rol: 'papel', mueve: [1, 1] }),
  );
  return parte([grupo('repisa', piezas)]);
}

function mesa({ x0, x1, y, abajo }) {
  const g = 18, p = 30;
  return parte([grupo('mesa', [
    R(x0, y, x1 - x0, g, { rol: 'mesa' }),
    L([x0, y + g], [x1, y + g], { linea: 'int' }),
    L([x0, y], [x0, y + g], { linea: 'ext' }),
    L([x1, y], [x1, y + g], { linea: 'ext' }),
    ...[x0 + p, x1 - p - 14].flatMap((x) => [L([x, y + g], [x, abajo], { linea: 'int', tinta: 'viva' }), L([x + 14, y + g], [x + 14, abajo], { linea: 'int', tinta: 'viva' })]),
  ])]);
}

const flecha = (d, punta, ang, tinta = 'ambar') => {
  const r = (ang * Math.PI) / 180, k = 11;
  const a = [punta[0] - k * Math.cos(r - 0.5), punta[1] - k * Math.sin(r - 0.5)];
  const b = [punta[0] - k * Math.cos(r + 0.5), punta[1] - k * Math.sin(r + 0.5)];
  return [P(d, { linea: 'int', tinta }), PL([a, punta, b], { linea: 'int', tinta })];
};

function bordes(grupos, pad = 8) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  const pon = ([x, y]) => { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); };
  for (const g of grupos) for (const p of g.piezas) {
    if (p.a) { pon(p.a); pon(p.b); }
    if (p.pts) p.pts.forEach(pon);
    if (p.c) { pon([p.c[0] - p.rx, p.c[1] - p.ry]); pon([p.c[0] + p.rx, p.c[1] + p.ry]); }
    if (p.d) { const n = p.d.match(/-?\d*\.?\d+/g).map(Number); for (let i = 0; i + 1 < n.length; i += 2) pon([n[i], n[i + 1]]); }
  }
  return [x0 - pad, y0 - pad, x1 - x0 + 2 * pad, y1 - y0 + 2 * pad];
}

const COMP = {
  h: {
    ancho: 900, alto: 640,
    mesa: { x0: 64, x1: 868, y: 468, abajo: 640 },
    monitor: { x: 360, y: 467, s: 1 }, teclado: { x: 360, y: 468, s: 1 }, taza: { x: 116, y: 467, s: 1 },
    lampara: { x: 806, y: 467, s: 1 }, lamp: { E: [30, -124], J: [-62, -206], T: [-236, 0], abre: 104 },
    haku: { x: 584, y: 467, s: 0.84 }, agente: { x: 196, y: 467, s: 0.78 }, paso: 16,
    repisa: { x: 548, y: 168, s: 1 }, objetos: 3, anchoRepisa: 300,
    tam: 24,
    rotulos: (t) => [
      T('idea', 56, 232, { tam: t }),
      ...flecha('M 112 226 C 150 214 196 222 232 252', [232, 252], 38),
      T('pruebas', 292, 212, { tam: t }),
      PL([[392, 200], [399, 208], [414, 190]], { linea: 'ext', tinta: 'ambar' }),
      T('Haku supervisa', 596, 562, { tam: t, ancla: 'middle', tinta: 'hueso' }),
      ...flecha('M 604 538 C 612 524 610 510 600 498', [600, 498], -110, 'hueso'),
    ],
  },
  v: {
    ancho: 360, alto: 440,
    mesa: { x0: 12, x1: 348, y: 318, abajo: 440 },
    monitor: { x: 150, y: 317, s: 0.6 }, teclado: { x: 150, y: 318, s: 0.6 }, taza: { x: 32, y: 317, s: 0.66 },
    lampara: { x: 334, y: 317, s: 0.62 }, lamp: { E: [26, -120], J: [-34, -250], T: [-120, 0], abre: 86 },
    haku: { x: 270, y: 317, s: 0.54 }, agente: { x: 64, y: 317, s: 0.52 }, paso: 9,
    repisa: { x: 200, y: 86, s: 0.72 }, objetos: 2, anchoRepisa: 200,
    tam: 17,
    rotulos: (t) => [
      T('idea', 24, 150, { tam: t }),
      ...flecha('M 64 146 C 76 150 84 160 86 174', [86, 174], 70),
      T('pruebas', 112, 160, { tam: t }),
      PL([[178, 151], [183, 157], [194, 144]], { linea: 'int', tinta: 'ambar' }),
      T('Haku supervisa', 236, 392, { tam: t, ancla: 'middle', tinta: 'hueso' }),
      ...flecha('M 262 374 C 270 366 270 354 264 344', [264, 344], -100, 'hueso'),
    ],
  },
};

function componer(id) {
  const c = COMP[id];
  const partes = {
    mesa: mesa(c.mesa),
    repisa: mover(repisa(c.anchoRepisa, c.objetos), c.repisa),
    monitor: mover(monitor(), c.monitor),
    teclado: mover(teclado(), c.teclado),
    taza: mover(taza(), c.taza),
    lampara: mover(lampara(c.lamp), c.lampara),
    haku: prefijar(mover(hakuSentado(), c.haku), 'haku'),
    agente: prefijar(mover(agenteCargando({ anim: 'agente' }), c.agente), 'agente'),
  };
  const rotulos = { nombre: 'rotulos', piezas: c.rotulos(c.tam) };
  // orden de pintado (z): luz y sombras van en su capa; lo de adelante al final
  const grupos = [
    ...partes.mesa.grupos, ...partes.repisa.grupos, ...partes.lampara.grupos, ...partes.monitor.grupos,
    ...partes.teclado.grupos, ...partes.taza.grupos, ...partes.haku.grupos, ...partes.agente.grupos, rotulos,
  ];
  const anclas = { ...partes.taza.anclas, ...partes.lampara.anclas, ...partes.haku.anclas, ...partes.agente.anclas };
  const nombres = (p) => p.grupos.map((g) => g.nombre);
  const hk = nombres(partes.haku);
  const orden = [
    ['mesa'], ['monitor', 'sombra-monitor', 'teclado'], ['taza', 'sombra-taza', 'repisa'], ['lampara'], ['luz', '!parpadeoLuz'],
    hk.filter((n) => !/orejas|cabeza|ojos/.test(n)), hk.filter((n) => /orejas|cabeza|ojos/.test(n)),
    nombres(partes.agente), ['rotulos', '!pasitos'], ['!parpadear', '!moverCola'],
  ];
  // la lámpara como botón: su caja en % del lienzo
  const [lx, ly, lw, lh] = bordes(partes.lampara.grupos.filter((g) => g.nombre === 'lampara'));
  const pc = (v, t) => Math.round((v / t) * 1000) / 10;
  const h = c.haku;
  return {
    nombre: `escritorio-${id}`,
    titulo: 'El escritorio de noche',
    vb: [0, 0, c.ancho, c.alto],
    grupos,
    anclas,
    orden,
    zonas: [E([h.x, h.y - 96 * h.s], 66 * h.s, 100 * h.s, { nombre: 'haku' })],
    lampara: { x: pc(lx, c.ancho), y: pc(ly, c.alto), w: pc(lw, c.ancho), h: pc(lh, c.alto) },
    gestos: {
      ...GESTOS_HAKU,
      ...GESTOS_AGENTE,
      pasitos: { tipo: 'pasos', anims: ['agente'], paso: c.paso, n: 3 },
      parpadeoLuz: { tipo: 'opacidad', anims: ['luz'], valores: [1, 0.15, 1], dur: [0.04, 0.09, 0.08] },
      vapor: { tipo: 'mover', anims: ['vapor'], valores: [[0, -4], [0, 0]], dur: [0.5, 0.5] },
    },
    alPasar: [{ zona: 'haku', gesto: 'oreja' }],
    sigue: 'mirar',
  };
}

// ── La composición ANCHA (escritorio ≥ 1024): tres dibujos a todo lo ancho ──
// Escala común: 16 u = 1vw. La mesa y la cajonera miden 528 u de alto (33vw) y su cubierta queda a 166 u del piso
// (10.375vw): las dos se colocan pegadas abajo y la cubierta queda a la misma altura.
const ANCHA = { alto: 528, cubierta: 362 };

/** libros acostados, uno sobre otro (origen = la mesa) */
function librosAcostados() {
  return parte([grupo('libros', [
    RR(-64, -15, 128, 15, 3, { rol: 'libro3' }), RR(-64, -15, 128, 15, 3, { linea: 'ext' }),
    L([-54, -7.5], [44, -7.5], { linea: 'fino', tinta: 'noche' }),
    RR(-56, -29, 108, 14, 3, { rol: 'libro1' }), RR(-56, -29, 108, 14, 3, { linea: 'ext' }),
    RR(-48, -42, 92, 13, 3, { rol: 'libro2' }), RR(-48, -42, 92, 13, 3, { linea: 'int' }),
    L([-38, -35.5], [30, -35.5], { linea: 'fino', tinta: 'noche' }),
  ])]);
}

/** hojas sueltas con un lápiz encima */
function hojas() {
  return parte([grupo('hojas', [
    PG([[-70, 0], [52, 0], [64, -10], [-58, -10]], { rol: 'paginas' }), PG([[-70, 0], [52, 0], [64, -10], [-58, -10]], { linea: 'int' }),
    PG([[-40, -10], [76, -10], [70, -18], [-46, -18]], { rol: 'paginas' }), PG([[-40, -10], [76, -10], [70, -18], [-46, -18]], { linea: 'int' }),
    L([-30, -14], [40, -14], { linea: 'fino', tinta: 'noche', punteado: '6 4' }),
    PG([[-20, -22], [58, -30], [60, -26], [-18, -18]], { rol: 'lampara' }), PG([[-20, -22], [58, -30], [60, -26], [-18, -18]], { linea: 'int' }),
    PL([[58, -30], [68, -28.5], [60, -26]], { linea: 'int' }),
  ])]);
}

/** el lapicero: un vaso con tres lápices */
function lapicero() {
  return parte([grupo('lapicero', [
    L([-8, -42], [-14, -70], { linea: 'int', tinta: 'ambar' }), L([4, -42], [6, -74], { linea: 'int', tinta: 'cielo' }), L([12, -42], [22, -66], { linea: 'int' }),
    PG([[-18, 0], [18, 0], [21, -44], [-21, -44]], { rol: 'maceta' }), PG([[-18, 0], [18, 0], [21, -44], [-21, -44]], { linea: 'ext' }),
    L([-16, -12], [16, -12], { linea: 'fino', tinta: 'noche' }),
  ])]);
}

/** una repisa larga de pared (origen = la orilla izquierda de la tabla, arriba) con sus cosas */
function repisaLarga(ancho, cosas) {
  const piezas = [
    R(0, 0, ancho, 10, { rol: 'mesa' }), R(0, 0, ancho, 10, { linea: 'int' }),
    ...[40, ancho - 40].map((x) => PL([[x, 10], [x, 34], [x + (x < ancho / 2 ? 22 : -22), 10]], { linea: 'int', tinta: 'viva' })),
  ];
  const x = (k) => k * ancho;
  if (cosas.includes('libros')) {
    const b = x(0.06);
    piezas.push(
      RR(b, -50, 16, 50, 2, { rol: 'libro1' }), RR(b, -50, 16, 50, 2, { linea: 'ext' }),
      RR(b + 18, -42, 14, 42, 2, { rol: 'libro2' }), RR(b + 18, -42, 14, 42, 2, { linea: 'ext' }),
      RR(b + 34, -46, 15, 46, 2, { rol: 'libro3' }), RR(b + 34, -46, 15, 46, 2, { linea: 'int' }),
      PG([[b + 52, 0], [b + 66, 0], [b + 84, -44], [b + 70, -48]], { rol: 'libro1' }),
      PG([[b + 52, 0], [b + 66, 0], [b + 84, -44], [b + 70, -48]], { linea: 'ext' }),
    );
  }
  if (cosas.includes('mata')) {
    const c = x(0.5);
    const h1 = `M ${c - 10} -74 C ${c - 20} -66 ${c - 23} -54 ${c - 17} -45 C ${c - 8} -52 ${c - 6} -64 ${c - 10} -74 Z`;
    const h2 = `M ${c + 6} -63 C ${c + 17} -60 ${c + 23} -49 ${c + 18} -42 C ${c + 9} -43 ${c + 3} -53 ${c + 6} -63 Z`;
    const m = [[c - 12, 0], [c + 12, 0], [c + 15, -18], [c - 15, -18]];
    piezas.push(
      P(h1, { rol: 'hoja' }), P(h1, { linea: 'int' }), P(h2, { rol: 'hoja' }), P(h2, { linea: 'int' }),
      P(`M ${c} -22 C ${c - 2} -34 ${c - 7} -44 ${c - 12} -50`, { linea: 'fino' }),
      P(`M ${c + 1} -22 C ${c + 4} -33 ${c + 10} -40 ${c + 15} -45`, { linea: 'fino' }),
      PG(m, { rol: 'maceta' }), PG(m, { linea: 'ext' }),
      R(c - 18, -24, 36, 6, { rol: 'maceta' }), R(c - 18, -24, 36, 6, { linea: 'int' }),
    );
  }
  if (cosas.includes('reloj')) {
    const c = x(0.3);
    piezas.push(
      E([c, -24], 20, 20, { rol: 'marco' }), E([c, -24], 20, 20, { linea: 'ext' }),
      L([c, -24], [c, -37], { linea: 'int', tinta: 'ambar' }), L([c, -24], [c + 9, -20], { linea: 'int', tinta: 'ambar' }),
      L([c - 14, 0], [c - 10, -8], { linea: 'int' }), L([c + 14, 0], [c + 10, -8], { linea: 'int' }),
    );
  }
  if (cosas.includes('cuadro')) {
    const c = x(0.82);
    piezas.push(
      RR(c - 22, -46, 44, 46, 3, { rol: 'marco' }), RR(c - 22, -46, 44, 46, 3, { linea: 'ext' }),
      PL([[c - 14, -8], [c - 4, -24], [c + 4, -14], [c + 10, -20], [c + 14, -8]], { linea: 'fino', tinta: 'cielo' }),
      E([c + 6, -34], 4, 4, { rol: 'papel', mueve: [1, 1] }),
    );
  }
  return parte([grupo('repisa', piezas)]);
}

/** la ventana con luna (origen arriba a la izquierda; 300×332) */
function ventana() {
  const est = (x, y, k = 1) => [L([x - 7 * k, y], [x + 7 * k, y], { linea: 'int', tinta: 'ambar' }), L([x, y - 7 * k], [x, y + 7 * k], { linea: 'int', tinta: 'ambar' })];
  const luna = 'M 196 52 C 168 56 152 84 158 110 C 164 136 192 150 218 142 C 196 136 182 116 184 94 C 186 74 198 60 214 54 C 208 52 202 51 196 52 Z';
  return {
    marco: parte([grupo('ventana', [
      RR(14, 14, 272, 300, 6, { rol: 'marco' }),
      R(30, 30, 240, 268, { rol: 'pantalla' }),
      R(34, 34, 232, 260, { trama: 'cielo', op: 0.32 }),
      RR(14, 14, 272, 300, 6, { linea: 'ext' }),
      R(30, 30, 240, 268, { linea: 'int', tinta: 'viva' }),
      L([150, 30], [150, 298], { linea: 'ext' }),
      L([30, 172], [270, 172], { linea: 'ext' }),
      R(0, 312, 300, 16, { rol: 'mesa' }), R(0, 312, 300, 16, { linea: 'int' }),
    ])]),
    luna: parte([
      grupo('brillo-luna', [E([192, 98], 58, 58, { trama: 'hueso', op: 0.7 })], { capa: 'luz' }),
      grupo('luna', [P(luna, { rol: 'sobre' }), P(luna, { linea: 'ext' }), E([176, 118], 5, 4, { linea: 'fino', tinta: 'apagado' }), E([170, 92], 3, 3, { linea: 'fino', tinta: 'apagado' })], { anim: 'luna' }),
    ], { luna: [192, 98] }),
    estrellas: parte([grupo('estrellas', [...est(70, 70), ...est(108, 126, 0.7), ...est(232, 214, 0.8), ...est(84, 236, 0.6)], { anim: 'estrella' })]),
  };
}

function componerAncha() {
  const A = ANCHA, y = A.cubierta;
  const nombres = (p) => p.grupos.map((g) => g.nombre);
  const pc = (v, t) => Math.round((v / t) * 1000) / 10;

  // 1 · la mesa: de x 0 (fuera de la ventana, a −3vw) a 1240 (74.5vw), donde termina en una orilla de verdad
  const m = {
    mesa: mesa({ x0: 0, x1: 1240, y, abajo: A.alto }),
    repisa: mover(repisaLarga(392, ['libros', 'mata', 'cuadro']), { x: 848, y: 52, s: 1 }),
    libros: mover(librosAcostados(), { x: 250, y: y - 1, s: 1 }),
    hojas: mover(hojas(), { x: 460, y: y - 1, s: 1 }),
    lapicero: mover(lapicero(), { x: 640, y: y - 1, s: 1 }),
    monitor: mover(monitor(), { x: 1010, y: y - 1, s: 1.12 }),
    teclado: mover(teclado(), { x: 1010, y, s: 1.12 }),
    taza: mover(taza(), { x: 1182, y: y - 1, s: 1.08 }),
    agente: prefijar(mover(agenteCargando({ anim: 'agente' }), { x: 818, y: y - 1, s: 0.84 }), 'agente'),
  };
  const mesaDef = {
    nombre: 'escritorio-mesa',
    titulo: 'El escritorio de noche',
    vb: [0, 0, 1248, A.alto],
    grupos: [
      ...m.mesa.grupos, ...m.repisa.grupos, ...m.monitor.grupos, ...m.teclado.grupos, ...m.libros.grupos,
      ...m.hojas.grupos, ...m.lapicero.grupos, ...m.taza.grupos, ...m.agente.grupos,
    ],
    anclas: { ...m.taza.anclas, ...m.agente.anclas },
    orden: [
      ['mesa'], ['libros', 'hojas'], ['lapicero', 'repisa'], ['monitor', 'sombra-monitor', 'teclado'], ['taza', 'sombra-taza'],
      nombres(m.agente), ['!pasitos'],
    ],
    gestos: {
      ...GESTOS_AGENTE,
      pasitos: { tipo: 'pasos', anims: ['agente'], paso: 16, n: 3 },
      vapor: { tipo: 'mover', anims: ['vapor'], valores: [[0, -4], [0, 0]], dur: [0.5, 0.5] },
    },
  };

  // 2 · la cajonera: de x 0 (80vw) hacia la derecha, sale por la orilla; la lámpara alumbra a Haku
  const h = { x: 150, y: y - 1, s: 0.92 };
  const c = {
    mesa: mesa({ x0: 6, x1: 430, y, abajo: A.alto }),
    repisa: mover(repisaLarga(420, ['reloj', 'cuadro']), { x: 0, y: 52, s: 1 }),
    lampara: mover(lampara({ E: [24, -118], J: [-52, -206], T: [-170, 0], abre: 86 }), { x: 312, y: y - 1, s: 1 }),
    haku: prefijar(mover(hakuSentado(), h), 'haku'),
  };
  const hk = nombres(c.haku);
  const rotulos = { nombre: 'rotulos', piezas: [
    T('Haku supervisa', 150, 470, { tam: 24, ancla: 'middle', tinta: 'hueso' }),
    ...flecha('M 158 446 C 166 432 164 418 154 406', [154, 406], -110, 'hueso'),
  ] };
  const [lx, ly, lw, lh] = bordes(c.lampara.grupos.filter((g) => g.nombre === 'lampara'));
  const cajDef = {
    nombre: 'escritorio-cajonera',
    titulo: 'El escritorio de noche',
    vb: [0, 0, 368, A.alto],
    grupos: [...c.mesa.grupos, ...c.repisa.grupos, ...c.lampara.grupos, ...c.haku.grupos, rotulos],
    anclas: { ...c.lampara.anclas, ...c.haku.anclas },
    orden: [
      ['mesa'], ['repisa'], ['lampara'], ['luz', '!parpadeoLuz'],
      hk.filter((n) => !/orejas|cabeza|ojos/.test(n)), hk.filter((n) => /orejas|cabeza|ojos/.test(n)),
      ['rotulos'], ['!parpadear', '!moverCola'],
    ],
    zonas: [E([h.x, h.y - 96 * h.s], 66 * h.s, 100 * h.s, { nombre: 'haku' })],
    lampara: { x: pc(lx, 368), y: pc(ly, A.alto), w: pc(lw, 368), h: pc(lh, A.alto) },
    gestos: {
      ...GESTOS_HAKU,
      parpadeoLuz: { tipo: 'opacidad', anims: ['luz'], valores: [1, 0.15, 1], dur: [0.04, 0.09, 0.08] },
    },
    alPasar: [{ zona: 'haku', gesto: 'oreja' }],
    sigue: 'mirar',
  };

  // 3 · la ventana con luna: al pasar el cursor por la luna, la luna se mece y las estrellas titilan
  const v = ventana();
  const venDef = {
    nombre: 'escritorio-ventana',
    titulo: 'La ventana con luna',
    vb: [0, 0, 300, 332],
    grupos: [...v.marco.grupos, ...v.luna.grupos, ...v.estrellas.grupos],
    anclas: { ...v.luna.anclas },
    orden: [['ventana'], ['brillo-luna', 'luna'], ['estrellas', '!titilar']],
    zonas: [E([192, 98], 70, 70, { nombre: 'luna' })],
    gestos: {
      titilar: { tipo: 'opacidad', anims: ['estrella'], valores: [0.15, 1, 0.35, 1], dur: [0.08, 0.12, 0.1, 0.16] },
      mecer: { tipo: 'giro', anims: ['luna'], valores: [-6, 4, -2, 0], dur: [0.2, 0.24, 0.2, 0.24] },
    },
    alPasar: [{ zona: 'luna', gesto: 'titilar' }, { zona: 'luna', gesto: 'mecer' }],
  };
  return [mesaDef, cajDef, venDef];
}

export function escritorio() {
  return [componer('h'), componer('v'), ...componerAncha()];
}
