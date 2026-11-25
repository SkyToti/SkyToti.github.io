// Haku: gatito lynx point (crema casi blanco; orejas, antifaz, patas y punta de la cola con rayitas;
// ojos azul cielo grandes; nariz rosa). UNA cabeza para las seis poses: mismas proporciones, mismas marcas.
// Origen de cada pose = el suelo bajo el gato. 1 u ≈ 1 px en la hoja de personajes.
import { L, PL, PG, P, E, par, espejo, tubo, raya, colocar, matriz, rot, mult, tras } from '../kit/formas.mjs';

const TINTA = 'noche'; // líneas interiores sobre el pelaje crema
const CABEZA = 'M -30 -24 C -18 -33 18 -33 30 -24 C 40 -16 43 2 37 14 C 31 25 15 30 0 30 C -15 30 -31 25 -37 14 C -43 2 -40 -16 -30 -24 Z';

export const GESTOS_HAKU = {
  parpadear: { tipo: 'escalaY', anims: ['ojoIzq', 'pupilaIzq', 'ojoDer', 'pupilaDer'], valores: [0.1, 1], dur: [0.07, 0.11] },
  moverCola: { tipo: 'giro', anims: ['cola'], valores: [-11, 8, -3, 0], dur: [0.22, 0.26, 0.2, 0.24] },
  oreja: { tipo: 'giro', anims: ['oreja'], valores: [16, -7, 4, 0], dur: [0.09, 0.12, 0.1, 0.14] },
  mirar: { tipo: 'mirar', anims: ['pupilaIzq', 'pupilaDer'], radio: 3.2 },
};

/** junta varias partes { grupos, anclas } en una */
export function juntar(...partes) {
  const grupos = [], anclas = {};
  for (const p of partes.flat()) {
    for (const g of p.grupos) {
      const ya = grupos.find((x) => x.nombre === g.nombre && x.capa === g.capa);
      if (ya && g.juntar !== false) ya.piezas.push(...g.piezas); else grupos.push({ ...g, piezas: [...g.piezas] });
    }
    Object.assign(anclas, p.anclas || {});
  }
  return { grupos, anclas };
}
/** coloca una parte { grupos, anclas } completa */
export function mover(parte, o) {
  const m = Array.isArray(o) ? o : matriz(o);
  const anclas = {};
  const grupos = parte.grupos.map((g) => {
    const r = colocar({ piezas: g.piezas }, m);
    return { ...g, piezas: r.piezas };
  });
  for (const [k, v] of Object.entries(parte.anclas || {})) anclas[k] = colocar({ piezas: [], anclas: { k: v } }, m).anclas.k;
  return { grupos, anclas };
}

/** boca abierta (bostezo): un óvalo oscuro bajo la nariz con la lengua rosa; k = 0..1 */
function bocaAbierta(fx, fy, k) {
  const h = 4 + 11 * k, w = 5 + 4 * k, y0 = 18.5 + fy;
  const d = `M ${fx - w} ${y0} C ${fx - w} ${y0 + h} ${fx + w} ${y0 + h} ${fx + w} ${y0} C ${fx + w * 0.5} ${y0 - 2} ${fx - w * 0.5} ${y0 - 2} ${fx - w} ${y0} Z`;
  return [
    L([fx, 16.5 + fy], [fx, y0 - 1], { linea: 'fino', tinta: TINTA }),
    P(d, { rol: 'oscuro' }),
    E([fx, y0 + h * 0.68], w * 0.62, h * 0.26, { rol: 'nariz' }),
    P(d, { linea: 'fino', tinta: TINTA }),
  ];
}

