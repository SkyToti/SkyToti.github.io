// Escenario 2 · CRM dental (MUNDO.md, fila 1–3, segunda pantalla del tramo de YaContesto). Escritorio: el tablero a
// 62vw saliéndose por la derecha, inclinado 3°; encima, la misma pantalla en un celular; detrás, la agenda asomando por
// arriba; la muela-mapa tapa la esquina inferior izquierda del tablero. A la izquierda el texto, con el botón GRANDE
// «Abrir la demo interactiva» además de «Ver el caso», y el «02» gigante abajo. La orilla izquierda queda libre.
// En < 1024 px: apilado dentro del relleno (texto, tablero, muela-mapa).
import MuelaMapa from "@/components/mundo/inventos/MuelaMapa";
import { rutaCaso } from "@/lib/idioma";
import { TEXTOS } from "@/lib/textos";
import Escenario, { Numero, Texto } from "../Escenario";
import { TEXTOS_INICIO } from "../textos";
import Vista from "../Vista";
import type { PropsEscenario } from "./Lamina";
import css from "./CrmDental.module.css";

export default function CrmDental({ caso, numero, idioma }: PropsEscenario) {
  const t = TEXTOS[idioma];
  const tx = TEXTOS_INICIO[idioma];
  const href = rutaCaso(idioma, caso.slug);
  const de = (fin: string) => caso.medios.find((m) => m.src.endsWith(fin));
  const tablero = de("tablero-1280.webp") ?? caso.medios[0];
  const celular = de("tablero-390.webp");
  const agenda = de("4-agenda-hoy-1280.webp");
  return (
    <Escenario nombre={`caso-${caso.slug}`} lado="der" etiqueta={caso.titulo} className={css.escena}>
      <Numero n={numero} className={css.numero} />
      <Texto ancho="30rem" className={css.texto}>
        <h3 className={css.titulo}>{caso.titulo}</h3>
        <p className={css.resumen}>{caso.resumen}</p>
        <p className={css.pildoras}>
          <span className="rotulo-chico rounded-full border border-linea-viva px-3 py-1 text-hueso">{t.tipos[caso.tipo]}</span>
          {caso.demo && <span className="rotulo-chico rounded-full border border-ambar px-3 py-1 text-ambar">{t.demoInteractiva}</span>}
          <span className="rotulo-chico text-hueso-apagado">{caso.anio}</span>
        </p>
        <p className={css.botones}>
          {caso.demo && (
            <a href={caso.demo} className={`boton boton-principal ${css.demo}`}>
              {t.abrirDemo}
              <span aria-hidden="true">→</span>
            </a>
          )}
          <a href={href} className={`boton ${caso.demo ? "" : "boton-principal"}`}>
            {tx.verElCaso}
            <span className="sr-only">: {caso.titulo}</span>
            <span aria-hidden="true">→</span>
          </a>
        </p>
      </Texto>
      {agenda && agenda !== tablero && (
        <div className={css.agenda} data-paralaje="0.6">
          <Vista medio={agenda} ancho="36vw" inclina={-2} href={href} idioma={idioma} />
        </div>
      )}
      {tablero && (
        <div className={css.tablero}>
          <Vista medio={tablero} ancho="62vw" inclina={3} href={href} idioma={idioma} />
        </div>
      )}
      {celular && (
        <div className={css.celular}>
          <Vista medio={celular} ancho="calc((50svh - 33px) * 0.4621 + 19px)" inclina={-3} marco="telefono" href={href} idioma={idioma} />
        </div>
      )}
      <div className={css.muela}>
        <MuelaMapa idioma={idioma} />
      </div>
    </Escenario>
  );
}
