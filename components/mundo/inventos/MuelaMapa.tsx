// «La muela-mapa» (CRM dental): los cuatro puntos de la muela se encienden uno por uno y trazan sus líneas;
// al pasar el cursor por la tableta, laten.
import InventoPerezoso from "../InventoPerezoso";
import type { PropsInvento } from "./Invento";

/** `idioma` (rótulos del dibujo) y `foto` (la captura real, pegada en su hueco); carga perezosa */
export default function MuelaMapa(props: PropsInvento) {
  return <InventoPerezoso invento="muela-mapa" {...props} />;
}
