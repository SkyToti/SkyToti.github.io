import { useEffect, useRef, useState } from "react";
import { m as motion, useDragControls } from "motion/react";
import { FAMILIAS, fondo } from "../color";
import { IconoRegresar } from "../ui/iconos";
import { granoURL, useMedida } from "../ui/medida";
import { useTelefono } from "../ui/pantalla";
import { doctorPorId } from "../datos";
import { suscribir, movimientoReducido } from "../motor/bucle";
import Panoramica from "./Panoramica";
import { crecerDesde } from "../motor/movimiento";
import Odontograma, { type MarcaPieza } from "./Odontograma";
import { ausentesDe, estadoDeHallazgo, NOMBRE_UNIDAD_PACIENTE, pacientePorId, tratadasDe, type Decision } from "./datos";
import { colorClaroDe, colorDe, NOMBRE_ESTADO, NOMBRE_SUPERFICIE } from "./clinica";

export interface EstadoExpediente {
  estado: "sin analizar" | "analizando" | "analizado";
  decisiones: Record<string, Decision>;
}

interface Props {
  id: string;
  estado: EstadoExpediente;
  alAnalizar: () => void;
  alTerminarAnalisis: () => void;
  alDecidir: (hallazgo: string, d: Decision | null) => void;
  foco: string | null;
  alFoco: (id: string | null) => void;
  /** la pieza que se ve en la muela; tocar una pieza en el odontograma o un hallazgo la cambia */
  pieza: number | null;
  alPieza: (n: number) => void;
  alCerrar: () => void;
}

/** La certeza de la IA: una línea de 0 a 100 con su punto lima (como la escala «1 · 100» de la referencia) */
export function Certeza({ valor }: { valor: number }) {
  return (
    <span className="certeza" role="img" aria-label={`Certeza de la sugerencia: ${Math.round(valor * 100)} %`}>
      <span className="certeza-linea">
        <span className="certeza-inicio" />
        <span className="certeza-punto" style={{ left: `${valor * 100}%` }} />
      </span>
      <span className="certeza-valor">{Math.round(valor * 100)} %</span>
    </span>
  );
}

const DURACION_ANALISIS = 2.6;

/**
 * El expediente de un paciente ficticio con el apoyo al diagnóstico de la IA (por construir):
 * la radiografía panorámica dibujada, «Analizar con IA», los hallazgos que confirma o descarta el
 * dentista (la NOM: «se sugiere que lo valore el dentista») y el historial de visitas.
 */
