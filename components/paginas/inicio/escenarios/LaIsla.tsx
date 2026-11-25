// Escenario 7 · La Isla (MUNDO.md, «Los escenarios, uno por uno»). La isla flotante al centro y en grande (~54vw: solo
// la isla, recortada del lienzo del invento); flota, se inclina hacia el cursor y se estira al tocarla (vivos-b.tsx).
// Debajo, colgándole las raíces encima, las tres capturas reales en abanico (cada una a 40vw): la que se toca pasa al
// frente; el abanico se sale por las dos orillas, con un paso entre la primera y la segunda para la línea viva. Arriba a la izquierda,
// sobre el «07» gigante, el título y el resumen; debajo, las dos cifras de memoria en grande.
// En < 1024 px: apilado dentro del relleno (texto, isla, cifras); el abanico es carrusel con el dedo.
import { rutaCaso } from "@/lib/idioma";
import { TEXTOS } from "@/lib/textos";
import Abanico from "../Abanico";
import Escenario, { Numero, Texto } from "../Escenario";
import { TEXTOS_INICIO } from "../textos";
import Vista from "../Vista";
import css from "./LaIsla.module.css";
import type { PropsEscenario } from "./Lamina";
import { TEXTOS_B } from "./textos-b";
import { IslaQueFlota } from "./vivos-b";

export default function LaIsla({ caso, numero, idioma }: PropsEscenario) {
  const t = TEXTOS[idioma];
  const tx = TEXTOS_INICIO[idioma];
  const tb = TEXTOS_B[idioma];
  const href = rutaCaso(idioma, caso.slug);
  const cifras = (caso.cifras ?? []).slice(0, 2);
  // el abanico del inicio usa capturas fijas; los clips se ven en la página del caso
  const medios = caso.medios.filter((m) => m.tipo === "imagen").slice(0, 3);
  return (
    <Escenario
      nombre={`caso-${caso.slug}`}
      lado="centro"
      etiqueta={caso.titulo}
      ancla={{ x: "26px", y: "28px" }}
      className={css.escena}
    >
      <Numero n={numero} className={css.numero} />
      <div className={css.columna}>
        <Texto ancho="22rem" className={css.texto}>
          <h3 className={css.titulo}>{caso.titulo}</h3>
          <p className={css.resumen}>{caso.resumen}</p>
          <p className={css.pildoras}>
            <span className="rotulo-chico rounded-full border border-linea-viva px-3 py-1 text-hueso">
              {t.tipos[caso.tipo]}
            </span>
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
      </div>
      <IslaQueFlota idioma={idioma} />
      {medios.length > 1 ? (
        <Abanico
          etiqueta={tx.abanico}
          abre="22vw"
          giro={4}
          className={css.abanico}
        >
          {medios.map((m) => (
            <Vista
              key={m.src}
              medio={m}
              ancho="40vw"
              href={href}
              idioma={idioma}
            />
          ))}
        </Abanico>
      ) : (
        medios[0] && (
          <Vista
            medio={medios[0]}
            ancho="56vw"
            href={href}
            idioma={idioma}
            className={css.sola}
          />
        )
      )}
    </Escenario>
  );
}
