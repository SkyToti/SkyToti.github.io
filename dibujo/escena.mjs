// «El escritorio de noche»: la escena como GEOMETRÍA LIMPIA.
// Nada de aquí sabe de estilos: solo formas con nombre, grupo, sub-grupo, tono y rol.
// generar.mjs las pasa por roughjs (3 semillas = línea que hierve) según el estilo.
//
// Una pieza:  { nombre, sub, tono, rol?, capa?, entra?, ...forma }
//   forma:  linea {a,b} · polilinea {pts} · poligono {pts} · rect {x,y,w,h}
//           elipse {c,rx,ry} · camino {d}
//   tono:   'hueso' | 'apagado' | 'viva' | 'ambar' | 'cielo'   (color del trazo; null = sin trazo)
//   rol:    nombre semántico para el relleno (cada estilo decide qué color le toca)
//   capa:   'ojos' → va por encima del oscurecido (los ojos del gato siguen viéndose)
//   entra:  'fade' → aparece con opacidad en vez de trazarse (p. ej. líneas punteadas)
// Un grupo vive en coordenadas locales (origen = donde toca la mesa) y la composición
// lo coloca con translate + escala; así la versión vertical es otra colocación, no un escalado.

const L = (a, b, x = {}) => ({ tipo: 'linea', a, b, ...x });
const PL = (pts, x = {}) => ({ tipo: 'polilinea', pts, ...x });
const PG = (pts, x = {}) => ({ tipo: 'poligono', pts, ...x });
const R = (x0, y0, w, h, x = {}) => ({ tipo: 'rect', x: x0, y: y0, w, h, ...x });
const E = (c, rx, ry, x = {}) => ({ tipo: 'elipse', c, rx, ry, ...x });
const P = (d, x = {}) => ({ tipo: 'camino', d, ...x });

const espejo = (p) => {
  const m = ([x, y]) => [-x, y];
  const q = { ...p };
  if (p.a) { q.a = m(p.a); q.b = m(p.b); }
  if (p.pts) q.pts = p.pts.map(m);
  if (p.c) q.c = m(p.c);
  if (p.d) q.d = p.d.replace(/(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)/g, (_, x, y) => `${-x} ${y}`);
  return q;
};
const par = (p) => [p, espejo(p)];

