// Piezas que comparten los inventos de la tanda 2 (torre, isla flotante, avión de papel, colmena-caja, cuaderno):
// el hueco para la foto real con su cinta, los rótulos en dos idiomas, nubes y el agente pequeño para dar escala.
import { L, PL, PG, P, E, RR, T, aplicar, rot, mult, tras } from '../kit/formas.mjs';
import { agente } from './agente.mjs';
import { mover } from './haku.mjs';

export const grupo = (nombre, piezas, extra = {}) => ({ nombre, piezas, ...extra });
export const prefijar = (p, pre) => ({ ...p, grupos: p.grupos.map((g) => ({ ...g, nombre: `${pre}-${g.nombre}` })) });

/** gira un punto `g` grados alrededor de c */
export const girar = (pt, g, c = [0, 0]) => aplicar(rot(g, c), pt);

/**
 * El hueco de la foto (lienzo de papel con su ventana vacía y dos trozos de cinta). La ventana es donde el sitio
 * pega la captura real: su centro, su medida y su giro viajan en las anclas `foto`, `fotoMedida`, `fotoGiro`
 * (el componente las lee para colocar el <img> en % del lienzo).
 */
export function huecoFoto({ cx, cy, giro = -3, w = 200, h = 125 }) {
  const m = mult(tras(cx, cy), rot(giro));
  const q = (pts) => pts.map((p) => aplicar(m, p));
  const caja = (x0, y0, x1, y1) => q([[x0, y0], [x1, y0], [x1, y1], [x0, y1]]);
  const hw = w / 2, hh = h / 2;
  // ventana: 9 a los lados y abajo, 15 arriba (la cinta muerde el borde de arriba sin tapar la foto)
  const v = { x0: -hw + 9, y0: -hh + 15, x1: hw - 9, y1: hh - 9 };
  const cinta = (x, g) => {
    const z = [];
    const a = 23, b = 8.5;
    for (let i = 0; i <= 4; i++) z.push([-a + (i % 2 ? 2.5 : 0), -b + (2 * b * i) / 4]);
    const der = z.map(([px, py]) => [-px, -py]);
    const pts = [...z.map(([px, py]) => [px, py]), ...der].map((p) => girar(p, g)).map(([px, py]) => [px + x, py - hh + 1]);
    return [PG(q(pts), { rol: 'sobre', op: 0.55, mueve: [0, 0] }), PG(q(pts), { linea: 'fino', tinta: 'apagado' })];
  };
  const centro = aplicar(m, [(v.x0 + v.x1) / 2, (v.y0 + v.y1) / 2]);
  return {
    grupos: [
      grupo('foto-sombra', [PG(caja(-hw + 6, -hh + 8, hw + 6, hh + 8), { trama: 'sombra', op: 0.55 })], { capa: 'luz' }),
      grupo('foto', [
        PG(caja(-hw, -hh, hw, hh), { rol: 'marco' }),
        PG(caja(-hw, -hh, hw, hh), { linea: 'ext' }),
        PG(caja(v.x0, v.y0, v.x1, v.y1), { rol: 'pantalla' }),
        PG(caja(v.x0, v.y0, v.x1, v.y1), { linea: 'fino', tinta: 'viva' }),
        ...cinta(-hw + 34, -9), ...cinta(hw - 34, 8),
      ]),
    ],
    anclas: { foto: centro, fotoMedida: [v.x1 - v.x0, v.y1 - v.y0], fotoGiro: [giro, 0] },
  };
}

/** rótulos en español y en inglés: dos grupos; el componente esconde el del otro idioma */
export function rotulos(es, en) {
  return [grupo('rotulos-es', es), grupo('rotulos-en', en)];
}
export { T };

/** flecha a mano: el trazo y su punta (ang en grados, hacia dónde apunta) */
export function flecha(d, punta, ang, tinta = 'ambar', linea = 'int') {
  const r = (ang * Math.PI) / 180, k = 11;
  const a = [punta[0] - k * Math.cos(r - 0.5), punta[1] - k * Math.sin(r - 0.5)];
  const b = [punta[0] - k * Math.cos(r + 0.5), punta[1] - k * Math.sin(r + 0.5)];
  return [P(d, { linea, tinta }), PL([a, punta, b], { linea, tinta })];
}

/** una nube de tres jorobas, base plana (cx = centro, y = base) */
export function nube(cx, y, w, extra = {}) {
  const h = w * 0.36, a = w / 2;
  const d = `M ${cx - a} ${y} C ${cx - a - 8} ${y - h * 0.55} ${cx - a * 0.55} ${y - h * 0.8} ${cx - a * 0.35} ${y - h * 0.6} `
    + `C ${cx - a * 0.3} ${y - h * 1.25} ${cx + a * 0.25} ${y - h * 1.3} ${cx + a * 0.25} ${y - h * 0.75} `
    + `C ${cx + a * 0.55} ${y - h * 0.95} ${cx + a + 8} ${y - h * 0.5} ${cx + a} ${y} Z`;
  return [P(d, { rol: 'marco', ...extra }), P(d, { linea: 'int', ...extra })];
}

/** el agente del kit, de pie (las mismas extremidades que «agente-parado»), colocado y con nombres propios */
export function agentePequeno({ x, y, s, mira = 0, brazoAnim = true }) {
  const a = agente({
    brazoI: [[-17, -46], [-25, -36], [-25, -25]],
    brazoD: [[17, -46], [25, -36], [25, -25]],
    piernaI: [[-7, -22], [-8, -12], [-9, -6]],
    piernaD: [[7, -22], [8, -12], [9, -6]],
    mira,
    brazoAnim,
  });
  return prefijar(mover(a, { x, y, s }), 'agente');
}

/** saludo del agente pequeño: el brazo derecho se levanta (giro desde el hombro) */
export const SALUDO = { tipo: 'giro', anims: ['brazo'], valores: [-150, -120, -150, -125, 0], dur: [0.22, 0.14, 0.14, 0.14, 0.3] };

export { L, PL, PG, P, E, RR };
