// Haku animado cuadro a cuadro (tanda 5, «Haku, el guía»). Cada cuadro es una POSE dibujada con el kit (la misma
// cabeza, las mismas marcas y los mismos tubos de pata y cola que las seis poses aprobadas de haku.mjs), no una
// interpolación. Lienzo común 160×120 con el piso en y = 112 y el pivote en las patas (x = 80): al cambiar de
// cuadro nada brinca. Dentro del lienzo el gato va a media escala (unidades del modelo × 0.5), así el trazo pesa lo
// mismo que en la hoja de personajes.
// Cada cuadro sale con UN solo trazo horneado (semilla 11): aquí la vida la da el cambio de cuadro, no el hervor.
// Todo el juego va en UN módulo de datos aparte (components/dibujo/datos/haku-ciclos.json, fuera de index.ts) que el
// guía carga de forma perezosa. Lo escribe `node dibujo/generar.mjs` (contrato `modulos()`).
import { L, PL, E, aplicar, mult, rot, tras } from '../kit/formas.mjs';
import { hornear } from '../kit/hornear.mjs';
import { cabeza, cola, pata, juntar, mover, TORSO, TINTA, hakuSentado, hakuSaltando, hakuDormido } from './haku.mjs';

export const LIENZO = { ancho: 160, alto: 120, piso: 112, centro: 80, escala: 0.5 };
/** caminata: cada pie va apoyado el 60 % del ciclo y en ese tiempo retrocede PASO respecto del cuerpo; para que no
 * patine, el gato avanza por cuadro exactamente lo que retrocede el pie apoyado: PASO / (6 · APOYO) */
const PASO = 48; // lo que barre un pie apoyado (unidades del modelo)
const APOYO = 0.6;
export const ZANCADA_MODELO = PASO / (6 * APOYO);
export const ZANCADA = ZANCADA_MODELO * LIENZO.escala; // unidades del lienzo por cuadro

// ── un cuerpo de perfil flexible: torso (y cola) colocado con una matriz; las patas van de la cadera (que sigue al
// torso) a un pie en coordenadas del suelo, con la rodilla por cinemática inversa ──
// las caderas apenas dentro del torso (su borde de abajo va por y ≈ −36): así el tubo de la pata no raya la panza
const CADERAS = { trasLejos: [-28, -44], delLejos: [28, -42], trasCerca: [-34, -44], delCerca: [34, -42] };
const SEG = 20; // largo de cada tramo de la pata

/** [cadera, rodilla, pie]: la rodilla sale hacia `lado` (+1 adelante, −1 atrás) */
function pierna(cad, pie, lado, doblez = 1) {
  const dx = pie[0] - cad[0], dy = pie[1] - cad[1], d = Math.hypot(dx, dy) || 1;
  const m = [(cad[0] + pie[0]) / 2, (cad[1] + pie[1]) / 2];
  const h = d >= 2 * SEG ? 0 : Math.sqrt(SEG * SEG - (d / 2) ** 2) * 0.7 * doblez;
  let nx = -dy / d, ny = dx / d;
  if (Math.sign(nx || 1) !== Math.sign(lado)) { nx = -nx; ny = -ny; }
  return [cad, [m[0] + nx * h, m[1] + ny * h], pie];
}

/**
 * perfil mirando a +x.  m: matriz del torso (y de la cola y las caderas) · pies: { trasLejos, delLejos, trasCerca,
 * delCerca } en coordenadas del suelo (o `piernas` ya hechas) · colaPts locales al torso · cab: opciones de cabeza.
 */
