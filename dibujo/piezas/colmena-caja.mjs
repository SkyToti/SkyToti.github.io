// Punto de venta · «La colmena-caja»: una caja registradora cuyo cuerpo es una colmena de anillos, con su cajón; encima,
// una abeja regordeta con lentes leyendo; al lado, una pila de tres libros. Lienzo 640×420.
// Entrada: se arma la caja, la abeja y los libros; suena la caja (¡clin!): el cajón sale y una moneda hexagonal salta al
// mostrador; la abeja pasa la página y mueve las alas. Al pasar por la caja, el cajón vuelve a abrir.
import { L, PL, PG, P, E, R, RR, aplicar, mult, tras, rot, transformar } from '../kit/formas.mjs';
import { mover } from './haku.mjs';
import { grupo, huecoFoto, rotulos, T } from './inventos-comun.mjs';

const CX = 170;
const MOSTRADOR = 368;
const MONEDA = [290, MOSTRADOR - 10.5];

const hexagono = (c, r) => Array.from({ length: 6 }, (_, i) => [c[0] + r * Math.cos((Math.PI / 3) * i), c[1] + r * Math.sin((Math.PI / 3) * i)]);

function mostrador() {
  return grupo('mostrador', [
    R(8, MOSTRADOR, 424, 16, { rol: 'mesa' }),
    L([8, MOSTRADOR], [432, MOSTRADOR], { linea: 'ext' }),
    L([8, MOSTRADOR + 16], [432, MOSTRADOR + 16], { linea: 'int' }),
    L([8, MOSTRADOR], [8, MOSTRADOR + 16], { linea: 'ext' }),
    L([432, MOSTRADOR], [432, MOSTRADOR + 16], { linea: 'ext' }),
    ...[40, 54, 386, 400].map((x) => L([x, MOSTRADOR + 16], [x, 420], { linea: 'int', tinta: 'viva' })),
  ]);
}

function caja() {
  const c = { anim: 'cajon' };
  const bandeja = grupo('bandeja', [
    R(86, 304, 168, 44, { rol: 'oscuro', ...c }),
    R(86, 304, 168, 44, { linea: 'int', ...c }),
    ...[128, 170, 212].map((x) => L([x, 330], [x, 348], { linea: 'fino', ...c })),
    ...[[106, 340], [148, 338], [190, 340], [232, 338]].flatMap(([x, y]) => [E([x, y], 11, 5, { rol: 'bloque', mueve: [1, 1], ...c }), E([x, y], 11, 5, { linea: 'fino', ...c })]),
  ]);
  const base = grupo('caja-base', [
    RR(66, 298, 208, 50, 8, { rol: 'auricular' }),
    RR(66, 298, 208, 50, 8, { linea: 'ext' }),
    ...[94, 125, 156, 187, 218, 249].flatMap((x, i) => [E([x, 322], 8, 7, { rol: i === 5 ? 'papel' : 'sobre', mueve: [2, 2] }), E([x, 322], 8, 7, { linea: 'int' })]),
  ]);
  const cajon = grupo('cajon', [
    RR(78, 346, 184, 22, 4, { rol: 'robot', ...c }),
    RR(78, 346, 184, 22, 4, { linea: 'ext', ...c }),
    L([150, 357], [190, 357], { linea: 'int', ...c }),
  ]);
  // la colmena: anillos de paja, del de arriba al de abajo (cada uno pisa al de arriba)
  const anillos = [[182, 206, 40], [202, 228, 60], [224, 252, 76], [248, 276, 88], [272, 300, 96]];
  const colmena = [
    P(`M ${CX - 30} 190 C ${CX - 30} 160 ${CX + 30} 160 ${CX + 30} 190 Z`, { rol: 'casquillo' }),
    P(`M ${CX - 30} 190 C ${CX - 30} 160 ${CX + 30} 160 ${CX + 30} 190`, { linea: 'ext' }),
  ];
  for (const [y0, y1, hw] of anillos) {
    colmena.push(RR(CX - hw, y0, hw * 2, y1 - y0, (y1 - y0) / 2, { rol: 'casquillo' }), RR(CX - hw, y0, hw * 2, y1 - y0, (y1 - y0) / 2, { linea: 'ext' }));
    colmena.push(L([CX - hw * 0.55, y0 + 7], [CX - hw * 0.45, y1 - 7], { linea: 'fino', tinta: 'noche' }), L([CX + hw * 0.5, y0 + 7], [CX + hw * 0.6, y1 - 7], { linea: 'fino', tinta: 'noche' }));
  }
  // sombra del lado de allá de la colmena y su piquera
  colmena.push(
    P(`M ${CX + 40} 276 C ${CX + 70} 276 ${CX + 92} 280 ${CX + 92} 290 C ${CX + 92} 296 ${CX + 70} 298 ${CX + 40} 298 Z`, { trama: 'sombra', op: 0.9 }),
    P(`M ${CX - 15} 300 C ${CX - 15} 284 ${CX + 15} 284 ${CX + 15} 300 Z`, { rol: 'oscuro' }),
    P(`M ${CX - 15} 300 C ${CX - 15} 284 ${CX + 15} 284 ${CX + 15} 300`, { linea: 'int' }),
    // visor de la caja con su precio
    RR(CX - 26, 229, 52, 19, 5, { rol: 'pantalla' }), RR(CX - 26, 229, 52, 19, 5, { linea: 'int' }),
    T('$ 85', CX, 244, { tam: 15, ancla: 'middle', tinta: 'ambar' }),
  );
  return [bandeja, base, cajon, grupo('colmena', colmena)];
}

