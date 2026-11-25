// Tráfico · lo que cruza entre escenarios además del agente (tanda 6). Todo con un solo trazo (`cuadros: 1`).
//   · trafico-viga   la viga larga que cargan tres agentes al hombro (agentes en VIGA.agentes; su cara de abajo en HOMBRO)
//   · trafico-tabla  la tabla corta de un solo agente (celular)
//   · trafico-moneda la moneda hexagonal de la colmena-caja (misma geometría, al doble: radio 22, hueco 11); origen = centro
//   · trafico-avion  el avión de papel del invento (misma geometría que avionLocal() de avion-de-papel.mjs, a 1.25×);
//                    origen = su centro, punta hacia +x (MotionPath lo alinea a la ruta)
//   · trafico-suelo  una raya de suelo a mano de 3200 de largo (se corta en la orilla de la ventana)
import { L, PL, PG, E, RR } from '../kit/formas.mjs';
import { HOMBRO } from './trafico-agente.mjs';

const uno = (d) => ({ cuadros: 1, anclas: {}, orden: [], gestos: {}, alEntrar: [], alPasar: [], ...d });

/** dónde va cada agente bajo la viga (x del origen de cada uno); el último puede ir un PASO atrasado */
export const VIGA = { agentes: [216, 108, 0], desde: -46, hasta: 258, grueso: 10 };
export const LIENZO_VIGA = [-64, -126, 334, 132];
export const TABLA = { desde: -40, hasta: 52 };
export const LIENZO_TABLA = [-50, -126, 112, 132];
export const RADIO_MONEDA = 22;

function tablon(nombre, x0, x1) {
  const y0 = HOMBRO - VIGA.grueso, h = VIGA.grueso;
  const vetas = [];
  for (let x = x0 + 18; x < x1 - 30; x += 46) vetas.push(L([x, y0 + 3.5], [x + 22, y0 + 3.5], { linea: 'fino', tinta: 'noche' }));
  for (let x = x0 + 40; x < x1 - 30; x += 58) vetas.push(L([x, y0 + 6.8], [x + 16, y0 + 6.8], { linea: 'fino', tinta: 'noche' }));
  return [
    { nombre: `${nombre}-sombra`, capa: 'luz', piezas: [] },
    { nombre, piezas: [
      RR(x0, y0, x1 - x0, h, 2.5, { rol: 'casquillo' }),
      RR(x0, y0, x1 - x0, h, 2.5, { linea: 'ext' }),
      ...vetas,
      E([x0 + 5, y0 + h / 2], 2.2, 3, { linea: 'fino', tinta: 'noche' }),
      E([x1 - 5, y0 + h / 2], 2.2, 3, { linea: 'fino', tinta: 'noche' }),
    ] },
  ].filter((g) => g.piezas.length);
}

const hexagono = (c, r) => Array.from({ length: 6 }, (_, i) => [c[0] + r * Math.cos((Math.PI / 3) * i), c[1] + r * Math.sin((Math.PI / 3) * i)]);

function avion() {
  const k = 1.25;
  const s = (pts) => pts.map(([x, y]) => [x * k, y * k]);
  const ala = s([[30, 0], [-26, -15], [-10, 1]]);
  const panza = s([[30, 0], [-10, 1], [-20, 13]]);
  const quilla = s([[30, 0], [-10, 1], [-16, 7]]);
  return [
    PG(panza, { rol: 'casquillo' }), PG(panza, { linea: 'ext' }),
    PG(ala, { rol: 'sobre' }), PG(ala, { linea: 'ext' }),
    PL(quilla, { linea: 'fino', tinta: 'noche' }),
  ];
}

function suelo() {
  const piezas = [];
  let x = 0, i = 0;
  while (x < 3200) {
    const largo = 220 + ((i * 97) % 140);
    piezas.push(L([x, (i % 3) - 1], [Math.min(3200, x + largo), ((i + 1) % 3) - 1], { linea: 'int', tinta: 'viva', remate: 0 }));
    x += largo + 16 + ((i * 31) % 20);
    i++;
  }
  return piezas;
}

export function ilustraciones() {
  return [
    uno({ nombre: 'trafico-viga', titulo: 'Una viga larga de madera', vb: LIENZO_VIGA, tope: 8, grupos: tablon('viga', VIGA.desde, VIGA.hasta) }),
    uno({ nombre: 'trafico-tabla', titulo: 'Una tabla corta de madera', vb: LIENZO_TABLA, tope: 4, grupos: tablon('tabla', TABLA.desde, TABLA.hasta) }),
    uno({
      nombre: 'trafico-moneda',
      titulo: 'Una moneda hexagonal',
      vb: [-30, -30, 62, 62],
      tope: 4,
      grupos: [{ nombre: 'moneda', piezas: [
        PG(hexagono([0, 0], RADIO_MONEDA), { rol: 'bloque' }), PG(hexagono([0, 0], RADIO_MONEDA), { linea: 'ext' }),
        PG(hexagono([0, 0], RADIO_MONEDA / 2), { linea: 'int', tinta: 'noche' }),
        L([-RADIO_MONEDA * 0.55, -RADIO_MONEDA * 0.62], [-RADIO_MONEDA * 0.25, -RADIO_MONEDA * 0.78], { linea: 'fino', tinta: 'hueso' }),
      ] }],
    }),
    uno({ nombre: 'trafico-avion', titulo: 'El avión de papel', vb: [-36, -26, 80, 50], tope: 4, grupos: [{ nombre: 'avion', piezas: avion() }] }),
    uno({ nombre: 'trafico-suelo', titulo: 'Una raya de suelo a mano', vb: [0, -8, 3200, 16], tope: 6, grupos: [{ nombre: 'suelo', piezas: suelo() }] }),
  ];
}
