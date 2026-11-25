// 1 · La cabecera del caso a pantalla completa (estación `caso-cabecera`). Escritorio: el número del caso gigante detrás
// del título, el título enorme, el resumen, la ficha y los botones a la izquierda; el invento del caso a ~56vw a la
// derecha, saliéndose por la orilla (sin foto pegada: la prueba real va justo debajo, en grande). Celular: apilado.
// Los casos sin capturas usan el invento VIVO del inicio (el invento es su prueba): minecraft-rcon-mcp, la bóveda que se
// gira (y sus dos cifras gigantes en esta primera pantalla); taller-claude, la mesa de los seis cruzando la base, con
// los agentes que saltan al tocarlos.
import InventoPerezoso from "@/components/mundo/InventoPerezoso";
import { INVENTO_DE_CASO } from "@/components/mundo/inventos/registro";
import Escenario, { Numero, Sangra } from "@/components/paginas/inicio/Escenario";
import { BovedaGiratoria, MesaQueSalta } from "@/components/paginas/inicio/escenarios/vivos-b";
import type { Caso } from "@/lib/contenido";
import { rutaInicio, type Idioma } from "@/lib/idioma";
import { TEXTOS } from "@/lib/textos";
import css from "./CabeceraCaso.module.css";
import { TEXTOS_CASO } from "./textos";

export default function CabeceraCaso({ caso, idioma }: { caso: Caso; idioma: Idioma }) {
  const t = TEXTOS[idioma];
  const tc = TEXTOS_CASO[idioma];
  const invento = INVENTO_DE_CASO[caso.slug];
  const vivo = caso.slug === "minecraft-rcon-mcp" ? "boveda" : caso.slug === "taller-claude" ? "mesa" : null;
  const cifras = vivo === "boveda" ? (caso.cifras ?? []).slice(0, 2) : [];
  return (
    <Escenario
      nombre="caso-cabecera"
      lado="der"
      etiqueta={caso.titulo}
      ancla={{ x: "28px", y: "28px" }}
      className={`${css.cabecera} ${vivo === "boveda" ? css.conBoveda : vivo === "mesa" ? css.conMesa : ""}`}
    >
      <Numero n={caso.orden} className={css.numero} />
      <div className={css.texto}>
        <p className={css.volver}>
          <a href={`${rutaInicio(idioma)}#trabajo`} className="rotulo enlace">
            <span aria-hidden="true">← </span>
            {tc.todosLosProyectos}
          </a>
        </p>
        {caso.sinTraducir && (
          <p lang={idioma === "en" ? "en" : undefined} className={css.aviso}>
            {t.sinTraducir}
          </p>
        )}
        {/* sin `data-lineas`: el título es lo más grande de la pantalla (LCP) y se pinta ya, sin esperar a GSAP */}
        <h1 id="titulo" className={`${css.titulo} ${caso.titulo.length > 26 ? css.largo : ""}`}>
          {caso.titulo}
        </h1>
        <p className={css.resumen}>{caso.resumen}</p>
        <dl className={css.ficha} aria-label={tc.ficha}>
          <div className={css.dato}>
            <dt className="rotulo">{t.anio}</dt>
            <dd>{caso.anio}</dd>
          </div>
          <div className={css.dato}>
            <dt className="rotulo">{t.tipo}</dt>
            <dd className={css.tipo}>
              {t.tipos[caso.tipo]}
              {caso.privado && <span className={`rotulo-chico ${css.privado}`}>{t.privado}</span>}
            </dd>
          </div>
          <div className={`${css.dato} ${css.papel}`}>
            <dt className="rotulo">{t.papel}</dt>
            <dd>{caso.papel}</dd>
          </div>
        </dl>
        {(caso.demo || caso.enVivo || caso.repo) && (
          <p className={css.botones}>
            {caso.demo && (
              <a href={caso.demo} className={`boton boton-principal ${css.grande}`}>
                {t.abrirDemo}
                <span aria-hidden="true">→</span>
              </a>
            )}
            {caso.enVivo && (
              <a
                href={caso.enVivo}
                rel="noopener"
                className={`boton ${caso.demo ? "" : "boton-principal"} ${css.grande}`}
              >
                {t.enVivo}
                <span aria-hidden="true">↗</span>
              </a>
            )}
            {caso.repo && (
              <a href={caso.repo} rel="noopener" className={`boton ${css.grande}`}>
                {t.repositorio}
                <span aria-hidden="true">↗</span>
              </a>
            )}
          </p>
        )}
      </div>
      {cifras.length > 0 && (
        <ul className={css.cifras} aria-label={tc.laPrueba}>
          {cifras.map((c) => (
            <li key={c.etiqueta} className={css.cifra}>
              <span className={css.valor}>{c.valor}</span>
              <span className={css.etiqueta}>{c.etiqueta}</span>
            </li>
          ))}
        </ul>
      )}
      {vivo === "boveda" && (
        <Sangra orilla="der" ancho="var(--ancho-invento)" desplaza="var(--sale-invento)" en="var(--arriba-invento)" className={css.invento}>
          <BovedaGiratoria idioma={idioma} />
        </Sangra>
      )}
      {vivo === "mesa" && (
        // la mesa: una ventana que recorta el dibujo de orilla a orilla, en la base de la pantalla
        <div className={css.mesa} data-obstaculo="" data-linea="detras">
          <div className={css.mesaLienzo}>
            <MesaQueSalta idioma={idioma} />
          </div>
        </div>
      )}
      {invento && !vivo && (
        <Sangra
          orilla="der"
          ancho="var(--ancho-invento)"
          desplaza="var(--sale-invento)"
          en="var(--arriba-invento)"
          className={css.invento}
        >
          <InventoPerezoso invento={invento} idioma={idioma} />
        </Sangra>
      )}
    </Escenario>
  );
}