// ── Haku: gatito lynx point sentado de frente (origen = centro de la base, 1 u ≈ 1 px a 820) ──
function haku() {
  const piezas = [];
  const add = (sub, arr) => arr.flat().forEach((p) => piezas.push({ sub, tono: 'hueso', ...p }));

  add('cola', [
    P('M 40 -12 C 64 -10 78 -22 76 -42 C 75 -54 80 -64 90 -63', { nombre: 'cola-fuera', rol: 'pelaje' }),
    P('M 42 -2 C 70 -2 86 -18 84 -40 C 83 -49 86 -54 92 -54', { nombre: 'cola-dentro' }),
    P('M 90 -63 C 97 -62 98 -55 92 -54', { nombre: 'cola-punta' }),
    L([75, -45], [84, -43], { nombre: 'cola-raya1', tono: 'apagado' }),
    L([77, -54], [85, -51], { nombre: 'cola-raya2', tono: 'apagado' }),
    L([82, -61], [88, -57], { nombre: 'cola-raya3', tono: 'apagado', detalle: true }),
  ]);
  // relleno de la cola (un solo cuerpo cerrado, sin trazo)
  piezas.push({ sub: 'cola', tono: null, rol: 'pelaje', nombre: 'cola-masa',
    ...P('M 40 -12 C 64 -10 78 -22 76 -42 C 75 -54 80 -64 90 -63 C 97 -62 98 -55 92 -54 C 86 -54 83 -49 84 -40 C 86 -18 70 -2 42 -2 Z') });
  piezas.push({ sub: 'cola', tono: null, rol: 'puntas', nombre: 'cola-punta-masa',
    ...P('M 75 -46 C 75 -54 80 -64 90 -63 C 97 -62 98 -55 92 -54 C 86 -54 83 -49 84 -44 Z') });

  add('cuerpo', [
    { tono: null, rol: 'pelaje', nombre: 'cuerpo-masa',
      ...P('M -23 -90 C -32 -80 -36 -66 -36 -54 C -36 -50 -48 -40 -46 -18 C -45 -10 -44 -6 -42 -4 L 42 -4 C 44 -6 45 -10 46 -18 C 48 -40 36 -50 36 -54 C 36 -66 32 -80 23 -90 Z') },
    par(P('M -23 -90 C -32 -80 -36 -66 -36 -54 C -36 -50 -48 -40 -46 -18 C -45 -10 -44 -6 -42 -4', { nombre: 'costado' })),
    par(P('M -35 -50 C -27 -44 -25 -28 -27 -9', { nombre: 'muslo' })),
    par(E([-34, -4.5], 9, 4.5, { nombre: 'pata-trasera' })),
    par(P('M -16 -66 C -18 -42 -18 -22 -17 -8', { nombre: 'pata-fuera' })),
    L([0, -60], [0, -9], { nombre: 'entre-patas' }),
    par(E([-9, -4.5], 9, 5, { nombre: 'mano' })),
    P('M -7 -79 L -3.5 -74 L 0 -78 L 3.5 -74 L 7 -79', { nombre: 'pechera', fino: true }),
  ]);

  add('cabeza', [
    { tono: null, rol: 'pelaje', nombre: 'cabeza-masa',
      ...P('M -30 -138 C -18 -147 18 -147 30 -138 C 40 -130 43 -112 37 -100 C 31 -89 15 -84 0 -84 C -15 -84 -31 -89 -37 -100 C -43 -112 -40 -130 -30 -138 Z') },
    P('M -30 -138 C -18 -147 18 -147 30 -138 C 40 -130 43 -112 37 -100 C 31 -89 15 -84 0 -84 C -15 -84 -31 -89 -37 -100 C -43 -112 -40 -130 -30 -138 Z', { nombre: 'cabeza' }),
    par(PL([[-38, -108], [-45, -102], [-38, -98]], { nombre: 'mechon-mejilla' })),
    // antifaz y frente con rayitas (lynx point)
    par({ tono: null, rol: 'puntas', nombre: 'antifaz', ...E([-15, -113], 13, 12) }),
    L([-8, -141], [-6, -131], { nombre: 'frente1', tono: 'apagado', detalle: true }),
    L([0, -144], [0, -133], { nombre: 'frente2', tono: 'apagado' }),
    L([8, -141], [6, -131], { nombre: 'frente3', tono: 'apagado', detalle: true }),
    par(L([-27, -117], [-35, -120], { nombre: 'raya-ojo1', tono: 'apagado', detalle: true })),
    par(L([-27, -110], [-36, -110], { nombre: 'raya-ojo2', tono: 'apagado' })),
    // nariz, boca y bigotes
    { tono: null, rol: 'nariz', nombre: 'nariz', ...PG([[-4.5, -101], [4.5, -101], [0, -96.5]]) },
    P('M 0 -96.5 L 0 -93.5 M -7 -91 C -5 -88 -1 -89 0 -93.5 C 1 -89 5 -88 7 -91', { nombre: 'boca', fino: true }),
    par(L([-21, -99], [-50, -105], { nombre: 'bigote1', tono: 'apagado' })),
    par(L([-21, -96], [-52, -96], { nombre: 'bigote2', tono: 'apagado' })),
    par(L([-21, -93], [-48, -87], { nombre: 'bigote3', tono: 'apagado', detalle: true })),
  ]);

  const oreja = (sub, s) => {
    const k = ([x, y]) => [s * x, y];
    add(sub, [
      { tono: null, rol: 'pelaje', nombre: 'oreja-masa', ...PG([[-34, -133], [-38, -170], [-13, -144.5]].map(k)) },
      { tono: null, rol: 'puntas', nombre: 'oreja-dentro-masa', ...PG([[-31, -137], [-35, -162], [-18, -144]].map(k)) },
      PL([[-34, -133], [-38, -170], [-13, -144.5]].map(k), { nombre: 'oreja' }),
      L(k([-38, -170]), k([-40, -177]), { nombre: 'pincel' }),
      L(k([-31, -150]), k([-25, -146]), { nombre: 'oreja-raya1', tono: 'apagado' }),
      L(k([-33, -157]), k([-28, -153]), { nombre: 'oreja-raya2', tono: 'apagado', detalle: true }),
    ]);
  };
  oreja('oreja-i', 1);
  oreja('oreja-d', -1);

  // ojos: capa de arriba (siguen viéndose con la lámpara apagada)
  for (const [lado, cx] of [['i', -15], ['d', 15]]) {
    piezas.push({ sub: `ojo-${lado}`, capa: 'ojos', tono: 'hueso', rol: 'ojo', nombre: 'ojo', fino: true, ...E([cx, -114], 9.5, 10.5) });
    piezas.push({ sub: `ojo-${lado}`, capa: 'ojos', tono: null, rol: 'pupila', nombre: 'pupila', pupila: true, ...E([cx, -113], 3.3, 7.2) });
    piezas.push({ sub: `ojo-${lado}`, capa: 'ojos', tono: null, rol: 'brillo', nombre: 'brillo', pupila: true, ...E([cx + 2.6, -118], 1.9, 1.9) });
  }

  return {
    piezas,
    pivotes: { cola: [40, -8], 'oreja-d': [23, -140], 'ojo-i': [-15, -114], 'ojo-d': [15, -114] },
    golpe: { c: [0, -88], rx: 58, ry: 92 }, // zona de cursor
  };
}

