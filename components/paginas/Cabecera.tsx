// Cabecera fija y delgada (DIRECCION.md §4): el monograma «DB» · Trabajo · Sobre mí · CV · cambio de idioma a la MISMA página
// en el otro idioma. Los enlaces de texto llevan letras que ruedan (solo ratón y teclado). Abajo, el avance de
// lectura con su mini chispa (components/mundo/AvanceLectura.tsx).
import AvanceLectura from "@/components/mundo/AvanceLectura";
import Monograma from "@/components/mundo/estaciones/Monograma";
import LetrasQueRuedan from "@/components/movimiento/LetrasQueRuedan";
import { ETIQUETA, otroIdioma, rutaInicio, type Idioma } from "@/lib/idioma";
import { CV, TEXTOS } from "@/lib/textos";

const enlace =
  "inline-flex min-h-11 items-center px-2 text-[0.9375rem] font-medium text-hueso-apagado transition-colors duration-[var(--dur-micro)] hover:text-hueso sm:px-3";

export default function Cabecera({ idioma, alterna }: { idioma: Idioma; alterna: string }) {
  const t = TEXTOS[idioma];
  const otro = otroIdioma(idioma);
  const inicio = rutaInicio(idioma);
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-linea bg-noche">
      <LetrasQueRuedan>
        <nav aria-label={t.navegacion} className="marco flex h-14 items-center justify-between gap-2">
          {/* El monograma «DB» de una sola línea (components/mundo/estaciones/Monograma.tsx): se traza al cargar y se
              vuelve a trazar al pasar el cursor o al enfocarlo. Es un <a> normal (no next/link: ver eslint.config.mjs). */}
          <Monograma
            href={inicio}
            etiqueta={`${t.iniciales} · ${t.marca} — ${t.irAlInicio}`}
            className="-ml-1 inline-block w-16 rounded-md py-2 leading-none"
          />
          <ul className="-mr-2 flex items-center sm:-mr-3">
            <li>
              <a href={`${inicio}#trabajo`} data-rueda className={enlace}>
                <span data-rueda-texto>{t.trabajo}</span>
              </a>
            </li>
            <li>
              <a href={`${inicio}#sobre-mi`} data-rueda className={enlace}>
                <span data-rueda-texto>{t.sobreMi}</span>
              </a>
            </li>
            <li>
              <a href={CV[idioma]} download aria-label={t.cvEtiqueta} data-rueda className={enlace}>
                <span data-rueda-texto>{t.cv}</span>
              </a>
            </li>
            <li className="ml-1 border-l border-linea pl-1 sm:ml-2 sm:pl-2">
              <a
                href={alterna}
                hrefLang={ETIQUETA[otro]}
                lang={ETIQUETA[otro]}
                aria-label={`${idioma.toUpperCase()}/${t.cambiarIdioma} — ${t.cambiarIdiomaEtiqueta}`}
                className={`${enlace} font-mono text-[0.8125rem] tracking-[0.06em]`}
              >
                <span aria-hidden="true" className="text-hueso-apagado">
                  {idioma.toUpperCase()}/
                </span>
                <span className="text-ambar">{t.cambiarIdioma}</span>
              </a>
            </li>
          </ul>
        </nav>
      </LetrasQueRuedan>
      <AvanceLectura />
    </header>
  );
}
