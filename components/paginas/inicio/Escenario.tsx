// Las piezas comunes de los escenarios a todo lo ancho del inicio (MUNDO.md, «Versión 2»). Server Components: todo
// llega en el HTML; el contrato completo está en components/paginas/inicio/LEEME.md.
//   <Escenario>  la sección de orilla a orilla, con el ancla de la línea viva y `data-lado` para Haku.
//   <Texto>      el bloque de texto: ancho de lectura (≤ 34rem) y el relleno lateral de la página.
//   <Sangra>     una capa que se sale por una orilla (dibujo o vista); en celular vuelve al flujo, sin salirse.
//   <Numero>     el número gigante en mono, detrás de todo.
import type { CSSProperties, ReactNode } from "react";
import css from "./escenario.module.css";

export type Lado = "izq" | "der" | "centro";
type Vars = CSSProperties & Record<`--${string}`, string | number | undefined>;

export type PropsEscenario = {
  /** nombre de la estación (`data-estacion`): `caso-<slug>`, `portada`, `cifras`… También es la clave de las frases de Haku. */
  nombre: string;
  /** dónde queda la prueba principal (`data-lado`): Haku se sienta del otro lado y la mira */
  lado: Lado;
  id?: string;
  /** `pantalla` (por omisión): ≥ 100svh en escritorio · `largo`: ≥ 180svh · `natural`: lo que mida. En < 1024 px, siempre natural. */
  alto?: "pantalla" | "natural" | "largo";
  /** nombre accesible de la sección (aria-label) */
  etiqueta: string;
  /** dónde pasa la línea viva en escritorio, en largos CSS relativos a la sección (`"4%"`, `"calc(100% - 28px)"`).
   *  Por omisión, arriba a 28 px de la orilla contraria a la prueba. En < 1024 px va siempre a 12 px de la izquierda. */
  ancla?: { x: string; y: string };
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
};

export default function Escenario({ nombre, lado, id, alto = "pantalla", etiqueta, ancla, className, style, children }: PropsEscenario) {
  const a = ancla ?? { x: lado === "izq" ? "calc(100% - 28px)" : "28px", y: "28px" };
  return (
    <section
      id={id}
      data-estacion={nombre}
      data-lado={lado}
      aria-label={etiqueta}
      className={`${css.escenario} ${css[alto]} ${className ?? ""}`}
      style={style}
    >
      <span data-ancla="" aria-hidden="true" className={css.ancla} style={{ "--ancla-x": a.x, "--ancla-y": a.y } as Vars} />
      {children}
    </section>
  );
}

/** El bloque de texto del escenario: ancho de lectura ≤ 34rem (`ancho` lo puede bajar) y el relleno lateral
 *  `clamp(20px, 4vw, 72px)` a los dos lados. `lado="der"` lo empuja a la orilla derecha. Va encima del número. */
export function Texto({
  children,
  ancho,
  lado = "izq",
  className,
  style,
}: {
  children: ReactNode;
  ancho?: string;
  lado?: "izq" | "der";
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div className={`${css.texto} ${lado === "der" ? css.textoDer : ""} ${className ?? ""}`} style={{ ...style, "--lectura": ancho } as Vars}>
      {children}
    </div>
  );
}

export type Orilla = "izq" | "der" | "arriba" | "abajo" | "arriba-izq" | "arriba-der" | "abajo-izq" | "abajo-der";

/** Una capa que se sale por una `orilla` del escenario (la sección la recorta: no hay barra horizontal).
 *  `ancho`/`alto`: largos CSS de la capa (alto opcional: si falta, lo da el contenido). `desplaza`: cuánto se sale
 *  (por omisión 8vw). `en`: posición en el otro eje (p. ej. `top` para izq/der; por omisión, la orilla misma).
 *  `capa` (por omisión) la pone en absoluto; `capa={false}` la deja en el flujo con margen negativo hacia la orilla.
 *  Lleva `data-obstaculo` (la línea viva la rodea) salvo `obstaculo={false}`. En < 1024 px: en el flujo, a todo el
 *  ancho dentro del relleno, sin salirse. */
export function Sangra({
  orilla,
  ancho,
  alto,
  desplaza = "8vw",
  en,
  capa = true,
  obstaculo = true,
  detras,
  className,
  style,
  children,
}: {
  orilla: Orilla;
  ancho: string;
  alto?: string;
  desplaza?: string;
  en?: string;
  capa?: boolean;
  obstaculo?: boolean;
  /** dibujo decorativo: la línea viva puede cruzarlo por detrás (`data-linea="detras"`) */
  detras?: boolean;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  return (
    <div
      data-orilla={orilla}
      data-obstaculo={obstaculo ? "" : undefined}
      data-linea={detras ? "detras" : undefined}
      className={`${css.sangra} ${capa ? css.capa : css.flujo} ${className ?? ""}`}
      style={{ ...style, "--ancho": ancho, "--alto": alto, "--desplaza": desplaza, "--en": en } as Vars}
    >
      {children}
    </div>
  );
}

/** El número gigante del escenario, en mono y en `linea`, DETRÁS de todo (hasta 22vw). Es decoración: `aria-hidden` y
 *  sin nodo de texto (lo pinta `::before`), así no cuenta para el contraste ni para el lector de pantalla. Lleva
 *  `data-obstaculo` (la línea no pasa por encima) salvo `libre`. Por omisión arriba a la izquierda; muévelo con
 *  `className`/`style`. */
export function Numero({
  n,
  libre,
  className,
  style,
}: {
  n: number | string;
  libre?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  const texto = typeof n === "number" ? String(n).padStart(2, "0") : n;
  return (
    <span
      aria-hidden="true"
      data-numero={texto}
      data-obstaculo={libre ? undefined : ""}
      className={`${css.numero} ${className ?? ""}`}
      style={style}
    />
  );
}
