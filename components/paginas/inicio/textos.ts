// Textos de interfaz de las piezas del inicio a todo lo ancho (Escenario, Vista, Abanico y los escenarios). Los textos
// nuevos de esta carpeta van aquí, en los dos idiomas; NO en lib/textos.ts (components/paginas/inicio/LEEME.md).
import type { Idioma } from "@/lib/idioma";

export type TextosInicio = {
  /** botón del escenario hacia la página del caso */
  verElCaso: string;
  /** botón de un video que no se reproduce solo (menos movimiento, ahorro de datos) o que se pausó */
  reproducir: string;
  pausar: string;
  /** nombre accesible de una tira o un carrusel de capturas */
  masPantallas: string;
  /** nombre accesible de un abanico de vistas */
  abanico: string;
};

export const TEXTOS_INICIO: Record<Idioma, TextosInicio> = {
  es: {
    verElCaso: "Ver el caso",
    reproducir: "Reproducir el video",
    pausar: "Pausar el video",
    masPantallas: "Más pantallas",
    abanico: "Capturas",
  },
  en: {
    verElCaso: "See the case",
    reproducir: "Play the video",
    pausar: "Pause the video",
    masPantallas: "More screens",
    abanico: "Screenshots",
  },
};