// ── la cabeza (centro en 0,0) ──
// opciones de la tanda 5 (ciclos), todas compatibles: ojos 'medio' (párpado a media asta), `ojoGrande` (susto: ojo más
// grande, pupila chica), `boca` (0 = la de siempre; 0..1 abierta, bostezo) y `lengua` (lamerse).
export function cabeza({ x = 0, y = 0, s = 1, giro = 0, alza = 0, ojos = 'abiertos', mira = [0, 0], inclina = 0, orejaAnim = true, orejasAtras = 0, ojoGrande = 1, boca = 0, lengua = false } = {}) {
  const fx = giro * 7, fy = -alza * 8;
  const orejas = [];
  for (const lado of [-1, 1]) {
    const k = ([px, py]) => [lado * px + fx * 0.35, py];
    const g0 = orejasAtras * lado * -8;
    const giraOreja = (pts) => pts.map(k).map(([px, py]) => {
      const r = (g0 * Math.PI) / 180, bx = lado * 24, by = -26;
      const dx = px - bx, dy = py - by;
      return [bx + dx * Math.cos(r) - dy * Math.sin(r), by + dx * Math.sin(r) + dy * Math.cos(r)];
    });
    const anim = lado === 1 && orejaAnim ? { anim: 'oreja' } : {};
    orejas.push(
      PG(giraOreja([[-34, -19], [-38, -56], [-12, -31]]), { rol: 'pelaje', ...anim }),
      PG(giraOreja([[-31, -25], [-35, -47], [-18, -31]]), { rol: 'puntas', ...anim }),
      PL(giraOreja([[-34, -19], [-38, -56], [-12, -31]]), { linea: 'ext', ...anim }),
      L(...giraOreja([[-38, -56], [-40, -64]]), { linea: 'int', ...anim }),
      L(...giraOreja([[-31, -35], [-26, -32.5]]), { linea: 'fino', tinta: 'linea', ...anim }),
      L(...giraOreja([[-33, -42], [-29.5, -39.5]]), { linea: 'fino', tinta: 'linea', ...anim }),
    );
  }
  const lejos = (lado) => (giro * lado < 0 ? 1 - 0.2 * Math.abs(giro) : 1);
  const cara = [
    P(CABEZA, { rol: 'pelaje' }),
    // antifaz lynx point
    ...[-1, 1].map((lado) => E([lado * 16 + fx, fy - 1], (ojos === 'abiertos' ? 12 : 10) * lejos(lado), ojos === 'abiertos' ? 11 : 8, { rol: 'puntas', ...(ojos === 'abiertos' ? {} : { op: 0.55 }) })),
    PG([[-4 + fx, fy - 9], [4 + fx, fy - 9], [2.5 + fx, fy + 4], [-2.5 + fx, fy + 4]], { rol: 'puntas' }),
    P(CABEZA, { linea: 'ext' }),
    ...par(PL([[-38, 6], [-45, 12], [-37.5, 16]], { linea: 'ext' })),
    // rayitas de la frente y las mejillas
    L([-7 + fx, -28 + fy * 0.4], [-5 + fx, -19 + fy * 0.4], { linea: 'fino', tinta: TINTA }),
    L([fx, -31 + fy * 0.4], [fx, -20 + fy * 0.4], { linea: 'fino', tinta: TINTA }),
    L([7 + fx, -28 + fy * 0.4], [5 + fx, -19 + fy * 0.4], { linea: 'fino', tinta: TINTA }),
    ...[-1, 1].map((l) => L([l * 28 + fx * 0.5, 2 + fy * 0.5], [l * 35 + fx * 0.3, 0 + fy * 0.5], { linea: 'fino', tinta: TINTA })),
    // nariz, boca y bigotes
    PG([[-4.5 + fx, 12 + fy], [4.5 + fx, 12 + fy], [fx, 16.5 + fy]], { rol: 'nariz' }),
    ...(boca > 0 ? bocaAbierta(fx, fy, boca) : [P(`M ${fx} ${16.5 + fy} L ${fx} ${19.5 + fy} M ${fx - 6.5} ${22 + fy} C ${fx - 4.5} ${25 + fy} ${fx - 1} ${24 + fy} ${fx} ${19.5 + fy} C ${fx + 1} ${24 + fy} ${fx + 4.5} ${25 + fy} ${fx + 6.5} ${22 + fy}`, { linea: 'fino', tinta: TINTA })]),
    ...(lengua ? [E([fx + 1, 25.5 + fy], 3.6, 4.2, { rol: 'nariz' }), E([fx + 1, 25.5 + fy], 3.6, 4.2, { linea: 'fino', tinta: TINTA })] : []),
    ...[-1, 1].flatMap((l) => [
      L([l * 22 + fx, 13 + fy], [l * 52 + fx * 0.5, 7 + fy * 0.6], { linea: 'fino' }),
      L([l * 22 + fx, 17 + fy], [l * 54 + fx * 0.5, 17 + fy * 0.6], { linea: 'fino' }),
    ]),
  ];
  if (alza > 0) cara.push(P(`M ${-9 + fx} ${27} C ${-4 + fx} ${30} ${4 + fx} ${30} ${9 + fx} ${27}`, { linea: 'fino', tinta: TINTA }));

  const vista = [];
  const anclas = {};
  for (const lado of [-1, 1]) {
    const ex = lado * 15 + fx, rx = 9.5 * lejos(lado), ey = fy;
    const nom = lado < 0 ? 'Izq' : 'Der';
    if (ojos === 'abiertos') {
      const g = ojoGrande, pu = g === 1 ? 1 : 0.62;
      vista.push(E([ex, ey], rx * g, 10.5 * g, { rol: 'ojo', linea: 'fino', tinta: TINTA, anim: `ojo${nom}` }));
      vista.push(E([ex + mira[0], ey + 1 + mira[1]], 3.6 * (rx / 9.5) * pu, 6.8 * pu, { rol: 'pupila', anim: `pupila${nom}` }));
      vista.push(E([ex + 2.6 + mira[0] * 0.5, ey - 4 + mira[1] * 0.5], 2, 2, { rol: 'brillo', anim: `pupila${nom}` }));
      anclas[`ojo${nom}`] = [ex, ey];
      anclas[`pupila${nom}`] = [ex, ey];
    } else if (ojos === 'medio') {
      // párpado a media asta: media elipse de abajo con la pupila asomada y la línea del párpado encima
      vista.push(P(`M ${ex - rx} ${ey + 1} C ${ex - rx} ${ey + 8} ${ex + rx} ${ey + 8} ${ex + rx} ${ey + 1} Z`, { rol: 'ojo', linea: 'fino', tinta: TINTA }));
      vista.push(E([ex + mira[0], ey + 4], 3.2 * (rx / 9.5), 3, { rol: 'pupila' }));
      vista.push(L([ex - rx - 1, ey + 1], [ex + rx + 1, ey + 1], { linea: 'int', tinta: TINTA }));
    } else {
      vista.push(P(`M ${ex - 8} ${ey} C ${ex - 4} ${ey + 5} ${ex + 4} ${ey + 5} ${ex + 8} ${ey}`, { linea: 'int', tinta: TINTA }));
    }
  }
  if (orejaAnim) anclas.oreja = [24 + fx * 0.35, -26];
  const parte = {
    grupos: [
      { nombre: 'orejas', piezas: orejas },
      { nombre: 'cabeza', piezas: cara },
      { nombre: 'ojos', capa: 'arriba', piezas: vista },
    ],
    anclas,
  };
  return mover(parte, mult(tras(x, y), mult(rot(inclina), [s, 0, 0, s, 0, 0])));
}

