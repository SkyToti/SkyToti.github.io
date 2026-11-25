import { useEffect, useRef } from "react";
import { m as motion, useDragControls } from "motion/react";
import { DIAS, doctorPorId, TITULAR, textoProcedencia } from "../datos";
import { FAMILIAS, fondo } from "../color";
import { IconoRegresar } from "../ui/iconos";
import { granoURL, useMedida } from "../ui/medida";
import { useTelefono } from "../ui/pantalla";
import Retrato from "./Retrato";
import { familiaDe, NOMBRE_UNIDAD } from "./Equipo";
import { crecerDesde } from "../motor/movimiento";

const DIA_HOY = ["dom", "lun", "mar", "mie", "jue", "vie", "sab"] as const;

/**
 * El perfil de un doctor (BRIEF.md §3.4): especialidad, sillón y su agenda de ejemplo dibujada como
 * línea del tiempo (qué día en qué unidad). También el perfil del doctor titular, que abre el botón «R».
 */
export default function Perfil({ id, ahora, alCerrar }: { id: string; ahora: Date; alCerrar: () => void }) {
  const telefono = useTelefono();
  const controles = useDragControls();
  const regresar = useRef<HTMLButtonElement>(null);
  const [ref, m] = useMedida<HTMLElement>();
  useEffect(() => {
    const r = requestAnimationFrame(() => regresar.current?.focus({ preventScroll: true }));
    return () => cancelAnimationFrame(r);
  }, []);
  const d = id === "titular" ? null : doctorPorId(id);
  const fam = FAMILIAS[d ? familiaDe(d.unidad) : "centro"];
  const hoy = DIA_HOY[ahora.getDay()];
  const mov = telefono
    ? {
        initial: { y: "100%" },
        animate: { y: 0 },
        exit: { y: "100%" },
        transition: { type: "spring" as const, stiffness: 380, damping: 40 },
        drag: "y" as const,
        dragListener: false,
        dragControls: controles,
        dragConstraints: { top: 0, bottom: 0 },
        dragElastic: { top: 0, bottom: 0.7 },
        onDragEnd: (_: unknown, info: { offset: { y: number }; velocity: { y: number } }) => {
          if (info.offset.y > 110 || info.velocity.y > 650) alCerrar();
        },
      }
    : crecerDesde(`doctor-${id}`);

  return (
    <motion.section
      {...mov}
      ref={ref as React.Ref<HTMLElement>}
      className="detalle perfil"
      data-perfil={id}
      data-tinta={fam.tinta}
      data-telefono={telefono || undefined}
      role="dialog"
      aria-modal="true"
      aria-label={d ? `Perfil: ${d.nombre}` : "Tu perfil: Dr. Robles (ejemplo)"}
    >
      <div className="tesela-fondo" style={{ backgroundImage: m.w ? fondo("pacientes", fam, m.w * 1.2, m.h * 1.2, "detalle") : undefined }} aria-hidden="true" />
      <div className="tesela-grano" style={{ backgroundImage: `url(${granoURL()})` }} aria-hidden="true" />
      {telefono && (
        <div className="hoja-agarre" onPointerDown={(e) => controles.start(e)} aria-hidden="true">
          <div className="hoja-asa" />
        </div>
      )}
      <div className="detalle-cuerpo">
        <button ref={regresar} className="detalle-regresar" type="button" onClick={alCerrar} aria-label="Regresar (Esc)">
          <IconoRegresar tam={18} />
          <span>Regresar</span>
        </button>
        {d ? (
          <>
            <header className="perfil-cabeza">
              <Retrato iniciales={d.iniciales} rota={d.rota} tam={92} dondeHoy={hoy !== "dom" && d.agenda[hoy] ? ["centro", "norte", "sur"].indexOf(d.agenda[hoy]!) : 0} />
              <div>
                <h2 className="perfil-nombre">{d.nombre}</h2>
                <p className="perfil-especialidad">{d.especialidad}</p>
              </div>
            </header>
            <ol className="perfil-semana" aria-label="Su semana">
              {DIAS.map((x) => {
                const u = d.agenda[x.id];
                return (
                  <li key={x.id} className="perfil-dia" data-hoy={x.id === hoy || undefined} data-libre={!u || undefined}>
                    <span className="perfil-dia-nombre">{x.largo}</span>
                    <span
                      className="perfil-dia-barra"
                      style={u ? { backgroundImage: `linear-gradient(90deg, ${FAMILIAS[familiaDe(u)].texto}, ${FAMILIAS[familiaDe(u)].medio})` } : undefined}
                    />
                    <span className="perfil-dia-unidad">{u ? NOMBRE_UNIDAD[u] : "—"}</span>
                  </li>
                );
              })}
            </ol>
            <div className="detalle-texto">
              <ul className="detalle-datos">
                <li>
                  <span className="detalle-dato">{d.sillon}</span>
                  <span className="detalle-nota">ejemplo</span>
                </li>
                <li>
                  <span className="detalle-dato">{d.nota}</span>
                  <span className="detalle-nota">{"ejemplo"}</span>
                </li>
              </ul>
              <div className="detalle-contexto">
                <p>Nombre ficticio y agenda de ejemplo. El lima marca hoy.</p>
              </div>
            </div>
          </>
        ) : (
          <>
            <header className="perfil-cabeza">
              <Retrato iniciales="R" tam={92} />
              <div>
                <h2 className="perfil-nombre">{TITULAR.nombre}</h2>
                <p className="perfil-especialidad">{TITULAR.rol}</p>
              </div>
            </header>
            <blockquote className="perfil-cita">
              {TITULAR.cita}
              <span className="detalle-nota">{textoProcedencia(TITULAR.citaProcedencia)}</span>
            </blockquote>
            <div className="detalle-texto">
              <ul className="detalle-datos">
                {TITULAR.datos.map((x) => (
                  <li key={x.texto}>
                    <span className="detalle-dato">{x.texto}</span>
                    <span className="detalle-nota">{textoProcedencia(x.procedencia)}</span>
                  </li>
                ))}
              </ul>
              <div className="detalle-contexto">
                <p>
                  {TITULAR.idea} <span className="detalle-nota">{textoProcedencia(TITULAR.ideaProcedencia)}</span>
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </motion.section>
  );
}
