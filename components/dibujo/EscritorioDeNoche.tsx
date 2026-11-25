// «El escritorio de noche»: la escena de la portada, lista para montarse (7 de 12 columnas). Trae sus dos
// composiciones (ancha 900×640 y vertical 360×440); cuál se ve lo decide CSS por el ancho del contenedor.
// Haku sigue el cursor con los ojos y mueve una oreja; la lámpara es un botón (clic, Enter o Espacio);
// «ver de nuevo» repite la entrada. Con menos movimiento, todo dibujado y quieto (la lámpara sigue funcionando).
import Dibujo from "./Dibujo";
import css from "./dibujo.module.css";

export default function EscritorioDeNoche({ className }: { className?: string }) {
  return (
    <div className={`${css.escritorio} ${className ?? ""}`}>
      <div className={css.ancho}>
        <Dibujo nombre="escritorio-h" vivo controles />
      </div>
      <div className={css.alto}>
        <Dibujo nombre="escritorio-v" vivo controles />
      </div>
    </div>
  );
}
