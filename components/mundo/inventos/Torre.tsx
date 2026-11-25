// La Elegía · la torre de cien pisos, el castillo y el halo de Aurelion.
import InventoPerezoso from "../InventoPerezoso";
import type { PropsInvento } from "./Invento";

/** `idioma` (rótulos del dibujo) y `foto` (la captura real, pegada en su hueco); carga perezosa */
export default function Torre(props: PropsInvento) {
  return <InventoPerezoso invento="torre" {...props} />;
}
