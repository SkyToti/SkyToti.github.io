// «La bóveda con ventanilla» (minecraft-rcon-mcp): una tarjeta rebota con tache, el sello aprueba el folio y el
// volante gira media vuelta; al pasar el cursor por el volante, gira.
import InventoPerezoso from "../InventoPerezoso";
import type { PropsInvento } from "./Invento";

/** `idioma` (rótulos del dibujo) y `foto` (la captura real, pegada en su hueco); carga perezosa */
export default function Boveda(props: PropsInvento) {
  return <InventoPerezoso invento="boveda" {...props} />;
}
