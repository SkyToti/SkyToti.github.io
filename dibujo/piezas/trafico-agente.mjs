// Tráfico · el ciclo de caminata del agente-foco, de perfil, en 4 cuadros (tanda 6). Es el MISMO agente de la hoja
// (agente() de agente.mjs: cuerpo, cabeza de foco, halo y sombra intactos); aquí solo cambian piernas y brazos.
// Tres variantes, cada una un dibujo con sus 4 cuadros como grupos `paso0-…`…`paso3-…` (el componente muestra uno):
//   · trafico-camina  brazos que se balancean (y el cuerpo sube 1 en los cuadros de paso)
//   · trafico-empuja  inclinado hacia delante, las dos manos en el manubrio (MANUBRIO, fijo en los 4 cuadros)
//   · trafico-hombro  una viga sobre los hombros (su cara de abajo en y = HOMBRO); la mano cercana la sujeta
// Lienzo común (LIENZO, el mismo en las tres), origen = el suelo bajo la cadera; mira hacia +x.
// Sin patinar: el pie apoyado retrocede PASO por cuadro; si el cuerpo avanza PASO por cuadro, el pie no se mueve.
// Un solo trazo por cuadro (`cuadros: 1`, sin hervor): ya se mueven solos.
import { PL, E, RR, rot, mult, tras } from '../kit/formas.mjs';
import { agente } from './agente.mjs';
import { mover } from './haku.mjs';
import { prefijar } from '../kit/componer.mjs';

export const PASO = 12; // unidades que avanza el cuerpo por cuadro (= lo que retrocede el pie apoyado)
export const MANUBRIO = [38, -42]; // donde van las manos al empujar
export const HOMBRO = -55; // cara de abajo de la viga (el tope de la caja del cuerpo)
export const LIENZO = [-44, -124, 100, 130];

// ── piernas: [cadera, rodilla, tobillo]; el pie (13×6) sale del tobillo hacia delante ──
const CADERA_LEJOS = [-1, -22], CADERA_CERCA = [2, -22];
/** las piernas de cada cuadro: dónde cae el pie (x) y si va en el aire */
function piernas(k, corre = 0) {
  // pie cercano: delante, apoyado al centro, detrás, en el aire (y el lejano medio ciclo después)
  const apoyo = (x) => ({ x: x + corre, alto: 0 });
  const aire = { x: -2 + corre, alto: 8 };
  const cerca = [apoyo(PASO), apoyo(0), apoyo(-PASO), aire][k];
  const lejos = [apoyo(-PASO), aire, apoyo(PASO), apoyo(0)][k];
  return { cerca, lejos };
}
function pierna(cadera, { x, alto }, bob, lejos) {
  const c = [cadera[0], cadera[1] - bob];
  const tobillo = [x, -6 - alto];
  // rodilla: a media altura, empujada hacia delante (más si el pie va en el aire)
  const rod = [(c[0] + tobillo[0]) / 2 + (alto ? 8 : 2), (c[1] + tobillo[1]) / 2 - (alto ? 2 : 0)];
  const tinta = lejos ? { tinta: 'apagado' } : {};
  return [
    PL([c, rod, tobillo], { linea: 'ext', ...tinta }),
    RR(x - 4, -6 - alto, 13, 6, 2.5, { rol: lejos ? 'teclado' : 'robot' }),
    RR(x - 4, -6 - alto, 13, 6, 2.5, { linea: 'int', ...tinta }),
  ];
}

// ── brazos: [hombro, codo, mano]; la mano es la bolita del kit ──
function brazo(pts, lejos) {
  const fin = pts.at(-1);
  const tinta = lejos ? { tinta: 'apagado' } : {};
  return [PL(pts, { linea: 'ext', ...tinta }), E(fin, 4, 4, { rol: lejos ? 'teclado' : 'casquillo' }), E(fin, 4, 4, { linea: 'int', ...tinta })];
}

/**
 * Un cuadro: el agente de la hoja con sus piernas y brazos de perfil.
 * inclina: grados hacia delante (gira cuerpo, cabeza y brazos alrededor de la cadera).
 */
