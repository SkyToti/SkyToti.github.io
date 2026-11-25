// Escenario 3 · yacontesto.com (MUNDO.md, fila 1–3, tercera pantalla del tramo de YaContesto). Escritorio: el
// recorrido en video a 70vw, centrado, como pantalla de cine (marco fino, derecho); el «03» gigante sale por la esquina
// de arriba a la derecha, detrás del video; el folioscopio GRANDE tapa la esquina de abajo a la izquierda del video y se
// sale por la orilla izquierda y por la de abajo; debajo del video, a la derecha del folioscopio, el título y el
// resumen, y al lado las píldoras con «Ver en vivo» y «Ver el caso». En < 1024 px: apilado.
// El folioscopio es decoración «detrás» (`data-linea="detras"`): al soltarse el tramo fijado, el «03» tapa la orilla
// derecha y el folioscopio la izquierda; sin esto la línea no tenía por dónde bajar hacia el escenario del MCP.
import Folioscopio from "@/components/mundo/inventos/Folioscopio";
import { rutaCaso } from "@/lib/idioma";
import { TEXTOS } from "@/lib/textos";
import Escenario, { Numero, Sangra } from "../Escenario";
import { TEXTOS_INICIO } from "../textos";
import Vista from "../Vista";
import type { PropsEscenario } from "./Lamina";
import css from "./YacontestoWeb.module.css";

/** el ancho de la pantalla de cine: 70vw, salvo que con su texto debajo no quepa en el alto de la ventana */
const CINE = "min(70vw, calc((100svh - 330px) * 1.7778))";

export default function YacontestoWeb({ caso, numero, idioma }: PropsEscenario) {
  const t = TEXTOS[idioma];
  const tx = TEXTOS_INICIO[idioma];
  const href = rutaCaso(idioma, caso.slug);
  const recorrido = caso.medios.find((m) => m.tipo === "video") ?? caso.medios[0];
  return (
    <Escenario
      nombre={`caso-${caso.slug}`}
      lado="centro"
      etiqueta={caso.titulo}
      ancla={{ x: "28px", y: "28px" }}
      className={css.escena}
    >
      <Numero n={numero} className={css.numero} />
      <div className={css.pie}>
        <div className={css.texto}>
          <h3 className={css.titulo}>{caso.titulo}</h3>
          <p className={css.resumen}>{caso.resumen}</p>
        </div>
        <div className={css.acciones}>
          <p className={css.pildoras}>
            <span className="rotulo-chico rounded-full border border-linea-viva px-3 py-1 text-hueso">{t.tipos[caso.tipo]}</span>
            <span className="rotulo-chico text-hueso-apagado">{caso.anio}</span>
          </p>
          <p className={css.botones}>
            {caso.enVivo && (
              <a href={caso.enVivo} rel="noopener" className="boton">
                {t.enVivo}
                <span className="sr-only">: {caso.titulo}</span>
                <span aria-hidden="true" className="text-hueso-apagado">
                  ↗
                </span>
              </a>
            )}
            <a href={href} className="boton boton-principal">
              {tx.verElCaso}
              <span className="sr-only">: {caso.titulo}</span>
              <span aria-hidden="true">→</span>
            </a>
          </p>
        </div>
      </div>
      {recorrido && (
        <div className={css.cine}>
          <Vista medio={recorrido} ancho={CINE} href={href} idioma={idioma} />
        </div>
      )}
      <Sangra orilla="abajo-izq" ancho="var(--ancho-folio)" desplaza="var(--sale-folio)" en="-4svh" detras className={css.folioscopio}>
        <Folioscopio idioma={idioma} />
      </Sangra>
    </Escenario>
  );
}
