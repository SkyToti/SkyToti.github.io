// «El sello» (La pizarra · 160×160): un agente pequeño alza su sello de goma y lo estampa en una hoja; la marca
// queda en la hoja y salta el sello redondo «medido» / «measured». En reposo: sello alzado, marca y sello a la vista.
import { L, PL, PG, E, R, RR, T } from '../kit/formas.mjs';
import { grupo, prefijar } from '../kit/componer.mjs';
import { agente, GESTOS_AGENTE } from './agente.mjs';
import { mover } from './haku.mjs';

const AG = { x: 40, y: 150, s: 0.82 };
const HOMBRO = [AG.x + 17 * AG.s, AG.y - 46 * AG.s];
const MANO = [92, 100]; // donde agarra el mango
const SELLO = [118, 54];

function selloDeGoma([x, y]) {
  // mango redondo arriba, cuello, base con su goma abajo
  return [
    E([x, y - 10], 6.5, 6.5, { rol: 'libro3' }), E([x, y - 10], 6.5, 6.5, { linea: 'int' }),
    R(x - 2.5, y - 4, 5, 12, { rol: 'casquillo', mueve: [1, 1] }), R(x - 2.5, y - 4, 5, 12, { linea: 'fino' }),
    RR(x - 12, y + 8, 24, 8, 2, { rol: 'libro3' }), RR(x - 12, y + 8, 24, 8, 2, { linea: 'int' }),
    R(x - 10, y + 16, 20, 3.5, { rol: 'bloque', mueve: [0, 0] }),
  ];
}

export function ilustraciones() {
  return ['medido', 'measured'].map((texto, i) => {
    const ag = prefijar(mover(agente({
      brazoI: [[-17, -46], [-25, -36], [-25, -25]],
      brazoD: [[17, -46], [18, -45]], // el brazo de verdad va en la mano (se mueve con el sello)
      piernaI: [[-7, -22], [-8, -12], [-9, -6]],
      piernaD: [[7, -22], [8, -12], [9, -6]],
      mira: 1,
    }), AG), 'agente');
    const codo = [HOMBRO[0] + 14, HOMBRO[1] - 2];
    const tam = i === 0 ? 13 : 11;
    return {
      nombre: `sello-${i === 0 ? 'es' : 'en'}`,
      titulo: `El agente estampa el sello «${texto}»`,
      vb: [0, 0, 160, 160],
      tope: 60,
      grupos: [
        grupo('hoja', [
          PG([[64, 140], [146, 140], [138, 152], [56, 152]], { rol: 'paginas' }),
          PG([[64, 140], [146, 140], [138, 152], [56, 152]], { linea: 'int' }),
        ]),
        grupo('marca', [
          E([97, 146], 13, 3.4, { linea: 'int', tinta: 'ambar' }),
          E([97, 146], 7, 1.6, { linea: 'fino', tinta: 'ambar' }),
        ], { anim: 'marca' }),
        ...ag.grupos,
        grupo('mano', [
          PL([HOMBRO, codo, [MANO[0] - 4, MANO[1] + 2]], { linea: 'ext' }),
          E([MANO[0] - 4, MANO[1] + 2], 4, 4, { rol: 'casquillo' }), E([MANO[0] - 4, MANO[1] + 2], 4, 4, { linea: 'int' }),
          ...selloDeGoma(MANO),
        ], { anim: 'mano' }),
        grupo('golpe', [
          L([70, 128], [64, 122], { linea: 'fino', tinta: 'ambar' }), L([97, 126], [97, 118], { linea: 'fino', tinta: 'ambar' }),
          L([124, 128], [130, 122], { linea: 'fino', tinta: 'ambar' }),
        ], { anim: 'golpe', opacidad: 0 }),
        grupo('sello', [
          E(SELLO, 32, 32, { rol: 'oscuro', mueve: [0, 0] }),
          E(SELLO, 32, 32, { linea: 'ext', tinta: 'ambar' }),
          E(SELLO, 26, 26, { linea: 'fino', tinta: 'ambar' }),
          PL([[SELLO[0] - 7, SELLO[1] - 15], [SELLO[0] - 2, SELLO[1] - 10], [SELLO[0] + 8, SELLO[1] - 20]], { linea: 'int', tinta: 'ambar' }),
          T(texto, SELLO[0], SELLO[1] + 8, { tam, ancla: 'middle', tinta: 'ambar', giro: -12, largo: i === 0 ? 40 : 44 }),
        ], { anim: 'sello' }),
      ],
      anclas: { ...ag.anclas, mano: HOMBRO, marca: [97, 146], golpe: [97, 128], sello: SELLO },
      orden: [['hoja'], ag.grupos.map((g) => g.nombre), ['mano'], ['marca', 'golpe', 'sello']],
      gestos: {
        ...GESTOS_AGENTE,
        alza: { tipo: 'giro', anims: ['mano'], valores: [-22], dur: [0.3], ease: 'power2.out' },
        estampa: { tipo: 'giro', anims: ['mano'], valores: [38], dur: [0.09], ease: 'power3.in' },
        regresa: { tipo: 'giro', anims: ['mano'], valores: [30, 0], dur: [0.12, 0.35], ease: 'sine.out' },
        marca: { tipo: 'opacidad', anims: ['marca'], desde: 0, valores: [1], dur: [0.04] },
        golpe: { tipo: 'opacidad', anims: ['golpe'], valores: [1, 1, 0], dur: [0.03, 0.18, 0.15] },
        sello: { tipo: 'escala', anims: ['sello'], desde: 0, valores: [1.18, 0.94, 1], dur: [0.16, 0.1, 0.12], ease: 'power2.out' },
        estampar: { tipo: 'secuencia', pasos: [
          { gesto: 'encender' }, { gesto: 'alza', espera: 0.05 }, { gesto: 'estampa', espera: 0.08 },
          { gesto: 'marca', espera: -0.02 }, { gesto: 'golpe', espera: -0.04 }, { gesto: 'regresa', espera: -0.33 },
          { gesto: 'sello', espera: -0.3 },
        ] },
      },
      alEntrar: ['estampar'],
    };
  });
}
