// Página de un caso a todo lo ancho (MUNDO.md, «Versión 2» y «Página de caso»), con las mismas piezas que el inicio
// (Escenario, Vista, TiraDeLado). Una sola plantilla que se adapta a lo que trae el caso:
//   1 · cabecera a pantalla completa (número gigante, título, resumen, ficha, botones y el invento grande)
//   2 · la prueba principal ENORME (el primer medio; sin medios, el diagrama de «Cómo funciona» hace de prueba)
//   2½ · la demo interactiva (si la hay) · 3 · Cómo funciona · 4 · La prueba (cifras gigantes) · 5 · Se ve así
//   6 · Mi papel · Tecnología · 7 · Siguiente caso (circular)
// Haku guía también aquí: las tres frases del caso (contenido/guia.*.md) van a la cabecera, «Cómo funciona» y «La
// prueba»; las demás estaciones usan las de repuesto. Sin línea viva, <Llegadas> despacha `estacion:llega`.
// Las secciones viven en components/paginas/caso/.
import Animar from "@/components/movimiento/Animar";
import HakuGuia from "@/components/mundo/guia/HakuGuia";
import Cabecera from "@/components/paginas/Cabecera";
import Pie from "@/components/paginas/Pie";
import CabeceraCaso from "@/components/paginas/caso/CabeceraCaso";
import Como from "@/components/paginas/caso/Como";
import { repartir } from "@/components/paginas/caso/comun";
import css from "@/components/paginas/caso/Caso.module.css";
import Papel from "@/components/paginas/caso/Papel";
import Principal from "@/components/paginas/caso/Principal";
import Prueba from "@/components/paginas/caso/Prueba";
import SeVe from "@/components/paginas/caso/SeVe";
import Siguiente from "@/components/paginas/caso/Siguiente";
import { TEXTOS_CASO } from "@/components/paginas/caso/textos";
import { Llegadas, Paralaje } from "@/components/paginas/caso/vivos";
import { contenido, SECCIONES, seccionDe, type Seccion } from "@/lib/contenido";
import { otroIdioma, rutaCaso, type Idioma } from "@/lib/idioma";
import { TEXTOS } from "@/lib/textos";

const fijas: readonly string[] = Object.values(SECCIONES).flat();

export default function Caso({ idioma, slug }: { idioma: Idioma; slug: string }) {
  const t = TEXTOS[idioma];
  const tc = TEXTOS_CASO[idioma];
  const lector = contenido();
  const caso = lector.caso(slug, idioma);
  const casos = lector.casos(idioma);
  const i = casos.findIndex((c) => c.slug === slug);
  const siguiente = casos[(i + 1) % casos.length]!;

  const queEs = seccionDe(caso, SECCIONES.queEs);
  const paraQuien = seccionDe(caso, SECCIONES.paraQuien);
  const intro = [queEs, paraQuien].filter((s): s is Seccion => !!s);
  const comoFunciona = seccionDe(caso, SECCIONES.comoFunciona);
  const prueba = seccionDe(caso, SECCIONES.laPrueba);
  const papel = seccionDe(caso, SECCIONES.miPapel);
  const tecnologia = seccionDe(caso, SECCIONES.tecnologia);
  const otras = caso.secciones.filter((s) => !fijas.includes(s.id));
  const { forma, principal, acompana, resto } = repartir(caso);
  const sinMedios = forma === "sin";
  const cifrasPrueba = slug === "minecraft-rcon-mcp" ? [] : (caso.cifras ?? []);

  // Haku: la 1.ª frase del caso en la cabecera, la 2.ª en «Cómo funciona», la 3.ª en «La prueba»; el resto, repuesto
  const guia = lector.guia(idioma);
  const propias = guia?.estaciones[slug] ?? [];
  const frases: Record<string, string[]> = {};
  (["caso-cabecera", "caso-como", "caso-prueba"] as const).forEach((k, n) => {
    if (propias[n]) frases[k] = [propias[n]];
  });

  return (
    <>
      <Cabecera idioma={idioma} alterna={rutaCaso(otroIdioma(idioma), slug)} />
      <main id="contenido" className={`pt-14 ${css.caso}`}>
        <Animar>
          <article lang={caso.sinTraducir ? "es-MX" : undefined}>
            <CabeceraCaso caso={caso} idioma={idioma} />

            {forma !== "sin" && principal && (
              <Principal forma={forma} principal={principal} acompana={acompana} textos={intro} idioma={idioma} orden={caso.orden} />
            )}

            {/* La demo interactiva (misma pestaña: la demo trae su «Volver al portafolio») */}
            {caso.demo && (
              <section aria-labelledby="demo" className={css.demo}>
                <div className={css.demoTexto}>
                  <h2 id="demo" className={css.demoTitulo}>
                    {t.demoInteractiva}
                  </h2>
                  <p className={css.demoFrase}>{t.demoFrase}</p>
                </div>
                <p>
                  <a href={caso.demo} className={`boton boton-principal ${css.demoBoton}`}>
                    {t.abrirDemo}
                    <span aria-hidden="true">→</span>
                  </a>
                </p>
              </section>
            )}

            {comoFunciona && (
              <Como
                seccion={comoFunciona}
                escena={caso.escena ?? caso.slug}
                resumen={caso.resumen}
                idioma={idioma}
                estrella={sinMedios}
                intro={sinMedios ? intro : undefined}
              />
            )}

            {/* (las cifras de minecraft-rcon-mcp ya van gigantes en su cabecera, junto a la bóveda) */}
            {(prueba || (cifrasPrueba.length > 0)) && <Prueba seccion={prueba} cifras={cifrasPrueba} titulo={tc.laPrueba} />}

            {resto.length > 0 && <SeVe medios={resto} titulo={t.seVeAsi} idioma={idioma} />}

            {(papel || tecnologia || otras.length > 0) && (
              <Papel
                papel={papel}
                otras={otras}
                tecnologia={tecnologia}
                lista={caso.tecnologia}
                tituloTecnologia={t.tecnologia}
                etiqueta={tc.queHice}
              />
            )}
          </article>

          <Siguiente caso={siguiente} idioma={idioma} rotulo={t.siguienteCaso} />
        </Animar>
      </main>
      <Pie idioma={idioma} />
      <Llegadas />
      <Paralaje />
      {guia && <HakuGuia idioma={idioma} frases={frases} repuesto={guia.repuesto} />}
    </>
  );
}
