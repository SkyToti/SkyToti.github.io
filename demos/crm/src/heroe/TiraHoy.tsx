import { m as motion} from "motion/react";
import { useDependenciaCubierta } from "../ui/cubierta";
import { FAMILIAS } from "../color";
import { CRECER } from "../motor/movimiento";
import { IconoAbrir } from "../ui/iconos";
import type { Vista } from "../vista";

/** Las citas (o estudios, o entregas) de hoy en la unidad: EJEMPLO, repartidas de 8:30 a 19:45 */
export function citasDe(vista: Vista): number[] {
  if (!vista.hoy || vista.hoy.vacia) return [];
  const n = vista.hoy.lugares === 1 ? 12 : vista.hoy.lugares * 10 + 1;
  return Array.from({ length: n }, (_, i) => {
    const base = 8.5 + (11.25 * i) / (n - 1);
    const vaiven = 0.12 * Math.sin(i * 2.3 + vista.id.length);
    return Math.round((base + vaiven) * 4) / 4;
  });
}

/** mezcla dos colores hexadecimales (a=0 → el primero) */
function mezcla(a: string, b: string, t: number): string {
  const x = parseInt(a.slice(1), 16);
  const y = parseInt(b.slice(1), 16);
  const c = (s: number) => Math.round(((x >> s) & 255) * (1 - t) + ((y >> s) & 255) * t);
  return `rgb(${c(16)}, ${c(8)}, ${c(0)})`;
}

export const hhmm = (h: number) => `${Math.floor(h)}:${String(Math.round((h % 1) * 60)).padStart(2, "0")}`;

/**
 * La tira de hoy (como «Today's Data»): el día de 8:00 a 20:00; lo que ya pasó lleva el degradado
 * de la unidad, cada punto es una cita y el bloque lima es la hora actual.
 */
export default function TiraHoy({ ahora, vista, alAbrir }: { ahora: Date; vista: Vista; alAbrir?: () => void }) {
  const f = FAMILIAS[vista.familia === "mezcla" ? "centro" : vista.familia];
  const domingo = ahora.getDay() === 0;
  const h = ahora.getHours() + ahora.getMinutes() / 60;
  const u = Math.max(0, Math.min(1, (h - 8) / 12));
  const X = (hora: number) => `${(((hora - 8) / 12) * 100).toFixed(2)}%`;
  const citas = citasDe(vista);
  const que = vista.hoy?.que ?? "citas";
  const cubierta = useDependenciaCubierta();
  const quedan = domingo ? 0 : citas.filter((c) => c > h).length;
  const sub = !vista.hoy ? "Por mapear" : vista.hoy.vacia ? `Sin ${que} todavía` : domingo ? "Hoy no hay consulta" : `${quedan} de ${citas.length} ${que} por atender`;
  return (
    <motion.section layoutId="agenda" layoutDependency={cubierta} transition={{ layout: CRECER }} className="tira" aria-label="Hoy" data-oscura={f.tinta === "oscura" || undefined}>
      <div className="tira-texto">
        <h2 className="tira-titulo">Hoy</h2>
        <p className="tira-sub">{sub}</p>
      </div>
      <div className="tira-pista">
        <div
          className="tira-pasado"
          style={{ width: `${(u * 100).toFixed(2)}%`, backgroundImage: `linear-gradient(90deg, ${f.texto}, ${mezcla(f.texto, f.medio, 0.5)})` }}
        />
        {[8, 10, 12, 14, 16, 18, 20].map((hr) => (
          <span key={hr} className="tira-hora" style={{ left: X(hr) }} data-pasada={hr <= h || undefined}>
            {hr}:00
          </span>
        ))}
        {!domingo && citas.map((c, i) => <span key={i} className="tira-cita" style={{ left: X(c) }} data-pasada={c <= h || undefined} />)}
        {!domingo && h >= 8 && h <= 20 && (
          <span className="tira-ahora" style={{ left: X(h) }}>
            {hhmm(h)}
          </span>
        )}
      </div>
      {/* una unidad recién creada no tiene agenda todavía: sin la flecha */}
      {!vista.hoy?.vacia && (
        <button className="boton-icono tira-abrir" type="button" aria-label="Abrir la agenda" data-abrir="hoy" onClick={alAbrir}>
          <IconoAbrir tam={18} />
        </button>
      )}
    </motion.section>
  );
}
