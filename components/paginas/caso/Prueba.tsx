// 4 · «La prueba» (estación `caso-prueba`): las cifras del caso GIGANTES en una banda de orilla a orilla (con su línea de
// cota y su contador: Animar.tsx cuenta `data-contar`), y debajo el párrafo del Markdown, grande. El tamaño de la
// cifra se calcula para que la más larga quepa en su columna (2 cifras: enormes; 4: un poco menos).
import type { CSSProperties } from "react";
import Escenario from "@/components/paginas/inicio/Escenario";
import type { Seccion } from "@/lib/contenido";
import css from "./Prueba.module.css";

type Vars = CSSProperties & Record<`--${string}`, string | number | undefined>;
type Cifra = { valor: string; etiqueta: string };

export default function Prueba({ seccion, cifras, titulo }: { seccion?: Seccion; cifras: Cifra[]; titulo: string }) {
  const n = Math.max(1, cifras.length);
  const largo = Math.max(3, ...cifras.map((c) => c.valor.length));
  // ancho de la columna (en vw) / (caracteres × 0.62 em del mono): que la cifra más larga quepa
  const tamano = Math.min(15, (88 / n - 2) / (largo * 0.62));
  const tamanoChico = Math.min(26, (86 / Math.min(n, 2) - 3) / (largo * 0.62));
  return (
    <Escenario
      nombre="caso-prueba"
      lado="centro"
      alto="natural"
      etiqueta={seccion?.titulo ?? titulo}
      className={css.prueba}
    >
      <h2 id="la-prueba" data-lineas className={css.titulo}>
        {seccion?.titulo ?? titulo}
      </h2>
      {cifras.length > 0 && (
        <ul
          className={css.banda}
          style={
            {
              "--n": n,
              "--tamano": `${tamano.toFixed(2)}vw`,
              "--tamano-chico": `${tamanoChico.toFixed(2)}vw`,
            } as Vars
          }
        >
          {cifras.map((c) => (
            <li key={c.etiqueta} data-revelar className={css.cifra}>
              <span aria-hidden="true" className={css.cota}>
                <span />
              </span>
              <span className={css.valor}>
                <span aria-hidden="true" data-contar={c.valor}>
                  {c.valor}
                </span>
                <span className="sr-only">{c.valor}</span>
              </span>
              <span className={css.etiqueta}>{c.etiqueta}</span>
            </li>
          ))}
        </ul>
      )}
      {seccion && <div className={`prosa ${css.prosa}`} dangerouslySetInnerHTML={{ __html: seccion.html }} />}
    </Escenario>
  );
}
