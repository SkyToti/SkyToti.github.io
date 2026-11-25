// Textos de interfaz de los escenarios 4 (minecraft-rcon-mcp), 5 (taller-claude) y 7 (La Isla), en los dos idiomas.
// Viven aquí y no en ../textos.ts para que cada escenario se pueda rehacer sin tocar archivos comunes. Los papeles y
// modelos de los seis agentes son los del caso y los del diagrama `orquesta-agentes` (escenas/orquesta-agentes.ts).
import type { Idioma } from "@/lib/idioma";

export type Agente = { papel: string; modelo: string };

export type TextosB = {
  /** rótulo encima del diagrama en miniatura (la sección «Cómo funciona» del caso) */
  comoFunciona: string;
  /** nombre accesible de las cifras del caso */
  laPrueba: string;
  /** el volante de la bóveda (deslizador que se gira) */
  volante: string;
  /** cómo se lee su valor: «90 grados» */
  grados: (n: number) => string;
  /** lo que se anuncia cuando el volante da una vuelta y baja el sello */
  aprobado: string;
  /** la batuta de la mesa de los seis */
  batuta: string;
  /** los seis agentes, en el orden del dibujo (de izquierda a derecha) */
  agentes: Agente[];
  /** la isla, que se estira al tocarla */
  isla: string;
};

export const TEXTOS_B: Record<Idioma, TextosB> = {
  es: {
    comoFunciona: "Cómo funciona",
    laPrueba: "La prueba",
    volante: "Volante de la bóveda: gíralo una vuelta con las flechas o arrastrando",
    grados: (n) => `${n} grados`,
    aprobado: "Aprobado",
    batuta: "Batuta: dar el golpe para que martillen",
    agentes: [
      { papel: "explorador", modelo: "Haiku" },
      { papel: "cartógrafo", modelo: "Haiku" },
      { papel: "investigador", modelo: "Sonnet" },
      { papel: "redactor", modelo: "Sonnet" },
      { papel: "verificador", modelo: "Sonnet" },
      { papel: "programador", modelo: "Opus" },
    ],
    isla: "Estirar la isla",
  },
  en: {
    comoFunciona: "How it works",
    laPrueba: "The proof",
    volante: "Vault wheel: turn it all the way round with the arrow keys or by dragging",
    grados: (n) => `${n} degrees`,
    aprobado: "Approved",
    batuta: "Baton: give the beat so they hammer",
    agentes: [
      { papel: "explorer", modelo: "Haiku" },
      { papel: "mapper", modelo: "Haiku" },
      { papel: "researcher", modelo: "Sonnet" },
      { papel: "writer", modelo: "Sonnet" },
      { papel: "verifier", modelo: "Sonnet" },
      { papel: "programmer", modelo: "Opus" },
    ],
    isla: "Stretch the island",
  },
};
