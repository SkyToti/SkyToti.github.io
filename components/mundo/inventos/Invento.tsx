// La base de los diez inventos: pinta el dibujo vivo del kit a partir de SUS datos (no del índice entero, para que
// cada invento viaje en su propio trozo de JS) y, si se le da, pega la captura real del proyecto en su hueco.
// La API pública es la de cada invento (<Torre idioma foto />…), que carga perezoso con <InventoPerezoso>.
//
// Dos estrategias de hueco y de rótulos conviven (vienen de dos tandas; no se redibuja nada para unificarlas):
//  · Hueco: si el dibujo trae las anclas `fotoMedida`/`fotoGiro` (tanda 2), la foto va ENCIMA del dibujo;
//    si no (tanda 1), va DETRÁS, en un hueco fijo de 200×125 con el giro del marco, y el borde y la cinta del
//    dibujo le quedan encima. Las dos usan el ancla `foto` como centro.
//  · Rótulos: grupos `rotulos-es`/`rotulos-en` dentro de un mismo dibujo (CSS esconde el que no toca) o dos
//    variantes horneadas `<nombre>-es`/`<nombre>-en` (el registro elige cuál cargar).
import { useId } from "react";
import DibujoVivo from "@/components/dibujo/DibujoVivo";
import { limpiarId, prefijarIds } from "@/components/dibujo/ids";
import type { DatosDibujo } from "@/components/dibujo/tipos";
import cssDibujo from "@/components/dibujo/dibujo.module.css";
import css from "./inventos.module.css";

export type Idioma = "es" | "en";
export type FotoInvento = { src: string; alt: string };
export type PropsInvento = { idioma?: Idioma; foto?: FotoInvento; className?: string };
/** hueco de la foto en unidades del lienzo cuando el dibujo no lo trae en sus anclas (tanda 1) */
export type HuecoFijo = { medida: [number, number]; giro: number };

const pc = (v: number, total: number) => `${Math.round((v / total) * 10000) / 100}%`;

export default function Invento({
  datos,
  idioma = "es",
  foto,
  className,
  hueco,
}: PropsInvento & { datos: DatosDibujo; hueco?: HuecoFijo }) {
  const { svg: marcado, tipo, ...meta } = datos;
  const uid = limpiarId(useId());
  const centro = meta.anclas.foto;
  const medida = meta.anclas.fotoMedida ?? hueco?.medida;
  const giro = meta.anclas.fotoGiro?.[0] ?? hueco?.giro ?? 0;
  const detras = !meta.anclas.fotoMedida;
  const img =
    foto && centro && medida ? (
      // eslint-disable-next-line @next/next/no-img-element -- sitio estático (output: export): sin optimizador de imágenes
      <img
        className={`${css.foto} ${detras ? css.detras : ""}`}
        src={foto.src}
        alt={foto.alt}
        width={Math.round(medida[0] * 2)}
        height={Math.round(medida[1] * 2)}
        loading="lazy"
        decoding="async"
        data-foto=""
        style={{
          left: pc(centro[0] - medida[0] / 2, meta.ancho),
          top: pc(centro[1] - medida[1] / 2, meta.alto),
          width: pc(medida[0], meta.ancho),
          height: pc(medida[1], meta.alto),
          transform: `rotate(${giro}deg)`,
        }}
      />
    ) : null;
  return (
    <div className={`${css.invento} ${className ?? ""}`} data-idioma={idioma} data-invento={meta.nombre}>
      {detras && img}
      <DibujoVivo meta={meta} className={css.dibujo}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={cssDibujo.svg}
          viewBox={meta.vb}
          data-dibujo={meta.nombre}
          data-tipo={tipo}
          focusable="false"
          aria-hidden="true"
          dangerouslySetInnerHTML={{ __html: prefijarIds(marcado, `d${uid}`) }}
        />
      </DibujoVivo>
      {!detras && img}
    </div>
  );
}
