import { useEffect, useMemo, useRef, useState } from "react";
import { m as motion} from "motion/react";
import Odontograma from "../expedientes/Odontograma";
import { Certeza } from "../expedientes/Expediente";
import { COLOR_CLINICO, NOMBRE_SUPERFICIE, NOMBRE_TIPO_CLINICO } from "../expedientes/clinica";
import { NOMBRE_UNIDAD_PACIENTE } from "../expedientes/datos";
import { useMedida } from "../ui/medida";
import { movimientoReducido } from "../motor/bucle";
import Escribe from "./Escribe";
import Radiografia from "./Radiografia";
import { ESTUDIOS_DIBUJADOS, leer, type Armado, type Lectura } from "./lectura";

interface Props {
  armado: Armado;
  /** el id del expediente que se va a crear (los hallazgos lo llevan) */
  id: string;
  alVolver: () => void;
  alLlevar: (l: Lectura) => void;
}

type Pregunta = "primero" | "paciente";
const PREGUNTA: Record<Pregunta, string> = { primero: "¿Qué atiendo primero?", paciente: "Explícaselo al paciente" };

/** El expediente armado, como tarjeta: lo primero que «recibe» la IA */
function Tarjeta({ a }: { a: Armado }) {
  const [ref, m] = useMedida<HTMLDivElement>();
  return (
    <article className="chat-tarjeta" aria-label={`Expediente de ${a.nombre}`}>
      <p className="chat-tarjeta-nombre">{a.nombre}</p>
      <p className="chat-tarjeta-meta">
        {a.edad ? `${a.edad} años · ` : ""}
        {NOMBRE_UNIDAD_PACIENTE[a.unidad]} · paciente ficticio
      </p>
      <p className="chat-tarjeta-motivo">{a.motivo.trim() || "Sin motivo escrito"}</p>
      {a.antecedentes.length > 0 && (
        <ul className="chat-tarjeta-antecedentes" aria-label="Antecedentes">
          {a.antecedentes.map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ul>
      )}
      {a.marcas.length > 0 && (
        <div ref={ref} className="odo-medida chat-tarjeta-odonto">
          {m.w > 0 && <Odontograma marcas={a.marcas} elegida={null} alElegir={() => {}} ancho={m.w} etiqueta="Odontograma inicial" leyenda="armado" />}
        </div>
      )}
      <ul className="chat-tarjeta-estudios" aria-label="Estudios">
        {ESTUDIOS_DIBUJADOS.filter((e) => a.estudios.includes(e.id)).map((e) => (
          <li key={e.id}>
            <span className="radio-mini" aria-hidden="true">
              <Radiografia tipo={e.id} w={112} h={62} />
            </span>
            {e.nombre}
          </li>
        ))}
      </ul>
      {a.notas.trim() && <p className="chat-tarjeta-notas">{a.notas.trim()}</p>}
    </article>
  );
}

/**
 * El pseudo-chat con la IA (BRIEF-4 §4.E): el expediente sale como tarjeta, la IA «lee» por pasos con texto
 * que se escribe y responde un resumen y sus hallazgos (certeza, zona y tipo) con la leyenda de la NOM.
 * Todo guionado (lectura.ts): 0 peticiones a internet.
 */
export default function Chat({ armado, id, alVolver, alLlevar }: Props) {
  const l = useMemo(() => leer(armado, id), [armado, id]);
  const [paso, setPaso] = useState(0);
  const [etapa, setEtapa] = useState<"leyendo" | "resumen" | "hallazgos" | "lista">("leyendo");
  const [preguntas, setPreguntas] = useState<Pregunta[]>([]);
  const [respondidas, setRespondidas] = useState(0);
  const hilo = useRef<HTMLDivElement>(null);
  const llevar = useRef<HTMLButtonElement>(null);

  // los hallazgos entran uno tras otro; luego aparecen las acciones
  useEffect(() => {
    if (etapa !== "hallazgos") return;
    const t = window.setTimeout(() => setEtapa("lista"), movimientoReducido() ? 0 : l.hallazgos.length * 260 + 380);
    return () => window.clearTimeout(t);
  }, [etapa, l.hallazgos.length]);
  useEffect(() => {
    if (etapa === "lista") llevar.current?.focus({ preventScroll: true });
  }, [etapa]);
  // el hilo baja solo mientras la IA escribe (en el teléfono se recorre la hoja entera: por eso scrollIntoView)
  useEffect(() => {
    hilo.current?.querySelector(".chat-lista > :last-child")?.scrollIntoView({ block: "end", behavior: movimientoReducido() ? "auto" : "smooth" });
  }, [paso, etapa, preguntas.length, respondidas]);

  const entra = (i: number) => ({ initial: { opacity: 0, y: 6 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.3, delay: i * 0.26 } });
  return (
    <div className="chat" data-lectura={etapa}>
      {/* lo que mandaste se queda a la vista (a la izquierda en pantallas anchas) mientras la IA escribe */}
      <aside className="chat-expediente" aria-label="Lo que le mandaste a la IA">
        <p className="chat-quien">Tú</p>
        <Tarjeta a={armado} />
      </aside>
      <div className="chat-hilo" ref={hilo}>
        <ol className="chat-lista">
          <li className="chat-msg chat-ia">
            <p className="chat-quien">
              IA del concepto <span className="exp-marca chat-marca">por construir</span>
            </p>
            <ol className="chat-pasos" aria-label="Lo que la IA revisa">
              {l.pasos.slice(0, paso + 1).map((t, i) => {
                const hecho = i < paso || etapa !== "leyendo";
                return (
                  <li key={i} className="chat-paso" data-hecho={hecho || undefined}>
                    <span className="chat-paso-marca" aria-hidden="true" />
                    {hecho ? t : <Escribe texto={t} alTerminar={() => (i === l.pasos.length - 1 ? setEtapa("resumen") : setPaso(i + 1))} />}
                  </li>
                );
              })}
            </ol>
          </li>
          {etapa !== "leyendo" && (
            <li className="chat-msg chat-ia">
              <p className="chat-quien">Resumen</p>
              <p className="chat-texto">{etapa === "resumen" ? <Escribe texto={l.resumen} alTerminar={() => setEtapa("hallazgos")} /> : l.resumen}</p>
              {etapa !== "resumen" && l.hallazgos.length > 0 && (
                <ul className="chat-hallazgos" aria-label="Sugerencias de la IA">
                  {l.hallazgos.map((h, i) => (
                    <motion.li key={h.id} className="chat-hallazgo" data-hallazgo-chat={h.id} {...entra(i)}>
                      <span className="chat-hallazgo-pieza" style={{ ["--clinico" as string]: COLOR_CLINICO.rojo }}>
                        {h.pieza}
                      </span>
                      <span className="chat-hallazgo-cuerpo">
                        <span className="chat-hallazgo-texto">{h.texto}</span>
                        <span className="chat-hallazgo-zona">
                          cara {NOMBRE_SUPERFICIE[h.superficie]} · {NOMBRE_TIPO_CLINICO[h.tipo]} · sugerido por la IA
                        </span>
                        <Certeza valor={h.certeza} />
                      </span>
                    </motion.li>
                  ))}
                </ul>
              )}
              {etapa !== "resumen" && (
                <p className="chat-nom">
                  «Se sugiere que lo valore el dentista»<span className="chat-nom-fuente"> la leyenda de la NOM · la IA sugiere, decides tú</span>
                </p>
              )}
            </li>
          )}
          {preguntas.map((q, i) => (
            <li key={q} className="chat-par">
              <div className="chat-msg chat-tu chat-pregunta">{PREGUNTA[q]}</div>
              <div className="chat-msg chat-ia">
                <p className="chat-texto">{i < respondidas ? l[q] : <Escribe texto={l[q]} alTerminar={() => setRespondidas(i + 1)} />}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
      <div className="chat-pie" data-visible={etapa === "lista" || undefined}>
        {etapa === "lista" && (
          <>
            <div className="chat-sugeridas" role="group" aria-label="Preguntas sugeridas">
              {(["primero", "paciente"] as Pregunta[])
                .filter((q) => !preguntas.includes(q))
                .map((q) => (
                  <button key={q} type="button" className="arm-chip" disabled={respondidas < preguntas.length} onClick={() => setPreguntas((x) => [...x, q])}>
                    {PREGUNTA[q]}
                  </button>
                ))}
            </div>
            <div className="chat-acciones">
              <button ref={llevar} type="button" className="agenda-accion chat-llevar" onClick={() => alLlevar(l)} disabled={!l.hallazgos.length && !armado.marcas.length}>
                Llevar al expediente
              </button>
              <button type="button" className="agenda-accion" data-secundaria onClick={alVolver}>
                Volver al armado
              </button>
            </div>
          </>
        )}
        <p className="agenda-nota">Respuestas guionadas para este demo: no sale nada a internet · apoyo al diagnóstico por construir · paciente ficticio, radiografías dibujadas</p>
      </div>
    </div>
  );
}
