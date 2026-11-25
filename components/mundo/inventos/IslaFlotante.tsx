// La Isla · la isla flotante que se vuelve reproductor, lanzador y control.
import InventoPerezoso from "../InventoPerezoso";
import type { PropsInvento } from "./Invento";

/** `idioma` (rótulos del dibujo) y `foto` (la captura real, pegada en su hueco); carga perezosa */
export default function IslaFlotante(props: PropsInvento) {
  return <InventoPerezoso invento="isla-flotante" {...props} />;
}
