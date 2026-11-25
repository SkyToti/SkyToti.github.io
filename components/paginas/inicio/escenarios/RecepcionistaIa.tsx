// Escenario 1 · Recepcionista con IA (MUNDO.md, fila 1–3, primera pantalla del tramo de YaContesto). Escritorio: la
// conversación real en un teléfono de 78svh inclinado −4° al centro-derecha, con el anuncio más chico detrás
// asomando; el «01» gigante detrás del título; el conmutador grande abajo a la izquierda saliéndose por la orilla de
// abajo; una luna arriba que despierta con la llegada y se aparta del cursor. El texto arriba a la izquierda.
// Las orillas izquierda y derecha (≥ 52 px) quedan libres: por ahí rodea la línea viva el tramo fijado.
// En < 1024 px: apilado dentro del relleno (texto, teléfono, conmutador).
import Conmutador from "@/components/mundo/inventos/Conmutador";
import { rutaCaso } from "@/lib/idioma";
import { TEXTOS } from "@/lib/textos";
import Escenario, { Numero, Sangra, Texto } from "../Escenario";
import { TEXTOS_INICIO } from "../textos";
import Vista from "../Vista";
import type { PropsEscenario } from "./Lamina";
import css from "./RecepcionistaIa.module.css";

/** ancho de una <Vista marco="telefono"> que mide `alto` de alto (bisel: 22 + 8 px de alto, 8 + 8 de ancho, borde 1.5) */
const telefono = (alto: string, ancho: number, altoMedio: number) => `calc((${alto} - 33px) * ${(ancho / altoMedio).toFixed(4)} + 19px)`;

export default function RecepcionistaIa({ caso, numero, idioma }: PropsEscenario) {
  const t = TEXTOS[idioma];
  const tx = TEXTOS_INICIO[idioma];
  const href = rutaCaso(idioma, caso.slug);
  const conversacion = caso.medios.find((m) => m.src.endsWith("conversacion.mp4")) ?? caso.medios[0];
  const anuncio = caso.medios.find((m) => m !== conversacion && m.tipo === "video");
  return (
    <Escenario nombre={`caso-${caso.slug}`} lado="der" etiqueta={caso.titulo} className={css.escena}>
      <Numero n={numero} className={css.numero} />
      {/* La luna (decoración): se dibuja al llegar y se aparta del cursor (data-paralaje, TramoYaContesto). */}
      <svg className={css.luna} data-paralaje="1.6" viewBox="0 0 120 120" aria-hidden="true" focusable="false">
        <circle className={css.halo} cx="60" cy="60" r="50" pathLength="1" />
        <path className={css.creciente} d="M 66 22 C 36 22 22 46 26 68 C 30 92 56 104 80 96 C 58 92 46 74 48 56 C 50 40 58 28 66 22 Z" />
        <path className={css.estrella} d="M 104 18 L 106 26 L 114 28 L 106 30 L 104 38 L 102 30 L 94 28 L 102 26 Z" />
        <path className={css.estrella} d="M 14 96 L 15.5 101 L 20 102 L 15.5 103.5 L 14 108 L 12.5 103.5 L 8 102 L 12.5 101 Z" />
      </svg>
      <Texto ancho="32rem" className={css.texto}>
        <h3 className={css.titulo}>{caso.titulo}</h3>
        <p className={css.resumen}>{caso.resumen}</p>
        <p className={css.pildoras}>
          <span className="rotulo-chico rounded-full border border-linea-viva px-3 py-1 text-hueso">{t.tipos[caso.tipo]}</span>
          <span className="rotulo-chico text-hueso-apagado">{caso.anio}</span>
        </p>
        <a href={href} className={`boton boton-principal ${css.boton}`}>
          {tx.verElCaso}
          <span className="sr-only">: {caso.titulo}</span>
          <span aria-hidden="true">→</span>
        </a>
      </Texto>
      {anuncio && (
        <div className={css.anuncio}>
          <Vista medio={anuncio} ancho={telefono("54svh", anuncio.ancho, anuncio.alto)} inclina={4} marco="telefono" href={href} idioma={idioma} />
        </div>
      )}
      {conversacion && (
        <div className={css.telefono}>
          <Vista
            medio={conversacion}
            ancho={telefono("78svh", conversacion.ancho, conversacion.alto)}
            inclina={-4}
            marco="telefono"
            href={href}
            idioma={idioma}
          />
        </div>
      )}
      <Sangra orilla="abajo" ancho="48vw" desplaza="4svh" en="max(56px, 4vw)" className={css.conmutador}>
        <Conmutador idioma={idioma} />
      </Sangra>
    </Escenario>
  );
}
