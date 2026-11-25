/**
 * Colores clínicos (BRIEF-4 §3). La NOM-013-SSA2-2015 (9.2.2.8) pide el odontograma con la nomenclatura FDI,
 * pero no fija colores; la convención de la práctica (y la norma peruana del odontograma, NTS 150-MINSA/2019
 * y NTS 188-2022) es: rojo = pendiente o patológico, azul = realizado o en buen estado.
 * El tercer estado es nuestro, no de la norma: «sugerido por la IA», en trama y sin relleno, hasta que el
 * dentista lo confirma (se vuelve rojo) o lo marca como hecho (azul). El lima sigue siendo «ahora / lo elegido».
 */

/** Zonas anatómicas de una pieza. Las 8 primeras se tiñen en la muela 3D; el conducto se ve por dentro. */
export type Superficie = "oclusal" | "mesial" | "distal" | "vestibular" | "palatina" | "cervical" | "raiz" | "periapical" | "conducto";
/** El orden es el de uZona en el sombreador (muela.ts) */
export const ZONAS_MUELA: Superficie[] = ["oclusal", "mesial", "distal", "vestibular", "palatina", "cervical", "raiz", "periapical"];

export type EstadoClinico = "sugerido" | "por-tratar" | "realizado";

export type TipoClinico =
  | "caries"
  | "restauracion"
  | "restauracion-desadaptada"
  | "endodoncia"
  | "corona"
  | "implante"
  | "extraccion"
  | "ausente"
  | "fractura"
  | "sellante"
  | "calculo"
  | "perdida-osea"
  | "lesion-periapical"
  | "apinamiento";

/** Un rojo y un azul que un dentista lee como clínicos, pero dentro de la paleta terrosa (§10) */
export const COLOR_CLINICO = { rojo: "#c4412f", azul: "#2f5fb3" } as const;

export const colorDe = (e: EstadoClinico) => (e === "realizado" ? COLOR_CLINICO.azul : COLOR_CLINICO.rojo);

/** Los mismos dos, aclarados para fondos oscuros (la radiografía): sobre casi negro, los de arriba no llegan a 3:1 */
export const COLOR_CLINICO_CLARO = { rojo: "#ec7560", azul: "#79a2f2" } as const;
export const colorClaroDe = (e: EstadoClinico) => (e === "realizado" ? COLOR_CLINICO_CLARO.azul : COLOR_CLINICO_CLARO.rojo);

export const NOMBRE_ESTADO: Record<EstadoClinico, string> = {
  sugerido: "sugerido por la IA",
  "por-tratar": "por tratar",
  realizado: "realizado",
};

export const NOMBRE_SUPERFICIE: Record<Superficie, string> = {
  oclusal: "oclusal",
  mesial: "mesial",
  distal: "distal",
  vestibular: "vestibular",
  palatina: "palatina o lingual",
  cervical: "cervical",
  raiz: "radicular",
  periapical: "periapical",
  conducto: "conducto",
};

/** Una marca clínica sobre una zona de una pieza */
export interface Marca {
  superficie: Superficie;
  estado: EstadoClinico;
}

/** Lo que la muela debe mostrar: color y fuerza por zona, su trama, y el conducto */
export interface MetaClinica {
  zonas: { color: string; fuerza: number; trama: number }[];
  conducto: { color: string; fuerza: number; trama: number };
}

const URGENCIA: Record<EstadoClinico, number> = { "por-tratar": 3, sugerido: 2, realizado: 1 };

/** Si dos marcas caen en la misma zona, se ve la más urgente: por tratar, luego sugerido, luego realizado */
export function metaClinica(marcas: Marca[]): MetaClinica {
  const vacia = (): { color: string; fuerza: number; trama: number } => ({ color: COLOR_CLINICO.rojo, fuerza: 0, trama: 0 });
  const zonas = ZONAS_MUELA.map(vacia);
  const conducto = vacia();
  const mejor = new Map<Superficie, Marca>();
  for (const m of marcas) {
    const antes = mejor.get(m.superficie);
    if (!antes || URGENCIA[m.estado] > URGENCIA[antes.estado]) mejor.set(m.superficie, m);
  }
  for (const [s, m] of mejor) {
    const z = { color: colorDe(m.estado), fuerza: 1, trama: m.estado === "sugerido" ? 1 : 0 };
    if (s === "conducto") Object.assign(conducto, z);
    else zonas[ZONAS_MUELA.indexOf(s)] = z;
  }
  return { zonas, conducto };
}

