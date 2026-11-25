// «El conmutador de noche» (Recepcionista con IA): el teléfono suena, el agente conecta la clavija y salta
// «¡listo!»; al pasar el cursor por el teléfono, vuelve a sonar.
import InventoPerezoso from "../InventoPerezoso";
import type { PropsInvento } from "./Invento";

/** `idioma` (rótulos del dibujo) y `foto` (la captura real, pegada en su hueco); carga perezosa */
export default function Conmutador(props: PropsInvento) {
  return <InventoPerezoso invento="conmutador" {...props} />;
}