// ── cola: un tubo con la punta oscura y rayitas ──
function cola(pts, w0 = 13, w1 = 9, { anim = 'cola', ancla } = {}) {
  const tb = tubo(pts, w0, w1);
  const a = anim ? { anim } : {};
  return {
    grupos: [{
      nombre: 'cola',
      piezas: [
        PG(tb.cerrado, { rol: 'pelaje', ...a }),
        PG(tb.corte(0.74), { rol: 'puntas', ...a }),
        PL(tb.abierto, { linea: 'ext', ...a }),
        raya(tb, 0.62, 0.8, { tinta: TINTA, ...a }),
        raya(tb, 0.8, 0.75, { tinta: 'linea', ...a }),
        raya(tb, 0.9, 0.7, { tinta: 'linea', ...a }),
      ],
    }],
    anclas: anim ? { [anim]: ancla || pts[0] } : {},
  };
}

// ── pata en perfil: tubo de la cadera/hombro al suelo con la mano oscura ──
function pata(pts, { lejos = false, almohadilla = false, w0 = 14, w1 = 11, anim = null } = {}) {
  const tb = tubo(pts, w0, w1);
  const a = anim ? { anim } : {};
  const piezas = [
    PG(tb.cerrado, { rol: lejos ? 'lejos' : 'pelaje', ...a }),
    PG(tb.corte(0.8), { rol: 'puntas', ...a }),
    PL(tb.abierto, { linea: lejos ? 'int' : 'ext', ...a }),
  ];
  if (!lejos) piezas.push(raya(tb, 0.5, 0.7, { tinta: TINTA, ...a }), raya(tb, 0.64, 0.7, { tinta: TINTA, ...a }));
  if (almohadilla) {
    const f = tb.centro.at(-1), pen = tb.centro.at(-3), dx = f[0] - pen[0], dy = f[1] - pen[1], k = Math.hypot(dx, dy);
    piezas.push(E([f[0] + (dx / k) * 3, f[1] + (dy / k) * 3], 3.2, 3.2, { rol: 'almohadilla', ...a }));
  }
  return piezas;
}

