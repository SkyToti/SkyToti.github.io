// 2 · Cifras: una banda de orilla a orilla con las cuatro cifras del perfil en hilera, a tamaño de titular (2×2 en
// celular), cada una con su etiqueta debajo y un agente pequeño que la estampa con su sello «medido» cuando llega la
// chispa, uno tras otro (MUNDO.md, «Versión 2», fila C). El número llega en el HTML con su valor final; Animar lo
// cuenta si hay movimiento (solo la parte numérica: el prefijo y el sufijo van fijos y más chicos). El lector de
// pantalla lee la copia oculta, entera y fija.
import Sello from "@/components/mundo/estaciones/Sello";
import { partirCifra } from "@/lib/cifras";
import type { Perfil } from "@/lib/contenido";
import type { Idioma } from "@/lib/idioma";
import { TEXTOS } from "@/lib/textos";
import css from "./Cifras.module.css";

/** «Más de 2,000» → { antes: "Más de", numero: "2,000", despues: "" } (sin número: todo va en `numero`) */
function partes(valor: string) {
  const p = partirCifra(valor);
  if (!p) return { antes: "", numero: valor, despues: "" };
  return { antes: p.prefijo.trim(), numero: valor.slice(p.prefijo.length, valor.length - p.sufijo.length), despues: p.sufijo };
}

export default function Cifras({ idioma, cifras }: { idioma: Idioma; cifras: Perfil["cifras"] }) {
  const t = TEXTOS[idioma];
  // si alguna cifra lleva un prefijo con letras arriba («Más de»), las demás reservan ese renglón: los números alinean
  const conRenglon = cifras.some((c) => /\p{L}/u.test(partes(c.valor).antes));
  return (
    <section data-estacion="cifras" data-lado="centro" aria-labelledby="cifras" className={css.banda}>
      <span data-ancla="" aria-hidden="true" className={css.ancla} />
      <h2 id="cifras" className={`rotulo ${css.rotulo}`}>
        {t.cifras}
      </h2>
      <ul className={css.lista}>
        {cifras.map((c, i) => {
          const { antes, numero, despues } = partes(c.valor);
          // un prefijo con letras («Más de») va arriba y chico; uno de símbolo («~») va pegado al número, del mismo tamaño
          const arriba = /\p{L}/u.test(antes);
          return (
            <li key={c.etiqueta} data-revelar className={css.cifra}>
              {/* el agente y su sello: decorativo (la cifra ya está escrita); estampan al llegar la chispa, escalonados 0.18 s */}
              <Sello idioma={idioma} retraso={i * 0.18} className={css.sello} />
              <span aria-hidden="true" className={css.cota}>
                <span />
              </span>
              <p className={css.valor}>
                <span aria-hidden="true">
                  {arriba ? <span className={css.antesArriba}>{antes}</span> : conRenglon && <span className={css.antesArriba}>&nbsp;</span>}
                  {antes && !arriba && <span className={css.numero}>{antes}</span>}
                  <span data-contar={numero} className={css.numero}>
                    {numero}
                  </span>
                  {despues && <span className={/\p{L}/u.test(despues) ? css.afijo : css.numero}>{despues}</span>}
                </span>
                <span className="sr-only">{c.valor}</span>
              </p>
              <p className={css.etiqueta}>{c.etiqueta}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