/** franja oscura de la panza: la parte de la elipse entre x=a y x=b (coordenadas de la elipse sin girar) */
function franja(rx, ry, a, b, n = 6) {
  const y = (x) => ry * Math.sqrt(Math.max(0, 1 - (x * x) / (rx * rx)));
  const arriba = [], abajo = [];
  for (let i = 0; i <= n; i++) { const x = a + ((b - a) * i) / n; arriba.push([x, -y(x)]); abajo.push([x, y(x)]); }
  return [...arriba, ...abajo.reverse()];
}

/** la abeja (origen = donde se sienta); mira a +x, con el libro abierto en el regazo */
function abeja() {
  const panza = mult(tras(-12, -22), rot(-14));
  const enPanza = (pts) => pts.map((p) => aplicar(panza, p));
  const al = { anim: 'alas' }, pg = { anim: 'pagina' };
  const alas = grupo('abeja-alas', [
    P('M -8 -38 C -30 -62 -44 -52 -36 -40 C -30 -32 -16 -34 -8 -38 Z', { rol: 'hoja', op: 0.7, ...al }),
    P('M -8 -38 C -30 -62 -44 -52 -36 -40 C -30 -32 -16 -34 -8 -38 Z', { linea: 'int', ...al }),
    P('M -4 -40 C -6 -66 8 -70 10 -58 C 11 -50 4 -42 -4 -40 Z', { rol: 'hoja', op: 0.7, ...al }),
    P('M -4 -40 C -6 -66 8 -70 10 -58 C 11 -50 4 -42 -4 -40 Z', { linea: 'int', ...al }),
  ]);
  const cuerpo = grupo('abeja', [
    // aguijón y patitas
    PG(enPanza([[-22, -4], [-34, 0], [-22, 5]]), { rol: 'oscuro' }), PL(enPanza([[-22, -4], [-34, 0], [-22, 5]]), { linea: 'int' }),
    P('M -18 -8 C -20 -2 -22 2 -24 6', { linea: 'int' }), P('M -4 -6 C -3 -1 -4 3 -6 7', { linea: 'int' }),
    // panza con dos franjas
    transformar(E([0, 0], 24, 19, { rol: 'foco' }), panza),
    ...[[-14, -5], [2, 10]].map(([a, b]) => PG(enPanza(franja(24, 19, a, b)), { rol: 'oscuro' })),
    transformar(E([0, 0], 24, 19, { linea: 'ext' }), panza),
    // cabeza con lentes y antenas
    P('M 12 -55 C 8 -66 2 -70 -2 -76', { linea: 'int' }), E([-3, -78], 3.6, 3.6, { rol: 'oscuro' }), E([-3, -78], 3.6, 3.6, { linea: 'fino' }),
    P('M 22 -56 C 25 -66 30 -71 35 -75', { linea: 'int' }), E([36, -77], 3.6, 3.6, { rol: 'oscuro' }), E([36, -77], 3.6, 3.6, { linea: 'fino' }),
    E([17, -40], 17, 16, { rol: 'foco' }),
    E([17, -40], 17, 16, { linea: 'ext' }),
    E([11, -39], 6.5, 6.5, { rol: 'brillo', op: 0.55 }), E([25, -39], 6.5, 6.5, { rol: 'brillo', op: 0.55 }),
    E([11, -39], 6.5, 6.5, { linea: 'int', tinta: 'noche' }), E([25, -39], 6.5, 6.5, { linea: 'int', tinta: 'noche' }),
    L([17.5, -40], [18.5, -40], { linea: 'int', tinta: 'noche', remate: 0 }),
    E([12, -36.5], 1.8, 2.2, { rol: 'oscuro' }), E([26, -36.5], 1.8, 2.2, { rol: 'oscuro' }),
    P('M 14 -29 C 16 -27 19 -27 21 -29', { linea: 'fino', tinta: 'noche' }),
  ]);
  // libro abierto en el regazo (lomo en x=20)
  const izq = [[4, -6], [20, -2], [20, -22], [6, -26]], der = [[20, -2], [36, -6], [34, -26], [20, -22]];
  const libro = grupo('libro-abeja', [
    PG([[2, -4], [20, 0], [38, -4], [36, -24], [20, -20], [4, -24]], { rol: 'libro1', mueve: [2, 2] }),
    PG(izq, { rol: 'sobre' }), PG(izq, { linea: 'int' }),
    PG(der, { rol: 'sobre' }), PG(der, { linea: 'int' }),
    L([8, -18], [17, -16], { linea: 'fino', tinta: 'noche' }), L([8, -12], [17, -10], { linea: 'fino', tinta: 'noche' }),
    L([23, -16], [31, -18], { linea: 'fino', tinta: 'noche' }), L([23, -10], [31, -12], { linea: 'fino', tinta: 'noche' }),
    // la hoja que se pasa
    PG(der, { rol: 'sobre', ...pg }), PG(der, { linea: 'int', ...pg }),
    L([23, -13], [31, -15], { linea: 'fino', tinta: 'noche', ...pg }),
    // manitas
    P('M 6 -26 C 0 -22 -2 -16 2 -12', { linea: 'int' }), E([5, -14], 3, 3, { rol: 'oscuro' }),
    P('M 30 -26 C 36 -26 40 -20 38 -14', { linea: 'int' }), E([37, -14], 3, 3, { rol: 'oscuro' }),
  ]);
  return { grupos: [alas, cuerpo, libro], anclas: { alas: [-6, -39], pagina: [20, -12] } };
}

