// Los tres estilos: cómo se convierte la geometría limpia en dibujo.
// trazo: opciones de roughjs (strokeWidth en px de pantalla; generar.mjs compensa la escala del grupo)
// rellenos: rol → { fill, modo: 'liso' (forma limpia) | 'rugoso' (roughjs solid), mueve: [dx,dy] (registro corrido), opacidad }

export const color = {
  noche: '#0B1220', superficie: '#121B2E', linea: '#2A3854', viva: '#5B6F96',
  hueso: '#EDE6D6', apagado: '#A7A698', ambar: '#F5B455',
  cielo: '#86C8F0', // azul cielo propuesto: 10.3:1 sobre noche, 9.4:1 sobre superficie
  rosa: '#E8A0A6', // solo la nariz de Haku
};

const comunes = {
  ojo: { fill: color.cielo, modo: 'liso' },
  pupila: { fill: color.noche, modo: 'liso' },
  brillo: { fill: color.hueso, modo: 'liso' },
  nariz: { fill: color.rosa, modo: 'liso' },
};

export const estilos = {
  a: {
    nombre: 'Tinta fina',
    trazo: { strokeWidth: 1.75, roughness: 0.55, bowing: 0.7, disableMultiStroke: false, curveStepCount: 7 },
    linea: { strokeWidth: 1.75, roughness: 0.5, bowing: 0.5 },
    tonos: { hueso: color.hueso, apagado: color.apagado, viva: color.viva, ambar: color.ambar, cielo: color.cielo },
    rellenos: {
      ...comunes,
      // «tapas» del color de la noche: no se ven como relleno, solo tapan lo que queda detrás
      papel: { fill: color.noche, modo: 'liso' },
      ojitos: { fill: color.hueso, modo: 'liso' },
    },
    luz: { cono: { fill: color.ambar, opacity: 0.13 }, charco: { fill: color.ambar, opacity: 0.32 }, foco: 0.9 },
    rotulo: { size: 17, peso: 420, infm: 55, bnce: 10, fill: color.apagado, em: 0.55 },
    chispa: 4,
  },
  b: {
    nombre: 'Marcador',
    trazo: { strokeWidth: 4.5, roughness: 1.45, bowing: 2.2, disableMultiStroke: true, curveStepCount: 6, remate: 5 },
    sinDetalles: true, // el marcador se salta las rayitas finas
    finos: 0.6, // bigotes y rayitas a 2.7 px
    linea: { strokeWidth: 4.5, roughness: 1.1, bowing: 1.2 },
    tonos: { hueso: color.hueso, apagado: color.apagado, viva: color.viva, ambar: color.ambar, cielo: color.cielo },
    rellenos: {
      ...comunes,
      papel: { fill: color.ambar, modo: 'rugoso', mueve: [3, 3] },
      lampara: { fill: color.ambar, modo: 'rugoso', mueve: [3, 3] },
      bloque: { fill: color.ambar, modo: 'rugoso', mueve: [3, 3] },
      foco: { fill: color.ambar, modo: 'rugoso', mueve: [2, 2] },
      pantalla: { fill: color.superficie, modo: 'liso' },
      taza: { fill: color.viva, modo: 'rugoso', mueve: [3, 3] },
      puntas: { fill: color.viva, modo: 'rugoso', mueve: [1, 1], opacidad: 0.55 },
      ojitos: { fill: color.noche, modo: 'liso' },
    },
    luz: { cono: { fill: color.ambar, opacity: 0.17 }, charco: { fill: color.ambar, opacity: 0.45 }, foco: 1 },
    rotulo: { size: 22, peso: 760, infm: 100, bnce: 55, fill: color.hueso, em: 0.6 },
    chispa: 6,
  },
  c: {
    nombre: 'Risografía',
    trazo: { strokeWidth: 2.5, roughness: 0.85, bowing: 1, disableMultiStroke: true, curveStepCount: 6 },
    finos: 0.75,
    linea: { strokeWidth: 2.5, roughness: 0.7, bowing: 0.8 },
    tonos: { hueso: color.hueso, apagado: color.apagado, viva: color.viva, ambar: color.ambar, cielo: color.cielo },
    // bloques planos corridos respecto a la línea (registro de riso) + trama de puntos con <pattern>
    rellenos: {
      ...comunes,
      ojo: { fill: color.cielo, modo: 'liso', mueve: [1.5, 1] },
      pelaje: [{ fill: color.superficie, modo: 'liso', mueve: [5, 4] }, { fill: 'url(#trama-hueso)', modo: 'liso', mueve: [5, 4] }],
      puntas: { fill: color.viva, modo: 'liso', mueve: [5, 4], opacidad: 0.9 },
      papel: { fill: color.ambar, modo: 'liso', mueve: [5, 4] },
      lampara: { fill: color.ambar, modo: 'liso', mueve: [5, 4] },
      bloque: { fill: color.ambar, modo: 'liso', mueve: [4, 3] },
      foco: { fill: color.ambar, modo: 'liso', mueve: [4, 3] },
      robot: { fill: 'url(#trama-cielo)', modo: 'liso', mueve: [4, 3] },
      pantalla: { fill: 'url(#trama-pantalla)', modo: 'liso', mueve: [6, 5], opacidad: 0.55 },
      marco: { fill: color.superficie, modo: 'liso', mueve: [6, 5] },
      taza: { fill: color.cielo, modo: 'liso', mueve: [5, 4] },
      teclado: { fill: color.linea, modo: 'liso', mueve: [5, 4] },
      mesa: { fill: color.linea, modo: 'liso', mueve: [6, 5] },
      ojitos: { fill: color.noche, modo: 'liso' },
    },
    tramas: {
      'trama-hueso': { color: color.hueso, r: 1.45, paso: 4.4 },
      'trama-cielo': { color: color.cielo, r: 1.2, paso: 5 },
      'trama-pantalla': { color: color.cielo, r: 0.9, paso: 7 },
      'trama-ambar': { color: color.ambar, r: 1.5, paso: 6 },
    },
    luz: { cono: { fill: 'url(#trama-ambar)', opacity: 0.8 }, charco: { fill: color.ambar, opacity: 0.6 }, foco: 1, debajo: true },
    rotulo: { size: 19, peso: 600, infm: 35, bnce: 20, fill: color.ambar, em: 0.57 },
    chispa: 5,
  },
};
