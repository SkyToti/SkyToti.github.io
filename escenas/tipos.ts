// Tipos de una escena («maquinita») del plano. La especificación está en ESCENAS.md §1.
// Una escena es DATOS: el motor (components/plano/) la dibuja y la anima.
//
// Estos archivos los importa también `node --test` (pruebas/escenas.test.mjs) con la eliminación de tipos de
// Node: en escenas/<nombre>.ts solo se importan TIPOS (`import type`), y nada de sintaxis que no se pueda borrar.

export type Texto = { es: string; en: string };

/** Posición en la retícula: [columna, fila]. Se aceptan medios (2.5) para centrar. */
export type Celda = [col: number, fila: number];

export type TipoNodo = "persona" | "ia" | "servicio" | "dato" | "fin";

export type Nodo = {
  id: string;
  tipo: TipoNodo;
  /** ≤ 18 caracteres por idioma; va en mono y en mayúsculas (se escribe ya en mayúsculas). */
  etiqueta: Texto;
  /** Segunda línea opcional, en hueso apagado (≤ 26 caracteres). Aparece cuando el nodo se enciende. */
  nota?: Texto;
  /** Composición horizontal: retícula 12 × 6. Columna 1 se alinea a la izquierda y la 12 a la derecha. */
  ancho: Celda;
  /** Composición vertical (celular): retícula 4 × N. Columna 1 a la izquierda, 4 a la derecha. */
  alto: Celda;
};

/**
 * Forma de la ruta ortogonal (h = tramo horizontal, v = vertical). Por omisión `hvh` en `ancho` y `vhv` en `alto`;
 * si los extremos quedan alineados, se vuelve una recta. `via` es dónde va el tramo del medio: una columna en
 * `hvh` y una fila en `vhv` (así varios trazos que comparten `via` se juntan en una sola línea).
 */
export type Ruta = { forma?: "hvh" | "vhv" | "hv" | "vh"; via?: number };

export type Trazo = { id: string; de: string; a: string; punteado?: boolean; ancho?: Ruta; alto?: Ruta };

/** Compuerta: barra que cruza el trazo `en`. Afecta a todo trazo que pase por ese punto (tramo común). */
export type Compuerta = { id: string; en: string; etiqueta: Texto };

export type Cota = {
  id: string;
  /** id de nodo o de compuerta */
  junto: string;
  valor: number;
  prefijo?: string;
  sufijo?: string;
  /** ≤ 26 caracteres por idioma */
  etiqueta: Texto;
};

/** Burbuja de mensaje, ≤ 60 caracteres. `entra` = mensaje que llega; `sale` = respuesta. */
export type Globo = { id: string; junto: string; texto: Texto; lado: "entra" | "sale" };

export type Accion =
  | { dibuja: string | string[] }
  | { enciende: string | string[] }
  | { pulso: string; vuelve?: boolean; color?: "ambar" | "alto" }
  | { pulsos: string[] }
  | { compuerta: string; estado: "abre" | "detiene" }
  | { cuenta: string }
  | { globo: string }
  | { marca: string; como: "hecho" | "alto" }
  | { espera: number };

/** Un Paso por cada paso de «Cómo funciona» del caso, en el mismo orden. */
export type Paso = { acciones: Accion[] };

export type Escena = {
  nombre: string;
  nodos: Nodo[];
  trazos: Trazo[];
  compuertas?: Compuerta[];
  cotas?: Cota[];
  globos?: Globo[];
  pasos: Paso[];
};

/** Topes de caracteres (por idioma). */
export const TOPES = { etiqueta: 18, nota: 26, globo: 60, compuerta: 18, cota: 26 } as const;
