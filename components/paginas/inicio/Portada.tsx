// 1 · Portada a todo lo ancho (MUNDO.md, «Versión 2», fila P). El nombre enorme arriba a la izquierda; debajo el titular,
// la frase y los botones; a la derecha la ventana con luna; y el escritorio de noche ocupa toda la base de la ventana,
// de orilla a orilla. En escritorio (≥ 1024) son tres dibujos del kit colocados a 16 u = 1vw (dibujo/piezas/escritorio.mjs):
// la mesa sale por la izquierda, la cajonera (lámpara y Haku) por la derecha, y entre las dos queda un hueco de 5vw.
// La línea viva sale del subrayado del nombre (que corre hasta ese hueco) y baja «por la orilla de la mesa».
// En celular y tableta, la composición vertical del escritorio debajo del texto, dentro del relleno (la ancha y la
// h no van: así el HTML no carga tres escritorios).
// Server Component: nombre, titular, frase y botones van en el HTML y funcionan sin JavaScript.
import { Fragment, type CSSProperties } from "react";
import Dibujo from "@/components/dibujo/Dibujo";
import type { Idioma } from "@/lib/idioma";
import { CV, TEXTOS } from "@/lib/textos";
import css from "./Portada.module.css";

type Props = {
  idioma: Idioma;
  nombre: string;
  ciudad?: string;
  titular?: string;
  /** HTML de la sección «En una línea» del perfil, si la hay. */
  enUnaLinea?: string;
  correo?: string;
};

export default function Portada({ idioma, nombre, ciudad, titular, enUnaLinea, correo }: Props) {
  const t = TEXTOS[idioma];
  return (
    <section data-estacion="portada" data-lado="centro" aria-labelledby="nombre" className={css.portada}>
      <div className={css.cabeza}>
        {ciudad && <p className="rotulo">{ciudad}</p>}
        {/* La entrada por renglones (máscara que sube, como `data-lineas`) es CSS puro: el nombre es lo más grande de
            la pantalla (LCP) y se pinta desde el primer cuadro, sin esperar a GSAP ni a las fuentes. `width:
            min-content` deja una palabra por renglón, así que cada palabra es un renglón. */}
        <h1 id="nombre" data-entrada="" className={css.nombre}>
          {nombre.split(" ").map((palabra, i) => (
            <Fragment key={i}>
              {i > 0 && " "}
              <span className={css.renglon} style={{ "--i": i } as CSSProperties}>
                <span>{palabra}</span>
              </span>
            </Fragment>
          ))}
        </h1>
        {/* El subrayado del nombre: de aquí sale la línea viva. En escritorio corre hasta el hueco junto a la mesa. */}
        <div aria-hidden="true" className={`subrayado ${css.subrayado}`}>
          <span data-linea-inicio="" />
          <span data-ancla="" className="ancla-subrayado" />
        </div>
      </div>

      <div className={css.texto}>
        {titular && <p className={css.titular}>{titular}</p>}
        {enUnaLinea !== undefined && <div className={`prosa ${css.frase}`} dangerouslySetInnerHTML={{ __html: enUnaLinea }} />}
        <p className={css.botones}>
          <a href="#trabajo" className="boton boton-principal">
            {t.verTrabajo}
          </a>
          {/* Sin aria-label: el nombre sale del texto visible más la explicación para lector de pantalla. */}
          <a href={CV[idioma]} download className="boton">
            {t.cv}
            <span aria-hidden="true" className="font-mono text-sm text-hueso-apagado">
              PDF
            </span>
            <span className="sr-only">: {t.cvEtiqueta}</span>
          </a>
          {correo && (
            <a href={`mailto:${correo}`} className="boton">
              {t.correo}
            </a>
          )}
        </p>
      </div>

      {/* La ventana con luna (solo escritorio): arriba a la derecha, a la derecha del hueco de la línea. */}
      <div className={css.ventana} data-portada-escena="ventana">
        <Dibujo nombre="escritorio-ventana" vivo controles retraso={0.4} />
      </div>

      <div className={css.escena} data-haku="propio" data-haku-modo="portada">
        {/* Por aquí sale la línea viva: en escritorio, la orilla de la mesa (el hueco entre mesa y cajonera). */}
        <span data-ancla="" aria-hidden="true" className={css.anclaMesa} />
        <div className={css.mesa} data-portada-escena="mesa">
          <Dibujo nombre="escritorio-mesa" vivo controles />
        </div>
        <div className={css.cajonera} data-portada-escena="cajonera">
          <Dibujo nombre="escritorio-cajonera" vivo controles retraso={0.9} />
        </div>
        <div className={css.chico}>
          <Dibujo nombre="escritorio-v" vivo controles />
        </div>
      </div>
    </section>
  );
}