// ── Monitor con notas adhesivas (origen = base del pie) ──
function monitor() {
  const nota = (c, lado, giro, nombre) => {
    const r = (giro * Math.PI) / 180, h = lado / 2;
    const rot = ([x, y]) => [c[0] + x * Math.cos(r) - y * Math.sin(r), c[1] + x * Math.sin(r) + y * Math.cos(r)];
    return [
      { tono: 'hueso', rol: 'papel', nombre, ...PG([[-h, -h], [h, -h], [h, h], [-h, h]].map(rot)) },
      L(rot([-h + 6, -h + 9]), rot([h - 7, -h + 9]), { tono: 'apagado', nombre: `${nombre}-renglon1` }),
      L(rot([-h + 6, -h + 16]), rot([h - 11, -h + 16]), { tono: 'apagado', nombre: `${nombre}-renglon2` }),
    ];
  };
  const piezas = [
    { sub: 'marco', tono: 'hueso', rol: 'marco', nombre: 'marco', ...R(-110, -222, 220, 150) },
    { sub: 'marco', tono: 'viva', rol: 'pantalla', nombre: 'pantalla', ...R(-100, -212, 200, 130) },
    { sub: 'marco', tono: 'hueso', nombre: 'cuello-i', ...L([-10, -72], [-10, -10]) },
    { sub: 'marco', tono: 'hueso', nombre: 'cuello-d', ...L([10, -72], [10, -10]) },
    { sub: 'marco', tono: 'hueso', rol: 'pie', nombre: 'pie', ...PG([[-40, 0], [40, 0], [22, -10], [-22, -10]]) },
    { sub: 'codigo', tono: 'cielo', nombre: 'menor', ...PL([[-42, -162], [-60, -147], [-42, -132]]) },
    { sub: 'codigo', tono: 'cielo', nombre: 'diagonal', ...L([-8, -127], [8, -167]) },
    { sub: 'codigo', tono: 'cielo', nombre: 'mayor', ...PL([[42, -162], [60, -147], [42, -132]]) },
    { sub: 'codigo', tono: 'cielo', nombre: 'brillo1', ...L([70, -204], [88, -190]) },
    { sub: 'codigo', tono: 'cielo', nombre: 'brillo2', ...L([80, -205], [90, -197]) },
    ...nota([102, -214], 30, 9, 'nota1').map((p) => ({ sub: 'notas', ...p })),
    ...nota([-82, -98], 26, -7, 'nota2').map((p) => ({ sub: 'notas', ...p })),
  ];
  return { piezas };
}