function cuadro({ k, bob = 0, inclina = 0, brazoCerca, brazoLejos, corre = 0 }) {
  const base = agente({
    brazoI: [[0, -40], [0, -39]], brazoD: [[0, -40], [0, -39]], // se sustituyen abajo
    piernaI: [[0, -22], [0, -6]], piernaD: [[0, -22], [0, -6]],
    mira: 1.5,
  });
  const m = mult(tras(0, -bob), rot(inclina, [0, -22]));
  const arriba = (g) => mover({ grupos: [g] }, m).grupos[0];
  const { cerca, lejos } = piernas(k, corre);
  const grupos = [];
  for (const g of base.grupos) {
    if (g.nombre === 'sombra') grupos.push(g);
    else if (g.nombre === 'brillo') grupos.push(arriba(g));
    else if (g.nombre === 'piernas') {
      // la pierna y el brazo de allá van detrás del cuerpo, en tinta apagada (así se lee cuál pisa)
      grupos.push({ nombre: 'lejos', piezas: [...pierna(CADERA_LEJOS, lejos, bob, true), ...(brazoLejos ? arriba({ piezas: brazo(brazoLejos, true) }).piezas : [])] });
      grupos.push({ nombre: 'piernas', piezas: pierna(CADERA_CERCA, cerca, bob, false) });
    } else if (g.nombre === 'brazos') {
      if (brazoCerca) grupos.push({ nombre: 'brazos', piezas: arriba({ piezas: brazo(brazoCerca, false) }).piezas });
    } else grupos.push(arriba(g));
  }
  return { grupos };
}

/** el brazo cercano que llega a un punto (fuera de la inclinación) desde su hombro, con el codo hacia abajo */
function brazoA(meta, inclina, bob, hombro = [3, -47]) {
  // el punto en coordenadas del cuerpo sin inclinar (el cuadro lo vuelve a inclinar)
  const inv = mult(rot(-inclina, [0, -22]), tras(0, bob));
  const p = [inv[0] * meta[0] + inv[2] * meta[1] + inv[4], inv[1] * meta[0] + inv[3] * meta[1] + inv[5]];
  const codo = [(hombro[0] + p[0]) / 2 - 1, Math.max(hombro[1], p[1]) + 5];
  return [hombro, codo, p];
}

function variante(nombre, titulo, f) {
  const cuadros = [0, 1, 2, 3].map((k) => prefijar(f(k), `paso${k}`));
  return {
    nombre,
    titulo,
    vb: LIENZO,
    cuadros: 1,
    tope: 28,
    grupos: cuadros.flatMap((c) => c.grupos),
    anclas: {},
    orden: [],
    gestos: {},
    alEntrar: [],
    alPasar: [],
  };
}

export function ilustraciones() {
  // camina: el brazo cercano va al revés que la pierna cercana
  const balanceo = [
    [[3, -47], [-4, -38], [-14, -31]], // pierna cercana delante → brazo detrás
    [[3, -47], [3, -37], [4, -26]],
    [[3, -47], [11, -39], [19, -32]],
    [[3, -47], [3, -37], [4, -26]],
  ];
  const balanceoLejos = [
    [[-1, -47], [8, -39], [17, -33]],
    null,
    [[-1, -47], [-8, -38], [-17, -32]],
    null,
  ];
  const BOB = [0, 1, 0, 1];
  const INCLINA = 9;
  return [
    variante('trafico-camina', 'El agente caminando de perfil (4 cuadros)', (k) =>
      cuadro({ k, bob: BOB[k], brazoCerca: balanceo[k], brazoLejos: balanceoLejos[k] })),
    variante('trafico-empuja', 'El agente empujando, inclinado, con las manos en el manubrio (4 cuadros)', (k) =>
      cuadro({ k, inclina: INCLINA, corre: -4, brazoCerca: brazoA(MANUBRIO, INCLINA, 0), brazoLejos: brazoA([MANUBRIO[0] - 3, MANUBRIO[1] + 2], INCLINA, 0, [-1, -47]) })),
    variante('trafico-hombro', 'El agente con una viga al hombro, sujetándola con la mano (4 cuadros)', (k) =>
      cuadro({ k, brazoCerca: [[3, -47], [15, -49], [13, HOMBRO - 6]] })),
  ];
}
