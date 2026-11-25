// Textos de interfaz del plano (controles y lista de pasos) en los dos idiomas.
import type { Idioma } from "@/lib/idioma";

type TextosPlano = {
  reproducir: string;
  pausa: string;
  deNuevo: string;
  controles: string;
  pasoDe: (n: number, total: number) => string;
  verPaso: (n: number, total: number) => string;
};

export const TEXTOS_PLANO: Record<Idioma, TextosPlano> = {
  es: {
    reproducir: "Reproducir",
    pausa: "Pausa",
    deNuevo: "Ver de nuevo",
    controles: "Controles de la animación",
    pasoDe: (n, total) => `Paso ${n} de ${total}`,
    verPaso: (n, total) => `Ver el paso ${n} de ${total}`,
  },
  en: {
    reproducir: "Play",
    pausa: "Pause",
    deNuevo: "Watch again",
    controles: "Animation controls",
    pasoDe: (n, total) => `Step ${n} of ${total}`,
    verPaso: (n, total) => `Show step ${n} of ${total}`,
  },
};