function teclado() {
  return {
    piezas: [
      { sub: 'teclado', tono: 'hueso', rol: 'teclado', nombre: 'teclado', ...PG([[-80, 0], [80, 0], [72, -16], [-72, -16]]) },
      { sub: 'teclas', tono: 'apagado', nombre: 'teclas1', punteado: '7 4', entra: 'fade', ...L([-66, -11.5], [66, -11.5]) },
      { sub: 'teclas', tono: 'apagado', nombre: 'teclas2', punteado: '7 4', entra: 'fade', ...L([-70, -6], [70, -6]) },
    ],
  };
}

function taza() {
  return {
    piezas: [
      { sub: 'taza', tono: null, rol: 'taza', nombre: 'taza-masa', ...P('M -16 -44 L -14 -2 C -14 1 14 1 14 -2 L 16 -44 Z') },
      { sub: 'taza', tono: 'hueso', nombre: 'taza', ...P('M -16 -44 L -14 -2 C -14 1 14 1 14 -2 L 16 -44') },
      { sub: 'taza', tono: 'hueso', nombre: 'borde', ...E([0, -44], 16, 4) },
      { sub: 'taza', tono: 'hueso', nombre: 'asa', ...P('M -15 -36 C -29 -36 -29 -14 -14 -14') },
      { sub: 'vapor', tono: 'apagado', nombre: 'vapor1', ...P('M -4 -52 C -9 -58 1 -62 -4 -70') },
      { sub: 'vapor', tono: 'apagado', nombre: 'vapor2', ...P('M 6 -54 C 1 -60 11 -64 6 -73') },
    ],
  };
}

// ── Lámpara de brazo: la geometría del cono sale del brazo (origen = base) ──
function lampara({ E: codo, J, T, abre }) {
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
  const sum = (a, b) => [a[0] + b[0], a[1] + b[1]];
  const mul = (a, k) => [a[0] * k, a[1] * k];
  const d = sub(T, J), n0 = Math.hypot(...d), u = mul(d, 1 / n0), n = [-u[1], u[0]];
  const A = sum(J, mul(u, 2)), C = sum(J, mul(u, 44));
  const N1 = sum(A, mul(n, 8)), N2 = sum(A, mul(n, -8));
  const W1 = sum(C, mul(n, 25)), W2 = sum(C, mul(n, -25));
  const foco = sum(C, mul(u, 9));
  const [Wi, Wd] = W1[0] < W2[0] ? [W1, W2] : [W2, W1];
  const cono = [sum(Wi, mul(u, 2)), sum(Wd, mul(u, 2)), [T[0] + abre, 0], [T[0] - abre, 0]];
  const piezas = [
    { sub: 'base', tono: 'hueso', rol: 'lampara', nombre: 'base', ...P('M -26 0 C -24 -11 24 -11 26 0 Z') },
    { sub: 'brazo', tono: 'hueso', nombre: 'brazo-bajo', ...L([0, -8], codo) },
    { sub: 'brazo', tono: 'hueso', nombre: 'brazo-alto', ...L(codo, J) },
    { sub: 'brazo', tono: 'hueso', rol: 'tornillo', nombre: 'codo', ...E(codo, 5, 5) },
    { sub: 'brazo', tono: 'hueso', rol: 'tornillo', nombre: 'nuca', ...E(J, 4.5, 4.5) },
    { sub: 'pantalla', tono: 'hueso', rol: 'lampara', nombre: 'pantalla', ...PG([N1, N2, W2, W1]) },
    { sub: 'pantalla', tono: 'hueso', nombre: 'foco', ...P(`M ${sum(C, mul(n, 11)).join(' ')} Q ${sum(C, mul(u, 17)).join(' ')} ${sum(C, mul(n, -11)).join(' ')}`) },
  ];
  const xs = [...cono.slice(0, 2), N1, N2, codo, J, [-26, 0], [26, 0]].map((p) => p[0]);
  const ys = [N1, N2, W1, W2, codo, J, [0, 0]].map((p) => p[1]);
  const caja = { x: Math.min(...xs) - 6, y: Math.min(...ys) - 8, w: Math.max(...xs) - Math.min(...xs) + 12, h: -Math.min(...ys) + 12 };
  return { piezas, luz: { cono, charco: { c: T, rx: abre * 0.92, ry: 6 }, foco }, caja };
}

