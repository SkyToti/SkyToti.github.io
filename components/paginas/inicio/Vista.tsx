// <Vista>: la prueba real de un caso en GRANDE (MUNDO.md, «Versión 2», regla 2). Imagen o video con marco fino y
// esquinas de 10 px; ancho en escritorio por `ancho` (56vw por omisión), 100 % de su caja en < 1024 px; inclinación
// opcional que se endereza con resorte al pasar el cursor o al enfocar. Reserva exacta (width/height + aspect-ratio:
// CLS 0) y `data-obstaculo` (la línea viva la rodea). Sin JavaScript: la imagen o el póster, y el enlace al caso.
// Los videos (VideoVivo) se cargan al acercarse y se reproducen solos, sin sonido, mientras están a la vista.
// Contrato: components/paginas/inicio/LEEME.md.
import type { CSSProperties } from "react";
import type { Medio } from "@/lib/contenido";
import type { Idioma } from "@/lib/idioma";
import { TEXTOS_INICIO } from "./textos";
import VideoVivo from "./VideoVivo";
import css from "./vista.module.css";

type Vars = CSSProperties & Record<`--${string}`, string | number | undefined>;

export type PropsVista = {
  /** la captura o el video, tal como viene del contenido (`caso.medios[i]`) */
  medio: Medio;
  /** ancho en escritorio (≥ 1024 px), CSS: `58vw`, `40vw`, `100%`… Por omisión 56vw. En < 1024 px, 100 % de su caja. */
  ancho?: string;
  /** grados, de −4 a 4 (en < 1024 px, máximo 2). Se endereza con resorte al pasar el cursor o al enfocar. */
  inclina?: number;
  marco?: "pantalla" | "telefono" | "ninguno";
  /** toda la vista enlaza aquí (la página del caso) */
  href?: string;
  /** la imagen grande de arriba de la página: sin carga perezosa (en el inicio, casi nunca) */
  prioridad?: boolean;
  idioma?: Idioma;
  className?: string;
  style?: CSSProperties;
};

const limita = (v: number, max: number) => Math.max(-max, Math.min(max, v));

/** `sizes` a partir del ancho de escritorio: si va en vw se usa tal cual; si no, se supone toda la ventana. */
function tamanos(ancho: string): string {
  return `(min-width: 1024px) ${/^\d+(\.\d+)?vw$/.test(ancho) ? ancho : "100vw"}, calc(100vw - 40px)`;
}

export default function Vista({
  medio,
  ancho = "56vw",
  inclina = 0,
  marco = "pantalla",
  href,
  prioridad,
  idioma = "es",
  className,
  style,
}: PropsVista) {
  const giro = limita(inclina, 4);
  const vars = {
    ...style,
    "--ancho": ancho,
    "--inclina": `${giro}deg`,
    "--inclina-chica": `${limita(giro, 2)}deg`,
    // en celular, una vista inclinada se encoge un poco para que sus esquinas no pisen el carril de la línea
    "--holgura-giro": giro ? "16px" : "0px",
    "--proporcion": `${medio.ancho} / ${medio.alto}`,
  } as Vars;

  const lamina =
    medio.tipo === "video" ? (
      <VideoVivo medio={medio} textos={TEXTOS_INICIO[idioma]} prioridad={prioridad} className={css.medio} />
    ) : (
      // eslint-disable-next-line @next/next/no-img-element -- sitio estático (output: export): <img> propio con width/height
      <img
        className={css.medio}
        src={medio.src}
        width={medio.ancho}
        height={medio.alto}
        alt={medio.alt}
        sizes={tamanos(ancho)}
        loading={prioridad ? "eager" : "lazy"}
        fetchPriority={prioridad ? "high" : undefined}
        decoding="async"
      />
    );

  return (
    <figure data-vista="" data-obstaculo="" data-marco={marco} className={`${css.vista} ${className ?? ""}`} style={vars}>
      {href && medio.tipo === "imagen" ? (
        <a href={href} className={css.lamina}>
          {lamina}
        </a>
      ) : (
        <div className={css.lamina}>
          {lamina}
          {/* Video: el enlace cubre la lámina (el video y su botón quedan encima cuando se usan). */}
          {href && (
            <a href={href} className={css.cubre}>
              <span className="sr-only">{medio.alt}</span>
            </a>
          )}
        </div>
      )}
    </figure>
  );
}
