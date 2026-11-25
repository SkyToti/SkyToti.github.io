import { useState } from "react";
import type { Vista } from "../vista";
import { citasDe, hhmm } from "../heroe/TiraHoy";
import { DOCTORES } from "../datos";

/** Qué se hace en cada cita (EJEMPLO) y quién la atiende, según la unidad */
const QUE: Record<Vista["id"], string[]> = {
  todo: ["Limpieza", "Valoración", "Resina", "Endodoncia", "Control de brackets", "Panorámica", "Entrega de corona"],
  centro: ["Valoración de implante", "Endodoncia", "Resina", "Prótesis: prueba", "Limpieza", "Extracción"],
  sucursal: ["Limpieza", "Control de brackets", "Consulta", "Resina"],
  imagen: ["Panorámica", "Periapical", "Escaneo intraoral"],
  laboratorio: ["Entrega de corona", "Entrega de removible", "Prueba de color"],
  especialidades: [],
};

const FILAS: Record<Vista["id"], string[]> = {
  todo: ["Centro", "Norte", "Imagen Dental", "Laboratorio"],
  centro: ["Sillón 1", "Sillón 2", "Sillón 3"],
  sucursal: ["Norte, sillón 1", "Norte, sillón 2"],
  imagen: ["Escáner"],
  laboratorio: ["Entregas"],
  especialidades: [],
};

const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

/** Hoy, abierto: una fila por sillón (o equipo) de 8:00 a 20:00; cada bloque es una cita de ejemplo y la línea lima es la hora actual */
export default function HoyDetalle({ vista, ahora }: { vista: Vista; ahora: Date }) {
  const filas = FILAS[vista.id];
  const [sel, setSel] = useState<number | null>(null);
  const citas = citasDe(vista);
  const h = ahora.getHours() + ahora.getMinutes() / 60;
  const domingo = ahora.getDay() === 0;
  const X = (hora: number) => `${(((hora - 8) / 12) * 100).toFixed(2)}%`;
  const que = vista.hoy?.que ?? "citas";
  const dur = que === "citas" ? 0.5 : 0.4;
  const quedan = domingo ? 0 : citas.filter((c) => c > h).length;
  return (
    <>
      <header className="detalle-cabeza">
        <h2 className="detalle-etiqueta">
          Hoy, {DIAS[ahora.getDay()]} {ahora.getDate()} de {MESES[ahora.getMonth()]}
        </h2>
        <p className="detalle-cifra">
          {domingo || !filas.length ? "—" : quedan}
          <span className="tesela-unidad"> {domingo ? "no hay consulta" : !filas.length ? "por mapear" : `de ${citas.length} ${que} por atender`}</span>
        </p>
      </header>
      {filas.length > 0 && !domingo && (
        <div className="hoy-rejilla" role="img" aria-label={`${citas.length} ${que} de ejemplo repartidas en ${filas.length} ${filas.length === 1 ? "fila" : "filas"}; ahora son las ${hhmm(h)}`}>
          {filas.map((fila, i) => (
            <div className="hoy-fila" key={fila}>
              <span className="hoy-lugar">{fila}</span>
              <div className="hoy-pista">
                {citas.map((c, k) =>
                  k % filas.length !== i ? null : (
                    <button
                      key={k}
                      type="button"
                      className="hoy-cita"
                      data-cita={k}
                      data-pasada={c + dur <= h || undefined}
                      data-elegida={sel === k || undefined}
                      style={{ left: X(c), width: `calc(${X(8 + dur)} - 2px)` }}
                      aria-label={`${hhmm(c)}, ${fila}`}
                      onClick={() => setSel(sel === k ? null : k)}
                    />
                  ),
                )}
              </div>
            </div>
          ))}
          <div className="hoy-horas" aria-hidden="true">
            {[8, 10, 12, 14, 16, 18, 20].map((hr) => (
              <span key={hr} style={{ left: X(hr) }}>
                {hr}:00
              </span>
            ))}
          </div>
          {h >= 8 && h <= 20 && (
            <div className="hoy-capa" aria-hidden="true">
              <div className="hoy-ahora" style={{ left: X(h) }}>
                <span>{hhmm(h)}</span>
              </div>
            </div>
          )}
        </div>
      )}
      {sel !== null && citas[sel] !== undefined && (
        <div className="hoy-ficha" role="status">
          <span className="hoy-ficha-hora">{hhmm(citas[sel])}</span>
          <span className="hoy-ficha-que">{QUE[vista.id][sel % Math.max(1, QUE[vista.id].length)]}</span>
          <span className="hoy-ficha-quien">
            {filas[sel % filas.length]} · {DOCTORES[(sel * 3) % DOCTORES.length].nombre} · paciente de ejemplo
          </span>
        </div>
      )}
      <div className="detalle-texto">
        <ul className="detalle-datos">
          <li>
            <span className="detalle-dato">Toca un bloque para ver su cita. Cada bloque es {que === "citas" ? "una cita" : que === "estudios" ? "un estudio" : "una entrega"}; los rellenos ya pasaron</span>
            <span className="detalle-nota">ejemplo</span>
          </li>
          {(vista.id === "centro" || vista.id === "todo") && (
            <li>
              <span className="detalle-dato">Tres sillones en la principal; en cada uno caben hasta 4 doctores al día</span>
              <span className="detalle-nota">ejemplo</span>
            </li>
          )}
        </ul>
        <div className="detalle-contexto">
          <p>La línea lima es la hora actual.</p>
        </div>
      </div>
    </>
  );
}
