// «El buzón» (Contacto · 640×420): la línea corre por la mesa y termina en un sobre a la orilla; Haku (pose 5) lo
// empuja con la pata, el sobre cae girando al buzón y sube la banderita. En reposo (sin movimiento) se ve el último
// cuadro: el sobre asomando por la boca del buzón y la banderita arriba.
// También: la estampa redonda «copiado» / «copied» que baja sobre el buzón al copiar el correo (dibujo aparte).
import { L, PL, PG, P, E, R, T } from '../kit/formas.mjs';
import { grupo, prefijar } from '../kit/componer.mjs';
import { hakuEmpujando, GESTOS_HAKU, mover } from './haku.mjs';

// el buzón pegado a la orilla de la mesa (corrido D desde donde se dibujó): mesa, Haku, sobre y buzón son UNA escena
const W = 560, H = 420;
const D = [-90, -44];
const SUELO = 424 - D[1]; // el poste sigue hasta la orilla de abajo
const MESA = { x0: -10, x1: 300, y: 196 };
const LINEA = 'M -6 92 C 26 92 10 196 40 196 L 300 196';

function mesa() {
  const { x0, x1, y } = MESA, g = 16;
  return grupo('mesa', [
    R(x0, y, x1 - x0, g, { rol: 'mesa' }),
    L([x0, y + g], [x1, y + g], { linea: 'int' }),
    L([x1, y], [x1, y + g], { linea: 'ext' }),
    ...[40, 246].flatMap((x) => [L([x, y + g], [x, H + 6], { linea: 'int', tinta: 'viva' }), L([x + 14, y + g], [x + 14, H + 6], { linea: 'int', tinta: 'viva' })]),
  ]);
}

// el buzón visto de tres cuartos: boca en D hacia la mesa, cuerpo hacia atrás, poste y banderita en el costado
const BOCA = 'M 420 322 L 420 282 C 420 262 430 251 441 251 C 452 251 462 262 462 280 L 462 318 Z';
const CUERPO = 'M 441 251 L 604 249 C 616 250 622 262 622 276 L 622 316 L 462 318 L 462 280 C 462 262 452 252 441 251 Z';
const PIVOTE = [598, 298];

function buzon() {
  return [
    grupo('sombra-buzon', [E([536, SUELO], 70, 5, { trama: 'sombra' })], { capa: 'luz' }),
    grupo('buzon', [
      R(522, 316, 18, SUELO - 316, { rol: 'poste' }),
      L([522, 318], [522, SUELO], { linea: 'ext' }), L([540, 318], [540, SUELO], { linea: 'ext' }),
      P(CUERPO, { rol: 'buzon' }), P(CUERPO, { linea: 'ext' }),
      L([452, 262], [616, 260], { linea: 'fino', tinta: 'noche' }),
      L([500, 300], [560, 299], { linea: 'fino', tinta: 'noche' }),
      P(BOCA, { rol: 'oscuro', mueve: [0, 0] }), P(BOCA, { linea: 'ext' }),
      PG([[420, 322], [462, 318], [468, 352], [426, 358]], { rol: 'buzon', mueve: [3, 2] }),
      PG([[420, 322], [462, 318], [468, 352], [426, 358]], { linea: 'ext' }),
      E([447, 346], 3, 3, { rol: 'oscuro', mueve: [0, 0] }),
    ]),
    grupo('banderita', [
      R(595, 226, 6, 72, { rol: 'poste' }), R(595, 226, 6, 72, { linea: 'int' }),
      P('M 601 226 L 626 228 L 625 246 L 601 244 Z', { rol: 'bloque' }),
      P('M 601 226 L 626 228 L 625 246 L 601 244', { linea: 'ext' }),
      E(PIVOTE, 4.5, 4.5, { rol: 'oscuro', mueve: [0, 0] }), E(PIVOTE, 4.5, 4.5, { linea: 'int' }),
    ], { anim: 'banderita' }),
    grupo('adentro', [
      PG([[424, 298], [452, 291], [457, 308], [429, 314]], { rol: 'sobre', mueve: [2, 1] }),
      PG([[424, 298], [452, 291], [457, 308], [429, 314]], { linea: 'int' }),
      PL([[424, 298], [440, 304], [452, 291]], { linea: 'fino', tinta: 'noche' }),
    ], { anim: 'adentro', capa: 'arriba' }),
  ];
}

/** Haku empujando (pose 5) sin su mesa: la pata delantera gira desde el hombro; devuelve también el centro del sobre */
function hakuConSobre({ x, y, s }) {
  const p = hakuEmpujando({ pataAnim: 'pata' });
  const m = mover({ ...p, grupos: p.grupos.filter((g) => g.nombre !== 'mesa' && g.nombre !== 'aire') }, { x, y, s });
  const a = (14 * Math.PI) / 180, dx = -13, dy = -13; // el sobre (79,-13) girado 14° sobre la orilla (92,0)
  const cx = 92 + dx * Math.cos(a) - dy * Math.sin(a), cy = dx * Math.sin(a) + dy * Math.cos(a);
  return { ...m, centroSobre: [x + cx * s, y + cy * s] };
}

