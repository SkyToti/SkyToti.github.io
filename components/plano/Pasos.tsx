// Pasos (servidor): la lista numerada de «Cómo funciona» con el texto del Markdown. Cada número es un botón que
// PlanoVivo habilita (sin JavaScript o con menos movimiento quedan deshabilitados y la lista se lee igual).
import type { Idioma } from "@/lib/idioma";
import css from "./plano.module.css";
import { TEXTOS_PLANO } from "./textos";

export default function Pasos({ pasos, idioma }: { pasos: { html: string }[]; idioma: Idioma }) {
  const t = TEXTOS_PLANO[idioma];
  return (
    <ol className={css.pasos}>
      {pasos.map((p, i) => (
        <li key={i} className={css.paso} data-paso={i}>
          <button type="button" className={css.pasoBoton} data-paso-boton={i} disabled aria-label={t.verPaso(i + 1, pasos.length)}>
            {String(i + 1).padStart(2, "0")}
          </button>
          <div className={css.pasoTexto} dangerouslySetInnerHTML={{ __html: p.html }} />
        </li>
      ))}
    </ol>
  );
}