// ── El agente: robotito con cabeza de foco que carga un bloque (origen = entre los pies, mira a +x) ──
function agente() {
  return {
    piezas: [
      { sub: 'agente', tono: 'hueso', nombre: 'pierna-i', ...L([-5, -12], [-6, 0]) },
      { sub: 'agente', tono: 'hueso', nombre: 'pierna-d', ...L([5, -12], [6, 0]) },
      { sub: 'agente', tono: 'hueso', nombre: 'pie-i', ...L([-10, 0], [-2, 0]) },
      { sub: 'agente', tono: 'hueso', nombre: 'pie-d', ...L([3, 0], [11, 0]) },
      { sub: 'agente', tono: 'hueso', rol: 'robot', nombre: 'cuerpo', ...R(-11, -30, 22, 18) },
      { sub: 'agente', tono: 'hueso', rol: 'casquillo', nombre: 'casquillo', ...R(-6, -36, 12, 6) },
      { sub: 'agente', tono: 'apagado', nombre: 'rosca', ...L([-5, -33], [5, -33]) },
      { sub: 'agente', tono: 'hueso', rol: 'foco', nombre: 'cabeza', ...P('M -6 -36 C -6 -41 -13 -44 -13 -52 C -13 -59 -7 -64 0 -64 C 7 -64 13 -59 13 -52 C 13 -44 6 -41 6 -36 Z') },
      { sub: 'agente', tono: 'apagado', nombre: 'reflejo', ...P('M -9 -54 C -8 -58 -6 -60 -3 -61') },
      { sub: 'agente', tono: null, rol: 'ojitos', nombre: 'ojito-i', ...E([0, -51], 1.8, 2.3) },
      { sub: 'agente', tono: null, rol: 'ojitos', nombre: 'ojito-d', ...E([7, -51], 1.8, 2.3) },
      { sub: 'agente', tono: 'hueso', nombre: 'brazo1', ...L([10, -26], [19, -31]) },
      { sub: 'agente', tono: 'hueso', nombre: 'brazo2', ...L([10, -18], [19, -23]) },
      { sub: 'bloque', tono: 'hueso', rol: 'bloque', nombre: 'bloque', ...R(18, -40, 18, 18) },
      { sub: 'bloque', tono: 'apagado', nombre: 'bloque-l1', ...L([22, -34], [32, -34]) },
      { sub: 'bloque', tono: 'apagado', nombre: 'bloque-l2', ...L([22, -28], [29, -28]) },
    ],
  };
}

function escritorio({ x0, x1, y, abajo }) {
  const g = 16, p = 28;
  return {
    piezas: [
      { sub: 'mesa', tono: null, rol: 'mesa', nombre: 'canto-masa', ...R(x0, y, x1 - x0, g) },
      { sub: 'mesa', tono: 'hueso', nombre: 'canto-bajo', ...L([x0, y + g], [x1, y + g]) },
      { sub: 'mesa', tono: 'hueso', nombre: 'canto-i', ...L([x0, y], [x0, y + g]) },
      { sub: 'mesa', tono: 'hueso', nombre: 'canto-d', ...L([x1, y], [x1, y + g]) },
      ...[x0 + p, x1 - p - 14].flatMap((x, i) => [
        { sub: 'patas', tono: 'viva', nombre: `pata${i}-a`, ...L([x, y + g], [x, abajo]) },
        { sub: 'patas', tono: 'viva', nombre: `pata${i}-b`, ...L([x + 14, y + g], [x + 14, abajo]) },
      ]),
    ],
  };
}

