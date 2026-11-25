// «La 404»: Haku de perfil, en la mesa, con la pata en la taza que está en la orilla (su broma de siempre). Detrás
// de él, en la otra punta de la mesa, una bola de papel y un lápiz: los tira con la cola cuando lo tocan.
// La geometría deja TODO en su sitio de antes de caer (la taza de pie en la orilla); a dónde cae cada cosa lo dicen
// las anclas `<cosa>Suelo` (centro en el suelo) y su giro final en CAIDAS (lo leen app/global-not-found.tsx para el
// estado quieto en CSS y components/paginas/NoEncontradaEscena.tsx para la caída). Lienzo 760×520, origen arriba a la
// izquierda (así el CSS puede girar en coordenadas del lienzo sin sorpresas).
// Haku es el de la hoja de personajes (piezas/haku.mjs: perfil(), las patas y la cola de la pose «empujando»).
import { L, P, E, PG, R } from '../kit/formas.mjs';
import { grupo } from '../kit/componer.mjs';
import { perfil, mover, GESTOS_HAKU } from './haku.mjs';

const W = 760, H = 520;
const MESA = 262; // y de la cubierta
const ORILLA_D = 520, ORILLA_I = 196; // orillas de la mesa
const SUELO = 490;
const HAKU = { x: 386, y: MESA, s: 1.45 };

// la taza de la portada (piezas/escritorio.mjs) sin vapor; origen = centro de la base
const TAZA_C = [513, MESA];
function taza([cx, cy]) {
  const t = (d) => d.replace(/(-?\d+\.?\d*) (-?\d+\.?\d*)/g, (_, x, y) => `${+x + cx} ${+y + cy}`);
  const a = { anim: 'taza' };
  return grupo('taza', [
    P(t('M -18 -50 L -16 -2 C -16 1 16 1 16 -2 L 18 -50 Z'), { rol: 'taza', ...a }),
    P(t('M -18 -50 L -16 -2 C -16 1 16 1 16 -2 L 18 -50'), { linea: 'ext', ...a }),
    E([cx, cy - 50], 18, 4.5, { linea: 'int', ...a }),
    E([cx, cy - 50], 14, 2.6, { rol: 'oscuro', ...a }),
    P(t('M -17 -41 C -33 -41 -33 -16 -16 -16'), { linea: 'ext', ...a }),
  ]);
}

// la bola de papel y el lápiz, en la otra punta de la mesa
const BOLA_C = [280, MESA - 11];
const LAPIZ_C = [232, MESA - 4];
function bola([cx, cy]) {
  const a = { anim: 'bola' };
  return grupo('bola', [
    E([cx, cy], 11, 10.5, { rol: 'paginas', ...a }),
    E([cx, cy], 11, 10.5, { linea: 'int', ...a }),
    P(`M ${cx - 6} ${cy - 4} L ${cx - 1} ${cy - 1} L ${cx + 2} ${cy - 7} M ${cx - 3} ${cy + 5} L ${cx + 4} ${cy + 1} L ${cx + 7} ${cy + 4}`, { linea: 'fino', tinta: 'noche', ...a }),
  ]);
}
function lapiz([cx, cy]) {
  const a = { anim: 'lapiz' };
  const x0 = cx - 26, x1 = cx + 18, y0 = cy - 4, y1 = cy + 4;
  return grupo('lapiz', [
    R(x0, y0, x1 - x0, y1 - y0, { rol: 'lampara', ...a }),
    R(x0 - 7, y0, 7, y1 - y0, { rol: 'nariz', ...a }),
    PG([[x1, y0], [x1 + 12, cy], [x1, y1]], { rol: 'sobre', ...a }),
    R(x0 - 7, y0, x1 - x0 + 7, y1 - y0, { linea: 'int', ...a }),
    PG([[x1, y0], [x1 + 12, cy], [x1, y1]], { linea: 'int', ...a }),
    L([x0, y0], [x0, y1], { linea: 'fino', ...a }),
    E([x1 + 10.5, cy], 1.6, 1.6, { rol: 'oscuro', ...a }),
  ]);
}