const TORSO = 'M -46 -64 C -44 -80 -16 -82 8 -80 C 30 -79 46 -76 50 -62 C 54 -48 46 -36 32 -35 C 10 -33 -16 -33 -34 -36 C -50 -39 -50 -54 -46 -64 Z';

/** cuerpo de perfil mirando a +x: patas = { delLejos, delCerca, trasLejos, trasCerca } (líneas centrales) */
function perfil({ patas, colaPts, cab, sombra = true, almohadilla = null, pataAnim = null, torso = TORSO, colaAncho = [13, 9], erizo = null, rayas = true }) {
  const grupos = [];
  if (sombra) grupos.push({ nombre: 'sombra', capa: 'luz', piezas: [E([0, 1.5], 62, 5, { trama: 'sombra' })] });
  grupos.push({ nombre: 'patas-lejos', piezas: [...pata(patas.trasLejos, { lejos: true }), ...pata(patas.delLejos, { lejos: true })] });
  const c = cola(colaPts, colaAncho[0], colaAncho[1]);
  grupos.push(...c.grupos);
  grupos.push({
    nombre: 'cuerpo',
    piezas: [
      P(torso, { rol: 'pelaje' }),
      P(torso, { linea: 'ext' }),
      ...(rayas ? [
        P('M -40 -62 C -27 -66 -17 -52 -24 -38', { linea: 'int', tinta: TINTA }),
        L([-14, -79], [-12, -72], { linea: 'fino', tinta: TINTA }),
        L([-4, -80], [-2, -73], { linea: 'fino', tinta: TINTA }),
      ] : []),
      // pelo erizado (susto): picos sobre el lomo
      ...(erizo ? [PL(erizo, { linea: 'int' })] : []),
    ],
  });
  grupos.push({ nombre: 'patas', piezas: [...pata(patas.trasCerca), ...pata(patas.delCerca, { almohadilla: almohadilla === 'del', anim: pataAnim })] });
  const h = cabeza(cab);
  // pataAnim: la pata delantera cercana gira desde el hombro (empujar, saludar)
  return juntar({ grupos, anclas: { ...c.anclas, ...(pataAnim ? { [pataAnim]: patas.delCerca[0] } : {}) } }, h);
}

