// Escenario 9 · Punto de venta (MUNDO.md, «Los escenarios, uno por uno»). Es el escenario de muestra de las piezas
// comunes (inicio/LEEME.md): la pantalla de venta a 58vw a la derecha inclinada −3°, la colmena-caja grande abajo a la
// izquierda saliéndose por la orilla, las otras cuatro capturas en una tira que pasa de lado, el número gigante
// detrás, y el título, el resumen, las píldoras y «Ver el caso». La línea viva entra arriba a la derecha, baja por la
// orilla derecha (o por el pasillo entre la colmena y la tira) y sale por abajo hacia «Cómo trabajo».
// En < 1024 px: todo apilado dentro del relleno; la tira es un carrusel con el dedo.
import ColmenaCaja from "@/components/mundo/inventos/ColmenaCaja";
import { rutaCaso } from "@/lib/idioma";
import { TEXTOS } from "@/lib/textos";
import Escenario, { Numero, Sangra, Texto } from "../Escenario";
import TiraDeLado from "../TiraDeLado";
import { TEXTOS_INICIO } from "../textos";
import Vista from "../Vista";
import type { PropsEscenario } from "./Lamina";
import css from "./PuntoDeVenta.module.css";

export default function PuntoDeVenta({ caso, numero, idioma }: PropsEscenario) {
  const t = TEXTOS[idioma];
  const tx = TEXTOS_INICIO[idioma];
  const href = rutaCaso(idioma, caso.slug);
  const [principal, ...resto] = caso.medios;
  return (
    <Escenario
      nombre={`caso-${caso.slug}`}
      lado="der"
      etiqueta={caso.titulo}
      ancla={{ x: "calc(100% - 26px)", y: "28px" }}
      className={css.escena}
    >
      <Numero n={numero} className={css.numero} />
      <div className={css.arriba}>
        <Texto ancho="28rem" className={css.texto}>
          <h3 className={css.titulo}>{caso.titulo}</h3>
          <p className={css.resumen}>{caso.resumen}</p>
          <p className={css.pildoras}>
            <span className="rotulo-chico rounded-full border border-linea-viva px-3 py-1 text-hueso">{t.tipos[caso.tipo]}</span>
            {caso.demo && <span className="rotulo-chico rounded-full border border-ambar px-3 py-1 text-ambar">{t.demoInteractiva}</span>}
            <span className="rotulo-chico text-hueso-apagado">{caso.anio}</span>
          </p>
          <a href={href} className={`boton boton-principal ${css.boton}`}>
            {tx.verElCaso}
            <span className="sr-only">: {caso.titulo}</span>
            <span aria-hidden="true">→</span>
          </a>
        </Texto>
        {principal && <Vista medio={principal} ancho="58vw" inclina={-3} href={href} idioma={idioma} className={css.vista} />}
      </div>
      <div className={css.abajo}>
        <Sangra orilla="izq" ancho="50vw" desplaza="9vw" capa={false} className={css.colmena}>
          <ColmenaCaja idioma={idioma} />
        </Sangra>
        {/* Hueco declarado entre la colmena y la tira: por aquí puede bajar la línea. */}
        <span data-pasillo="" aria-hidden="true" className={css.pasillo} />
        {resto.length > 0 && (
          <TiraDeLado etiqueta={tx.masPantallas} cuadro="25vw" className={css.tira}>
            {resto.slice(0, 4).map((m) => (
              <Vista key={m.src} medio={m} ancho="100%" idioma={idioma} />
            ))}
          </TiraDeLado>
        )}
      </div>
    </Escenario>
  );
}
