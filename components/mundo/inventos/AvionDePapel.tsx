// Tierra de Viajes · el avión de papel que va de la maleta al pin.
import InventoPerezoso from "../InventoPerezoso";
import type { PropsInvento } from "./Invento";

/** `idioma` (rótulos del dibujo) y `foto` (la captura real, pegada en su hueco); carga perezosa */
export default function AvionDePapel(props: PropsInvento) {
  return <InventoPerezoso invento="avion-de-papel" {...props} />;
}
