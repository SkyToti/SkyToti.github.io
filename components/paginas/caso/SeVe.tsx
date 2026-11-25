// 5 · «Se ve así» (estación `caso-se-ve`): TODOS los medios que no salieron arriba, grandes y compuestos, cada uno con
// su pie visible (el `alt`):
//   · lo horizontal: 3 o más → una tira que pasa de lado con el scroll, todas al mismo alto (≥ 44vw de ancho cada una);
//     2 → escalonadas de orilla a orilla (50vw y 46vw); 1 → una sola a 70vw, corrida a la derecha.
//   · lo vertical (capturas de celular y videos verticales): en marcos de teléfono; al final de la tira si la hay, si no
//     en hilera, a 72svh.
// Celular: apilado; la tira es un carrusel con el dedo.
import type { CSSProperties } from "react";
import Escenario from "@/components/paginas/inicio/Escenario";
import TiraDeLado from "@/components/paginas/inicio/TiraDeLado";
import type { Medio } from "@/lib/contenido";
import type { Idioma } from "@/lib/idioma";
import { anchoTelefono, esVertical, FiguraMedio } from "./comun";
import css from "./SeVe.module.css";
import { TEXTOS_CASO } from "./textos";

type Vars = CSSProperties & Record<`--${string}`, string | number | undefined>;

/** alto común de las piezas de la tira en escritorio */
const ALTO_TIRA = "min(38vw, 64svh)";

export default function SeVe({ medios, titulo, idioma }: { medios: Medio[]; titulo: string; idioma: Idioma }) {
  const tc = TEXTOS_CASO[idioma];
  const horizontales = medios.filter((m) => !esVertical(m));
  const verticales = medios.filter(esVertical);
  return (
    <Escenario nombre="caso-se-ve" lado="centro" alto="natural" etiqueta={titulo} className={css.seVe}>
      <h2 id="se-ve-asi" data-lineas className={css.titulo}>
        {titulo}
      </h2>

      {horizontales.length >= 3 && (
        <TiraDeLado etiqueta={tc.capturas} cuadro="auto" className={css.tira}>
          {horizontales.map((m) => (
            <FiguraMedio
              key={m.src}
              medio={m}
              idioma={idioma}
              ancho={`calc(${ALTO_TIRA} * ${(m.ancho / m.alto).toFixed(4)})`}
            />
          ))}
          {/* las capturas de celular cierran la tira, en su marco de teléfono y al mismo alto */}
          {verticales.map((m) => (
            <FiguraMedio key={m.src} medio={m} idioma={idioma} telefono ancho={anchoTelefono(m, ALTO_TIRA)} />
          ))}
        </TiraDeLado>
      )}
      {horizontales.length === 2 && (
        <div className={css.par}>
          <FiguraMedio medio={horizontales[0]!} idioma={idioma} ancho="50vw" inclina={-1.5} className={css.uno} />
          <FiguraMedio medio={horizontales[1]!} idioma={idioma} ancho="46vw" inclina={2} className={css.dos} />
        </div>
      )}
      {horizontales.length === 1 && (
        <div className={css.sola}>
          <FiguraMedio medio={horizontales[0]!} idioma={idioma} ancho="70vw" inclina={1.5} />
        </div>
      )}

      {verticales.length > 0 && horizontales.length < 3 && (
        <div className={css.telefonos} aria-label={tc.enCelular} role="group">
          {verticales.map((m, i) => (
            <FiguraMedio
              key={m.src}
              medio={m}
              idioma={idioma}
              telefono
              ancho={anchoTelefono(m, "72svh")}
              inclina={i % 2 ? 2 : -2}
              style={{ "--ancho-tel-chico": anchoTelefono(m, "70svh") } as Vars}
            />
          ))}
        </div>
      )}
    </Escenario>
  );
}
