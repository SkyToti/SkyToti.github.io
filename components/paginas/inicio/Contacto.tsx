// Fila K · Contacto (MUNDO.md, «Los escenarios, uno por uno»): la mesa y el buzón a lo ancho. A la izquierda,
// «Escríbeme» como titular enorme, que es también el botón principal (mailto:); debajo, el correo escrito con
// «Copiar», los dos CV y GitHub. La mesa y el buzón pegado a su orilla (54vw, una sola escena) se salen por la
// esquina de abajo a la derecha, bajo la flecha de «Escríbeme»: Haku empuja el sobre (cuando el guía entra en escena); al copiar el correo baja el
// sello «copiado» (CopiarConSello despacha `correo:copiado`).
// Solo correo, CV y GitHub: sin teléfono ni WhatsApp. La línea viva entra arriba a la izquierda y baja por la orilla
// izquierda hacia el pie. En < 1024 px: apilado, el buzón a todo el ancho debajo.
import Buzon from "@/components/mundo/estaciones/Buzon";
import EnEscena from "@/components/mundo/estaciones/EnEscena";
import type { Idioma } from "@/lib/idioma";
import { CV, TEXTOS } from "@/lib/textos";
import Escenario, { Sangra } from "./Escenario";
import { TEXTOS_D } from "./textos-d";
import { CopiarConSello } from "./vivos-d";
import css from "./Contacto.module.css";

export default function Contacto({ idioma, correo, github }: { idioma: Idioma; correo?: string; github?: string }) {
  const t = TEXTOS[idioma];
  const tx = TEXTOS_D[idioma];
  return (
    <Escenario nombre="contacto" lado="der" etiqueta={t.contacto} ancla={{ x: "26px", y: "26px" }} className={css.escena}>
      <div className={css.texto}>
        <h2 id="contacto" className={`rotulo ${css.rotulo}`}>
          {t.contacto}
        </h2>
        {correo && (
          <>
            <a href={`mailto:${correo}`} className={css.escribeme}>
              <span className={css.palabra}>{t.escribeme}</span>
              <span aria-hidden="true" className={css.flecha}>
                →
              </span>
            </a>
            <div className={css.bloque}>
              <p className="rotulo">{tx.oCopiaElCorreo}</p>
              <p className={css.correo}>
                <span className="text-hueso select-all [overflow-wrap:anywhere]">{correo}</span>
                <CopiarConSello correo={correo} copiar={t.copiar} copiado={t.copiado} noSeCopio={t.noSeCopio} />
              </p>
            </div>
          </>
        )}
        <div className={css.bloque}>
          <p className="rotulo">{tx.masDeMi}</p>
          <ul className={css.botones}>
            <li>
              <a href={CV.es} download hrefLang="es-MX" className="boton">
                {t.cvEs}
              </a>
            </li>
            <li>
              <a href={CV.en} download hrefLang="en" className="boton">
                {t.cvEn}
              </a>
            </li>
            {github && (
              <li>
                <a href={github} rel="noopener me" className="boton">
                  {t.github}
                  <span aria-hidden="true" className="font-mono text-hueso-apagado">
                    ↗
                  </span>
                </a>
              </li>
            )}
          </ul>
        </div>
      </div>
      <Sangra orilla="abajo-der" ancho="var(--ancho-buzon)" desplaza="var(--sale-buzon)" en="-2svh" className={css.buzon}>
        {/* el Haku del buzón espera al guía: al entrar en escena vuelve a empujar el sobre */}
        <EnEscena gesto="envio" reinicio={{ sobre: { x: 0, y: 0, rotation: 0 } }}>
          <Buzon idioma={idioma} />
        </EnEscena>
      </Sangra>
    </Escenario>
  );
}
