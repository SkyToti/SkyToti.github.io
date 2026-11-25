// Fila S · Sobre mí (MUNDO.md, «Los escenarios, uno por uno»): la repisa de pared a pared. Arriba, el título grande,
// el texto del perfil en dos columnas (≤ 34rem cada una) y la ficha (ciudad, disponibilidad, idiomas); abajo, la
// repisa a 102vw, más ancha que la ventana, con sus seis objetos en grande: cada uno es un botón (Tab por
// objeto) que se tambalea y suelta su dato en un globo con aria-live; Haku llega de un salto al llegar la chispa.
// Los datos salen del perfil (ventas, lugar, idiomas) y de textos-d.ts (estudios, la taza y Haku, hechos del CV).
// En < 1024 px: apilado; con menos de 600 px de ancho la repisa usa su composición vertical.
// La línea viva entra arriba a la izquierda y baja por la orilla izquierda (6vw libres sobre el texto; 48 px junto a
// la repisa, que arranca ahí con el trazo que se dobla en tabla) hacia Contacto.
import Repisa, { type DatoRepisa } from "@/components/mundo/estaciones/Repisa";
import { contenido, textoPlano, type Perfil } from "@/lib/contenido";
import type { Idioma } from "@/lib/idioma";
import { TEXTOS } from "@/lib/textos";
import { enParrafos } from "./comun";
import Escenario from "./Escenario";
import { TEXTOS_D } from "./textos-d";
import css from "./SobreMi.module.css";

type Props = {
  idioma: Idioma;
  titulo: string;
  /** HTML de la sección «Sobre mí» del perfil. */
  html: string;
  ficha: Pick<Perfil, "nombre" | "ciudad" | "disponibilidad" | "idiomas">;
};

/** Los seis datos de la repisa: del perfil (ventas, lugar, idiomas) y de textos-d.ts (estudios, la taza y Haku). */
function datosRepisa(idioma: Idioma, html: string, ficha: Props["ficha"]): DatoRepisa[] {
  const tx = TEXTOS_D[idioma].repisa;
  const perfil = contenido().perfil(idioma);
  const lineas = [...enParrafos(html).matchAll(/<p>([\s\S]*?)<\/p>/g)].map((m) => textoPlano(m[1] ?? ""));
  // los ~10 años en ventas: la cifra del perfil y la frase de «Sobre mí» que los cuenta
  const cifra = perfil.cifras.find((c) => /ventas|sales/i.test(c.etiqueta));
  const frase = lineas.find((l) => /ventas|sales/i.test(l));
  const datos: (DatoRepisa | null)[] = [
    cifra || frase ? { clave: "ventas", titulo: cifra ? `${cifra.valor} ${cifra.etiqueta}` : "", texto: frase ?? "" } : null,
    { clave: "estudios", ...tx.estudios },
    { clave: "noche", ...tx.noche },
    ficha.ciudad ? { clave: "lugar", titulo: ficha.ciudad, texto: ficha.disponibilidad ?? "" } : null,
    ficha.idiomas ? { clave: "idiomas", titulo: tx.idiomas, texto: ficha.idiomas } : null,
    { clave: "haku", ...tx.haku },
  ];
  return datos.filter((d): d is DatoRepisa => d !== null);
}

export default function SobreMi({ idioma, titulo, html, ficha }: Props) {
  const t = TEXTOS[idioma];
  const tx = TEXTOS_D[idioma];
  const filas = [
    [t.ciudad, ficha.ciudad],
    [t.disponibilidad, ficha.disponibilidad],
    [t.idiomas, ficha.idiomas],
  ].filter(([, v]) => v);
  return (
    <Escenario
      nombre="sobre-mi"
      id="sobre-mi"
      lado="centro"
      etiqueta={titulo}
      ancla={{ x: "26px", y: "26px" }}
      className={css.escena}
    >
      <div className={css.arriba}>
        <h2 id="titulo-sobre-mi" className={css.titulo}>
          {titulo}
        </h2>
        <div className={css.prosa} dangerouslySetInnerHTML={{ __html: enParrafos(html) }} />
        <dl className={css.ficha}>
          {filas.map(([k, v]) => (
            <div key={k} className={css.fila}>
              <dt className="rotulo">{k}</dt>
              <dd className={css.valor}>{v}</dd>
            </div>
          ))}
        </dl>
      </div>
      <p className={`rotulo ${css.pista}`}>
        {tx.repisaPista}
        <span aria-hidden="true" className={css.flecha}>
          ↓
        </span>
      </p>
      <div className={css.repisa} data-obstaculo="" data-linea="detras" data-haku="propio">
        <Repisa idioma={idioma} datos={datosRepisa(idioma, html, ficha)} />
      </div>
    </Escenario>
  );
}
