// 3 · Trabajo (MUNDO.md, «Versión 2»): el encabezado a todo lo ancho («Trabajo» gigante) y los escenarios, cada uno de
// orilla a orilla: primero el tramo horizontal de YaContesto (casos 1–3, escenarios/TramoYaContesto.tsx) y luego los
// demás, uno por pantalla (escenarios/index.ts; los que aún usan la lámina común se meten solos en su `.marco`).
// ENTRE escenarios pasa el tráfico (components/mundo/trafico): el carrito con el número del que viene, el avión antes de
// Tierra de Viajes, las nubes antes de La Elegía y, después del último, la viga y la moneda. Cada banda va de orilla a
// orilla y es un dibujo «detrás» (`data-linea="detras"`): la línea viva la cruza por detrás, de preferencia por sus
// orillas (un `data-pasillo` a cada lado). Contrato: inicio/LEEME.md.
import type { ReactNode } from "react";
import Cruce, { type TipoCruce } from "@/components/mundo/trafico/Cruce";
import type { Caso } from "@/lib/contenido";
import type { Idioma } from "@/lib/idioma";
import { TEXTOS } from "@/lib/textos";
import { CRUCE_ANTES, TRAMO_YACONTESTO, escenarioDe } from "./escenarios";
import TramoYaContesto from "./escenarios/TramoYaContesto";
import css from "./Trabajo.module.css";

/** una banda del tráfico con sus dos orillas libres para la línea viva */
function Paso({ tipo, numero }: { tipo: TipoCruce; numero?: string }) {
  return (
    <div className={css.paso} data-linea="detras">
      <span data-pasillo="" aria-hidden="true" className={`${css.pasillo} ${css.izq}`} />
      <span data-pasillo="" aria-hidden="true" className={`${css.pasillo} ${css.der}`} />
      <Cruce tipo={tipo} numero={numero} className={css.banda} />
    </div>
  );
}

export default function Trabajo({ idioma, casos }: { idioma: Idioma; casos: Caso[] }) {
  const t = TEXTOS[idioma];
  const nn = (i: number) => String(i + 1).padStart(2, "0");
  const lang = (c: Caso) => (c.sinTraducir ? "es-MX" : undefined);
  const delTramo = casos.filter((c) => TRAMO_YACONTESTO.includes(c.slug));
  const hayTramo = delTramo.length > 1;

  const filas: ReactNode[] = [];
  casos.forEach((caso, i) => {
    const enTramo = hayTramo && TRAMO_YACONTESTO.includes(caso.slug);
    if (enTramo) {
      if (caso !== delTramo[0]) return;
      filas.push(
        <li key="tramo-yacontesto">
          <TramoYaContesto
            idioma={idioma}
            pantallas={delTramo.map((c) => {
              const Escenario = escenarioDe(c.slug);
              return { clave: c.slug, titulo: c.titulo, lang: lang(c), nodo: <Escenario caso={c} numero={casos.indexOf(c) + 1} idioma={idioma} /> };
            })}
          />
        </li>,
      );
      return;
    }
    const Escenario = escenarioDe(caso.slug);
    const ultimo = i === casos.length - 1;
    filas.push(
      <li key={caso.slug} lang={lang(caso)}>
        {i > 0 && <Paso tipo={CRUCE_ANTES[caso.slug] ?? "carrito"} numero={nn(i)} />}
        <Escenario caso={caso} numero={i + 1} idioma={idioma} />
        {ultimo && (
          <>
            <Paso tipo="viga" />
            <Paso tipo="moneda" />
          </>
        )}
      </li>,
    );
  });

  return (
    <section aria-labelledby="trabajo" className={css.trabajo}>
      <div className={css.cabeza}>
        <h2 id="trabajo" data-lineas className={`t-seccion ${css.titulo}`}>
          {t.trabajo}
        </h2>
      </div>
      <ol className={css.lista}>{filas}</ol>
    </section>
  );
}
