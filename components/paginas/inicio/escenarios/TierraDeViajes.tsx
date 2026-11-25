// Escenario 8 · Tierra de Viajes (MUNDO.md, «Los escenarios, uno por uno»). La portada del sitio a 55vw a la izquierda,
// con un pin clavado encima (la forma del pin del invento AvionDePapel: rebota al pasar el cursor). Detrás de su orilla
// de arriba asoma el «08» gigante. A la derecha, el itinerario en un teléfono, con la vista de escritorio del
// itinerario asomando detrás (inclinada y saliéndose por la orilla); abajo a la derecha, la maleta del invento,
// saliéndose por la esquina. Debajo de la portada, el título, el resumen, las píldoras, «Ver en vivo» y «Ver el caso».
// Por encima de todo cruza la RUTA punteada del avión: de la maleta sube por el pasillo entre la portada y el teléfono,
// da su rizo arriba a la izquierda y baja al pin; el avión la recorre con el scroll (vivos-c.tsx) y da un rizo al
// tocarlo. La ruta nunca pasa por el texto.
// En < 1024 px: apilado (texto, portada con su pin, teléfono delante de la vista de escritorio, maleta); la ruta sube
// por la orilla derecha y da el rizo sobre la esquina de la portada.
import Dibujo from "@/components/dibujo/Dibujo";
import AvionDePapel from "@/components/mundo/inventos/AvionDePapel";
import { rutaCaso } from "@/lib/idioma";
import { TEXTOS } from "@/lib/textos";
import Escenario, { Numero, Sangra } from "../Escenario";
import { TEXTOS_INICIO } from "../textos";
import Vista from "../Vista";
import type { PropsEscenario } from "./Lamina";
import { TEXTOS_C } from "./textos-c";
import css from "./TierraDeViajes.module.css";
import { PinQueRebota, RutaDelAvion } from "./vivos-c";

export default function TierraDeViajes({ caso, numero, idioma }: PropsEscenario) {
  const t = TEXTOS[idioma];
  const tx = TEXTOS_INICIO[idioma];
  const tc = TEXTOS_C[idioma];
  const href = rutaCaso(idioma, caso.slug);
  const portada = caso.medios.find((m) => m.src === caso.portada) ?? caso.medios[0];
  const celular = caso.medios.find((m) => m.src.includes("celular"));
  const escritorio = caso.medios.find((m) => m !== portada && m !== celular && m.tipo === "imagen");
  return (
    <Escenario
      nombre={`caso-${caso.slug}`}
      lado="izq"
      etiqueta={caso.titulo}
      ancla={{ x: "26px", y: "28px" }}
      className={css.escena}
    >
      <Numero n={numero} className={css.numero} />
      <div className={css.texto}>
        <h3 className={css.titulo}>{caso.titulo}</h3>
        <div className={css.lado}>
          <p className={css.resumen}>{caso.resumen}</p>
          <p className={css.pildoras}>
            <span className="rotulo-chico rounded-full border border-linea-viva px-3 py-1 text-hueso">{t.tipos[caso.tipo]}</span>
            <span className="rotulo-chico text-hueso-apagado">{caso.anio}</span>
          </p>
          <p className={css.enlaces}>
            {caso.enVivo && (
              <a href={caso.enVivo} rel="noopener" className="boton">
                {t.enVivo}
                <span className="sr-only">: {caso.titulo}</span>
                <span aria-hidden="true">↗</span>
              </a>
            )}
            <a href={href} className="boton boton-principal">
              {tx.verElCaso}
              <span className="sr-only">: {caso.titulo}</span>
              <span aria-hidden="true">→</span>
            </a>
          </p>
        </div>
      </div>
      {portada && (
        <div className={css.portada} data-portada="">
          <Vista medio={portada} ancho="100%" href={href} idioma={idioma} />
          <PinQueRebota className={css.pin} />
        </div>
      )}
      <div className={css.itinerario}>
        {escritorio && <Vista medio={escritorio} ancho="var(--ancho-escritorio)" inclina={3} href={href} idioma={idioma} className={css.escritorio} />}
        {celular && (
          <div className={css.telefono} data-telefono="">
            <Vista medio={celular} ancho="100%" marco="telefono" inclina={-2} href={href} idioma={idioma} />
          </div>
        )}
      </div>
      <Sangra orilla="abajo-der" ancho="var(--ancho-maleta)" desplaza="var(--sale-maleta)" en="var(--baja-maleta)" className={css.maleta}>
        <div className={css.recorteMaleta} data-maleta="">
          <div className={css.lienzoMaleta}>
            <AvionDePapel idioma={idioma} />
          </div>
        </div>
      </Sangra>
      <RutaDelAvion etiqueta={tc.avion}>
        <Dibujo nombre="trafico-avion" />
      </RutaDelAvion>
    </Escenario>
  );
}
