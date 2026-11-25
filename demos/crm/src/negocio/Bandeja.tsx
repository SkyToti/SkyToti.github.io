import { m as motion} from "motion/react";
import Pantalla from "../ui/PantallaCompleta";
import { CRECER } from "../motor/movimiento";
import { NOMBRE_ORIGEN, type Estudio } from "./datos";
import { FAMILIAS } from "../color";

/** de dónde viene: el tono de su clínica, o un gris cálido si lo mandó otro dentista */
const ORIGEN: Record<Estudio["origen"], string> = { centro: FAMILIAS.centro.texto, norte: FAMILIAS.sucursal.texto, externo: FAMILIAS.especialidades.medio };

interface Props {
  estudios: Estudio[];
  alEstudios: (e: Estudio[]) => void;
  alCerrar: () => void;
  /** mandar el estudio al expediente de su paciente: lo abre para analizarlo */
  alAbrirExpediente: (id: string) => void;
  /** si el paciente no tiene expediente, se arma uno (BRIEF-4 §4.E) */
  alArmarExpediente?: (e: Estudio) => void;
}

/**
 * La bandeja de Imagen Dental (BRIEF-4 §4.D): los estudios de hoy, de dónde vienen y adónde van. Mandar un
 * estudio al expediente de su paciente lo abre, listo para el análisis de la IA (por construir).
 * Todo es de ejemplo: los estudios, los pacientes y su origen.
 */
export default function Bandeja({ estudios, alEstudios, alCerrar, alAbrirExpediente, alArmarExpediente }: Props) {
  const porRevisar = estudios.filter((e) => e.estado === "Por revisar").length;
  const externos = estudios.filter((e) => e.origen === "externo").length;
  return (
    <Pantalla layoutId="pantalla-imagen" titulo="Imagen Dental" clase="bandeja" sub="Los estudios de hoy: de dónde vienen y a qué expediente van" alCerrar={alCerrar}>
      <div className="ban-cuerpo">
        <div className="agenda-resumen">
          <p className="agenda-cifra">
            <span className="agenda-cifra-valor">{estudios.length}</span>
            <span className="agenda-cifra-etiqueta">estudios hoy</span>
          </p>
          <p className="agenda-cifra">
            <span className="agenda-cifra-valor">{porRevisar}</span>
            <span className="agenda-cifra-etiqueta">por revisar</span>
          </p>
          <p className="agenda-cifra">
            <span className="agenda-cifra-valor">{externos}</span>
            <span className="agenda-cifra-etiqueta">de otros dentistas</span>
          </p>
        </div>
        <ol className="ban-lista">
          {estudios.map((e) => (
            <li key={e.id} className="ban-fila" data-estudio={e.id} data-estado-estudio={e.estado}>
              <span className="ban-hora">{e.hora}</span>
              <span className="ban-texto">
                <span className="ban-tipo">{e.tipo}</span>
                <span className="ban-quien">
                  <span className="ban-punto" style={{ background: ORIGEN[e.origen] }} aria-hidden="true" />
                  {e.paciente} · de {NOMBRE_ORIGEN[e.origen]}
                </span>
              </span>
              <span className="ban-estado">{e.estado}</span>
              {e.estado === "Por revisar" && e.expediente && (
                <button
                  type="button"
                  className="agenda-accion"
                  onClick={() => {
                    alEstudios(estudios.map((x) => (x.id === e.id ? { ...x, estado: "En el expediente" } : x)));
                    alAbrirExpediente(e.expediente!);
                  }}
                >
                  Mandar a su expediente
                </button>
              )}
              {e.estado === "Por revisar" && !e.expediente && alArmarExpediente && (
                <motion.button
                  layoutId={"armar-" + e.id}
                  transition={{ layout: CRECER }}
                  type="button"
                  className="agenda-accion"
                  data-secundaria
                  data-armar-estudio={e.id}
                  onClick={() => alArmarExpediente(e)}
                >
                  Armar su expediente
                </motion.button>
              )}
              {e.estado === "En el expediente" && e.expediente && (
                <button type="button" className="agenda-accion" data-secundaria onClick={() => alAbrirExpediente(e.expediente!)}>
                  Abrir el expediente
                </button>
              )}
            </li>
          ))}
        </ol>
      </div>
      <p className="agenda-nota">Estudios de ejemplo · pacientes ficticios · las radiografías del concepto son dibujos</p>
    </Pantalla>
  );
}
