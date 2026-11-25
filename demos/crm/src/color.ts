/**
 * Familias de degradados por unidad (BRIEF.md §3.2), afinadas contra la paleta medida (§2.2).
 * Cada familia tiene cinco tonos; cada mosaico tiene su plantilla de manchas grandes y suaves.
 * El tono «texto» es el que queda detrás de las cifras: se eligió para que el contraste pase (§4).
 */
import type { Tinta } from "./graficos/graficos";

export type FamiliaId = "centro" | "sucursal" | "imagen" | "laboratorio" | "especialidades";

export interface Familia {
  nombre: string;
  tinta: Tinta;
  texto: string; // detrás de las cifras y etiquetas
  medio: string;
  claro: string;
  acento: string; // el más saturado de la familia
  calido: string; // el contrapunto terroso
}

export const FAMILIAS: Record<FamiliaId, Familia> = {
  // agua y azul grisáceo, con el turquesa de su marca (#3FA7C9) como matiz
  centro: { nombre: "agua", tinta: "clara", texto: "#2f414b", medio: "#75848f", claro: "#b8c0bf", acento: "#6b9aab", calido: "#cdb08f" },
  // salvia y menta: el verde de «Heart Age» y la menta de su logo (#7FD4B8)
  sucursal: { nombre: "salvia", tinta: "clara", texto: "#2e4a2c", medio: "#8aa281", claro: "#b4bf7f", acento: "#77c7a9", calido: "#c9c38a" },
  // ocre, cerca de su ámbar (#E7A857)
  // ocre claro con tinta oscura: el blanco sobre ocre no alcanzaba el contraste (medido, §10)
  imagen: { nombre: "ocre", tinta: "oscura", texto: "#f3e6c6", medio: "#d9b877", claro: "#ecd9a8", acento: "#e0a24c", calido: "#d7925f" },
  // arena y porcelana: claro, con tinta oscura
  laboratorio: { nombre: "porcelana", tinta: "oscura", texto: "#f1e7d6", medio: "#cdb3a4", claro: "#efe4cf", acento: "#c79f88", calido: "#e3cdb0" },
  // gris cálido
  especialidades: { nombre: "gris cálido", tinta: "clara", texto: "#45403b", medio: "#8b847c", claro: "#cbc4bb", acento: "#a3968a", calido: "#b9ad9f" },
};

type Tono = keyof Omit<Familia, "nombre" | "tinta">;
/** Una mancha: tono, centro (x, y en % del mosaico) y radio (% del lado mayor) */
type Plantilla = { base: Tono; manchas: [Tono, number, number, number][] };

export type TeselaId = "pacientes" | "whatsapp" | "sillones" | "rotan" | "laboratorio" | "imagen" | "expansion";

// El tono «texto» siempre cae arriba a la izquierda, donde van la etiqueta y la cifra
// (x, y en % del mosaico; el radio, en % de su lado mayor)
// Regla (medida, §10): toda plantilla parte del tono «texto» de su familia; los tonos luminosos son
// resplandores en medio, detrás del gráfico, lejos de la cifra, las etiquetas y las notas.
const PLANTILLAS: Record<TeselaId, Plantilla> = {
  pacientes: { base: "texto", manchas: [["acento", 60, 52, 40], ["claro", 42, 62, 28], ["medio", 90, 68, 32], ["calido", 100, 40, 26]] },
  whatsapp: { base: "texto", manchas: [["acento", 64, 60, 36], ["calido", 92, 56, 24], ["medio", 38, 56, 28]] },
  sillones: { base: "texto", manchas: [["calido", 70, 58, 34], ["acento", 36, 58, 26], ["medio", 96, 64, 26]] },
  rotan: { base: "texto", manchas: [["acento", 64, 62, 30], ["claro", 94, 66, 26], ["medio", 42, 54, 22]] },
  laboratorio: { base: "texto", manchas: [["acento", 52, 58, 32], ["calido", 92, 62, 28], ["medio", 32, 50, 22]] },
  imagen: { base: "texto", manchas: [["acento", 48, 60, 34], ["calido", 94, 56, 26], ["medio", 28, 48, 22]] },
  expansion: { base: "texto", manchas: [["medio", 72, 46, 28], ["acento", 100, 18, 22], ["claro", 48, 60, 20]] },
};

/** El fondo de un mosaico como capas de degradados radiales (se pinta una vez; lo que respira es la capa) */
export function fondo(tesela: TeselaId, f: Familia, w: number, h: number, modo: "tesela" | "detalle" = "tesela"): string {
  const p = PLANTILLAS[tesela];
  const lado = Math.max(w, h, 1);
  // veladuras del tono «texto» arriba y abajo, donde van la cifra, las etiquetas y las notas (§4:
  // «degradado más profundo detrás del texto»); el resplandor queda en medio, detrás del gráfico
  // (en el mosaico van en su propia capa fija, ver «veladura»: aquí respirarían con las manchas)
  const t = rgbDe(f.texto);
  const veladuras =
    modo === "detalle"
      ? [
          `linear-gradient(180deg, rgba(${t}, 0.84) 8%, rgba(${t}, 0.62) 30%, rgba(${t}, 0) 50%)`,
          `linear-gradient(0deg, rgba(${t}, 0.88) 8%, rgba(${t}, 0.46) 20%, rgba(${t}, 0) 34%)`,
          // en el detalle el texto ocupa toda la superficie: una veladura pareja más
          `linear-gradient(rgba(${t}, 0.68), rgba(${t}, 0.68))`,
        ]
      : [];
  // la primera capa queda arriba: el tono «texto» va primero
  const capas = p.manchas.map(
    ([tono, x, y, r]) => `radial-gradient(circle ${Math.round((r / 100) * lado)}px at ${x}% ${y}%, ${f[tono]} 0%, ${transparente(f[tono])} 100%)`,
  );
  return [...veladuras, ...capas, `linear-gradient(${f[p.base]}, ${f[p.base]})`].join(", ");
}

/**
 * Las veladuras de un mosaico, fijas (no respiran con las manchas) y medidas en píxeles desde el texto
 * real: plenas hasta donde termina la cabeza (o el estado) y desde donde empieza la nota, y se desvanecen
 * en ~56 px. Nunca cubren menos que las de proporción fija de antes. Así el contraste no depende del
 * momento de la respiración ni de cuántas líneas ocupe una etiqueta en un mosaico angosto (medido, §10).
 */
export function veladura(f: Familia, alto: number, arriba: number, abajo: number): string {
  const t = rgbDe(f.texto);
  const px = (v: number) => `${Math.round(v)}px`;
  const a1 = Math.max(arriba, 0.26 * alto);
  const a2 = Math.max(arriba + 56, 0.5 * alto);
  const b1 = Math.max(abajo, 0.14 * alto);
  const b2 = Math.max(abajo + 44, 0.31 * alto);
  return [
    `linear-gradient(180deg, rgba(${t}, 0.86) 0px, rgba(${t}, ${arriba ? 0.8 : 0.62}) ${px(a1)}, rgba(${t}, 0) ${px(a2)})`,
    `linear-gradient(0deg, rgba(${t}, 0.88) 0px, rgba(${t}, ${abajo ? 0.8 : 0.46}) ${px(b1)}, rgba(${t}, 0) ${px(b2)})`,
  ].join(", ");
}

const rgbDe = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
};

/** El mismo color con alfa 0 (evita el gris sucio de mezclar hacia «transparent» en algunos motores) */
function transparente(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, 0)`;
}
