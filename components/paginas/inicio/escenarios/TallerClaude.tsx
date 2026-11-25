// Escenario 5 · taller-claude (MUNDO.md, «Los escenarios, uno por uno»). El banco de la mesa de los seis cruza la base
// de la ventana (el dibujo a 124vw, sale por las dos orillas y por abajo; la línea viva lo cruza por detrás); los seis agentes en grande: cada uno salta al tocarlo, señalarlo o enfocarlo y enseña su papel
// y su modelo; la batuta repite el golpe y el martilleo en escala (vivos-b.tsx). Arriba a la izquierda, sobre el «05»
// gigante, el título y el resumen; arriba a la derecha, el diagrama `orquesta-agentes` en mini.
// En < 1024 px: apilado dentro del relleno (texto, diagrama, mesa).
import { Escena } from "@/components/Escena";
import { rutaCaso } from "@/lib/idioma";
import { TEXTOS } from "@/lib/textos";
import Escenario, { Numero, Texto } from "../Escenario";
import { TEXTOS_INICIO } from "../textos";
import type { PropsEscenario } from "./Lamina";
import css from "./TallerClaude.module.css";
import { TEXTOS_B } from "./textos-b";
import { MesaQueSalta } from "./vivos-b";

export default function TallerClaude({ caso, numero, idioma }: PropsEscenario) {
  const t = TEXTOS[idioma];
  const tx = TEXTOS_INICIO[idioma];
  const tb = TEXTOS_B[idioma];
  const href = rutaCaso(idioma, caso.slug);
  return (
    <Escenario nombre={`caso-${caso.slug}`} lado="centro" etiqueta={caso.titulo} ancla={{ x: "26px", y: "28px" }} className={css.escena}>
      <Numero n={numero} className={css.numero} />
      <div className={css.arriba}>
        <Texto ancho="22rem" className={css.texto}>
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
        {caso.escena && (
          <figure className={css.diagrama}>
            <figcaption className={`rotulo-chico ${css.rotulo}`}>{tb.comoFunciona}</figcaption>
            <Escena nombre={caso.escena} idioma={idioma} modo="mini" resumen={caso.resumen} />
          </figure>
        )}
      </div>
      {/* La mesa: una ventana que recorta el dibujo, de orilla a orilla; la línea viva pasa por detrás. */}
      <div className={css.mesa} data-obstaculo="" data-linea="detras">
        <div className={css.mesaLienzo}>
          <MesaQueSalta idioma={idioma} />
        </div>
      </div>
    </Escenario>
  );
}
