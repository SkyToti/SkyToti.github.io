// «Riso con mano de marcador» (elegido por Diego el 24-nov-2026: risografía + marcador mezclados).
//  · riso: bloques planos de color DESFASADOS de la línea (registro corrido abajo-derecha) y trama de puntos
//    SOLO en luz y sombra (cono de la lámpara, sombra bajo objetos, brillo del monitor).
//  · marcador: contorno exterior grueso con temblor y remates que se pasan; rótulos gordos en Shantell Sans.
//  · jerarquía de línea: exterior 3.25 · interior 2.25 · fino 1.5 (así las caras no se empastan).

export const color = {
  noche: '#0B1220', superficie: '#121B2E', linea: '#2A3854', viva: '#5B6F96',
  hueso: '#EDE6D6', apagado: '#A7A698', ambar: '#F5B455', cielo: '#86C8F0',
  rosa: '#E8A0A6', // solo la nariz y las almohadillas de Haku
};

const REG = [5, 4]; // registro corrido del riso (px abajo-derecha)

export const estilo = {
  nombre: 'Riso con mano de marcador',
  lineas: {
    ext: { strokeWidth: 3.25, roughness: 1.05, bowing: 1.3, remate: 3.2 },
    int: { strokeWidth: 2.25, roughness: 0.75, bowing: 0.9, remate: 1.2 },
    fino: { strokeWidth: 1.5, roughness: 0.4, bowing: 0.5 },
  },
  comun: { disableMultiStroke: true, preserveVertices: true, curveStepCount: 7, maxRandomnessOffset: 1.6 },
  // relleno por rol: { color, op, mueve }  (mueve por defecto = REG)
  rellenos: {
    pelaje: { color: 'hueso', op: 0.9 },          // Haku: crema casi blanco
    lejos: { color: 'apagado', op: 0.75 },           // patas del lado de allá
    puntas: { color: 'apagado', op: 1, mueve: [4, 3] }, // lynx point: orejas, antifaz, patas, punta de la cola
    almohadilla: { color: 'rosa', op: 1, mueve: [1, 1] },
    ojo: { color: 'cielo', op: 1, mueve: [1.5, 1] },
    pupila: { color: 'noche', op: 1, mueve: [0, 0] },
    brillo: { color: 'hueso', op: 1, mueve: [0, 0] },
    nariz: { color: 'rosa', op: 1, mueve: [1, 1] },
    oscuro: { color: 'noche', op: 1, mueve: [0, 0] },
    robot: { color: 'viva', op: 1 },
    foco: { color: 'ambar', op: 1, mueve: [4, 3] },
    casquillo: { color: 'apagado', op: 1, mueve: [3, 2] },
    bloque: { color: 'ambar', op: 1 },
    papel: { color: 'ambar', op: 1 },
    sobre: { color: 'hueso', op: 0.9 },
    lampara: { color: 'ambar', op: 1 },
    marco: { color: 'superficie', op: 1 },
    pantalla: { color: 'noche', op: 1, mueve: [0, 0] },
    taza: { color: 'cielo', op: 1 },
    teclado: { color: 'linea', op: 1 },
    mesa: { color: 'linea', op: 1, mueve: [6, 5] },
    libro1: { color: 'cielo', op: 1, mueve: [4, 3] },
    libro2: { color: 'ambar', op: 1, mueve: [4, 3] },
    libro3: { color: 'viva', op: 1, mueve: [4, 3] },
    maceta: { color: 'viva', op: 1, mueve: [4, 3] },
    hoja: { color: 'cielo', op: 0.85, mueve: [3, 2] },
    auricular: { color: 'linea', op: 1, mueve: [2, 2] },
    martillo: { color: 'apagado', op: 1, mueve: [3, 2] },
    // tanda 3 (repisa, buzón, pie, sello)
    paginas: { color: 'hueso', op: 0.88, mueve: [3, 2] },
    oceano: { color: 'cielo', op: 1, mueve: [4, 3] },
    tierra: { color: 'viva', op: 1, mueve: [2, 2] },
    plato: { color: 'viva', op: 1, mueve: [4, 3] },
    buzon: { color: 'cielo', op: 1 },
    poste: { color: 'apagado', op: 1, mueve: [3, 2] },
  },
  // tramas de puntos: SOLO luz y sombra
  tramas: {
    ambar: { color: 'ambar', r: 1.45, paso: 5.6, op: 0.85 },
    cielo: { color: 'cielo', r: 1.05, paso: 6.5, op: 0.6 },
    sombra: { color: 'viva', r: 1.05, paso: 4.4, op: 0.75 },
    hueso: { color: 'hueso', r: 1, paso: 5, op: 0.5 },
  },
  rotulo: { familia: "'Shantell Sans', 'Comic Sans MS', cursive", peso: 760, infm: 100, bnce: 55, tam: 22 },
  REG,
};
