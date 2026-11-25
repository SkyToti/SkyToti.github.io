// La lámina común del trabajo: la usan los casos que aún no tienen escenario a todo lo ancho (cada archivo de esta
// carpeta la envuelve mientras tanto) y es el respaldo para un slug sin escenario propio (index.ts). Se mete sola en
// el `.marco` centrado y entra con `data-revelar`, como antes de que «Trabajo» dejara de tener contenedor.
import InventoPerezoso from "@/components/mundo/InventoPerezoso";
import { INVENTO_DE_CASO } from "@/components/mundo/inventos/registro";
import type { Caso } from "@/lib/contenido";
import { rutaCaso, type Idioma } from "@/lib/idioma";
import { TEXTOS } from "@/lib/textos";
import { acomodo, col } from "../comun";

export type PropsEscenario = { caso: Caso; numero: number; idioma: Idioma };

/** Una lámina del trabajo, sin caja: separada por una línea fina, con su número grande como cota, título, línea
 *  llana, el invento del caso (MUNDO.md) con su portada pegada con cinta, y la píldora del tipo. Toda la lámina es un solo enlace al
 *  caso: el título, estirado sobre la lámina, con el foco dibujado alrededor de toda ella. */
export default function Lamina({ caso, numero, idioma }: PropsEscenario) {
  const t = TEXTOS[idioma];
  const nn = String(numero).padStart(2, "0");
  const invento = INVENTO_DE_CASO[caso.slug];
  const lado = acomodo(numero);
  const primera = numero === 1;
  return (
    <div className="marco" data-revelar>
      <article
        data-estacion={`caso-${caso.slug}`}
        className={`group columnas relative gap-y-5 border-t border-linea py-8 sm:gap-y-7 sm:py-12 lg:grid-rows-[auto_1fr] lg:gap-y-8 ${
          primera ? "lg:pt-14 lg:pb-20" : "lg:py-16"
        }`}
      >
        <div className={`${col} ${lado.texto} lg:row-start-1`}>
          <p aria-hidden="true" className="rotulo relative lg:hidden">
            <span data-ancla="" className="ancla-rotulo-lamina" />
            <span className="lamina-numero">{nn}</span> — {caso.titulo}
          </p>
          {/* La cota: el número de la lámina, grande y en mono, con su línea de medida. */}
          <p aria-hidden="true" className="relative hidden items-center gap-4 lg:flex">
            <span data-ancla="" className={`ancla-numero ${numero % 2 === 0 ? "ancla-par" : ""}`} />
            <span className="lamina-numero font-mono text-[clamp(3rem,5vw,4.5rem)] leading-none tracking-[-0.04em] text-linea-viva transition-colors duration-[var(--dur-micro)] group-hover:text-ambar">
              {nn}
            </span>
            <span className="h-px flex-1 bg-linea" />
          </p>
          <h3
            className={`t-lamina mt-3 text-hueso transition-colors duration-[var(--dur-micro)] group-hover:text-ambar lg:mt-8 ${
              primera ? "lg:text-[clamp(2rem,3.4vw,3rem)]" : ""
            }`}
          >
            <a
              href={rutaCaso(idioma, caso.slug)}
              className="after:absolute after:-inset-x-3 after:inset-y-2 after:z-10 after:rounded-[6px] after:content-[''] focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-ambar"
            >
              {caso.titulo}
            </a>
          </h3>
          <p className="mt-3 max-w-[44ch] text-hueso-apagado lg:mt-4">{caso.resumen}</p>
        </div>
        <div className={`${col} ${lado.medio} lg:row-span-2 lg:row-start-1`}>
          {invento && (
            <InventoPerezoso invento={invento} idioma={idioma} foto={caso.portada ? { src: caso.portada, alt: "" } : undefined} />
          )}
        </div>
        <p className={`${col} ${lado.texto} flex items-center gap-3 lg:row-start-2 lg:self-end`}>
          <span className="rotulo-chico rounded-full border border-linea-viva px-3 py-1 text-hueso">{t.tipos[caso.tipo]}</span>
          {caso.demo && (
            <span className="rotulo-chico rounded-full border border-ambar px-3 py-1 text-ambar">{t.demoInteractiva}</span>
          )}
          <span className="rotulo-chico text-hueso-apagado">{caso.anio}</span>
          <span
            aria-hidden="true"
            className="ml-auto font-mono text-xl text-ambar transition-transform duration-[var(--dur-micro)] group-hover:translate-x-1"
          >
            →
          </span>
        </p>
      </article>
    </div>
  );
}
