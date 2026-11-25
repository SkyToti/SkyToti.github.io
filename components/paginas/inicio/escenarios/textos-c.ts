// Textos de interfaz de los escenarios 6 (La Elegía) y 8 (Tierra de Viajes), en los dos idiomas. Viven aquí y no en
// ../textos.ts para que cada escenario se pueda rehacer sin tocar archivos comunes. Nada de esto es contenido del caso:
// son nombres accesibles de controles y de grupos.
import type { Idioma } from "@/lib/idioma";

export type TextosC = {
  /** nombre accesible de la lista de cifras del caso */
  cifras: string;
  /** el halo de Aurelion detrás de la cima (botón: gira) */
  halo: string;
  /** la tira de láminas de concepto y modelo */
  laminas: string;
  /** el avión de papel que recorre la ruta (botón: da un rizo) */
  avion: string;
};

export const TEXTOS_C: Record<Idioma, TextosC> = {
  es: {
    cifras: "Cifras del caso",
    halo: "Girar el halo de Aurelion",
    laminas: "Conceptos y modelos",
    avion: "Hacer que el avión de papel dé un rizo",
  },
  en: {
    cifras: "Case figures",
    halo: "Spin Aurelion's halo",
    laminas: "Concepts and models",
    avion: "Make the paper plane loop",
  },
};
