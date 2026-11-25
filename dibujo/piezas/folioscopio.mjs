// «El folioscopio» (yacontesto.com): un bloc de hojas sujeto con una pinza; la hoja de arriba va a medio pasar.
// En las hojas, un garabato que cambia: una nube → un globo de mensaje → una palomita. Al entrar pasan tres hojas;
// al pasar el cursor, pasa otra. Sin rótulos (una sola variante para los dos idiomas). Lienzo 640×420.
//
// Cómo pasa una hoja con los gestos del kit: la hoja que vuela (`volteo`) es la de arriba a medio pasar; con
// escalaY negativo desde la pinza baja y tapa el bloc, y al volver a su sitio destapa el garabato siguiente (que se
// enciende con opacidad justo cuando está tapado). En reposo (y sin movimiento) se ve la palomita: el último cuadro.
import { tubo } from '../kit/formas.mjs';
import { ANCHO, ALTO, PISO, grupo, base, hueco, L, PL, PG, P, E, R, RR } from './tanda1-comun.mjs';

const H = { x0: 122, x1: 378, y0: 148, y1: 356 }; // las hojas (la pinza en y0)
const ALTO_VOLTEO = 88; // lo que asoma la hoja a medio pasar por encima de la pinza
const TAPA = -((H.y1 - H.y0) / ALTO_VOLTEO); // escalaY con que la hoja que vuela tapa el bloc entero
const C = [250, 256]; // centro del garabato

function hoja(nombre, garabato) {
  return grupo(nombre, [
    R(H.x0, H.y0, H.x1 - H.x0, H.y1 - H.y0, { rol: 'sobre', op: 1, mueve: [0, 0] }),
    R(H.x0, H.y0, H.x1 - H.x0, H.y1 - H.y0, { linea: 'int' }),
    ...garabato,
  ], { anim: nombre });
}

const nube = () => {
  const d = 'M 196 290 C 172 290 168 258 192 254 C 188 226 226 216 238 240 C 246 216 286 220 286 246 C 312 244 316 290 290 290 Z';
  return [P(d, { rol: 'hoja', op: 1 }), P(d, { linea: 'ext', tinta: 'noche' })];
};
const mensaje = () => {
  const d = 'M 210 220 L 290 220 C 300 220 306 226 306 236 L 306 270 C 306 280 300 286 290 286 L 238 286 L 214 304 L 220 286 L 210 286 C 200 286 194 280 194 270 L 194 236 C 194 226 200 220 210 220 Z';
  return [
    P(d, { rol: 'papel' }), P(d, { linea: 'ext', tinta: 'noche' }),
    E([226, 253], 5, 5, { rol: 'oscuro' }), E([250, 253], 5, 5, { rol: 'oscuro' }), E([274, 253], 5, 5, { rol: 'oscuro' }),
  ];
};
const palomita = () => {
  const t = tubo([[204, 252], [236, 286], [298, 218]], 20, 20, 3);
  return [PG(t.cerrado, { rol: 'foco' }), PG(t.cerrado, { linea: 'int', tinta: 'noche' })];
};