/** a dónde cae cada cosa: centro en el suelo y giro final (grados); el centro de giro es su ancla de la mesa */
export const CAIDAS = {
  taza: { desde: [TAZA_C[0], MESA - 25], hasta: [598, SUELO - 19.5], giro: 90 },
  bola: { desde: BOLA_C, hasta: [116, SUELO - 10.5], giro: -200 },
  lapiz: { desde: LAPIZ_C, hasta: [170, SUELO - 5], giro: -180 },
};

function mesa() {
  return [
    grupo('suelo', [L([24, SUELO], [W - 24, SUELO], { linea: 'int', tinta: 'viva' })]),
    grupo('sombras', [
      E([ORILLA_I + 34, SUELO + 1], 22, 3.5, { trama: 'sombra' }),
      E([ORILLA_D - 26, SUELO + 1], 22, 3.5, { trama: 'sombra' }),
      E([360, MESA + 1.5], 92, 4, { trama: 'sombra' }),
    ], { capa: 'luz' }),
    grupo('mesa', [
      // patas: tocan el suelo
      PG([[ORILLA_I + 24, MESA + 18], [ORILLA_I + 42, MESA + 18], [ORILLA_I + 42, SUELO], [ORILLA_I + 24, SUELO]], { rol: 'mesa' }),
      PG([[ORILLA_I + 24, MESA + 18], [ORILLA_I + 42, MESA + 18], [ORILLA_I + 42, SUELO], [ORILLA_I + 24, SUELO]], { linea: 'int' }),
      PG([[ORILLA_D - 36, MESA + 18], [ORILLA_D - 18, MESA + 18], [ORILLA_D - 18, SUELO], [ORILLA_D - 36, SUELO]], { rol: 'mesa' }),
      PG([[ORILLA_D - 36, MESA + 18], [ORILLA_D - 18, MESA + 18], [ORILLA_D - 18, SUELO], [ORILLA_D - 36, SUELO]], { linea: 'int' }),
      PG([[ORILLA_I, MESA], [ORILLA_D, MESA], [ORILLA_D, MESA + 18], [ORILLA_I, MESA + 18]], { rol: 'mesa' }),
      PG([[ORILLA_I, MESA], [ORILLA_D, MESA], [ORILLA_D, MESA + 18], [ORILLA_I, MESA + 18]], { linea: 'ext' }),
    ]),
  ];
}

export function ilustraciones() {
  const haku = mover(perfil({
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
    pataAnim: 'pata',
  }), HAKU);
  // el golpe en el suelo: tres rayitas junto a la taza caída (ocultas bajo html.mueve hasta que cae)
  const [gx, gy] = CAIDAS.taza.hasta;
  const golpe = grupo('golpe', [
    L([gx - 46, gy + 4], [gx - 60, gy - 6], { linea: 'int', tinta: 'apagado' }),
    L([gx - 44, gy - 12], [gx - 52, gy - 26], { linea: 'int', tinta: 'apagado' }),
    L([gx + 50, gy - 10], [gx + 60, gy - 22], { linea: 'int', tinta: 'apagado' }),
  ]);
  return [{
    nombre: 'no-encontrada',
    titulo: 'Haku empujando una taza desde la orilla de la mesa',
    vb: [0, 0, W, H],
    tope: 90,
    grupos: [...mesa(), bola(BOLA_C), lapiz(LAPIZ_C), ...haku.grupos, taza(TAZA_C), golpe],
    anclas: {
      ...haku.anclas,
      taza: CAIDAS.taza.desde, tazaSuelo: CAIDAS.taza.hasta,
      bola: CAIDAS.bola.desde, bolaSuelo: CAIDAS.bola.hasta,
      lapiz: CAIDAS.lapiz.desde, lapizSuelo: CAIDAS.lapiz.hasta,
    },
    gestos: { ...GESTOS_HAKU },
    orden: [],
  }];
}