function perfilX({ m = [1, 0, 0, 1, 0, 0], pies, piernas: dadas = {}, colaPts, colaMundo = false, colaAncho = [13, 9], cab, sombra = 62, torso = TORSO, erizo = null, almohadilla = false }) {
  const piernas = {};
  for (const k of Object.keys(CADERAS)) {
    if (dadas[k]) { piernas[k] = dadas[k]; continue; }
    const cad = aplicar(m, CADERAS[k]);
    piernas[k] = pierna(cad, pies[k], k.startsWith('del') ? 1 : -1);
  }
  const grupos = [];
  if (sombra) grupos.push({ nombre: 'sombra', capa: 'luz', piezas: [E([0, 1.5], sombra, 5, { trama: 'sombra' })] });
  grupos.push({ nombre: 'patas-lejos', piezas: [...pata(piernas.trasLejos, { lejos: true }), ...pata(piernas.delLejos, { lejos: true })] });
  const c0 = cola(colaPts, colaAncho[0], colaAncho[1], { anim: null });
  const c = colaMundo ? c0 : mover(c0, m);
  grupos.push(...c.grupos);
  const cuerpo = mover({ grupos: [{ nombre: 'cuerpo', piezas: [
    { tipo: 'camino', d: torso, rol: 'pelaje' },
    { tipo: 'camino', d: torso, linea: 'ext' },
    { tipo: 'camino', d: 'M -40 -62 C -27 -66 -17 -52 -24 -38', linea: 'int', tinta: TINTA },
    L([-14, -79], [-12, -72], { linea: 'fino', tinta: TINTA }),
    L([-4, -80], [-2, -73], { linea: 'fino', tinta: TINTA }),
    ...(erizo ? [PL(erizo, { linea: 'int' })] : []),
  ] }] }, m);
  grupos.push(...cuerpo.grupos);
  grupos.push({ nombre: 'patas', piezas: [...pata(piernas.trasCerca), ...pata(piernas.delCerca, { almohadilla })] });
  return juntar({ grupos, anclas: {} }, cabeza({ orejaAnim: false, ...cab }));
}

const CAB_PERFIL = { x: 56, y: -96, giro: 0.6, mira: [2, 0] }; // la de «caminando de perfil» (hoja de personajes)
const COLA_PERFIL = [[-44, -60], [-64, -70], [-72, -92], [-66, -114], [-56, -122]];

// ── caminar: andar lateral (trasera → delantera del mismo lado), apoyo 60 % del ciclo ──
const FASE = { trasCerca: 0, delCerca: 0.25, trasLejos: 0.5, delLejos: 0.75 };
export function pieEn(k, t) {
  const cad = CADERAS[k];
  const f = (t + FASE[k]) % 1;
  const centro = cad[0] + (k.startsWith('del') ? 4 : -4);
  if (f < APOYO) return [centro + PASO / 2 - (PASO * f) / APOYO, -6]; // apoyado: retrocede al ritmo del avance
  const s = (f - APOYO) / (1 - APOYO); // en el aire: adelante y arriba
  return [centro - PASO / 2 + PASO * s, -6 - Math.sin(Math.PI * s) * 13];
}
function caminar(i) {
  const t = i / 6, s = Math.sin(2 * Math.PI * t);
  const pies = Object.fromEntries(Object.keys(CADERAS).map((k) => [k, pieEn(k, t)]));
  // la cola hace de contrapeso: se mece al revés que el paso; el lomo apenas sube y baja (1 u), la cabeza no se mueve
  const colaPts = COLA_PERFIL.map(([x, y], j) => [x - s * [0, 1, 3, 5, 7][j], y + Math.cos(2 * Math.PI * t) * [0, 0, 1, 2, 3][j]]);
  const lomo = Math.abs(Math.cos(2 * Math.PI * t * 2)) * 1;
  return perfilX({ m: tras(0, -lomo), pies, colaPts, cab: CAB_PERFIL });
}

