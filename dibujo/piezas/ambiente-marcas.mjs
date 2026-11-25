// Ambiente · marcas a mano del plano que viven en las orillas de la ventana (tanda 6): cruces de registro, cotas con
// su numerito, flechitas, esquinas de corte y crucecitas. Todo en tinta `viva`, línea fina o interior, sin rellenos
// (el componente las pinta con opacidad baja). Un solo trazo (`cuadros: 1`).
import { L, PL, P, E, T } from '../kit/formas.mjs';

const uno = (d) => ({ cuadros: 1, anclas: {}, orden: [], gestos: {}, alEntrar: [], alPasar: [], tope: 3, ...d });
const v = (x = {}) => ({ linea: 'fino', tinta: 'viva', ...x });

function cota(nombre, largo, texto) {
  return uno({
    nombre,
    titulo: `Una cota de ${texto}`,
    vb: [-8, -26, largo + 16, 36],
    grupos: [{ nombre: 'cota', piezas: [
      L([0, 0], [largo, 0], v({ remate: 0 })),
      L([0, -7], [0, 7], v()), L([largo, -7], [largo, 7], v()),
      PL([[7, -3.5], [1, 0], [7, 3.5]], v()), PL([[largo - 7, -3.5], [largo - 1, 0], [largo - 7, 3.5]], v()),
      T(texto, largo / 2, -7, { tam: 13, ancla: 'middle', tinta: 'viva', peso: 600 }),
    ] }],
  });
}

export function ilustraciones() {
  return [
    uno({
      nombre: 'ambiente-registro',
      titulo: 'Una cruz de registro',
      vb: [-20, -20, 40, 40],
      grupos: [{ nombre: 'registro', piezas: [E([0, 0], 9, 9, v({ linea: 'int' })), L([-16, 0], [16, 0], v()), L([0, -16], [0, 16], v())] }],
    }),
    cota('ambiente-cota-96', 96, '96'),
    cota('ambiente-cota-24', 48, '24'),
    uno({
      nombre: 'ambiente-flecha',
      titulo: 'Una flechita a mano',
      vb: [-6, -26, 78, 36],
      grupos: [{ nombre: 'flecha', piezas: [P('M 0 2 C 16 -20 42 -22 64 -8', v({ linea: 'int' })), PL([[52, -14], [64, -8], [56, 3]], v({ linea: 'int' }))] }],
    }),
    uno({
      nombre: 'ambiente-esquina',
      titulo: 'Una marca de corte',
      vb: [-6, -6, 40, 40],
      grupos: [{ nombre: 'esquina', piezas: [PL([[0, 28], [0, 0], [28, 0]], v({ linea: 'int' })), L([8, 8], [14, 8], v()), L([8, 8], [8, 14], v())] }],
    }),
    uno({
      nombre: 'ambiente-mas',
      titulo: 'Una crucecita',
      vb: [-12, -12, 24, 24],
      grupos: [{ nombre: 'mas', piezas: [L([-7, 0], [7, 0], v()), L([0, -7], [0, 7], v())] }],
    }),
  ];
}
