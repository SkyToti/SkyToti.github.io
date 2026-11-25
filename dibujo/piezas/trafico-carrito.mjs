// Tráfico · el carrito que empuja el agente (cruce `carrito`): una carretilla de caja con dos ruedas de rayos (anclas
// `rueda1`/`rueda2`, pivote en su eje: el componente las gira según lo que avanza) y un letrero en un poste. El número
// del letrero NO va horneado: lo escribe el componente encima (prop `numero`), centrado en LETRERO.
// Mismas coordenadas que trafico-empuja (origen = el suelo bajo el agente): el manubrio cae en MANUBRIO, donde el
// agente tiene las manos, así que agente y carrito se pintan uno encima del otro sin mover nada.
import { L, PL, E, RR } from '../kit/formas.mjs';
import { MANUBRIO } from './trafico-agente.mjs';

export const RUEDA = 9; // radio (unidades): el componente gira cada rueda avance / RUEDA radianes
export const LETRERO = { x: 100, y: -147, ancho: 64 }; // centro del número y ancho disponible
export const LIENZO_CARRITO = [-44, -186, 202, 192]; // agente + carrito (el componente lo usa de viewBox)

const rueda = (n, c) => {
  const a = { anim: `rueda${n}` };
  const rayo = (g) => {
    const r = (g * Math.PI) / 180, k = RUEDA - 2.5;
    return L([c[0] - Math.cos(r) * k, c[1] - Math.sin(r) * k], [c[0] + Math.cos(r) * k, c[1] + Math.sin(r) * k], { linea: 'fino', remate: 0, ...a });
  };
  return {
    nombre: `rueda${n}`,
    piezas: [
      E(c, RUEDA, RUEDA, { rol: 'oscuro', ...a }), E(c, RUEDA, RUEDA, { linea: 'ext', ...a }),
      rayo(0), rayo(60), rayo(120),
      E(c, 2.6, 2.6, { rol: 'bloque', mueve: [0, 0], ...a }), E(c, 2.6, 2.6, { linea: 'fino', ...a }),
      // una marca ámbar en la llanta: se ve girar aunque los rayos sean simétricos
      E([c[0], c[1] - RUEDA + 2.2], 1.6, 1.6, { rol: 'bloque', mueve: [0, 0], ...a }),
    ],
  };
};

export function ilustraciones() {
  const [mx, my] = MANUBRIO;
  const caja = [52, -40, 98, 26]; // x, y, w, h
  const R1 = [70, -RUEDA], R2 = [132, -RUEDA];
  const { x: lx } = LETRERO;
  const grupos = [
    { nombre: 'sombra', capa: 'luz', piezas: [E([101, 1.5], 56, 3.5, { trama: 'sombra' })] },
    // el poste y el letrero (detrás de la caja)
    { nombre: 'letrero', piezas: [
      L([lx - 14, caja[1] + 4], [lx - 10, -118], { linea: 'ext' }),
      L([lx + 14, caja[1] + 4], [lx + 10, -118], { linea: 'ext' }),
      RR(lx - 38, -180, 76, 62, 7, { rol: 'papel' }),
      RR(lx - 38, -180, 76, 62, 7, { linea: 'ext' }),
      E([lx - 29, -171], 2.2, 2.2, { rol: 'oscuro' }), E([lx + 29, -171], 2.2, 2.2, { rol: 'oscuro' }),
    ] },
    // la carga que asoma por encima del borde
    { nombre: 'carga', piezas: [
      RR(64, -56, 26, 20, 3, { rol: 'libro1', mueve: [3, 2] }), RR(64, -56, 26, 20, 3, { linea: 'int' }),
      RR(118, -58, 24, 22, 3, { rol: 'bloque' }), RR(118, -58, 24, 22, 3, { linea: 'int' }),
      PL([[125, -51], [122, -47], [125, -43]], { linea: 'fino', tinta: 'noche' }),
      L([131.5, -52], [128.5, -42], { linea: 'fino', tinta: 'noche' }),
      PL([[135, -51], [138, -47], [135, -43]], { linea: 'fino', tinta: 'noche' }),
    ] },
    // la caja de la carretilla y el manubrio hasta las manos del agente
    { nombre: 'caja', piezas: [
      RR(caja[0], caja[1], caja[2], caja[3], 4, { rol: 'buzon' }),
      RR(caja[0], caja[1], caja[2], caja[3], 4, { linea: 'ext' }),
      L([caja[0] + 6, caja[1] + 9], [caja[0] + caja[2] - 6, caja[1] + 9], { linea: 'fino', tinta: 'noche' }),
      L([caja[0] + 6, caja[1] + 17], [caja[0] + caja[2] - 6, caja[1] + 17], { linea: 'fino', tinta: 'noche' }),
      PL([[caja[0] + 2, caja[1] + 6], [mx + 6, my + 1], [mx + 1, my]], { linea: 'ext' }),
      L([mx + 1, my - 5], [mx + 1, my + 5], { linea: 'int' }),
    ] },
    rueda(1, R1),
    rueda(2, R2),
  ];
  return [{
    nombre: 'trafico-carrito',
    titulo: 'Una carretilla con dos ruedas de rayos, un letrero ámbar en su poste y un poco de carga',
    vb: LIENZO_CARRITO,
    cuadros: 1,
    tope: 12,
    grupos,
    anclas: { rueda1: R1, rueda2: R2 },
    orden: [],
    gestos: {},
    alEntrar: [],
    alPasar: [],
  }];
}