// ── sentarse: de pie (perfil) → sentado de frente, en 3 cuadros ──
function sentarse(i) {
  if (i === 0) {
    // la cadera baja: el torso gira sobre el hombro, las traseras se doblan
    const m = rot(-13, [36, -50]);
    return perfilX({
      m,
      pies: { trasLejos: [-26, -6], delLejos: [32, -6], trasCerca: [-32, -6], delCerca: [40, -6] },
      colaPts: [[-44, -60], [-66, -64], [-80, -78], [-80, -98], [-72, -110]],
      cab: { x: 54, y: -98, giro: 0.45, mira: [1.5, 0] },
    });
  }
  if (i === 1) {
    // sentado de perfil: ancas en el suelo, la trasera doblada hacia adelante, delanteras rectas
    const m = rot(-27, [36, -50]);
    const piernas = {
      trasCerca: [[-24, -24], [-2, -14], [2, -6]],
      trasLejos: [[-18, -22], [4, -12], [8, -6]],
      delCerca: pierna(aplicar(m, CADERAS.delCerca), [34, -6], 1, 0.2),
      delLejos: pierna(aplicar(m, CADERAS.delLejos), [26, -6], 1, 0.2),
    };
    return perfilX({ m, piernas, colaMundo: true, colaPts: [[-38, -24], [-58, -12], [-80, -7], [-98, -9], [-108, -18]], cab: { x: 46, y: -104, giro: 0.25, mira: [1, 0] }, sombra: 58 });
  }
  // de frente, con la cabeza todavía hacia donde caminaba
  return hakuSentado({ cab: { giro: 0.55 }, mira: [2.5, 0] });
}

// ── sentado: base, parpadeo, cola ──
const COLA_SENTADO = [
  [[34, -8], [60, -10], [76, -26], [78, -46], [90, -60]],
  [[34, -8], [60, -10], [78, -22], [88, -40], [104, -46]],
  [[34, -8], [60, -10], [74, -28], [68, -48], [76, -64]],
];

// la pata delantera derecha (de la pantalla) levantada: tubo del hombro a la mano, con almohadilla
const pataAlzada = (pts) => ({ nombre: 'pata-alzada', piezas: pata(pts, { almohadilla: true }) });

