// «El folioscopio» (yacontesto.com): pasan tres hojas (nube → globo → palomita); al pasar el cursor, pasa otra.
// Sin rótulos: una sola variante para los dos idiomas (`idioma` se acepta para que todos los inventos se usen igual).
import InventoPerezoso from "../InventoPerezoso";
import type { PropsInvento } from "./Invento";

/** `idioma` (rótulos del dibujo) y `foto` (la captura real, pegada en su hueco); carga perezosa */
export default function Folioscopio(props: PropsInvento) {
  return <InventoPerezoso invento="folioscopio" {...props} />;
}
