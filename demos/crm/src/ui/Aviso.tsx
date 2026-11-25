import { useEffect } from "react";
import { m as motion} from "motion/react";

let dicho = false;
/**
 * El aviso único (BRIEF-4 §4.D): la primera vez que algo cambia en el demo se dice, discreto, que al recargar
 * todo vuelve a su lugar. Se pide al crear el aviso (no al pintarlo), así se dice una sola vez en toda la visita.
 */
/** El recorrido automático guarda y regresa si ya se dijo (al salir, el demo queda como estaba) */
export const avisoDicho = () => dicho;
export const fijarAvisoDicho = (v: boolean) => void (dicho = v);
export function primeraVez(): boolean {
  if (dicho) return false;
  dicho = true;
  return true;
}

export interface DatosAviso {
  texto: string;
  /** hay algo que deshacer */
  deshacer?: () => void;
  /** un choque: se queda hasta que se deshaga o se mueva otra cosa */
  choque?: boolean;
  /** es el primer cambio de la visita: lleva la línea de «al recargar» */
  recarga?: boolean;
}

/** La confirmación discreta de un cambio, con «Deshacer»: la misma en la agenda, el laboratorio y las unidades */
export function Aviso({ aviso, alCerrar, clase }: { aviso: DatosAviso; alCerrar: () => void; clase?: string }) {
  useEffect(() => {
    if (aviso.choque) return;
    const t = window.setTimeout(alCerrar, aviso.recarga ? 8000 : 6000);
    return () => window.clearTimeout(t);
  }, [aviso, alCerrar]);
  return (
    <motion.div
      className={`agenda-aviso ${clase ?? ""}`}
      data-choque={aviso.choque || undefined}
      role="status"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
    >
      <span className="agenda-aviso-texto">
        {aviso.texto}
        {aviso.recarga && <span className="agenda-aviso-recarga">Es un demo: al recargar, todo vuelve a su lugar.</span>}
      </span>
      {aviso.deshacer && (
        <button
          type="button"
          className="agenda-aviso-deshacer"
          onClick={() => {
            aviso.deshacer?.();
            alCerrar();
          }}
        >
          Deshacer
        </button>
      )}
    </motion.div>
  );
}
