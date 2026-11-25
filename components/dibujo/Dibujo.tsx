// <Dibujo> (servidor): pinta una ilustración del kit en su estado final, con el cuadro 1 visible y los otros dos
// ocultos por CSS. Decorativa por defecto (aria-hidden); con `titulo` se anuncia como imagen; si declara zonas
// tocables accesibles (`alTocar` con `accesible`) se anuncia como grupo para que sus botones se alcancen.
// Con `vivo`, la envuelve <DibujoVivo> (cliente) que le da la entrada, el hervor y los gestos; el SVG lo sigue
// pintando el servidor, así que el cliente solo recibe los datos de animación (sin los trazos).
// Cada instancia lleva sus propios ids (tramas, recortes): el mismo dibujo se puede pintar varias veces.
// El HTML solo trae el cuadro 1 de cada trazo (hervor.ts): los otros dos solo los ve <DibujoVivo> al hervir, y los pide
// a /hervor/<nombre>.json al acercarse. Sin `vivo` nunca hierve: no se piden.
import { useId } from "react";
import { DIBUJOS, type NombreDibujo } from "./datos";
import DibujoVivo from "./DibujoVivo";
import { partirHervor } from "./hervor";
import { limpiarId, prefijarIds } from "./ids";
import css from "./dibujo.module.css";

type Props = {
  nombre: NombreDibujo;
  className?: string;
  titulo?: string;
  /** entrada, hervor y gestos en el cliente */
  vivo?: boolean;
  /** «ver de nuevo» y, si la ilustración tiene lámpara, su botón */
  controles?: boolean;
  /** segundos de espera entre despertar y empezar a trazarse (para escalonar varios dibujos de una estación) */
  retraso?: number;
  /** nombre accesible de cada zona tocable, por idioma: { haku: "Haku, asleep" } */
  etiquetas?: Record<string, string>;
};

export default function Dibujo({ nombre, className, titulo, vivo = false, controles = false, retraso, etiquetas }: Props) {
  const { svg: marcado, tipo, ...meta } = DIBUJOS[nombre];
  const uid = limpiarId(useId());
  const prefijo = `d${uid}`;
  const tocable = vivo && meta.alTocar?.some((t) => t.accesible);
  const accesible = tocable
    ? { role: "group", "aria-label": titulo ?? meta.titulo }
    : titulo
      ? { role: "img", "aria-label": titulo }
      : { "aria-hidden": true as const };
  const svg = (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={vivo ? css.svg : `${css.svg} ${className ?? ""}`}
      viewBox={meta.vb}
      data-dibujo={nombre}
      data-tipo={tipo}
      focusable="false"
      {...accesible}
      dangerouslySetInnerHTML={{ __html: prefijarIds(partirHervor(marcado).base, prefijo) }}
    />
  );
  if (!vivo) return svg;
  return (
    <DibujoVivo meta={meta} prefijo={prefijo} className={className} controles={controles} retraso={retraso} etiquetas={etiquetas}>
      {svg}
    </DibujoVivo>
  );
}

export type { NombreDibujo };