const flecha = (d, punta, ang) => {
  const r = (ang * Math.PI) / 180, k = 9;
  const a = [punta[0] - k * Math.cos(r - 0.5), punta[1] - k * Math.sin(r - 0.5)];
  const b = [punta[0] - k * Math.cos(r + 0.5), punta[1] - k * Math.sin(r + 0.5)];
  return [P(d, { nombre: 'flecha' }), PL([a, punta, b], { nombre: 'punta' })];
};

// ── Las dos composiciones ──
export const composiciones = {
  h: {
    ancho: 820, alto: 560,
    mesa: { x0: 76, x1: 756, y: 430, abajo: 560 },
    // la línea: entra por la izquierda, ES el canto del escritorio y sale por abajo
    linea: 'M -6 286 C 40 286 34 430 76 430 L 756 430 C 796 430 800 466 790 500 C 782 528 774 540 778 566',
    chispaFin: 0.955,
    grupos: {
      taza: [92, 426, 1],
      monitor: [330, 412, 1],
      teclado: [330, 428, 1],
      lampara: [705, 428, 1],
      gato: [495, 429, 1],
      agente: [196, 427, 1],
    },
    pasos: 3, paso: 20,
    lamp: { E: [28, -112], J: [-55, -185], T: [-190, 0], abre: 88 },
    rotulos: [
      { id: 'idea', texto: 'idea', x: 80, y: 214, ancla: 'end', piezas: flecha('M 88 208 C 122 200 160 206 206 232', [206, 232], 32) },
      { id: 'pruebas', texto: 'pruebas', x: 284, y: 170, palomita: true, piezas: [] },
      { id: 'haku', texto: 'Haku supervisa', x: 520, y: 512, ancla: 'middle', piezas: flecha('M 522 488 C 528 478 526 470 518 458', [518, 458], -115) },
    ],
  },
  v: {
    ancho: 350, alto: 420,
    mesa: { x0: 14, x1: 342, y: 318, abajo: 420 },
    linea: 'M -6 92 C 18 92 -2 318 14 318 L 342 318 C 351 318 350 350 344 372 C 338 392 332 404 335 426',
    chispaFin: 0.95,
    grupos: {
      taza: [38, 315, 0.72],
      monitor: [118, 306, 0.72],
      teclado: [118, 316, 0.72],
      lampara: [322, 316, 0.68],
      gato: [246, 317, 0.72],
      agente: [178, 315, -0.72], // camina hacia la izquierda, hacia el monitor
    },
    pasos: 3, paso: 10,
    lamp: { E: [26, -112], J: [-30, -262], T: [-112, 0], abre: 72 },
    rotulos: [
      { id: 'idea', texto: 'idea', x: 72, y: 118, ancla: 'end', piezas: flecha('M 78 112 C 92 110 102 118 106 134', [106, 134], 70) },
      { id: 'pruebas', texto: 'pruebas', x: 126, y: 92, palomita: true, piezas: [] },
      { id: 'haku', texto: 'Haku supervisa', x: 186, y: 386, ancla: 'middle', piezas: flecha('M 240 370 C 252 364 254 354 248 342', [248, 342], -100) },
    ],
  },
};

export function construir(id) {
  const c = composiciones[id];
  return {
    ...c,
    partes: {
      escritorio: escritorio(c.mesa),
      monitor: monitor(),
      teclado: teclado(),
      taza: taza(),
      lampara: lampara(c.lamp),
      gato: haku(),
      agente: agente(),
    },
  };
}
