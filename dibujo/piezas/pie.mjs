// «Pie» (420×200): la línea llega al final y Haku duerme hecho rosca encima (pose 6); tres «z» hierven y suben, y la
// chispa se va apagando a su lado. Al tocar a Haku abre un ojo y lo vuelve a cerrar.
import { PL, P, E } from '../kit/formas.mjs';
import { grupo, prefijar } from '../kit/componer.mjs';
import { hakuDormido, GESTOS_HAKU, mover } from './haku.mjs';

const W = 420, H = 200, SUELO = 170;
const HAKU = { x: 246, y: SUELO, s: 0.92 };
const CHISPA = [352, SUELO - 1];

export function ilustraciones() {
  const d = hakuDormido({ ojoQueAbre: true });
  const hk = prefijar(mover({ ...d, grupos: d.grupos.filter((g) => g.nombre !== 'zzz') }, HAKU), 'haku');
  const z = (i, x, y, k) => grupo(`z${i}`, [PL([[x, y], [x + 9 * k, y], [x, y + 9 * k], [x + 9 * k, y + 9 * k]], { linea: 'int', tinta: 'apagado' })], { anim: `z${i}` });
  const zs = [z(1, 262, 86, 0.8), z(2, 280, 62, 1), z(3, 300, 34, 1.2)];
  const sube = (i, a) => ({ tipo: 'mover', anims: [`z${i}`], valores: [[2 * a, -7], [-1 * a, -12], [0, 0]], dur: [0.5, 0.45, 0.01], ease: 'sine.inOut' });
  const asoma = (i) => ({ tipo: 'opacidad', anims: [`z${i}`], valores: [0.25, 1], dur: [0.3, 0.5] });
  const ronda = [
    { gesto: 'z1', espera: 0 }, { gesto: 'z2', espera: -0.65 }, { gesto: 'z3', espera: -0.65 },
  ];
  return [{
    nombre: 'pie-haku',
    titulo: 'Haku dormido al final de la línea',
    vb: [0, 0, W, H],
    tope: 90,
    grupos: [
      grupo('linea', [P(`M -6 112 C 40 112 70 ${SUELO} 120 ${SUELO} L ${CHISPA[0] - 12} ${SUELO}`, { linea: 'ext' })]),
      grupo('chispa', [
        E(CHISPA, 15, 15, { trama: 'ambar', capa: 'luz' }),
        E(CHISPA, 5.5, 5.5, { rol: 'foco', mueve: [0, 0] }),
      ], { anim: 'chispa', opacidad: 0.5 }),
      ...hk.grupos,
      ...zs,
    ],
    anclas: { ...hk.anclas, chispa: CHISPA, z1: [266, 90], z2: [285, 67], z3: [305, 40] },
    orden: [['linea'], ['chispa'], hk.grupos.map((g) => g.nombre), ['z1', 'z2', 'z3']],
    zonas: [E([HAKU.x - 6, HAKU.y - 34], 82, 46, { nombre: 'haku' })],
    gestos: {
      moverCola: GESTOS_HAKU.moverCola,
      z1: { tipo: 'secuencia', pasos: [{ gesto: 'z1s' }, { gesto: 'z1o', espera: -0.96 }] },
      z2: { tipo: 'secuencia', pasos: [{ gesto: 'z2s' }, { gesto: 'z2o', espera: -0.96 }] },
      z3: { tipo: 'secuencia', pasos: [{ gesto: 'z3s' }, { gesto: 'z3o', espera: -0.96 }] },
      z1s: sube(1, 1), z2s: sube(2, -1), z3s: sube(3, 1),
      z1o: asoma(1), z2o: asoma(2), z3o: asoma(3),
      zzz: { tipo: 'secuencia', pasos: [...ronda, { gesto: 'z1', espera: 0.1 }, { gesto: 'z2', espera: -0.65 }, { gesto: 'z3', espera: -0.65 }, { gesto: 'z1', espera: 0.1 }, { gesto: 'z2', espera: -0.65 }, { gesto: 'z3', espera: -0.65 }] },
      cierre: { tipo: 'secuencia', pasos: [{ gesto: 'apaga' }, { gesto: 'zzz', espera: -2.5 }] },
      apaga: { tipo: 'opacidad', anims: ['chispa'], desde: 1, valores: [0.7, 0.95, 0.55, 0.8, 0.5], dur: [0.6, 0.25, 0.7, 0.3, 0.9] },
      sinParpado: { tipo: 'opacidad', anims: ['parpado'], valores: [0], dur: [0.05] },
      conParpado: { tipo: 'opacidad', anims: ['parpado'], valores: [1], dur: [0.05] },
      ojoSe: { tipo: 'opacidad', anims: ['ojoAbre'], valores: [1], dur: [0.05] },
      ojoNo: { tipo: 'opacidad', anims: ['ojoAbre'], valores: [0], dur: [0.05] },
      ojoAbre: { tipo: 'escalaY', anims: ['ojoAbre'], desde: 0.15, valores: [1], dur: [0.12] },
      ojoCierra: { tipo: 'escalaY', anims: ['ojoAbre'], valores: [0.15], dur: [0.1] },
      abreUnOjo: { tipo: 'secuencia', pasos: [
        { gesto: 'sinParpado' }, { gesto: 'ojoSe', espera: -0.05 }, { gesto: 'ojoAbre', espera: -0.05 },
        { gesto: 'ojoCierra', espera: 0.9 }, { gesto: 'ojoNo', espera: -0.02 }, { gesto: 'conParpado', espera: -0.05 },
        { gesto: 'moverCola', espera: 0.05 },
      ] },
    },
    alEntrar: ['cierre'],
    alTocar: [{ zona: 'haku', gesto: 'abreUnOjo', etiqueta: 'Haku, dormido', accesible: true }],
  }];
}