export const rgb01 = (hex: string): [number, number, number] => {
  const n = parseInt(hex.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
};

/**
 * Hacia dónde gira la muela para enseñar una zona (radianes; la cámara ve la cara +z del modelo).
 * Mesial es +x, distal −x (hacia allá se curvan las raíces), vestibular +z y palatina −z.
 */
export function orientacionDe(s: Superficie | null | undefined): { guinada: number; cabeceo: number } {
  switch (s) {
    case "distal":
      return { guinada: 1.15, cabeceo: 0.3 };
    case "mesial":
      return { guinada: -1.15, cabeceo: 0.3 };
    case "palatina":
      return { guinada: 2.75, cabeceo: 0.22 };
    case "vestibular":
      return { guinada: -0.25, cabeceo: 0.2 };
    case "oclusal":
      return { guinada: -0.42, cabeceo: 0.62 };
    case "cervical":
      return { guinada: -0.42, cabeceo: 0.08 };
    case "raiz":
    case "periapical":
    case "conducto":
      return { guinada: -0.3, cabeceo: 0.02 };
    default:
      return { guinada: -0.42, cabeceo: 0.17 };
  }
}

/** El nombre de una pieza en numeración FDI: «16» → «primer molar superior derecho» */
export function nombrePieza(n: number): string {
  const tipo = ["", "incisivo central", "incisivo lateral", "canino", "primer premolar", "segundo premolar", "primer molar", "segundo molar", "tercer molar"][n % 10] ?? "";
  const lado = ["", "superior derecho", "superior izquierdo", "inferior izquierdo", "inferior derecho"][Math.floor(n / 10)] ?? "";
  return `${tipo} ${lado}`.trim();
}

/** El tipo de pieza para la muela 3D (BRIEF-4 §4.B), por su número FDI: los molares de arriba tienen tres
 *  raíces y los de abajo dos; premolares, caninos e incisivos, una (simplificado para el concepto). */
export type TipoPieza = "molar-superior" | "molar-inferior" | "premolar" | "canino" | "incisivo";
export const TIPOS_PIEZA: TipoPieza[] = ["molar-superior", "molar-inferior", "premolar", "canino", "incisivo"];
export function tipoDePieza(n: number): TipoPieza {
  const d = n % 10;
  const arriba = Math.floor(n / 10) <= 2;
  if (d >= 6) return arriba ? "molar-superior" : "molar-inferior";
  if (d >= 4) return "premolar";
  if (d === 3) return "canino";
  return "incisivo";
}
/** Las puntas de las raíces de cada tipo (espacio de la muela; iguales a las del sombreador, ya curvadas) */
export const PUNTAS: Record<TipoPieza, [number, number, number][]> = {
  "molar-superior": [[0.164, -2.1, 0.457], [-0.88, -1.95, 0.412], [-0.301, -2.16, -0.516]],
  "molar-inferior": [[0.255, -2.05, 0.02], [-0.658, -1.95, 0.0]],
  premolar: [[-0.151, -2.04, 0.03]],
  canino: [[-0.24, -2.49, 0.03]],
  incisivo: [[-0.179, -2.19, 0.03]],
};
/** Cuánto mide cada tipo donde se anclan las llamadas: punto de contacto, cara vestibular y la cima de la corona */
export const MEDIDAS: Record<TipoPieza, { cx: number; cz: number; cima: number; medio: number }> = {
  "molar-superior": { cx: 0.93, cz: 0.86, cima: 1.0, medio: 0.52 },
  "molar-inferior": { cx: 0.93, cz: 0.86, cima: 1.0, medio: 0.52 },
  premolar: { cx: 0.64, cz: 0.78, cima: 1.08, medio: 0.55 },
  canino: { cx: 0.54, cz: 0.6, cima: 1.3, medio: 0.62 },
  incisivo: { cx: 0.6, cz: 0.34, cima: 1.18, medio: 0.72 },
};

/** El tipo de una marca, dicho como lo diría el dentista */
export const NOMBRE_TIPO_CLINICO: Record<TipoClinico, string> = {
  caries: "caries",
  restauracion: "restauración",
  "restauracion-desadaptada": "restauración desadaptada",
  endodoncia: "endodoncia",
  corona: "corona",
  implante: "implante",
  extraccion: "extracción",
  ausente: "pieza ausente",
  fractura: "fractura",
  sellante: "sellante",
  calculo: "cálculo",
  "perdida-osea": "pérdida ósea",
  "lesion-periapical": "lesión periapical",
  apinamiento: "apiñamiento",
};
