// Escenario 4 · minecraft-rcon-mcp (MUNDO.md, «Los escenarios, uno por uno»). No hay captura: el invento ES la
// estrella. La bóveda a ~80svh de alto, centro-derecha, saliéndose por abajo y por la derecha; su volante se gira
// (arrastrando, rozándolo con el cursor o con las flechas) y cada vuelta completa baja el sello «aprobado»
// (vivos-b.tsx). Arriba a la izquierda, sobre el «04» gigante, el título y el resumen; arriba a la derecha, las dos
// cifras del caso ENORMES (cuentan al llegar); debajo del texto, como prueba, el diagrama `puerta-con-folio` en mini.
// La línea viva entra arriba a la izquierda y baja por la orilla izquierda (libre: 5vw).
// En < 1024 px: todo apilado dentro del relleno (texto, cifras, bóveda, diagrama).
import { Escena } from "@/components/Escena";
import { rutaCaso } from "@/lib/idioma";
import { TEXTOS } from "@/lib/textos";
import Escenario, { Numero, Sangra, Texto } from "../Escenario";
import { TEXTOS_INICIO } from "../textos";
import type { PropsEscenario } from "./Lamina";
import css from "./MinecraftRconMcp.module.css";
import { TEXTOS_B } from "./textos-b";
import { BovedaGiratoria } from "./vivos-b";

export default function MinecraftRconMcp({ caso, numero, idioma }: PropsEscenario) {
  const t = TEXTOS[idioma];
  const tx = TEXTOS_INICIO[idioma];
  const tb = TEXTOS_B[idioma];
  const href = rutaCaso(idioma, caso.slug);
  const cifras = (caso.cifras ?? []).slice(0, 2);
  return (
    <Escenario nombre={`caso-${caso.slug}`} lado="der" etiqueta={caso.titulo} ancla={{ x: "26px", y: "28px" }} className={css.escena}>
      <Numero n={numero} libre className={css.numero} />
      <Texto ancho="30rem" className={css.texto}>
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
      {cifras.length > 0 && (
        <ul className={css.cifras} aria-label={tb.laPrueba}>
          {cifras.map((c) => (
            <li key={c.etiqueta} className={css.cifra}>
              <span className={css.valor}>
                <span aria-hidden="true" data-contar={c.valor}>
                  {c.valor}
                </span>
                <span className="sr-only">{c.valor}</span>
              </span>
              <span className={css.etiqueta}>{c.etiqueta}</span>
            </li>
          ))}
        </ul>
      )}
      <Sangra orilla="abajo-der" ancho="var(--ancho-boveda)" desplaza="var(--sale-der)" en="var(--sale-abajo)" detras className={css.boveda}>
        <BovedaGiratoria idioma={idioma} />
      </Sangra>
      {caso.escena && (
        <figure className={css.diagrama}>
          <figcaption className={`rotulo-chico ${css.rotulo}`}>{tb.comoFunciona}</figcaption>
          <Escena nombre={caso.escena} idioma={idioma} modo="mini" resumen={caso.resumen} />
        </figure>
      )}
    </Escenario>
  );
}
