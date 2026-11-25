// 7 · «Siguiente caso»: una franja a toda la ventana con el título del siguiente caso en gigante y su invento en pequeño.
// Toda la franja es el enlace (el `::after` del enlace la cubre); el invento va debajo, decorativo e inerte (no se toca
// aquí: no hay nada interactivo dentro del enlace).
import InventoPerezoso from "@/components/mundo/InventoPerezoso";
import { INVENTO_DE_CASO } from "@/components/mundo/inventos/registro";
import type { Caso } from "@/lib/contenido";
import { rutaCaso, type Idioma } from "@/lib/idioma";
import css from "./Siguiente.module.css";

export default function Siguiente({ caso, idioma, rotulo }: { caso: Caso; idioma: Idioma; rotulo: string }) {
  const invento = INVENTO_DE_CASO[caso.slug];
  const nn = String(caso.orden).padStart(2, "0");
  return (
    <nav aria-label={rotulo} className={css.franja}>
      <span aria-hidden="true" className={css.numero} data-numero={nn} />
      <a href={rutaCaso(idioma, caso.slug)} lang={caso.sinTraducir ? "es-MX" : undefined} className={css.enlace}>
        <span className={`rotulo ${css.rotulo}`}>
          {rotulo} <span aria-hidden="true">→</span>
        </span>
        <span className={css.titulo}>{caso.titulo}</span>
        <span className={css.resumen}>{caso.resumen}</span>
      </a>
      {invento && (
        <div className={css.invento} aria-hidden="true" inert>
          <InventoPerezoso invento={invento} idioma={idioma} />
        </div>
      )}
    </nav>
  );
}
