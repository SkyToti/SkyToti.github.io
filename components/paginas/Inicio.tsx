// Inicio en cualquier idioma (DIRECCION.md §4): Portada → Cotas → Trabajo → Cómo trabajo → Más trabajo →
// Sobre mí → Contacto → Pie. Server Component: todo el texto llega en el HTML; el movimiento lo agrega <Animar>.
// La línea viva (components/mundo/LEEME.md): cada estación lleva `data-estacion` y, dentro, sus `data-ancla`
// (spans vacíos de 1×1 que el CSS coloca donde debe pasar la línea).
// Este archivo solo ensambla: cada sección vive en components/paginas/inicio/ y cada caso de «Trabajo» en
// components/paginas/inicio/escenarios/ (uno por slug), para poder rediseñarlas por separado.
import Animar from "@/components/movimiento/Animar";
import Mundo from "@/components/mundo/Mundo";
import Ambiente from "@/components/mundo/trafico/Ambiente";
import Cabecera from "@/components/paginas/Cabecera";
import Pie from "@/components/paginas/Pie";
import Cifras from "@/components/paginas/inicio/Cifras";
import ComoTrabajo from "@/components/paginas/inicio/ComoTrabajo";
import Contacto from "@/components/paginas/inicio/Contacto";
import HakuDelInicio from "@/components/paginas/inicio/HakuDelInicio";
import Portada from "@/components/paginas/inicio/Portada";
import SobreMi from "@/components/paginas/inicio/SobreMi";
import Tambien from "@/components/paginas/inicio/Tambien";
import Trabajo from "@/components/paginas/inicio/Trabajo";
import { contenido, SECCIONES, seccionDe } from "@/lib/contenido";
import { otroIdioma, rutaInicio, type Idioma } from "@/lib/idioma";
import { personaJsonLd } from "@/lib/metadatos";

export default function Inicio({ idioma }: { idioma: Idioma }) {
  const lector = contenido();
  const perfil = lector.perfil(idioma);
  const casos = lector.casos(idioma);
  const mas = lector.mas(idioma);
  const enUnaLinea = seccionDe(perfil, SECCIONES.enUnaLinea);
  const sobreMi = seccionDe(perfil, SECCIONES.sobreMi);
  const comoTrabajo = seccionDe(perfil, SECCIONES.comoTrabajo);
  const sinTraducir = perfil.sinTraducir ? "es-MX" : undefined;
  // Las frases de Haku (contenido/guia.*.md) van por nombre de estación; los casos se llaman por su slug y en la página
  // su estación es `caso-<slug>` (components/paginas/inicio/LEEME.md): aquí se traduce, sin tocar el contenido.
  const guia = lector.guia(idioma);
  const slugs = new Set(casos.map((c) => c.slug));
  const frases = guia
    ? Object.fromEntries(Object.entries(guia.estaciones).map(([k, v]) => [slugs.has(k) ? `caso-${k}` : k, v]))
    : null;

  return (
    <>
      {/* El fondo del plano a toda la ventana, fijo y detrás de todo (una sola vez por página). */}
      <Ambiente />
      <Cabecera idioma={idioma} alterna={rutaInicio(otroIdioma(idioma))} />
      <main id="contenido" lang={sinTraducir} className="relative isolate">
        <Mundo />
        <Animar>
          <Portada
            idioma={idioma}
            nombre={perfil.nombreCorto ?? perfil.nombre}
            ciudad={perfil.ciudad}
            titular={perfil.titular}
            enUnaLinea={enUnaLinea?.html}
            correo={perfil.correo}
          />
          {perfil.cifras.length > 0 && <Cifras idioma={idioma} cifras={perfil.cifras} />}
          <Trabajo idioma={idioma} casos={casos} />
          {comoTrabajo && <ComoTrabajo idioma={idioma} titulo={comoTrabajo.titulo} html={comoTrabajo.html} />}
          {mas && mas.proyectos.length > 0 && <Tambien idioma={idioma} proyectos={mas.proyectos} sinTraducir={mas.sinTraducir} />}
          {sobreMi && (
            <SobreMi
              idioma={idioma}
              titulo={sobreMi.titulo}
              html={sobreMi.html}
              ficha={{ nombre: perfil.nombre, ciudad: perfil.ciudad, disponibilidad: perfil.disponibilidad, idiomas: perfil.idiomas }}
            />
          )}
          <Contacto idioma={idioma} correo={perfil.correo} github={perfil.github} />
        </Animar>
      </main>
      {/* El pie es la última estación: ahí termina la línea. */}
      <div data-estacion="pie" className="relative">
        <span data-ancla="" aria-hidden="true" className="ancla-pie" />
        <Pie idioma={idioma} />
      </div>
      {frases && <HakuDelInicio idioma={idioma} frases={frases} repuesto={guia?.repuesto} />}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: personaJsonLd(idioma) }} />
    </>
  );
}
