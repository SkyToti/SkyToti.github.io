// Escenario 6 · La Elegía (MUNDO.md, «Los escenarios, uno por uno»): el TRAMO ALTO. En escritorio, la subida mide
// 180svh y adentro va un tablero fijo (`position: sticky`, sin pin de GSAP) de una pantalla: a la izquierda, sobre el
// «06» gigante, el título, el resumen, las píldoras, las cifras (59 animaciones en grande) y «Ver el caso»; al centro,
// el video de Aurelion (cuadrado, ~44vw) y, en su esquina de abajo, el video de la torre real en un marco más chico; a
// la derecha, la torre dibujada (dibujo `torre-alta`, 400×1600) que mide dos pantallas y se sale por arriba. Mientras
// subes, la cámara trepa por ella: la torre se arma anillo por anillo, las nubes cruzan a dos velocidades, un agente
// diminuto trepa, el castillo sale con rebote al llegar arriba y el halo gira (vivos-c.tsx). El halo es un botón.
// Al terminar la subida, las tres láminas de concepto y modelo y la hoja de Aurelion pasan de lado en una tira.
// En < 1024 px no hay nada fijo: el texto y las cifras con la torre como franja estrecha a la derecha (≤ 34 %), y
// debajo los dos videos y la tira (carrusel con el dedo).
// Menos movimiento o sin JavaScript: la torre completa y quieta, entera dentro del tablero.
import Dibujo from "@/components/dibujo/Dibujo";
import { DIBUJOS } from "@/components/dibujo/datos";
import { rutaCaso } from "@/lib/idioma";
import { TEXTOS } from "@/lib/textos";
import Escenario, { Numero } from "../Escenario";
import TiraDeLado from "../TiraDeLado";
import { TEXTOS_INICIO } from "../textos";
import Vista from "../Vista";
import css from "./LaElegia.module.css";
import type { PropsEscenario } from "./Lamina";
import { TEXTOS_C } from "./textos-c";
import { TorreQueSube } from "./vivos-c";

export default function LaElegia({ caso, numero, idioma }: PropsEscenario) {
  const t = TEXTOS[idioma];
  const tx = TEXTOS_INICIO[idioma];
  const tc = TEXTOS_C[idioma];
  const href = rutaCaso(idioma, caso.slug);
  const videos = caso.medios.filter((m) => m.tipo === "video");
  const [aurelion, laTorre] = videos;
  const imagenes = caso.medios.filter((m) => m.tipo === "imagen");
  // la tira: primero las láminas de concepto y modelo, al final la hoja del modelo
  const laminas = [...imagenes.filter((m) => m.src.includes("concepto")), ...imagenes.filter((m) => !m.src.includes("concepto"))];
  const [principal, ...otras] = caso.cifras ?? [];
  const torre = DIBUJOS["torre-alta"];
  return (
    <Escenario
      nombre={`caso-${caso.slug}`}
      lado="izq"
      alto="largo"
      etiqueta={caso.titulo}
      ancla={{ x: "26px", y: "28px" }}
      className={css.escena}
    >
      <div className={css.subida} data-subida="">
        <div className={css.tablero} data-tablero="">
          <Numero n={numero} className={css.numero} />
          {/* nubes: dos lejanas detrás de la torre, una cercana delante (decoración; con movimiento cruzan) */}
          <span aria-hidden="true" className={`${css.nube} ${css.nubeLejos1}`} data-nube="lejos">
            <Dibujo nombre="trafico-nube-lejos" />
          </span>
          <span aria-hidden="true" className={`${css.nube} ${css.nubeLejos2}`} data-nube="lejos">
            <Dibujo nombre="trafico-nube-lejos" />
          </span>
          <TorreQueSube anclas={torre.anclas} etiquetaHalo={tc.halo} className={css.torre}>
            <Dibujo nombre="torre-alta" />
          </TorreQueSube>
          <span aria-hidden="true" className={`${css.nube} ${css.nubeCerca}`} data-nube="cerca">
            <Dibujo nombre="trafico-nube-cerca-a" />
          </span>
          {/* el banco de nubes: sube al final de la subida y tapa donde el tablero corta la torre (ya vas sobre ellas) */}
          <span aria-hidden="true" className={`${css.nube} ${css.banco}`} data-banco="">
            <Dibujo nombre="trafico-nube-cerca-b" />
          </span>
          <div className={css.texto}>
            <h3 className={css.titulo}>{caso.titulo}</h3>
            <p className={css.resumen}>{caso.resumen}</p>
            <p className={css.pildoras}>
              <span className="rotulo-chico rounded-full border border-linea-viva px-3 py-1 text-hueso">{t.tipos[caso.tipo]}</span>
              <span className="rotulo-chico text-hueso-apagado">{caso.anio}</span>
            </p>
            {principal && (
              <ul className={css.cifras} aria-label={tc.cifras}>
                <li className={css.grande}>
                  <span className={css.valor}>
                    <span aria-hidden="true" data-contar={principal.valor}>
                      {principal.valor}
                    </span>
                    <span className="sr-only">{principal.valor}</span>
                  </span>
                  <span className={css.etiqueta}>{principal.etiqueta}</span>
                </li>
                {otras.slice(0, 3).map((c) => (
                  <li key={c.etiqueta} className={css.chica}>
                    <span className={css.valorChico}>{c.valor}</span>
                    <span className={css.etiqueta}>{c.etiqueta}</span>
                  </li>
                ))}
              </ul>
            )}
            <a href={href} className={`boton boton-principal ${css.boton}`}>
              {tx.verElCaso}
              <span className="sr-only">: {caso.titulo}</span>
              <span aria-hidden="true">→</span>
            </a>
          </div>
          {aurelion && <Vista medio={aurelion} ancho="var(--ancho-aurelion)" href={href} idioma={idioma} className={css.aurelion} />}
          {laTorre && (
            <Vista medio={laTorre} ancho="var(--ancho-la-torre)" inclina={-3} href={href} idioma={idioma} className={css.laTorre} />
          )}
        </div>
      </div>
      {laminas.length > 0 && (
        <TiraDeLado etiqueta={tc.laminas} cuadro="34vw" className={css.tira}>
          {laminas.map((m) => (
            <Vista key={m.src} medio={m} ancho="100%" href={href} idioma={idioma} />
          ))}
        </TiraDeLado>
      )}
    </Escenario>
  );
}