function libros() {
  return grupo('libros', [
    RR(312, 340, 104, 28, 3, { rol: 'libro1', mueve: [4, 3] }), RR(312, 340, 104, 28, 3, { linea: 'ext' }),
    L([322, 346], [408, 346], { linea: 'fino', tinta: 'noche' }), L([322, 362], [408, 362], { linea: 'fino', tinta: 'noche' }),
    PG([[320, 340], [410, 336], [409, 314], [319, 318]], { rol: 'libro2', mueve: [4, 3] }), PG([[320, 340], [410, 336], [409, 314], [319, 318]], { linea: 'ext' }),
    L([330, 324], [372, 322], { linea: 'fino', tinta: 'noche' }),
    RR(316, 294, 92, 20, 3, { rol: 'libro3', mueve: [4, 3] }), RR(316, 294, 92, 20, 3, { linea: 'ext' }),
    L([326, 304], [398, 304], { linea: 'fino', tinta: 'noche' }),
  ]);
}

export function colmenaCaja() {
  const foto = huecoFoto({ cx: 530, cy: 236, giro: 3 });
  const ab = abeja();
  const abM = mover(ab, { x: CX - 4, y: 174, s: 1.45 });
  const abG = abM.grupos;
  const abA = abM.anclas;
  const moneda = grupo('moneda', [
    PG(hexagono(MONEDA, 11), { rol: 'bloque', anim: 'moneda' }), PG(hexagono(MONEDA, 11), { linea: 'ext', anim: 'moneda', entra: 'fade' }),
    PG(hexagono(MONEDA, 5.5), { linea: 'fino', tinta: 'noche', anim: 'moneda', entra: 'fade' }),
  ]);
  const clin = grupo('clin', [
    L([62, 258], [44, 246], { linea: 'int', tinta: 'ambar', anim: 'clin', entra: 'fade' }),
    L([58, 276], [36, 276], { linea: 'int', tinta: 'ambar', anim: 'clin', entra: 'fade' }),
    L([62, 292], [44, 302], { linea: 'int', tinta: 'ambar', anim: 'clin', entra: 'fade' }),
  ]);
  const grupos = [
    grupo('sombra-caja', [E([CX, MOSTRADOR + 1], 112, 5, { trama: 'sombra' }), E([364, MOSTRADOR + 1], 58, 4, { trama: 'sombra' })], { capa: 'luz' }),
    mostrador(),
    ...caja(),
    ...abG,
    libros(),
    ...foto.grupos,
    moneda,
    clin,
    ...rotulos(
      [T('¡clin!', 22, 236, { tam: 24, anim: 'clin' })],
      [T('ka-ching!', 10, 236, { tam: 22, anim: 'clin' })],
    ),
  ];
  const [mx, my] = MONEDA;
  const sale = [210 - mx, 352 - my];
  return {
    nombre: 'colmena-caja',
    titulo: 'Una caja registradora con cuerpo de colmena, una abeja con lentes leyendo encima y una pila de libros',
    vb: [0, 0, 640, 420],
    grupos,
    anclas: { ...foto.anclas, ...abA, cajon: [CX, 357], moneda: MONEDA, clin: [50, 276] },
    orden: [
      ['mostrador', 'sombra-caja', 'foto', 'foto-sombra'], ['bandeja', 'caja-base', 'cajon'], ['colmena'], ['libros'],
      ['abeja-alas', 'abeja'], ['libro-abeja'],
      ['moneda', 'clin', 'rotulos-es', 'rotulos-en', '!clin', '!abre', '!moneda', '!giraMoneda'],
      [], ['!alas', '!pagina', '!paginaOp'],
    ],
    zonas: [P(`M 60 150 L 282 150 L 282 ${MOSTRADOR} L 60 ${MOSTRADOR} Z`, { nombre: 'caja' })],
    gestos: {
      clin: { tipo: 'opacidad', anims: ['clin'], valores: [0, 1, 0.3, 1], dur: [0.001, 0.06, 0.08, 0.1] },
      abre: { tipo: 'mover', anims: ['cajon'], valores: [[0, 24], [0, 24], [0, 0]], dur: [0.14, 0.75, 0.3] },
      moneda: { tipo: 'mover', anims: ['moneda'], valores: [sale, sale, [sale[0] * 0.55, -86], [0, 0], [0, -12], [0, 0]], dur: [0.001, 0.22, 0.26, 0.22, 0.1, 0.1] },
      giraMoneda: { tipo: 'giro', anims: ['moneda'], valores: [0, 360, 0], dur: [0.22, 0.48, 0.001] },
      alas: { tipo: 'escalaY', anims: ['alas'], valores: [0.35, 1, 0.35, 1, 0.35, 1], dur: [0.06, 0.06, 0.06, 0.06, 0.06, 0.08] },
      pagina: { tipo: 'giro', anims: ['pagina'], valores: [-95, -178, 0], dur: [0.26, 0.2, 0.001] },
      paginaOp: { tipo: 'opacidad', anims: ['pagina'], valores: [1, 0, 1], dur: [0.4, 0.06, 0.001] },
    },
    alEntrar: [],
    alPasar: [{ zona: 'caja', gesto: 'abre' }],
  };
}
