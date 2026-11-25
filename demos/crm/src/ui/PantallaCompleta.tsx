import { useEffect, useRef, type ReactNode } from "react";
import { m as motion} from "motion/react";
import { crecerDesde } from "../motor/movimiento";
import { useTelefono } from "./pantalla";
import { IconoRegresar } from "./iconos";

/**
 * Esc lo atiende solo la pantalla de más arriba: pueden quedar dos abiertas (el armado sobre la bandeja de Imagen
 * Scan) y cada una con su oyente cerraría a la de abajo. Una pila y un solo oyente.
 */
const pila: { current: () => void }[] = [];
function tecla(e: KeyboardEvent) {
  if (e.key !== "Escape" || !pila.length) return;
  e.stopImmediatePropagation();
  pila[pila.length - 1].current();
}

interface Props {
  /** el origen del que crece (BRIEF-4 §2): el botón que la abrió comparte este layoutId */
  layoutId: string;
  titulo: string;
  sub?: ReactNode;
  /** a la derecha de la cabeza (filtros, navegación) */
  lado?: ReactNode;
  clase?: string;
  alCerrar: () => void;
  /** Esc: si devuelve true, ya lo atendió algo de adentro (una ficha, un modo) y la pantalla no se cierra */
  alEsc?: () => boolean;
  children: ReactNode;
}

/**
 * Una pantalla completa en el lenguaje de la agenda: crece desde su origen y regresa a él; en el teléfono es
 * una hoja desde abajo. Esc cierra lo de más arriba y el foco empieza en «Regresar».
 */
export default function Pantalla({ layoutId, titulo, sub, lado, clase, alCerrar, alEsc, children }: Props) {
  const telefono = useTelefono();
  const regresar = useRef<HTMLButtonElement>(null);
  const esc = useRef({ alCerrar, alEsc });
  esc.current = { alCerrar, alEsc };
  useEffect(() => {
    const r = requestAnimationFrame(() => regresar.current?.focus({ preventScroll: true }));
    const propia = {
      current: () => {
        if (esc.current.alEsc?.()) return;
        esc.current.alCerrar();
      },
    };
    pila.push(propia);
    if (pila.length === 1) window.addEventListener("keydown", tecla, true);
    return () => {
      cancelAnimationFrame(r);
      pila.splice(pila.indexOf(propia), 1);
      if (!pila.length) window.removeEventListener("keydown", tecla, true);
    };
  }, []);
  return (
    <motion.section
      {...(telefono
        ? { initial: { y: "100%" }, animate: { y: 0 }, exit: { y: "100%" }, transition: { type: "spring" as const, stiffness: 380, damping: 40 } }
        : crecerDesde(layoutId))}
      className={`agenda pantalla ${clase ?? ""}`}
      data-telefono={telefono || undefined}
      role="dialog"
      aria-modal="true"
      aria-label={titulo}
    >
      <header className="agenda-barra">
        <button ref={regresar} className="detalle-regresar agenda-regresar" type="button" onClick={alCerrar} aria-label="Regresar (Esc)">
          <IconoRegresar tam={18} />
          <span>Regresar</span>
        </button>
      </header>
      <div className="agenda-cabeza">
        <div>
          <h1 className="agenda-titulo">{titulo}</h1>
          {sub && <p className="agenda-que">{sub}</p>}
        </div>
        {lado}
      </div>
      {children}
    </motion.section>
  );
}