// ── la tabla de ciclos ──
export function ciclos() {
  const C = {};
  C.caminar = [0, 1, 2, 3, 4, 5].map(caminar);
  C.sentarse = [0, 1, 2].map(sentarse);
  C.sentado = [hakuSentado()];
  C.parpadeo = [hakuSentado({ cab: { ojos: 'medio' } }), hakuSentado({ cab: { ojos: 'cerrados' } })];
  C.cola = COLA_SENTADO.map((colaPts) => hakuSentado({ colaPts }));
  C.mirar = [
    hakuSentado({ alza: 0.6, mira: [3, -3.4], inclina: 8, cab: { giro: 0.7 } }), // arriba a la derecha
    hakuSentado({ alza: 0.6, mira: [-3, -3.4], inclina: -8, cab: { giro: -0.7 } }), // arriba a la izquierda
  ];
  C.senalar = [
    hakuSentado({ sinMano: 'der', mira: [3, -1], cab: { giro: 0.45 }, encima: [pataAlzada([[14, -56], [38, -50], [58, -58]])] }),
    hakuSentado({ sinMano: 'der', alza: 0.3, mira: [3.2, -2.4], cab: { giro: 0.55 }, encima: [pataAlzada([[14, -58], [46, -68], [74, -84]])] }),
  ];
  const lame = (pts, o) => hakuSentado({ sinMano: 'der', inclina: o.inclina, cab: { ojos: 'cerrados', lengua: o.lengua, orejaAnim: false }, encima: [pataAlzada(pts)] });
  C.lamerse = [
    lame([[10, -56], [24, -72], [12, -88]], { inclina: 9, lengua: false }),
    lame([[10, -56], [24, -72], [12, -88]], { inclina: 12, lengua: true }),
    lame([[10, -56], [26, -76], [14, -94]], { inclina: 17, lengua: true }),
    lame([[10, -56], [26, -76], [14, -94]], { inclina: 14, lengua: false }),
  ];
  C.bostezar = [
    hakuSentado({ alza: 0.4, cab: { ojos: 'medio', boca: 0.35 } }),
    hakuSentado({ alza: 1, cab: { ojos: 'cerrados', boca: 1, orejasAtras: 1 } }),
    hakuSentado({ alza: 0.2, cab: { ojos: 'medio', boca: 0.12 } }),
  ];
  // susto: lomo arqueado, de puntitas, cola esponjada, pelo erizado y ojos grandes
  const arco = (k) => `M -46 -58 C -50 ${-92 - 12 * k} -26 ${-114 - 10 * k} -2 ${-114 - 10 * k} C 24 ${-114 - 8 * k} 46 ${-90 - 6 * k} 50 -62 C 52 -48 44 -38 32 -37 C 18 -46 -18 -46 -34 -37 C -48 -40 -50 -48 -46 -58 Z`;
  const picos = (k) => { const pts = []; for (let j = 0; j <= 10; j++) { const t = j / 10, x = -42 + 70 * t, y = -104 - 10 * k - Math.sin(Math.PI * t) * (10 + 10 * k) + 22 * (1 - Math.sin(Math.PI * t)) ** 2; pts.push([x, y - (j % 2 ? 7 + 3 * k : 0)]); } return pts; };
  const susto = (k) => perfilX({
    m: tras(0, -3 * k),
    pies: { trasLejos: [-28, -6], delLejos: [30, -6], trasCerca: [-38, -6], delCerca: [42, -6] },
    colaPts: [[-44, -60], [-58, -80], [-62, -106], [-56, -132 - 6 * k]],
    colaAncho: [20 + 4 * k, 16 + 4 * k],
    torso: arco(k),
    erizo: picos(k),
    cab: { x: 62, y: -80 - 2 * k, giro: 0.5, ojoGrande: 1.28, orejasAtras: 1, boca: 0.22 + 0.1 * k, mira: [0, -0.5] },
  });
  C.susto = [susto(0), susto(1)];
  // saltar: agacharse · impulso · aire (la pose aprobada) · caída
  C.saltar = [
    perfilX({
      m: mult(tras(0, 12), rot(5, [0, -48])),
      pies: { trasLejos: [-24, -6], delLejos: [32, -6], trasCerca: [-30, -6], delCerca: [44, -6] },
      colaPts: [[-44, -60], [-66, -58], [-88, -52], [-104, -48]],
      cab: { x: 58, y: -82, giro: 0.6, mira: [3, -2.5], orejasAtras: 0.5 },
    }),
    (() => {
      const m = mult(tras(6, -14), rot(-22, [-36, -48]));
      return perfilX({
        m,
        pies: { trasLejos: [-52, -6], trasCerca: [-60, -6] },
        piernas: {
          delCerca: [aplicar(m, CADERAS.delCerca), aplicar(m, [52, -40]), aplicar(m, [62, -30])],
          delLejos: [aplicar(m, CADERAS.delLejos), aplicar(m, [44, -36]), aplicar(m, [54, -28])],
        },
        colaPts: [[-44, -60], [-68, -62], [-90, -70], [-104, -84]],
        cab: { x: 54, y: -138, giro: 0.6, mira: [3, -3], orejasAtras: 0.7 },
        sombra: 50,
      });
    })(),
    hakuSaltando(),
    (() => {
      const m = mult(tras(8, -6), rot(16, [36, -50]));
      return perfilX({
        m,
        pies: { delCerca: [58, -6], delLejos: [50, -6] },
        piernas: {
          trasCerca: [aplicar(m, CADERAS.trasCerca), aplicar(m, [-58, -42]), aplicar(m, [-76, -40])],
          trasLejos: [aplicar(m, CADERAS.trasLejos), aplicar(m, [-50, -40]), aplicar(m, [-68, -40])],
        },
        colaPts: [[-44, -60], [-64, -76], [-74, -98], [-70, -118]],
        cab: { x: 66, y: -96, giro: 0.6, mira: [3, 2], orejasAtras: 0.3 },
        sombra: 54,
      });
    })(),
  ];
  // dormir: respira (el lomo sube 3.5 %) y las tres «z» suben
  const respira = (k) => {
    const d = hakuDormido();
    return {
      grupos: d.grupos.map((g) => (g.nombre === 'zzz'
        ? mover({ grupos: [g], anclas: {} }, tras(3 * k, -6 * k)).grupos[0]
        : g.capa === 'luz' ? g : mover({ grupos: [g], anclas: {} }, [1, 0, 0, 1 + 0.035 * k, 0, 0]).grupos[0])),
      anclas: {},
    };
  };
  C.dormir = [respira(0), respira(1)];
  return C;
}

// ── horneado: un trazo por cuadro, sin hervor, sin nombres de grupo; las tramas se comparten ──
const CON_MIRADA = new Set(['sentado-0']); // cuadros cuyas pupilas siguen al cursor (data-anim + data-o)

