// «La mesa de los seis» (taller-claude): la batuta da un golpe y los seis martillan uno tras otro; al pasar el
// cursor por la batuta, repiten. Sin rótulos: una sola variante para los dos idiomas.
import InventoPerezoso from "../InventoPerezoso";
import type { PropsInvento } from "./Invento";

/** `idioma` (rótulos del dibujo) y `foto` (la captura real, pegada en su hueco); carga perezosa */
export default function MesaDeLosSeis(props: PropsInvento) {
  return <InventoPerezoso invento="mesa-de-los-seis" {...props} />;
}
