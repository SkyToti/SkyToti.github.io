// 6 · «Mi papel» y «Tecnología» (estación `caso-papel`), a dos columnas de orilla a orilla con letra grande: a la
// izquierda mi papel (y cualquier otra sección del Markdown); a la derecha la tecnología, su párrafo y la lista en mono,
// un renglón por pieza. Celular: apilado.
import Escenario from "@/components/paginas/inicio/Escenario";
import type { Seccion } from "@/lib/contenido";
import css from "./Papel.module.css";

export default function Papel({
  papel,
  otras,
  tecnologia,
  lista,
  tituloTecnologia,
  etiqueta,
}: {
  papel?: Seccion;
  otras: Seccion[];
  tecnologia?: Seccion;
  lista: string[];
  tituloTecnologia: string;
  etiqueta: string;
}) {
  return (
    <Escenario nombre="caso-papel" lado="der" alto="natural" etiqueta={etiqueta} className={css.papel}>
      <div className={css.columnas}>
        <div className={css.izq}>
          {papel && (
            <div>
              <h2 id="mi-papel" data-lineas className={css.titulo}>
                {papel.titulo}
              </h2>
              <div className={`prosa ${css.prosa}`} dangerouslySetInnerHTML={{ __html: papel.html }} />
            </div>
          )}
          {otras.map((s) => (
            <div key={s.id}>
              <h2 className={css.titulo}>{s.titulo}</h2>
              <div className={`prosa ${css.prosa}`} dangerouslySetInnerHTML={{ __html: s.html }} />
            </div>
          ))}
        </div>
        <div className={css.der}>
          <h2 id="tecnologia" className={css.tituloChico}>
            {tecnologia?.titulo ?? tituloTecnologia}
          </h2>
          {tecnologia?.html && (
            <div className={`prosa ${css.prosaChica}`} dangerouslySetInnerHTML={{ __html: tecnologia.html }} />
          )}
          <ul className={css.lista}>
            {lista.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </div>
      </div>
    </Escenario>
  );
}
