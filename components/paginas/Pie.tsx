// Pie de todas las páginas (MUNDO.md, fila Z): a todo lo ancho, Haku hecho rosca sobre el final de la línea, grande a
// la izquierda (PieHaku: tres «z» que suben y la chispa que se apaga; tocarlo le abre un ojo), y a la derecha la
// firma, el correo y «volver arriba». Sin teléfono.
// En el inicio el pie va dentro de la estación `pie` (Inicio.tsx: `data-estacion="pie"` y su ancla, en el centro del
// pie en escritorio). En escritorio la línea pasa por ese centro, que aquí queda libre, y termina en el ancla de
// abajo, en la chispa del dibujo (83.8 %, 84.5 % del lienzo de 420×200): el dibujo se recorta justo ahí (lo que
// queda a la derecha es solo su chispa) y la chispa de la línea viva llega a ocupar su lugar, empalmando con el
// trazo dibujado bajo Haku (el dibujo va entero: nada se recorta). En < 1024 px esta ancla no existe y la línea termina en la del pie (abajo a la izquierda).
import EnEscena from "@/components/mundo/estaciones/EnEscena";
import PieHaku from "@/components/mundo/estaciones/PieHaku";
import { contenido } from "@/lib/contenido";
import type { Idioma } from "@/lib/idioma";
import { TEXTOS } from "@/lib/textos";
import css from "./Pie.module.css";

export default function Pie({ idioma }: { idioma: Idioma }) {
  const t = TEXTOS[idioma];
  const perfil = contenido().perfil(idioma);
  return (
    <footer className={css.pie}>
      <div className={css.haku} data-linea="detras">
        {/* las «z» esperan a Haku: suben cuando el guía entra en escena (antes, el CSS las esconde con él) */}
        <EnEscena gesto="zzz" className={css.dibujo}>
          <PieHaku idioma={idioma} />
        </EnEscena>
        <span data-ancla="" aria-hidden="true" className={css.fin} />
      </div>
      <div className={css.datos}>
        <p className="rotulo">
          © {new Date().getFullYear()} {perfil.nombre}
          {perfil.ciudad && <> · {perfil.ciudad}</>}
        </p>
        <p className={css.enlaces}>
          {perfil.correo && (
            <a href={`mailto:${perfil.correo}`} className="enlace text-[0.9375rem]">
              {perfil.correo}
            </a>
          )}
          <a href="#contenido" className="enlace text-[0.9375rem]">
            {t.volverArriba} ↑
          </a>
        </p>
      </div>
    </footer>
  );
}
