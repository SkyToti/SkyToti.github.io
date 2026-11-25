// Tráfico · las nubes y las estrellas del cruce `nubes` (tanda 6). Un solo trazo (`cuadros: 1`).
//   · trafico-nube-cerca-a / -b  nubes de la capa cercana: relleno `linea`, contorno hueso, sombra de trama abajo
//   · trafico-nube-lejos         nube de la capa lejana: relleno `superficie`, contorno fino en `viva`
//   · trafico-estrella           un destello de cuatro puntas en ámbar (titila una vez)
import { P, E } from '../kit/formas.mjs';

const uno = (d) => ({ cuadros: 1, anclas: {}, orden: [], gestos: {}, alEntrar: [], alPasar: [], ...d });

/** contorno de nube: base casi plana en y = 0, de 0 a w; jorobas arriba (alturas relativas a h) */
function nube(w, h, jorobas) {
  const n = jorobas.length;
  const hombro = (i) => [(w * i) / n, i === 0 || i === n ? -h * 0.18 : -h * 0.42];
  let d = `M 0 0 C ${-h * 0.25} 0 ${-h * 0.3} ${-h * 0.18} 0 ${-h * 0.18}`;
  for (let i = 0; i < n; i++) {
    const a = hombro(i), b = hombro(i + 1), alto = h * jorobas[i];
    d += ` C ${a[0] - 2} ${a[1] - alto * 0.95} ${b[0] + 2} ${b[1] - alto * 0.95} ${b[0]} ${b[1]}`;
  }
  d += ` C ${w + h * 0.3} ${-h * 0.18} ${w + h * 0.25} 0 ${w} 0 C ${w * 0.66} 3 ${w * 0.33} 3 0 0 Z`;
  return d;
}

function cerca(nombre, w, h, jorobas) {
  const d = nube(w, h, jorobas);
  return uno({
    nombre,
    titulo: 'Una nube',
    vb: [-h * 0.4, -h * 1.3, w + h * 0.8 + 6, h * 1.38 + 6],
    tope: 4,
    grupos: [
      { nombre: 'sombra', capa: 'luz', piezas: [E([w / 2, -h * 0.12], w * 0.42, h * 0.13, { trama: 'sombra', op: 0.6 })] },
      { nombre: 'nube', piezas: [P(d, { rol: 'teclado' }), P(d, { linea: 'int' }), P(`M ${w * 0.22} ${-h * 0.38} C ${w * 0.3} ${-h * 0.5} ${w * 0.4} ${-h * 0.5} ${w * 0.46} ${-h * 0.42}`, { linea: 'fino', tinta: 'viva' })] },
    ],
  });
}

export function ilustraciones() {
  const lejos = nube(150, 44, [0.5, 0.9, 0.6]);
  const t = 11, i = 3.4;
  const destello = `M 0 ${-t} C ${i * 0.3} ${-i} ${i} ${-i * 0.3} ${t} 0 C ${i} ${i * 0.3} ${i * 0.3} ${i} 0 ${t} C ${-i * 0.3} ${i} ${-i} ${i * 0.3} ${-t} 0 C ${-i} ${-i * 0.3} ${-i * 0.3} ${-i} 0 ${-t} Z`;
  return [
    cerca('trafico-nube-cerca-a', 230, 70, [0.55, 1, 0.8, 0.45]),
    cerca('trafico-nube-cerca-b', 160, 56, [0.7, 1, 0.5]),
    uno({
      nombre: 'trafico-nube-lejos',
      titulo: 'Una nube lejana',
      vb: [-20, -62, 192, 70],
      tope: 3,
      grupos: [{ nombre: 'nube', piezas: [P(lejos, { rol: 'marco', mueve: [3, 2] }), P(lejos, { linea: 'fino', tinta: 'viva' })] }],
    }),
    uno({
      nombre: 'trafico-estrella',
      titulo: 'Un destello de cuatro puntas',
      vb: [-16, -16, 34, 34],
      tope: 3,
      grupos: [{ nombre: 'estrella', piezas: [
        P(destello, { rol: 'bloque', mueve: [2, 2] }), P(destello, { linea: 'int', tinta: 'ambar' }),
      ] }],
    }),
  ];
}