export function folioscopio() {
  const foto = hueco({ cx: 506, cy: 100, giro: 3 });
  // la hoja a medio pasar: se ve su revés (gris) y, arriba, el rizo del canto que todavía muestra el frente
  const y0 = H.y0, yt = H.y0 - ALTO_VOLTEO;
  const volteo = `M ${H.x0 + 4} ${y0} L ${H.x0 - 2} ${yt + 14} C ${H.x0 + 70} ${yt + 4} ${H.x1 - 70} ${yt + 4} ${H.x1 + 2} ${yt + 14} L ${H.x1 - 4} ${y0} Z`;
  const rizo = `M ${H.x0 - 2} ${yt + 14} C ${H.x0 + 70} ${yt + 4} ${H.x1 - 70} ${yt + 4} ${H.x1 + 2} ${yt + 14} C ${H.x1 + 6} ${yt + 4} ${H.x1 - 4} ${yt - 4} ${H.x1 - 16} ${yt - 2} C ${H.x1 - 80} ${yt - 10} ${H.x0 + 80} ${yt - 10} ${H.x0 + 12} ${yt - 2} C ${H.x0} ${yt - 4} ${H.x0 - 8} ${yt + 4} ${H.x0 - 2} ${yt + 14} Z`;
  const grupos = [
    base(), ...foto.grupos,
    grupo('bloc-sombra', [E([254, PISO + 1], 150, 4, { trama: 'sombra' })], { capa: 'luz' }),
    // la pata de atrás (el bloc se para solo en la repisa)
    grupo('pata', [PL([[372, 300], [414, PISO]], { linea: 'ext' }), PL([[376, 316], [404, PISO]], { linea: 'int', tinta: 'viva' })]),
    grupo('respaldo', [RR(110, 136, 280, PISO - 136, 8, { rol: 'teclado' }), RR(110, 136, 280, PISO - 136, 8, { linea: 'ext' })]),
    grupo('bloc', [
      R(H.x0, H.y0, H.x1 - H.x0, H.y1 - H.y0 + 8, { rol: 'sobre', op: 1, mueve: [0, 0] }),
      R(H.x0, H.y0, H.x1 - H.x0, H.y1 - H.y0 + 8, { linea: 'int' }),
      L([H.x0 + 2, H.y1 + 3], [H.x1 - 2, H.y1 + 3], { linea: 'fino', tinta: 'apagado' }),
      L([H.x0 + 2, H.y1 + 6], [H.x1 - 2, H.y1 + 6], { linea: 'fino', tinta: 'apagado' }),
    ]),
    hoja('hojaA', nube()),
    hoja('hojaB', mensaje()),
    hoja('hojaC', palomita()),
    grupo('aire', [
      P('M 176 34 C 210 22 262 20 300 28', { linea: 'fino', tinta: 'apagado' }),
      P('M 214 18 C 236 12 262 12 282 16', { linea: 'fino', tinta: 'apagado' }),
    ]),
    grupo('volteo', [
      P(volteo, { rol: 'lejos', op: 1, mueve: [3, 2] }),
      P(volteo, { linea: 'ext' }),
      P(rizo, { rol: 'sobre', op: 1, mueve: [2, 1] }),
      P(rizo, { linea: 'int' }),
    ], { anim: 'volteo' }),
    grupo('pinza', [
      PL([[230, 142], [238, 104], [262, 104], [270, 142]], { linea: 'int' }),
      PL([[236, 142], [228, 116], [272, 116], [264, 142]], { linea: 'fino', tinta: 'apagado' }),
      PG([[216, 162], [284, 162], [276, 138], [224, 138]], { rol: 'robot' }),
      PG([[216, 162], [284, 162], [276, 138], [224, 138]], { linea: 'ext' }),
    ]),
  ];
  const vuelo = [0.02, 0.36, 0.3, 0.02, 0.36, 0.3, 0.02, 0.36];
  return {
    nombre: 'folioscopio',
    titulo: 'El folioscopio',
    vb: [0, 0, ANCHO, ALTO],
    grupos,
    anclas: { ...foto.anclas, volteo: [250, H.y0], hojaA: C, hojaB: C, hojaC: C },
    orden: [
      ['base', '!ocultar'], ['foto', 'sombra-foto'], ['pata', 'respaldo', 'bloc-sombra'], ['bloc'], ['hojaA', 'hojaB', 'hojaC'],
      ['volteo', 'aire'], ['pinza'], [], ['!volteo', '!verA', '!verB', '!verC'],
    ],
    zonas: [{ ...R(110, 40, 300, PISO - 40), nombre: 'bloc' }],
    gestos: {
      ocultar: { tipo: 'opacidad', anims: ['hojaA', 'hojaB', 'hojaC'], valores: [0], dur: [0.01] },
      volteo: { tipo: 'escalaY', anims: ['volteo'], valores: [TAPA, 1, 1, TAPA, 1, 1, TAPA, 1].map((v) => +v.toFixed(3)), dur: vuelo },
      verA: { tipo: 'opacidad', anims: ['hojaA'], valores: [0, 1], dur: [0.02, 0.01] },
      verB: { tipo: 'opacidad', anims: ['hojaB'], valores: [0, 1], dur: [0.7, 0.01] },
      verC: { tipo: 'opacidad', anims: ['hojaC'], valores: [0, 1], dur: [1.38, 0.01] },
      otraHoja: { tipo: 'escalaY', anims: ['volteo'], valores: [+TAPA.toFixed(3), 1], dur: [0.02, 0.42] },
    },
    alEntrar: [],
    alPasar: [{ zona: 'bloc', gesto: 'otraHoja' }],
  };
}

const inventos = () => [folioscopio()];
export default inventos;
