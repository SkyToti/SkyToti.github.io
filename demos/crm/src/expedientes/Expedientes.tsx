import { m as motion} from "motion/react";
import { CRECER } from "../motor/movimiento";
import { useState } from "react";
import type { Vista } from "../vista";
import { doctorPorId } from "../datos";
import { pacientesDe, NOMBRE_UNIDAD_PACIENTE } from "./datos";
import type { EstadoExpediente } from "./Expediente";

interface Props {
  vista: Vista;
  estados: Record<string, EstadoExpediente>;
  alAbrir: (id: string) => void;
  /** armar un expediente nuevo y mandárselo a la IA (BRIEF-4 §4.E) */
  alArmar?: () => void;
}

/**
 * La lista de expedientes (pacientes ficticios): quién tiene hallazgos de la IA por revisar,
 * quién ya fue revisado y quién tiene una radiografía nueva sin analizar.
 */
export default function Expedientes({ vista, estados, alAbrir, alArmar }: Props) {
  const [filtro, setFiltro] = useState<"todos" | "revisar">("todos");
  const lista = pacientesDe(vista.id);
  const estadoDe = (id: string, hallazgos: number) => {
    const e = estados[id];
    if (!e || e.estado === "sin analizar") return { clave: "nuevo", texto: "Radiografía nueva sin analizar" };
    if (e.estado === "analizando") return { clave: "analizando", texto: "Analizando…" };
    const pendientes = hallazgos - Object.keys(e.decisiones).length;
    if (hallazgos === 0) return { clave: "limpio", texto: "Sin hallazgos" };
    if (pendientes > 0) return { clave: "revisar", texto: `${pendientes} ${pendientes === 1 ? "hallazgo" : "hallazgos"} por revisar` };
    return { clave: "revisado", texto: "Revisado por el dentista" };
  };
  const visibles = lista.filter((p) => filtro === "todos" || ["revisar", "nuevo", "analizando"].includes(estadoDe(p.id, p.hallazgos.length).clave));
  return (
    <section className="expedientes" aria-label="Expedientes">
      <header className="equipo-cabeza expedientes-cabeza">
        <div>
          <h2 className="equipo-titulo">Expedientes</h2>
          <p className="equipo-sub">
            {lista.length} pacientes ficticios {vista.id === "todo" ? "de tus clínicas" : `de ${vista.corto}`} · el apoyo al diagnóstico con IA está por construir
          </p>
        </div>
        <div className="expedientes-acciones">
        {alArmar && (
          <motion.button layoutId="armar" transition={{ layout: CRECER }} type="button" className="exp-armar" data-armar onClick={alArmar}>
            Armar un expediente
          </motion.button>
        )}
        <div className="filtro" role="group" aria-label="Qué expedientes ver">
          <button type="button" className="agenda-doctor" aria-pressed={filtro === "todos"} onClick={() => setFiltro("todos")}>
            Todos
          </button>
          <button type="button" className="agenda-doctor" aria-pressed={filtro === "revisar"} onClick={() => setFiltro("revisar")}>
            Por revisar
          </button>
        </div>
        </div>
      </header>
      <ul className="exp-lista">
        {visibles.map((p) => {
          const e = estadoDe(p.id, p.hallazgos.length);
          return (
            <li key={p.id}>
              <motion.button layoutId={`paciente-${p.id}`} transition={{ layout: CRECER }} type="button" className="exp-fila" data-paciente={p.id} data-estado={e.clave} onClick={() => alAbrir(p.id)}>
                <span className="exp-fila-nombre">{p.nombre}</span>
                <span className="exp-fila-meta">
                  {p.edad} años · {NOMBRE_UNIDAD_PACIENTE[p.unidad]} · {doctorPorId(p.doctor)?.nombre}
                </span>
                <span className="exp-fila-motivo">{p.motivo}</span>
                <span className="exp-fila-estado">
                  <span className="exp-fila-punto" aria-hidden="true" />
                  {e.texto}
                </span>
              </motion.button>
            </li>
          );
        })}
        {visibles.length === 0 && <li className="exp-vacio">Nada por revisar en {vista.corto}.</li>}
      </ul>
    </section>
  );
}