// ── las seis poses ──
// opciones de la tanda 5 (compatibles): `cab` (más opciones para la cabeza: giro, ojos, boca…), `colaPts`, `sinMano`
// ('der': quita la mano y la pata delantera del lado derecho de la pantalla, para levantarla aparte) y `encima`
// (grupos que van sobre la cabeza: la pata que lame).
function sentado({ alza = 0, mira = [0, 0], extra = [], inclina = 0, cab = {}, colaPts = null, sinMano = null, encima = [] } = {}) {
  const c = cola(colaPts || [[34, -8], [60, -10], [76, -26], [78, -46], [90, -60]], 13, 9, { ancla: [36, -8] });
  const dos = (p) => (sinMano === 'der' ? [p] : par(p));
  const cuerpo = {
    grupos: [
      { nombre: 'sombra', capa: 'luz', piezas: [E([4, 1.5], 58, 5, { trama: 'sombra' })] },
      ...c.grupos,
      {
        nombre: 'cuerpo',
        piezas: [
          P('M -23 -90 C -32 -80 -36 -66 -36 -54 C -36 -50 -48 -40 -46 -18 C -45 -10 -44 -6 -42 -4 L 42 -4 C 44 -6 45 -10 46 -18 C 48 -40 36 -50 36 -54 C 36 -66 32 -80 23 -90 Z', { rol: 'pelaje' }),
          ...par(P('M -23 -90 C -32 -80 -36 -66 -36 -54 C -36 -50 -48 -40 -46 -18 C -45 -10 -44 -6 -42 -4', { linea: 'ext' })),
          ...par(P('M -35 -50 C -27 -44 -25 -28 -27 -10', { linea: 'int', tinta: TINTA })),
          ...par(E([-34, -4.5], 9.5, 4.8, { rol: 'puntas' })),
          ...par(E([-34, -4.5], 9.5, 4.8, { linea: 'int' })),
          ...dos(P('M -17 -64 C -19 -42 -19 -24 -18 -9', { linea: 'int', tinta: TINTA })),
          L([0, -60], [0, -10], { linea: 'int', tinta: TINTA }),
          ...dos(P('M -14 -26 C -11 -24.5 -8 -24.5 -5 -26', { linea: 'fino', tinta: TINTA })),
          ...dos(P('M -14.5 -19 C -11 -17.5 -8 -17.5 -4.5 -19', { linea: 'fino', tinta: TINTA })),
          ...dos(E([-9, -5], 9.5, 5.2, { rol: 'puntas' })),
          ...dos(E([-9, -5], 9.5, 5.2, { linea: 'int' })),
          P('M -7 -79 L -3.5 -74 L 0 -78 L 3.5 -74 L 7 -79', { linea: 'fino', tinta: TINTA }),
        ],
      },
    ],
    anclas: c.anclas,
  };
  return juntar(cuerpo, { grupos: encima.length ? extra : [], anclas: {} }, cabeza({ x: 0, y: -114, alza, mira, inclina, orejasAtras: alza ? 0.6 : 0, ...cab }), { grupos: encima.length ? encima : extra, anclas: {} });
}

function caminando() {
  return perfil({
    patas: {
      trasLejos: [[-30, -46], [-24, -24], [-18, -6]],
      delLejos: [[30, -46], [24, -24], [20, -6]],
      trasCerca: [[-36, -48], [-42, -26], [-48, -6]],
      delCerca: [[36, -50], [42, -26], [48, -6]],
    },
    colaPts: [[-44, -60], [-64, -70], [-72, -92], [-66, -114], [-56, -122]],
    cab: { x: 56, y: -96, giro: 0.6, mira: [2, 0] },
  });
}

function saltando() {
  const base = perfil({
    patas: {
      trasLejos: [[-30, -46], [-50, -36], [-66, -24]],
      delLejos: [[30, -46], [52, -40], [70, -38]],
      trasCerca: [[-36, -46], [-58, -38], [-74, -30]],
      delCerca: [[36, -46], [60, -36], [82, -32]],
    },
    colaPts: [[-44, -60], [-66, -66], [-86, -78], [-98, -96]],
    cab: { x: 58, y: -98, giro: 0.6, mira: [2.5, -1.5], orejasAtras: 0.8 },
    sombra: false,
    almohadilla: null,
  });
  const arriba = mover(base, mult(tras(0, -46), rot(-12, [0, -60])));
  arriba.grupos.unshift({
    nombre: 'sombra', capa: 'luz',
    piezas: [E([4, 1.5], 46, 4.5, { trama: 'sombra' })],
  });
  arriba.grupos.push({
    nombre: 'aire',
    piezas: [
      L([-118, -70], [-96, -66], { linea: 'int', tinta: 'apagado' }),
      L([-122, -52], [-104, -50], { linea: 'int', tinta: 'apagado' }),
      L([-112, -88], [-98, -84], { linea: 'fino', tinta: 'apagado' }),
    ],
  });
  return arriba;
}

