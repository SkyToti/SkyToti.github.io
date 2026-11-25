// 3 · «Cómo funciona» (estación `caso-como`): el diagrama del caso (`Escena` en modo completo) a todo el ancho útil y
// sus pasos en letra grande. Con pantalla ancha (≥ 1400 px) los pasos van a la derecha del diagrama; si no, debajo, en
// columnas. En los casos sin capturas esta sección ES la prueba principal (`estrella`): el diagrama a ~76vw, «Qué es» y
// «Para quién» arriba en dos columnas grandes, y los pasos debajo.
import { Escena } from "@/components/Escena";
import { componer } from "@/components/plano/geometria";
import { ESCENAS, existeEscena } from "@/escenas";
import Escenario from "@/components/paginas/inicio/Escenario";
import { pasosDe, type Seccion } from "@/lib/contenido";
import type { Idioma } from "@/lib/idioma";
import css from "./Como.module.css";

export default function Como({
  seccion,
  escena,
  resumen,
  idioma,
  estrella,
  intro,
}: {
  seccion: Seccion;
  escena: string;
  resumen: string;
  idioma: Idioma;
  /** sin capturas: el diagrama es la prueba principal */
  estrella?: boolean;
  /** «Qué es» y «Para quién» (solo con `estrella`) */
  intro?: Seccion[];
}) {
  // un diagrama bajo y largo (una sola hilera) no deja columna útil al lado: sus pasos van debajo, en columnas
  const [, , W, H] = existeEscena(escena) ? componer(ESCENAS[escena]!, "ancho", idioma).viewBox : [0, 0, 1, 1];
  const bajo = W / H > 4;
  return (
    <Escenario
      nombre="caso-como"
      lado="izq"
      alto="natural"
      etiqueta={seccion.titulo}
      ancla={{ x: "calc(100% - 28px)", y: "28px" }}
      className={`${css.como} ${estrella ? css.estrella : ""} ${bajo ? css.bajo : ""}`}
    >
      <div className={css.cabeza}>
        <h2 id="como-funciona" data-lineas className={css.titulo}>
          {seccion.titulo}
        </h2>
        {intro && intro.length > 0 && (
          <div className={css.intro}>
            {intro.map((s) => (
              <div key={s.id}>
                <h3 className={css.rotulo}>{s.titulo}</h3>
                <div className={`prosa ${css.prosa}`} dangerouslySetInnerHTML={{ __html: s.html }} />
              </div>
            ))}
          </div>
        )}
      </div>
      <div className={css.diagrama}>
        <Escena nombre={escena} idioma={idioma} modo="completo" resumen={resumen} pasos={pasosDe(seccion.html)} />
      </div>
    </Escenario>
  );
}