export default function Expediente({ id, estado, alAnalizar, alTerminarAnalisis, alDecidir, foco, alFoco, pieza, alPieza, alCerrar }: Props) {
  const p = pacientePorId(id)!;
  const telefono = useTelefono();
  const controles = useDragControls();
  const regresar = useRef<HTMLButtonElement>(null);
  const [refT, mt] = useMedida<HTMLElement>();
  const [refP, mp] = useMedida<HTMLDivElement>();
  const [refO, mo] = useMedida<HTMLDivElement>();
  const [avance, setAvance] = useState(estado.estado === "analizado" ? 1 : 0);
  const terminar = useRef(alTerminarAnalisis);
  terminar.current = alTerminarAnalisis;
  useEffect(() => {
    const r = requestAnimationFrame(() => regresar.current?.focus({ preventScroll: true }));
    return () => cancelAnimationFrame(r);
  }, []);

  // el análisis: la línea recorre la radiografía y los hallazgos aparecen a su paso
  useEffect(() => {
    if (estado.estado !== "analizando") return;
    if (movimientoReducido()) {
      setAvance(1);
      const t = window.setTimeout(() => terminar.current(), 400);
      return () => window.clearTimeout(t);
    }
    let t0 = -1;
    let hecho = false;
    const fuera = suscribir((t) => {
      if (t0 < 0) t0 = t;
      const u = Math.min(1, (t - t0) / DURACION_ANALISIS);
      setAvance(u);
      if (u >= 1 && !hecho) {
        hecho = true;
        fuera();
        terminar.current();
      }
    });
    return fuera;
  }, [estado.estado]);

  const fam = FAMILIAS[p.unidad === "norte" ? "sucursal" : p.unidad === "imagen" ? "imagen" : "centro"];
  const doctor = doctorPorId(p.doctor);
  const hallazgos = p.hallazgos.map((h) => ({ ...h, decision: estado.decisiones[h.id] }));
  const pendientes = hallazgos.filter((h) => !h.decision).length;
  // el odontograma: lo que registró el dentista y lo que sugiere la IA (si ya se analizó), pieza por pieza
  const marcasOdonto: MarcaPieza[] = [
    ...p.registros.map((r) => ({ pieza: r.pieza, superficie: r.superficie, estado: r.estado, tipo: r.tipo })),
    ...(estado.estado === "analizado"
      ? hallazgos.flatMap((h) => {
          const e = estadoDeHallazgo(h.decision);
          return e ? [{ pieza: h.pieza, superficie: h.superficie, estado: e, tipo: h.tipo }] : [];
        })
      : []),
  ];
  const panoH = Math.max(150, Math.min(260, mp.w * 0.42));

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
    : crecerDesde(`paciente-${id}`);

  return (
    <motion.section
      {...mov}
      ref={refT as React.Ref<HTMLElement>}
      className="detalle expediente"
      data-expediente={id}
      data-tinta={fam.tinta}
      data-telefono={telefono || undefined}
      role="dialog"
      aria-modal="true"
      aria-label={`Expediente de ${p.nombre}, paciente ficticio`}
    >
      <div className="tesela-fondo" style={{ backgroundImage: mt.w ? fondo("pacientes", fam, mt.w * 1.2, mt.h * 1.2, "detalle") : undefined }} aria-hidden="true" />
      <div className="tesela-grano" style={{ backgroundImage: `url(${granoURL()})` }} aria-hidden="true" />
      {telefono && (
        <div className="hoja-agarre" onPointerDown={(e) => controles.start(e)} aria-hidden="true">
          <div className="hoja-asa" />
        </div>
      )}
      <div className="detalle-cuerpo expediente-cuerpo">
        <button ref={regresar} className="detalle-regresar" type="button" onClick={alCerrar} aria-label="Regresar (Esc)">
          <IconoRegresar tam={18} />
          <span>Regresar</span>
        </button>
        <header className="exp-cabeza">
          <h2 className="exp-nombre">{p.nombre}</h2>
          <p className="exp-meta">
            {p.edad} años · {NOMBRE_UNIDAD_PACIENTE[p.unidad]} · {doctor?.nombre ?? "—"}
          </p>
          <p className="exp-motivo">{p.motivo}</p>
          <p className="detalle-nota">paciente ficticio · expediente de ejemplo</p>
        </header>

        <section className="exp-odonto" aria-label="Odontograma">
          <div className="exp-odonto-cabeza">
            <h3 className="exp-subtitulo">Odontograma</h3>
            <span className="detalle-nota">numeración FDI · colores de la convención clínica · ejemplo</span>
          </div>
          <div ref={refO} className="odo-medida">
            {mo.w > 0 && <Odontograma marcas={marcasOdonto} elegida={pieza} alElegir={alPieza} ancho={mo.w} />}
          </div>
        </section>

        <div className="exp-panel">
          <div className="exp-panel-cabeza">
            <span className="exp-panel-titulo">Radiografía panorámica</span>
            {estado.estado === "sin analizar" && (
              <button className="exp-analizar" type="button" onClick={alAnalizar}>
                <span className="exp-analizar-punto" aria-hidden="true" />
                Analizar con IA
              </button>
            )}
            {estado.estado === "analizando" && (
              <span className="exp-estado" role="status">
                Analizando… {Math.round(avance * 100)} %
              </span>
            )}
            {estado.estado === "analizado" && (
              <span className="exp-estado" role="status">
                {hallazgos.length === 0 ? "Sin hallazgos" : pendientes ? `${hallazgos.length} hallazgos · ${pendientes} por revisar` : "Revisado por el dentista"}
              </span>
            )}
          </div>
          <div className="exp-pano" ref={refP} style={{ height: panoH }}>
            {mp.w > 0 && (
              <Panoramica
                w={mp.w}
                h={panoH}
                tratadas={tratadasDe(p)}
                ausentes={ausentesDe(p)}
                hallazgos={hallazgos}
                estado={estado.estado}
                avance={avance}
                foco={foco}
                alFoco={alFoco}
                alPieza={alPieza}
              />
            )}
          </div>
          <p className="exp-panel-nota">Dibujo hecho para el concepto: no es una radiografía real</p>
        </div>

        <section className="exp-ia" aria-label="Apoyo al diagnóstico">
          <h3 className="exp-subtitulo">
            Apoyo al diagnóstico <span className="exp-marca">por construir</span>
          </h3>
          <p className="exp-nom">
            «Se sugiere que lo valore el dentista»
            <span className="detalle-nota"> la leyenda de la NOM</span>
          </p>
          {estado.estado === "sin analizar" && <p className="exp-vacio">La radiografía de hoy todavía no se revisa. «Analizar con IA» la recorre pieza por pieza.</p>}
          {estado.estado === "analizando" && <p className="exp-vacio">La IA está revisando pieza por pieza…</p>}
          {estado.estado === "analizado" && hallazgos.length === 0 && <p className="exp-vacio">Sin hallazgos en esta radiografía.</p>}
          {estado.estado === "analizado" && hallazgos.length > 0 && (
            <ul className="hallazgos">
              {hallazgos.map((h) => (
                <li
                  key={h.id}
                  className="hallazgo"
                  data-hallazgo={h.id}
                  data-decision={h.decision ?? "por revisar"}
                  data-activo={foco === h.id || undefined}
                  data-estado={estadoDeHallazgo(h.decision) ?? "descartado"}
                  onPointerEnter={() => alFoco(h.id)}
                  onPointerLeave={() => alFoco(null)}
                  onClick={(e) => {
                    if ((e.target as HTMLElement).closest("button")) return;
                    alPieza(h.pieza);
                    alFoco(h.id);
                  }}
                >
                  <span
                    className="hallazgo-pieza"
                    aria-label={`Pieza ${h.pieza}`}
                    style={{ ["--clinico" as string]: (fam.tinta === "clara" ? colorClaroDe : colorDe)(estadoDeHallazgo(h.decision) ?? "sugerido") }}
                  >
                    {h.pieza}
                  </span>
                  <div className="hallazgo-cuerpo">
                    <p className="hallazgo-texto">{h.texto}</p>
                    <p className="hallazgo-cara">
                      {NOMBRE_SUPERFICIE[h.superficie]} · {NOMBRE_ESTADO[estadoDeHallazgo(h.decision) ?? "sugerido"]}
                    </p>
                    <Certeza valor={h.certeza} />
                    <span className="detalle-nota">
                      {h.decision === "confirmado" ? "confirmado por el dentista" : h.decision === "realizado" ? "hecho, según el dentista" : h.decision === "descartado" ? "descartado por el dentista" : "sugerencia de la IA · ejemplo"}
                    </span>
                  </div>
                  <div className="hallazgo-acciones">
                    <button type="button" aria-pressed={h.decision === "confirmado"} onClick={() => alDecidir(h.id, h.decision === "confirmado" ? null : "confirmado")}>
                      Confirmar
                    </button>
                    <button type="button" aria-pressed={h.decision === "descartado"} onClick={() => alDecidir(h.id, h.decision === "descartado" ? null : "descartado")}>
                      Descartar
                    </button>
                    {(h.decision === "confirmado" || h.decision === "realizado") && (
                      <button type="button" aria-pressed={h.decision === "realizado"} onClick={() => alDecidir(h.id, h.decision === "realizado" ? "confirmado" : "realizado")}>
                        Hecho
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
          <p className="detalle-nota">Sin tomografías en este concepto</p>
        </section>

        <section className="exp-historial" aria-label="Historial">
          <h3 className="exp-subtitulo">Historial</h3>
          <ol className="historial">
            {p.visitas.map((v) => (
              <li key={v.fecha + v.que} className="visita">
                <span className="visita-fecha">{v.fecha}</span>
                <span className="visita-que">{v.que}</span>
                <span className="visita-quien">{doctorPorId(v.doctor)?.nombre}</span>
              </li>
            ))}
            {p.proxima && (
              <li className="visita" data-proxima>
                <span className="visita-fecha">{p.proxima}</span>
                <span className="visita-que">Próxima cita</span>
                <span className="visita-quien">{doctor?.nombre}</span>
              </li>
            )}
          </ol>
          <p className="detalle-nota">fechas de ejemplo</p>
        </section>
      </div>
    </motion.section>
  );
}
