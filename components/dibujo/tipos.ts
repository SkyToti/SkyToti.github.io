// Tipos del kit de dibujo. Los datos los escribe `node dibujo/generar.mjs` en components/dibujo/datos/.

/** Lo común a los gestos que animan anclas: a quién mueven y con qué curva. */
type Objetivos = {
  /** anclas (data-anim) que mueve */
  anims: string[];
  /** grupos enteros (data-g) que mueve, además de las anclas: p. ej. aparecer a Haku con su cola y sus ojos */
  grupos?: string[];
  /** curva de GSAP de cada tramo (por defecto "sine.inOut") */
  ease?: string;
};

/** Un gesto con nombre: qué anclas mueve y cómo. Cada ilustración declara los suyos. */
export type Gesto =
  | ({ tipo: "escalaY" | "escala" | "giro" | "opacidad"; valores: number[]; dur: number[]; desde?: number } & Objetivos)
  | ({ tipo: "mover"; valores: [number, number][]; dur: number[]; desde?: [number, number] } & Objetivos)
  | { tipo: "pasos"; anims: string[]; paso: number; n: number }
  | { tipo: "mirar"; anims: string[]; radio: number }
  /** otros gestos en fila: cada paso empieza `espera` s después de que termina el anterior (negativo = se encima) */
  | { tipo: "secuencia"; pasos: { gesto: string; espera?: number }[] };

/** Una zona (data-zona) que responde al clic o al toque. En pantallas táctiles sustituye a `alPasar`. */
export type Toque = {
  zona: string;
  /** un gesto o varios a la vez */
  gesto: string | string[];
  /** nombre accesible de la zona (solo cuenta con `accesible`) */
  etiqueta?: string;
  /** botón de verdad: role="button", Tab, Enter y Espacio. Sin esto la zona sigue siendo decorativa. */
  accesible?: boolean;
};

/** Todo lo que el cliente necesita para animar (sin el SVG, que lo pinta el servidor). */
export type MetaDibujo = {
  nombre: string;
  titulo: string;
  vb: string;
  ancho: number;
  alto: number;
  /** pasos de la entrada: grupos (data-g) que se trazan juntos; «!gesto» corre un gesto en ese paso */
  orden: (string | string[])[];
  /** pivote de cada ancla animable (coordenadas del viewBox) */
  anclas: Record<string, [number, number]>;
  gestos: Record<string, Gesto>;
  /** gestos al terminar de dibujarse, en orden */
  alEntrar: string[];
  /** gesto al pasar el cursor por una zona (data-zona) */
  alPasar: { zona: string; gesto: string }[];
  /** gestos al tocar o hacer clic en una zona */
  alTocar?: Toque[];
  /** gesto que sigue al cursor (los ojos) */
  sigue?: string;
  /** la lámpara como botón: caja en % del lienzo */
  lampara?: { x: number; y: number; w: number; h: number };
  /** dónde van piezas sueltas encima del lienzo (objetos de la repisa…), en % */
  huecos?: Record<string, { x: number; y: number; w: number; h: number }>;
};

export type DatosDibujo = MetaDibujo & { svg: string; tipo?: string };
