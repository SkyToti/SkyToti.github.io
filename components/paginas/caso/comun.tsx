// Piezas y cálculos que comparten las secciones de la página de caso a todo lo ancho (Caso.tsx las ensambla).
// Server Component: todo llega en el HTML.
import type { CSSProperties } from "react";
import Vista from "@/components/paginas/inicio/Vista";
import type { Caso, Medio } from "@/lib/contenido";
import type { Idioma } from "@/lib/idioma";
import css from "./comun.module.css";
import { VistaSinPrisa } from "./vivos";

type Vars = CSSProperties & Record<`--${string}`, string | number | undefined>;

export const esVertical = (m: Medio) => m.alto > m.ancho;
/** casi cuadrado (el video de Aurelion): se mide por el alto, como un vertical */
export const esCuadrado = (m: Medio) => !esVertical(m) && m.alto / m.ancho > 0.85;

/** «4-agenda-hoy-1280.webp» → «4-agenda-hoy»: la misma pantalla en otro tamaño */
const tallo = (src: string) => src.replace(/\.[a-z0-9]+$/i, "").replace(/-\d{3,4}$/, "");

export type Forma = "sin" | "horizontal" | "vertical" | "cuadrado";

/** Cómo se compone la prueba principal y qué queda para «Se ve así». */
export function repartir(caso: Caso): {
  forma: Forma;
  principal?: Medio;
  acompana?: Medio;
  resto: Medio[];
} {
  const [principal, ...demas] = caso.medios;
  if (!principal) return { forma: "sin", resto: [] };
  const forma: Forma = esVertical(principal) ? "vertical" : esCuadrado(principal) ? "cuadrado" : "horizontal";
  const verticales = demas.filter(esVertical);
  // al lado de lo vertical (o cuadrado), el siguiente vertical asomando detrás; sobre lo horizontal, la misma pantalla en
  // el celular si existe (o la primera captura de celular), tapando una esquina
  const acompana =
    forma === "horizontal"
      ? (verticales.find((m) => m.tipo === "imagen" && tallo(m.src) === tallo(principal.src)) ??
        verticales.find((m) => m.tipo === "imagen"))
      : verticales[0];
  return {
    forma,
    principal,
    acompana,
    resto: demas.filter((m) => m !== acompana),
  };
}

/** Ancho de un marco de teléfono que mide `alto` (CSS) de alto: bisel de 22 + 8 px y bordes de 1.5 px (vista.module.css). */
export const anchoTelefono = (m: Medio, alto: string) =>
  `calc((${alto} - 33px) * ${(m.ancho / m.alto).toFixed(4)} + 19px)`;

/** Un medio con su pie visible (el `alt`). El pie se oculta al lector de pantalla: ya lo dice la imagen o el video. */
export function FiguraMedio({
  medio,
  idioma,
  ancho,
  inclina,
  telefono,
  paralaje,
  className,
  style,
}: {
  medio: Medio;
  idioma: Idioma;
  /** ancho en escritorio (CSS). En < 1024 px, el de su caja. */
  ancho: string;
  inclina?: number;
  telefono?: boolean;
  /** se desliza a otra velocidad con el scroll (vivos.tsx, <Paralaje>) */
  paralaje?: number;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      data-paralaje={paralaje}
      className={`${css.figura} ${telefono ? css.telefono : ""} ${className ?? ""}`}
      style={{ ...style, "--ancho-figura": ancho } as Vars}
    >
      {medio.tipo === "video" ? (
        <VistaSinPrisa
          medio={medio}
          ancho="100%"
          inclina={inclina}
          marco={telefono ? "telefono" : "pantalla"}
          idioma={idioma}
          clasePoster={css.poster}
        />
      ) : (
        <Vista
          medio={medio}
          ancho="100%"
          inclina={inclina}
          marco={telefono ? "telefono" : "pantalla"}
          idioma={idioma}
        />
      )}
      <p aria-hidden="true" className={css.pie}>
        {medio.alt}
      </p>
    </div>
  );
}
