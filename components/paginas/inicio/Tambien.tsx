// Fila + · También (MUNDO.md, «Los escenarios, uno por uno»). Con un solo proyecto (el Cuaderno de repaso), en
// diagonal: «También» gigante arriba a la izquierda y debajo la captura real en una Vista de 50vw (inclinada −2°,
// enlaza al sitio en otra pestaña); arriba a la derecha el cuaderno dibujado a 44vw, inclinado 3° y saliéndose por la
// orilla, que se inclina hacia el cursor y levanta sus hojas al tocarlo; debajo de él, el nombre, la línea y el enlace.
// Con varios proyectos: rótulo «Más trabajo» y una rejilla de capturas a todo lo ancho del relleno.
// La línea viva entra arriba a la izquierda y baja por la orilla izquierda (6vw libres junto a la vista).
// En < 1024 px: todo apilado dentro del relleno (título, texto, vista al 100 %, cuaderno).
import type { Mas } from "@/lib/contenido";
import type { Idioma } from "@/lib/idioma";
import { TEXTOS } from "@/lib/textos";
import Escenario from "./Escenario";
import { TEXTOS_D } from "./textos-d";
import Vista from "./Vista";
import { CuadernoQueSigue } from "./vivos-d";
import css from "./Tambien.module.css";

type Proyecto = Mas["proyectos"][number];

export default function Tambien({ idioma, proyectos, sinTraducir }: { idioma: Idioma; proyectos: Proyecto[]; sinTraducir: boolean }) {
  const t = TEXTOS[idioma];
  const uno = proyectos.length === 1 ? proyectos[0] : undefined;
  return (
    <Escenario
      nombre="tambien"
      lado="izq"
      etiqueta={uno ? t.tambien : t.masTrabajo}
      alto={uno ? "pantalla" : "natural"}
      ancla={{ x: "26px", y: "26px" }}
      className={css.escena}
    >
      <div lang={sinTraducir ? "es-MX" : undefined} className={uno ? css.uno : css.varios}>
        <h2 id="mas-trabajo" className={css.rotulo}>
          {uno ? t.tambien : t.masTrabajo}
        </h2>
        {uno ? <MasUno proyecto={uno} idioma={idioma} /> : <Rejilla proyectos={proyectos} otraPestana={t.otraPestana} />}
      </div>
    </Escenario>
  );
}

function MasUno({ proyecto: p, idioma }: { proyecto: Proyecto; idioma: Idioma }) {
  const t = TEXTOS[idioma];
  const tx = TEXTOS_D[idioma];
  // el Cuaderno de repaso tiene su invento (MUNDO.md, estación 5): el cuaderno con cinta
  const cuaderno = /cuaderno/i.test(p.imagen);
  return (
    <>
      <div className={css.texto}>
        <h3 className={css.nombre}>
          <a href={p.url} target="_blank" rel="noopener" className={css.enlaceNombre}>
            {p.nombre}
            <span aria-hidden="true" className={css.flechita}>
              ↗
            </span>
            <span className="sr-only"> {t.otraPestana}</span>
          </a>
        </h3>
        <p className={css.linea}>{p.linea}</p>
        <a href={p.url} target="_blank" rel="noopener" className={`boton ${css.boton}`}>
          {tx.abrirSitio}
          <span aria-hidden="true" className="font-mono text-ambar">
            ↗
          </span>
          <span className="sr-only">
            : {p.nombre} {t.otraPestana}
          </span>
        </a>
      </div>
      {/* la captura real, en grande: enlaza al sitio (otra pestaña); el nombre accesible es el del proyecto */}
      <a href={p.url} target="_blank" rel="noopener" tabIndex={-1} aria-hidden="true" className={css.vista}>
        <Vista medio={{ tipo: "imagen", src: p.imagen, ancho: 960, alto: 600, alt: p.nombre }} ancho="50vw" inclina={-2} idioma={idioma} />
      </a>
      {cuaderno && <CuadernoQueSigue idioma={idioma} etiqueta={tx.hojear} className={css.cuaderno} />}
    </>
  );
}

function Rejilla({ proyectos, otraPestana }: { proyectos: Proyecto[]; otraPestana: string }) {
  return (
    <ul className={css.rejilla}>
      {proyectos.map((p) => (
        <li key={p.url} className="group relative flex flex-col">
          {/* eslint-disable-next-line @next/next/no-img-element -- sitio estático: <img> con width/height. */}
          <img
            src={p.imagen}
            width={960}
            height={600}
            alt=""
            loading="lazy"
            decoding="async"
            className="aspect-[16/10] w-full rounded-[10px] border border-linea-viva bg-superficie object-cover transition-colors duration-[var(--dur-micro)] group-hover:border-hueso-apagado"
          />
          <h3 className="mt-5 text-xl leading-tight font-semibold">
            <a href={p.url} target="_blank" rel="noopener" className="after:absolute after:inset-0 after:content-[''] group-hover:text-ambar">
              {p.nombre}
              <span aria-hidden="true" className="ml-2 font-mono text-base text-hueso-apagado">
                ↗
              </span>
              <span className="sr-only"> {otraPestana}</span>
            </a>
          </h3>
          <p className="mt-2 text-hueso-apagado">{p.linea}</p>
        </li>
      ))}
    </ul>
  );
}
