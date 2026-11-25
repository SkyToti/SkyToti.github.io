// El cuaderno (Cuaderno de repaso): cuaderno de espiral con cinta, lápiz y el esquema de una API. Sin hueco de foto.
import InventoPerezoso from "../InventoPerezoso";
import type { PropsInvento } from "./Invento";

/** `idioma` (rótulos del dibujo) y `foto` (la captura real, pegada en su hueco); carga perezosa */
export default function Cuaderno(props: PropsInvento) {
  return <InventoPerezoso invento="cuaderno" {...props} />;
}