/** camino absoluto (M L C Q A Z) → relativo con enteros (redondeando las absolutas antes: no se acumula error) */
export function relativo(d) {
  const tok = d.match(/[MLCQAZ]|-?\d*\.?\d+(?:e-?\d+)?/gi) || [];
  const N = { M: 2, L: 2, C: 6, Q: 4, A: 7, Z: 0 };
  let i = 0, x = 0, y = 0, x0 = 0, y0 = 0, out = '', cmd = '';
  const n = (v) => String(v).replace(/^0\./, '.').replace(/^-0\./, '-.');
  const junta = (nums) => nums.map((v, k) => (k && v >= 0 ? ' ' : '') + n(v)).join('');
  while (i < tok.length) {
    if (/[A-Z]/i.test(tok[i])) cmd = tok[i++].toUpperCase();
    if (cmd === 'Z') { out += 'z'; x = x0; y = y0; continue; }
    const v = tok.slice(i, i + N[cmd]).map(Number); i += N[cmd];
    if (cmd === 'A') {
      const ex = Math.round(v[5]), ey = Math.round(v[6]);
      out += `a${junta([Math.round(v[0]), Math.round(v[1])])} ${v[2]} ${v[3]} ${v[4]} ${junta([ex - x, ey - y])}`;
      x = ex; y = ey; continue;
    }
    const r = v.map(Math.round), rel = r.map((c, k) => c - (k % 2 ? y : x));
    out += (cmd === 'M' ? 'm' : cmd.toLowerCase()) + junta(rel);
    x = r.at(-2); y = r.at(-1);
    if (cmd === 'M') { x0 = x; y0 = y; cmd = 'L'; }
  }
  return out;
}

function cuadro(parte, clave) {
  const r = hornear({ nombre: 'hc', titulo: clave, grupos: parte.grupos, anclas: parte.anclas, vb: [0, 0, 160, 120] });
  let s = r.svg;
  const defs = (s.match(/<defs>[\s\S]*?<\/defs>/) || [''])[0];
  s = s.replace(defs, '')
    .replace(/<g class="f[12]">[\s\S]*?<\/g>/g, '')
    .replace(/<g class="f0">([\s\S]*?)<\/g>/g, '$1')
    .replace(/ class="t"/g, '')
    .replace(/ data-g="[^"]*"/g, '')
    .replace(/^<g fill="none"[^>]*>/, '').replace(/<\/g>$/, '');
  s = s.replace(/ d="([^"]+)"/g, (_, d) => ` d="${relativo(d)}"`);
  if (!CON_MIRADA.has(clave)) s = s.replace(/ data-anim="[^"]*"/g, '').replace(/ data-o="[^"]*"/g, '');
  return { s, defs };
}

/** contrato con generar.mjs: módulos de datos aparte (no entran a index.ts) */
export function modulos() {
  const C = ciclos();
  let defs = '';
  const cuadros = {};
  for (const [nombre, lista] of Object.entries(C)) {
    cuadros[nombre] = lista.map((p, i) => {
      const r = cuadro(p, `${nombre}-${i}`);
      if (r.defs && !defs.includes(r.defs)) defs += r.defs.replace(/^<defs>|<\/defs>$/g, '');
      return r.s;
    });
  }
  const { ancho, alto, piso, centro, escala } = LIENZO;
  return [{
    nombre: 'haku-ciclos',
    tope: 9, // KB por cuadro
    datos: {
      nombre: 'haku-ciclos',
      vb: `0 0 ${ancho} ${alto}`,
      ancho, alto, piso, centro,
      zancada: ZANCADA,
      fps: 10,
      envoltura: `<g fill="none" stroke="#EDE6D6" stroke-width="3.25" stroke-linecap="round" stroke-linejoin="round" transform="translate(${centro} ${piso}) scale(${escala})">`,
      // `svg`: las tramas compartidas (<defs>) — el mismo nombre de campo que el resto de los datos del kit
      svg: `<defs>${defs}</defs>`,
      cuadros,
    },
  }];
}
