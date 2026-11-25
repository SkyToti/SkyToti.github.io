// Tierra de Viajes · «El avión de papel»: una maleta con etiquetas y un pase de abordar asomando; de ella sale una
// ruta punteada que cruza el lienzo en curva, con un rizo, hasta un pin de mapa. Lienzo 640×420.
// Entrada: la maleta, el avión despega y recorre la ruta (la ruta se va trazando detrás de él), y el pin cae y rebota.
// Al pasar por el avión, da un rizo (gira 360° alrededor de un punto por encima de él).
import { L, PL, PG, P, E, RR, aplicar, rot } from '../kit/formas.mjs';
import { grupo, huecoFoto, rotulos, T, girar } from './inventos-comun.mjs';

// ── la ruta: curva suave por estos puntos (sale de la maleta, rizo arriba, baja al pin) ──
const PUNTOS = [
  [192, 252], [214, 204], [246, 156], [296, 126], [346, 114], [388, 100], [404, 72], [392, 44], [364, 36],
  [340, 52], [338, 82], [362, 106], [410, 118], [462, 130], [510, 156], [546, 196], [566, 240], [574, 270],
];
const PIN = [574, 330]; // punta del pin (toca el suelo)

function catmull(pts, n = 12) {
  const out = [], Q = [pts[0], ...pts, pts.at(-1)];
  for (let i = 1; i < Q.length - 2; i++) {
    const [p0, p1, p2, p3] = [Q[i - 1], Q[i], Q[i + 1], Q[i + 2]];
    for (let k = 0; k < n; k++) {
      const t = k / n, t2 = t * t, t3 = t2 * t;
      out.push([0, 1].map((j) => 0.5 * (2 * p1[j] + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3)));
    }
  }
  out.push(pts.at(-1));
  return out;
}
const CURVA = catmull(PUNTOS);
const ACUM = [0];
for (let i = 1; i < CURVA.length; i++) ACUM.push(ACUM[i - 1] + Math.hypot(CURVA[i][0] - CURVA[i - 1][0], CURVA[i][1] - CURVA[i - 1][1]));
const LARGO = ACUM.at(-1);
/** punto y ángulo (grados) a la distancia s de la ruta */
function en(s) {
  s = Math.max(0, Math.min(LARGO - 0.01, s));
  const i = Math.max(1, ACUM.findIndex((v) => v >= s));
  const a = CURVA[i - 1], b = CURVA[i], k = (s - ACUM[i - 1]) / (ACUM[i] - ACUM[i - 1] || 1);
  return { p: [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k], ang: (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI };
}

const REPOSO = 0.74; // dónde queda el avión (fracción de la ruta)
const RADIO_RIZO = 34;
const TRAMOS = 6; // la ruta se traza en 6 tramos, detrás del avión
const VUELO = TRAMOS * 0.42; // s (un tramo por paso de la entrada)
const ESPERA = 0.45; // s quieto en la maleta mientras aparece

function rutaPunteada() {
  const guion = 9, hueco = 8, grupos = Array.from({ length: TRAMOS }, () => []);
  for (let s = 6; s + guion < LARGO - 4; s += guion + hueco) {
    const a = en(s).p, b = en(s + guion).p;
    // ¿en qué tramo cae? (los del reposo en adelante, en el último)
    const t = s / LARGO, j = Math.min(TRAMOS - 1, Math.floor((t / REPOSO) * (TRAMOS - 1)));
    grupos[j].push(L(a, b, { linea: 'int', tinta: 'hueso', remate: 0 }));
  }
  return grupos.map((piezas, j) => grupo(`ruta${j + 1}`, piezas));
}

/** el avión de papel, con la punta hacia +x (origen = su centro) */
function avionLocal() {
  const ala = [[30, 0], [-26, -15], [-10, 1]];
  const panza = [[30, 0], [-10, 1], [-20, 13]];
  const quilla = [[30, 0], [-10, 1], [-16, 7]];
  return [
    PG(panza, { rol: 'casquillo' }), PG(panza, { linea: 'ext' }),
    PG(ala, { rol: 'sobre' }), PG(ala, { linea: 'ext' }),
    PL(quilla, { linea: 'fino', tinta: 'noche' }),
  ];
}

export function avionDePapel() {
  const foto = huecoFoto({ cx: 348, cy: 318, giro: -2.5 });
  const reposo = en(LARGO * REPOSO);
  const C = reposo.p, A0 = reposo.ang;
  const m = rot(A0);
  const colocarAvion = (p) => {
    const q = { ...p };
    const f = (pt) => { const r = aplicar(m, pt); return [r[0] + C[0], r[1] + C[1]]; };
    if (q.pts) q.pts = q.pts.map(f);
    return { ...q, anim: 'avion', entra: 'fade' };
  };
  // pivote del rizo: por encima del avión (su «arriba» local es -y)
  const PIV = (() => { const r = aplicar(m, [0, -RADIO_RIZO]); return [C[0] + r[0], C[1] + r[1]]; })();

  // cuadros clave del vuelo: posición sobre la ruta y giro relativo al de reposo (desenrollado, el rizo suma −360°)
  const N = 26, pos = [], giros = [];
  let previo = null, vuelta = 0;
  const angs = [];
  for (let k = 0; k <= N; k++) {
    const s = (LARGO * REPOSO * k) / N;
    const { p, ang } = en(Math.max(1, s));
    if (previo !== null) { let d = ang - previo; while (d > 180) d -= 360; while (d < -180) d += 360; vuelta += d; } else vuelta = ang;
    previo = ang;
    angs.push(vuelta);
    pos.push(p);
  }
  const fin = angs.at(-1);
  for (let k = 0; k <= N; k++) {
    const th = angs[k] - fin; // giro respecto al reposo
    const r = girar(C, th, PIV); // dónde queda el centro del avión con ese giro alrededor del pivote
    pos[k] = [+(pos[k][0] - r[0]).toFixed(1), +(pos[k][1] - r[1]).toFixed(1)];
    giros.push(+th.toFixed(1));
  }
  const durs = Array(N).fill(+(VUELO / N).toFixed(3));

  const maleta = grupo('maleta', [
    // pase de abordar asomando por detrás
    PG([[124, 292], [170, 246], [192, 266], [146, 312]], { rol: 'sobre' }),
    PG([[124, 292], [170, 246], [192, 266], [146, 312]], { linea: 'int' }),
    L([156, 274], [176, 254], { linea: 'fino', tinta: 'noche' }),
    L([162, 280], [178, 264], { linea: 'fino', tinta: 'noche' }),
    L([166, 260], [180, 274], { linea: 'fino', tinta: 'noche', punteado: '2 3', entra: 'fade' }),
    // asa
    P('M 82 292 L 82 268 C 82 260 122 260 122 268 L 122 292', { linea: 'ext' }),
    // cuerpo
    RR(40, 290, 162, 96, 12, { rol: 'robot' }),
    RR(40, 290, 162, 96, 12, { linea: 'ext' }),
    L([74, 292], [74, 384], { linea: 'int', tinta: 'noche' }),
    L([168, 292], [168, 384], { linea: 'int', tinta: 'noche' }),
    // etiqueta colgando del asa
    P('M 86 270 C 74 278 66 290 64 302', { linea: 'fino' }),
    PG([[52, 302], [74, 300], [78, 332], [56, 334]], { rol: 'papel' }),
    PG([[52, 302], [74, 300], [78, 332], [56, 334]], { linea: 'int' }),
    E([64, 309], 2.4, 2.4, { rol: 'oscuro' }),
    L([57, 320], [73, 319], { linea: 'fino', tinta: 'noche' }),
    // calcomanías
    E([96, 350], 15, 15, { rol: 'libro1', mueve: [3, 2] }), E([96, 350], 15, 15, { linea: 'int' }),
    PL([[88, 352], [96, 342], [104, 352]], { linea: 'fino', tinta: 'noche' }),
    PG([[136, 342], [160, 338], [162, 362], [138, 366]], { rol: 'papel', mueve: [3, 2] }),
    PG([[136, 342], [160, 338], [162, 362], [138, 366]], { linea: 'int' }),
    // ruedas
    E([62, 392], 7, 7, { rol: 'oscuro' }), E([62, 392], 7, 7, { linea: 'int' }),
    E([180, 392], 7, 7, { rol: 'oscuro' }), E([180, 392], 7, 7, { linea: 'int' }),
  ]);
  const pin = grupo('pin', [
    P(`M ${PIN[0]} ${PIN[1]} C ${PIN[0] - 8} ${PIN[1] - 16} ${PIN[0] - 20} ${PIN[1] - 28} ${PIN[0] - 20} ${PIN[1] - 44} C ${PIN[0] - 20} ${PIN[1] - 58} ${PIN[0] - 10} ${PIN[1] - 66} ${PIN[0]} ${PIN[1] - 66} C ${PIN[0] + 10} ${PIN[1] - 66} ${PIN[0] + 20} ${PIN[1] - 58} ${PIN[0] + 20} ${PIN[1] - 44} C ${PIN[0] + 20} ${PIN[1] - 28} ${PIN[0] + 8} ${PIN[1] - 16} ${PIN[0]} ${PIN[1]} Z`, { rol: 'bloque', anim: 'pin', entra: 'fade' }),
    P(`M ${PIN[0]} ${PIN[1]} C ${PIN[0] - 8} ${PIN[1] - 16} ${PIN[0] - 20} ${PIN[1] - 28} ${PIN[0] - 20} ${PIN[1] - 44} C ${PIN[0] - 20} ${PIN[1] - 58} ${PIN[0] - 10} ${PIN[1] - 66} ${PIN[0]} ${PIN[1] - 66} C ${PIN[0] + 10} ${PIN[1] - 66} ${PIN[0] + 20} ${PIN[1] - 58} ${PIN[0] + 20} ${PIN[1] - 44} C ${PIN[0] + 20} ${PIN[1] - 28} ${PIN[0] + 8} ${PIN[1] - 16} ${PIN[0]} ${PIN[1]} Z`, { linea: 'ext', anim: 'pin', entra: 'fade' }),
    E([PIN[0], PIN[1] - 44], 7.5, 7.5, { rol: 'oscuro', anim: 'pin' }),
    E([PIN[0], PIN[1] - 44], 7.5, 7.5, { linea: 'int', anim: 'pin', entra: 'fade' }),
  ]);
  const grupos = [
    grupo('sombras', [E([121, 401], 84, 6, { trama: 'sombra' }), E([PIN[0], PIN[1] + 2], 22, 4.5, { trama: 'sombra' })], { capa: 'luz' }),
    grupo('suelo', [P('M 14 402 C 100 399 180 402 226 401', { linea: 'int', tinta: 'viva' }), P(`M ${PIN[0] - 44} ${PIN[1] + 3} C ${PIN[0] - 10} ${PIN[1] + 1} ${PIN[0] + 20} ${PIN[1] + 2} ${PIN[0] + 50} ${PIN[1] + 4}`, { linea: 'int', tinta: 'viva' })]),
    maleta,
    ...foto.grupos,
    ...rutaPunteada(),
    pin,
    grupo('avion', avionLocal().map(colocarAvion)),
    ...rotulos(
      [T('¡vámonos!', 26, 236, { tam: 22 })],
      [T("let's go!", 30, 236, { tam: 22 })],
    ),
  ];
  return {
    nombre: 'avion-de-papel',
    titulo: 'Una maleta con pase de abordar y un avión de papel que sigue su ruta punteada, con un rizo, hasta un pin',
    vb: [0, 0, 640, 420],
    grupos,
    anclas: { ...foto.anclas, avion: PIV, pin: PIN },
    orden: [
      ['suelo', 'sombras', 'maleta', 'foto', 'foto-sombra'], ['rotulos-es', 'rotulos-en'],
      ['avion', '!vuela', '!vuelaGiro'],
      ...Array.from({ length: TRAMOS }, (_, j) => [`ruta${j + 1}`]),
      ['pin', '!caePin', '!aplastaPin'],
    ],
    zonas: [E(C, 48, 44, { nombre: 'avion' })],
    gestos: {
      vuela: { tipo: 'mover', anims: ['avion'], valores: [pos[0], pos[0], ...pos.slice(1)], dur: [0.001, ESPERA, ...durs] },
      vuelaGiro: { tipo: 'giro', anims: ['avion'], valores: [giros[0], giros[0], ...giros.slice(1)], dur: [0.001, ESPERA, ...durs] },
      caePin: { tipo: 'mover', anims: ['pin'], valores: [[0, -150], [0, -150], [0, 0], [0, -18], [0, 0], [0, -5], [0, 0]], dur: [0.001, 0.4, 0.3, 0.13, 0.13, 0.07, 0.07] },
      aplastaPin: { tipo: 'escalaY', anims: ['pin'], valores: [1, 0.72, 1.08, 1, 0.92, 1], dur: [0.7, 0.07, 0.12, 0.1, 0.05, 0.08] },
      rizo: { tipo: 'giro', anims: ['avion'], valores: [-360, 0], dur: [1.1, 0.001] },
    },
    alEntrar: [],
    alPasar: [{ zona: 'avion', gesto: 'rizo' }],
  };
}
