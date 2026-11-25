// Fila T · Cómo trabajo (MUNDO.md, «Los escenarios, uno por uno»): la tira a todo lo ancho. En ≥ 1024 px el tramo se
// fija y avanza de LADO: cada viñeta a ~46vw (el dibujo grande y, debajo, número, paso y frase en HTML), la siguiente
// asomando por la derecha, el título gigante fijo arriba a la izquierda y el indicador 1–4 a la derecha. Cada viñeta
// corre su escena al quedar centrada. En < 1024 px: viñetas apiladas a todo el ancho del relleno.
// La línea viva entra por la orilla izquierda (los 40 px que el tramo fijado deja libres) y sale por la derecha.
import Tira from "@/components/mundo/tira/Tira";
import { pasosDe } from "@/lib/contenido";
import type { Idioma } from "@/lib/idioma";
import { pasoTira } from "./comun";
import Escenario from "./Escenario";
import css from "./ComoTrabajo.module.css";

/** `html` es el de la sección «Cómo trabajo» del perfil: cada <li> es un paso. */
export default function ComoTrabajo({ idioma, titulo, html }: { idioma: Idioma; titulo: string; html: string }) {
  const pasos = pasosDe(html);
  return (
    <Escenario nombre="como-trabajo" lado="centro" etiqueta={titulo} alto="natural" ancla={{ x: "20px", y: "20px" }} className={css.escena}>
      <Tira
        idioma={idioma}
        pasos={pasos.map((p) => pasoTira(p.html))}
        cabeza={
          <h2 id="como-trabajo" className={css.titulo}>
            {titulo}
          </h2>
        }
      />
    </Escenario>
  );
}
