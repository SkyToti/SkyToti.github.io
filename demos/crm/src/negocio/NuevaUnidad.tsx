import { useEffect, useRef, useState } from "react";
import { m as motion} from "motion/react";
import { useTelefono } from "../ui/pantalla";
import { NOMBRE_TIPO, type TipoUnidad } from "../vista";

interface Props {
  alCrear: (d: { nombre: string; tipo: TipoUnidad; sillones: number }) => void;
  alCerrar: () => void;
}

const TIPOS: TipoUnidad[] = ["clinica", "laboratorio", "radiologico"];

/**
 * «Nueva unidad» : nombre, tipo y sillones. Los tipos son
 * de ejemplo. La unidad se crea solo en esta pestaña. No tiene un origen a la
 * vista (la lista del selector ya se cerró), así que entra con un fundido, como todo lo que no tiene origen.
 */
export default function NuevaUnidad({ alCrear, alCerrar }: Props) {
  const telefono = useTelefono();
  const [nombre, setNombre] = useState("");
  const [tipo, setTipo] = useState<TipoUnidad>("clinica");
  const [sillones, setSillones] = useState(2);
  const [error, setError] = useState(false);
  const campo = useRef<HTMLInputElement>(null);
  const cerrar = useRef(alCerrar);
  cerrar.current = alCerrar;
  useEffect(() => {
    const r = requestAnimationFrame(() => campo.current?.focus({ preventScroll: true }));
    const tecla = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopImmediatePropagation();
      cerrar.current();
    };
    window.addEventListener("keydown", tecla, true);
    return () => {
      cancelAnimationFrame(r);
      window.removeEventListener("keydown", tecla, true);
    };
  }, []);
  return (
    <div className="hoja-app" data-telefono={telefono || undefined}>
      <motion.div className="agenda-velo" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={alCerrar} aria-hidden="true" />
      <motion.form
        className="agenda-ficha nueva-unidad"
        role="dialog"
        aria-modal="true"
        aria-label="Nueva unidad"
        {...(telefono
          ? { initial: { y: "100%" }, animate: { y: 0 }, exit: { y: "100%" }, transition: { type: "spring" as const, stiffness: 380, damping: 40 } }
          : { initial: { opacity: 0, scale: 0.97 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 0.97 }, transition: { duration: 0.25 } })}
        onSubmit={(e) => {
          e.preventDefault();
          if (!nombre.trim()) {
            setError(true);
            campo.current?.focus();
            return;
          }
          alCrear({ nombre, tipo, sillones: tipo === "clinica" ? sillones : 1 });
        }}
      >
        <div className="agenda-ficha-cuerpo">
          <h2 className="agenda-ficha-quien nueva-unidad-titulo">Nueva unidad</h2>
          <label className="agenda-campo">
            <span>Nombre</span>
            <input
              ref={campo}
              value={nombre}
              onChange={(e) => {
                setNombre(e.target.value);
                if (e.target.value.trim()) setError(false);
              }}
              placeholder="Por ejemplo, Sucursal Poniente"
              name="nombre-unidad"
              autoComplete="off"
              maxLength={40}
              aria-invalid={error || undefined}
              aria-describedby={error ? "nueva-unidad-error" : undefined}
            />
          </label>
          {error && (
            <p className="nueva-unidad-error" id="nueva-unidad-error">
              Ponle un nombre: así la encuentras en el selector.
            </p>
          )}
          <fieldset className="nueva-unidad-grupo">
            <legend>Tipo</legend>
            <div className="nueva-unidad-opciones">
              {TIPOS.map((t) => (
                <label key={t} className="nueva-unidad-opcion" data-elegida={tipo === t || undefined}>
                  <input type="radio" name="tipo-unidad" value={t} checked={tipo === t} onChange={() => setTipo(t)} />
                  {NOMBRE_TIPO[t]}
                </label>
              ))}
            </div>
          </fieldset>
          {tipo === "clinica" && (
            <fieldset className="nueva-unidad-grupo">
              <legend>Sillones</legend>
              <div className="nueva-unidad-opciones">
                {[1, 2, 3].map((n) => (
                  <label key={n} className="nueva-unidad-opcion" data-elegida={sillones === n || undefined}>
                    <input type="radio" name="sillones-unidad" value={n} checked={sillones === n} onChange={() => setSillones(n)} />
                    {n}
                  </label>
                ))}
              </div>
            </fieldset>
          )}
          <div className="agenda-ficha-acciones">
            <button type="submit" className="agenda-accion">
              Crear en este demo
            </button>
            <button type="button" className="agenda-accion" data-secundaria onClick={alCerrar}>
              Cancelar
            </button>
          </div>
          <p className="agenda-nota">los tipos son de ejemplo · se crea solo en esta pestaña</p>
        </div>
      </motion.form>
    </div>
  );
}