function empujando({ pataAnim = null } = {}) {
  // la orilla de la mesa en x = 92; el sobre se ladea sobre la orilla
  const g = perfil({
    patas: {
      trasLejos: [[-30, -46], [-26, -24], [-22, -6]],
      delLejos: [[30, -46], [30, -24], [30, -6]],
      trasCerca: [[-36, -48], [-40, -26], [-42, -6]],
      delCerca: [[38, -54], [52, -40], [66, -24]],
    },
    colaPts: [[-44, -60], [-60, -76], [-58, -100], [-70, -116]],
    cab: { x: 52, y: -100, giro: 0.7, mira: [3, 2.5] },
    sombra: false,
    almohadilla: 'del',
    pataAnim,
  });
  const r = (pt) => { const a = (14 * Math.PI) / 180, dx = pt[0] - 92, dy = pt[1]; return [92 + dx * Math.cos(a) - dy * Math.sin(a), dx * Math.sin(a) + dy * Math.cos(a)]; };
  const sobre = [[60, -26], [98, -26], [98, 0], [60, 0]].map(r);
  g.grupos.unshift(
    { nombre: 'mesa', piezas: [
      PG([[-120, 0], [92, 0], [92, 16], [-120, 16]], { rol: 'mesa' }),
      L([-120, 0], [92, 0], { linea: 'ext' }),
      L([92, 0], [92, 16], { linea: 'ext' }),
      L([92, 16], [-120, 16], { linea: 'int', tinta: 'viva' }),
    ] },
    { nombre: 'sombra', capa: 'luz', piezas: [E([0, 2], 60, 4, { trama: 'sombra' })] },
  );
  g.grupos.splice(2, 0, { nombre: 'sobre', piezas: [
    PG(sobre, { rol: 'sobre' }),
    PG(sobre, { linea: 'ext' }),
    PL([[60, -26], [79, -12], [98, -26]].map(r), { linea: 'int', tinta: TINTA }),
  ] });
  g.grupos.push({ nombre: 'aire', piezas: [
    P(`M ${r([102, -34])[0]} ${r([102, -34])[1]} C ${r([108, -30])[0]} ${r([108, -30])[1]} ${r([110, -24])[0]} ${r([110, -24])[1]} ${r([110, -18])[0]} ${r([110, -18])[1]}`, { linea: 'fino', tinta: 'apagado' }),
  ] });
  return g;
}