function escena() {
  const hk = hakuConSobre({ x: 300 - 92 * 0.9, y: MESA.y, s: 0.9 });
  const sobre = hk.grupos.find((g) => g.nombre === 'sobre');
  const resto = prefijar({ grupos: hk.grupos.filter((g) => g !== sobre) }, 'haku');
  const centroSobre = hk.centroSobre;
  const boca = [441 + D[0], 296 + D[1]];
  const d = [boca[0] - centroSobre[0], boca[1] - centroSobre[1]];
  // caída: primero lo empuja (se desliza), luego cae en parábola (x lineal, y acelerada)
  const caida = [0.08, 0.3, 0.52, 0.76, 1].map((k, i) => (i === 0 ? [8, -3] : [Math.round(d[0] * k), Math.round(d[1] * k * k)]));
  return {
    nombre: 'buzon',
    titulo: 'Haku empuja un sobre al buzón',
    vb: [0, 0, W, H],
    tope: 90,
    grupos: [
      grupo('linea', [P(LINEA, { linea: 'ext' })]),
      mesa(),
      ...mover({ grupos: buzon() }, { x: D[0], y: D[1], s: 1 }).grupos,
      { ...sobre, nombre: 'sobre', anim: 'sobre', opacidad: 0, capa: 'arriba' },
      ...resto.grupos,
    ],
    anclas: { ...hk.anclas, sobre: centroSobre, banderita: [PIVOTE[0] + D[0], PIVOTE[1] + D[1]], adentro: boca },
    orden: [['linea'], ['mesa', 'sobre'], ['buzon', 'sombra-buzon', 'banderita', 'adentro'], resto.grupos.map((g) => g.nombre)],
    zonas: [
      E([250, 150], 72, 62, { nombre: 'haku' }),
      PG([[414, 240], [630, 240], [630, 330], [414, 330]].map(([x, y]) => [x + D[0], y + D[1]]), { nombre: 'buzon' }),
    ],
    gestos: {
      ...GESTOS_HAKU,
      empuja: { tipo: 'giro', anims: ['pata'], valores: [12, -16, 0], dur: [0.22, 0.1, 0.32] },
      sobreCae: { tipo: 'mover', anims: ['sobre'], valores: caida, dur: [0.14, 0.13, 0.12, 0.11, 0.1], ease: 'none' },
      sobreGira: { tipo: 'giro', anims: ['sobre'], valores: [8, 90, 200, 300, 346], dur: [0.14, 0.13, 0.12, 0.11, 0.1], ease: 'none' },
      sobreEntra: { tipo: 'opacidad', anims: ['sobre'], desde: 1, valores: [0], dur: [0.05] },
      adentro: { tipo: 'opacidad', anims: ['adentro'], desde: 0, valores: [1], dur: [0.05] },
      banderita: { tipo: 'giro', anims: ['banderita'], desde: -90, valores: [12, -5, 0], dur: [0.26, 0.14, 0.14], ease: 'power2.out' },
      banderitaTiembla: { tipo: 'giro', anims: ['banderita'], valores: [-16, 8, -3, 0], dur: [0.1, 0.12, 0.1, 0.12] },
      envio: { tipo: 'secuencia', pasos: [
        { gesto: 'empuja', espera: 0.3 }, { gesto: 'sobreCae', espera: -0.42 }, { gesto: 'sobreGira', espera: -0.6 },
        { gesto: 'sobreEntra' }, { gesto: 'adentro', espera: -0.05 }, { gesto: 'banderita', espera: 0.12 },
        { gesto: 'moverCola', espera: 0.05 }, { gesto: 'parpadear', espera: -0.4 },
      ] },
    },
    alEntrar: ['envio'],
    alPasar: [{ zona: 'haku', gesto: 'oreja' }],
    alTocar: [{ zona: 'buzon', gesto: 'banderitaTiembla' }, { zona: 'haku', gesto: 'oreja' }],
  };
}

/** la estampa redonda: tinta ámbar sobre un disco oscuro (se lee encima de cualquier cosa) */
function estampa(texto, tam) {
  const c = [60, 60];
  return {
    nombre: `estampa-${texto}`,
    titulo: `Sello «${texto}»`,
    vb: [0, 0, 120, 120],
    tope: 40,
    grupos: [grupo('estampa', [
      E(c, 46, 46, { rol: 'oscuro', mueve: [0, 0] }),
      E(c, 46, 46, { linea: 'ext', tinta: 'ambar' }),
      E(c, 38, 38, { linea: 'fino', tinta: 'ambar' }),
      PL([[44, 40], [52, 47], [70, 30]], { linea: 'int', tinta: 'ambar' }),
      T(texto, 60, 76, { tam, ancla: 'middle', tinta: 'ambar', giro: -10, largo: 60 }),
      E([24, 86], 2, 2, { rol: 'bloque', mueve: [0, 0] }), E([96, 86], 2, 2, { rol: 'bloque', mueve: [0, 0] }),
    ])],
  };
}

export function ilustraciones() {
  return [escena(), estampa('copiado', 17), estampa('copied', 18)];
}
