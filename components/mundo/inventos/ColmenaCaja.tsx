// Punto de venta · la colmena-caja con su abeja lectora.
import InventoPerezoso from "../InventoPerezoso";
import type { PropsInvento } from "./Invento";

/** `idioma` (rótulos del dibujo) y `foto` (la captura real, pegada en su hueco); carga perezosa */
export default function ColmenaCaja(props: PropsInvento) {
  return <InventoPerezoso invento="colmena-caja" {...props} />;
}
