// La página 404 (servidor): título, la línea de Haku, dos botones y el dibujo grande de Haku con la taza.
// Bilingüe en el mismo HTML: el español se ve por omisión y el inglés con html.en (lo pone el guion del <head> de
// app/global-not-found.tsx si la ruta empieza en /en/). Sin JavaScript: español, con el enlace en inglés debajo.
import Dibujo from "@/components/dibujo/Dibujo";
import { DIBUJOS } from "@/components/dibujo/datos";
import { CAIDAS } from "./NoEncontradaCaidas";
import NoEncontradaEscena from "./NoEncontradaEscena";
import css from "./NoEncontrada.module.css";

/** La taza ya en el suelo, quieta, cuando no hay movimiento (sin JavaScript o con prefers-reduced-motion). */
function tazaEnElSuelo(anclas: Record<string, [number, number]>): string {
  const [x0, y0] = anclas.taza!;
  const [x1, y1] = anclas.tazaSuelo!;
  return `html:not(.mueve) [data-dibujo="no-encontrada"] [data-anim="taza"]{transform-box:view-box;transform-origin:0 0;transform:translate(${x1}px,${y1}px) rotate(${CAIDAS.taza.giro}deg) translate(${-x0}px,${-y0}px)}`;
}

export default function NoEncontrada() {
  const anclas = DIBUJOS["no-encontrada"].anclas;
  return (
    <main className={css.pagina} id="contenido">
      <style>{tazaEnElSuelo(anclas)}</style>
      <div className={css.texto}>
        <p className={css.rotulo}>
          404 · <span data-l="es">página perdida</span>
          <span data-l="en">page lost</span>
        </p>
        <h1 className={css.titulo}>
          <span data-l="es">Esta página no existe</span>
          <span data-l="en" lang="en">
            This page doesn&apos;t exist
          </span>
        </h1>
        <p className={css.haku}>
          <span data-l="es">«Yo no fui. Bueno, la taza sí.»</span>
          <span data-l="en" lang="en">
            “It wasn&apos;t me. Well, the cup was.”
          </span>
          <span className={css.firma}>— Haku</span>
        </p>
        <div className={css.botones}>
          <a className={`${css.boton} ${css.principal}`} data-l="es" href="/">
            Ir al inicio
          </a>
          <a className={css.boton} data-l="es" href="/#trabajo">
            Ver el trabajo
          </a>
          <a className={`${css.boton} ${css.principal}`} data-l="en" lang="en" href="/en/">
            Go to the home page
          </a>
          <a className={css.boton} data-l="en" lang="en" href="/en/#trabajo">
            See the work
          </a>
        </div>
        <p className={css.otro} data-l="es" lang="en">
          In English: <a href="/en/">this page doesn&apos;t exist · go home</a>
        </p>
        <p className={css.otro} data-l="en" lang="es">
          En español: <a href="/">esta página no existe · ir al inicio</a>
        </p>
      </div>
      <div className={css.dibujo}>
        <NoEncontradaEscena anclas={anclas}>
          <Dibujo nombre="no-encontrada" />
        </NoEncontradaEscena>
      </div>
    </main>
  );
}