function dormido({ ojoQueAbre = false } = {}) {
  const cuerpo = 'M -60 0 C -70 -28 -40 -58 4 -58 C 46 -58 70 -36 66 -12 C 65 -4 58 0 50 0 Z';
  const c = cola([[60, -16], [58, -3], [34, 3], [6, 3], [-14, -2]], 12, 9, { anim: 'cola', ancla: [60, -16] });
  const parte = {
    grupos: [
      { nombre: 'sombra', capa: 'luz', piezas: [E([4, 1.5], 70, 5, { trama: 'sombra' })] },
      { nombre: 'cuerpo', piezas: [
        P(cuerpo, { rol: 'pelaje' }),
        P(cuerpo, { linea: 'ext' }),
        P('M 26 -52 C 48 -44 54 -26 46 -14', { linea: 'int', tinta: TINTA }),
        L([10, -57], [12, -49], { linea: 'fino', tinta: TINTA }),
        L([20, -55], [21, -47], { linea: 'fino', tinta: TINTA }),
        L([30, -51], [30, -44], { linea: 'fino', tinta: TINTA }),
      ] },
      { nombre: 'manos', piezas: [
        E([-6, -8], 10, 5.5, { rol: 'puntas' }), E([-6, -8], 10, 5.5, { linea: 'int' }),
      ] },
      ...c.grupos,
    ],
    anclas: c.anclas,
  };
  const zzz = (x, y, k) => PL([[x, y], [x + 8 * k, y], [x, y + 8 * k], [x + 8 * k, y + 8 * k]], { linea: 'int', tinta: 'apagado', anim: 'zzz' });
  const pos = { x: -30, y: -40, s: 0.86, inclina: -12, giro: -0.3, orejaAnim: false, orejasAtras: 0.25 };
  const cab = cabeza({ ...pos, ojos: 'cerrados' });
  if (ojoQueAbre) {
    // un ojo que se abre: el párpado (curva del ojo derecho) y el ojo abierto (oculto en reposo) se animan aparte
    const ojos = cab.grupos.find((g) => g.nombre === 'ojos');
    ojos.piezas[1] = { ...ojos.piezas[1], anim: 'parpado' };
    const abierto = cabeza({ ...pos, ojos: 'abiertos', mira: [2.5, 1] });
    const piezas = abierto.grupos.find((g) => g.nombre === 'ojos').piezas
      .filter((p) => /Der$/.test(p.anim || '')).map((p) => ({ ...p, anim: 'ojoAbre' }));
    cab.grupos.push({ nombre: 'ojo-abre', capa: 'arriba', opacidad: 0, piezas });
    cab.anclas.ojoAbre = abierto.anclas.ojoDer;
    cab.anclas.parpado = abierto.anclas.ojoDer;
  }
  return juntar(parte, cab, {
    grupos: [{ nombre: 'zzz', piezas: [zzz(26, -84, 0.8), zzz(42, -102, 1), zzz(60, -124, 1.2)] }],
    anclas: { zzz: [50, -100] },
  });
}

function mirandoArriba() {
  const chispa = [
    E([-58, -214], 16, 16, { trama: 'ambar', capa: 'luz' }),
    E([-58, -214], 5, 5, { rol: 'foco', mueve: [0, 0] }),
  ];
  return sentado({ alza: 1, mira: [-2, -3.6], inclina: -9, extra: [{ nombre: 'chispa', piezas: chispa }] });
}

const conTodo = () => ({ ...GESTOS_HAKU });

/** las ilustraciones de Haku (una por pose) */
export function poses() {
  return [
    { nombre: 'haku-sentado', titulo: 'Haku sentado de frente', ...sentado(), gestos: conTodo(), alEntrar: ['parpadear', 'moverCola'], alPasar: [{ zona: 'haku', gesto: 'oreja' }], sigue: 'mirar', zonaHaku: true },
    { nombre: 'haku-mirando', titulo: 'Haku mirando hacia arriba', ...mirandoArriba(), gestos: conTodo(), alEntrar: ['parpadear', 'moverCola'] },
    { nombre: 'haku-caminando', titulo: 'Haku caminando de perfil', ...caminando(), gestos: conTodo(), alEntrar: ['moverCola', 'parpadear'] },
    { nombre: 'haku-saltando', titulo: 'Haku saltando', ...saltando(), gestos: conTodo(), alEntrar: ['parpadear'] },
    { nombre: 'haku-empujando', titulo: 'Haku empujando un sobre desde la orilla', ...empujando(), gestos: conTodo(), alEntrar: ['parpadear', 'moverCola'] },
    { nombre: 'haku-dormido', titulo: 'Haku hecho rosca, dormido', ...dormido(), gestos: { moverCola: GESTOS_HAKU.moverCola, zzz: { tipo: 'mover', anims: ['zzz'], valores: [[3, -5], [0, 0]], dur: [0.6, 0.6] } }, alEntrar: ['zzz'] },
  ];
}

export { perfil, cola, pata, TORSO, TINTA };
export { sentado as hakuSentado, saltando as hakuSaltando, empujando as hakuEmpujando, dormido as hakuDormido, espejo };
