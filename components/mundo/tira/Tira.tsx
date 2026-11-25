// «La tira» (estación 4 del MUNDO): cómo trabaja Diego en cuatro viñetas dibujadas con el kit.
// Los textos de cada paso llegan del contenido y van en el HTML; los dibujos se cargan al acercarse y los anima
// <TiraViva> (pin horizontal en escritorio, viñetas apiladas en celular). Con menos movimiento: quieta y dibujada.
// `cabeza` (opcional) va dentro del tramo fijado, arriba: así el título de la sección se queda mientras pasan.
import type { ReactNode } from "react";
import TiraViva, { type PasoTira } from "./TiraViva";

export default function Tira({ idioma, pasos, cabeza }: { idioma: "es" | "en"; pasos: PasoTira[]; cabeza?: ReactNode }) {
  return <TiraViva idioma={idioma} pasos={pasos.slice(0, 4)} cabeza={cabeza} />;
}
