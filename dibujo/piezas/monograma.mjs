// «DB»: el monograma de la cabecera (64×40), trazado con UNA sola línea: el asta de la D sube, su panza baja, la
// línea pasa por debajo hasta la B, sube por su asta, hace sus dos panzas y sale en una colita con la chispa.
// Temblor más fino que el resto (a 64 px el marcador normal se come las letras).
import { P, E } from '../kit/formas.mjs';
import { grupo } from '../kit/componer.mjs';

const TRAZO = 'M 8 34 L 8 7 C 23 6 30 13 30 20.5 C 30 29 23 34.5 8 34 '
  + 'C 16 38.5 30 38.5 37 34 L 37 7 C 50 6 53 12 52 15.5 C 51 19 46 20.5 37.5 20.5 '
  + 'C 51 20 56 24 55 28.5 C 54 33 47 35 37 34 C 46 37 53 37.5 58 35.5';

export function ilustraciones() {
  return [{
    nombre: 'monograma',
    titulo: 'DB',
    vb: [0, 0, 64, 40],
    tope: 12,
    grupos: [
      grupo('trazo', [P(TRAZO, { linea: 'ext', rugoso: { roughness: 0.35, bowing: 0.3, maxRandomnessOffset: 0.5 } })]),
      grupo('chispa', [E([59.5, 35], 2.4, 2.4, { rol: 'foco', mueve: [0, 0] })]),
    ],
    orden: [['trazo'], ['chispa']],
  }];
}
