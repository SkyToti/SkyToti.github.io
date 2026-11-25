// Giro final de cada cosa que se cae en la 404 (grados). Lo mismo que CAIDAS en dibujo/piezas/no-encontrada.mjs: si
// cambias uno, cambia el otro. Dónde cae cada una NO va aquí: lo traen las anclas del dibujo (<cosa> y <cosa>Suelo).
export type Caida = { giro: number };

export const CAIDAS = {
  taza: { giro: 90 },
  bola: { giro: -200 },
  lapiz: { giro: -180 },
} satisfies Record<string, Caida>;
