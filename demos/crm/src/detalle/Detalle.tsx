import { useEffect, useRef, useState, type ReactNode } from "react";
import { CRECER } from "../motor/movimiento";
import { m as motion, useDragControls } from "motion/react";
import { FAMILIAS, fondo, type FamiliaId, type TeselaId } from "../color";
import { DIAS_WHATSAPP, type Vista } from "../vista";
import { ArcosImagen, ArcosSillon, Elipsoide, Embudo, Helice, PuntosEnLinea, RelojDeArena, type Tinta } from "../graficos/graficos";
import { IconoRegresar } from "../ui/iconos";
import { granoURL, useMedida } from "../ui/medida";
import { useFase } from "../motor/suave";
import { contenido, type Lista } from "./contenido";
import { dondeRota, estadoSillon } from "../mosaico/Mosaico";
import HoyDetalle from "./HoyDetalle";
import { useTelefono } from "../ui/pantalla";

export type DetalleId = TeselaId | "hoy";

interface Props {
  id: DetalleId;
  vista: Vista;
  ahora: Date;
  alCerrar: () => void;
  alMoverse: (m: boolean) => void;
  alAbrirExpediente?: (id: string) => void;
  /** abre la pantalla completa de este mosaico (pacientes, laboratorio, Imagen Dental): crece desde su botón */
  alPantalla?: (id: "pacientes" | "laboratorio" | "imagen") => void;
}

/** Lo que vive dentro del detalle: órdenes que cambian de estado, estudios que abren su expediente, temas con su peso */
function ListaDetalle({ lista, alAbrirExpediente }: { lista: Lista; alAbrirExpediente?: (id: string) => void }) {
  const [paso, setPaso] = useState<Record<number, number>>({});
  return (
    <section className="detalle-lista" aria-label={lista.titulo}>
      <h3 className="exp-subtitulo">{lista.titulo}</h3>
      <ul>
        {lista.filas.map((f, i) => {
          const estado = f.estados?.[(paso[i] ?? 0) % f.estados.length];
          const accion = f.estados ? () => setPaso((p) => ({ ...p, [i]: (p[i] ?? 0) + 1 })) : f.expediente ? () => alAbrirExpediente?.(f.expediente!) : undefined;
          const contenidoFila = (
            <>
              <span className="lista-texto">{f.texto}</span>
              <span className="lista-sub">{f.sub}</span>
              {f.medida !== undefined && (
                <span className="lista-medida" aria-hidden="true">
                  <span className="certeza-linea">
                    <span className="certeza-inicio" />
                    <span className="certeza-punto" style={{ left: `${f.medida * 100}%` }} />
                  </span>
                </span>
              )}
              {estado && (
                <span className="lista-estado" data-estado={estado}>
                  {estado}
                </span>
              )}
              {f.expediente && <span className="lista-ir">Abrir expediente</span>}
            </>
          );
          return (
            <li key={f.texto}>
              {accion ? (
                <button type="button" className="lista-fila" data-fila={i} onClick={accion} aria-label={estado ? `${f.texto}: ${estado}. Toca para cambiar el estado` : undefined}>
                  {contenidoFila}
                </button>
              ) : (
                <div className="lista-fila">{contenidoFila}</div>
              )}
            </li>
          );
        })}
      </ul>
      <p className="detalle-nota">{lista.nota}</p>
    </section>
  );
}

const NOMBRE_CLINICA = ["Centro", "Norte", "Sur"];

/** El gráfico de un mosaico, grande y con escala */
function graficoGrande(id: TeselaId, v: Vista, ahora: Date, m: { w: number; h: number; tinta: Tinta; t: number; sonda: { x: number; y: number } | null }): ReactNode {
  const t = v.teselas;
  const p = { ...m, detalle: true };
  const hora = ahora.getHours() + ahora.getMinutes() / 60;
  switch (id) {
    case "pacientes": {
      const g = t.pacientes.g;
      const esEstudio = v.id === "imagen" || v.id === "laboratorio";
      const n = (x: number) => (x < 0.1 ? "desde cero" : esEstudio ? `${Math.round(x)}` : `${Math.round(x)} mil`);
      return <RelojDeArena {...p} {...g} nombres={g.nombres[0] ? [`${g.nombres[0]} · ${n(g.arriba)}`, `${g.nombres[1]} · ${n(g.abajo)}`] : g.nombres} />;
    }
    case "whatsapp":
      return <Helice {...p} dias={DIAS_WHATSAPP.map((d) => d * t.whatsapp.g.escala)} hoy={Math.min(30, ahora.getDate())} />;
    case "sillones":
      return <ArcosSillon {...p} ahora={ahora.getDay() === 0 ? null : hora} turnos={t.sillones.g.turnos} />;
    case "rotan": {
      const r = dondeRota(ahora);
      return <Elipsoide {...p} puntos={t.rotan.g.puntos} elegido={r} hoy={r < 0 ? "Hoy no hay consulta" : `Varela hoy: ${NOMBRE_CLINICA[r]}`} />;
    }
    case "laboratorio":
      return <Embudo {...p} ordenes={t.laboratorio.g.ordenes} />;
    case "imagen":
      return <ArcosImagen {...p} elegido={t.imagen.g.elegido} fuentes={t.imagen.g.fuentes.map((f) => ({ ...f, nombre: `${f.nombre} ${f.n}`, fuerte: true }))} />;
    case "expansion":
      return <PuntosEnLinea {...p} {...t.expansion.g} />;
  }
}

/**
 * El detalle de un mosaico (BRIEF.md §3.4): el mosaico crece hasta ocupar todo el mosaico
 * (transición de elemento compartido) y su gráfico se vuelve legible, con escala y la línea de hoy.
 * Lo cierran Esc, la flecha de regreso o deslizar hacia abajo. En el teléfono es una hoja que sube.
 */
export default function Detalle({ id, vista, ahora, alCerrar, alMoverse, alAbrirExpediente, alPantalla }: Props) {
  const telefono = useTelefono();
  const controles = useDragControls();
  const regresar = useRef<HTMLButtonElement>(null);
  const [ref, m] = useMedida<HTMLDivElement>();
  const [refT, mt] = useMedida<HTMLElement>();
  const vivo = useRef<HTMLElement>(null);
  const t = useFase(vivo);
  // la sonda también con el dedo: en el detalle se recorre el gráfico para leer cada valor
  const [sonda, setSonda] = useState<{ x: number; y: number } | null>(null);
  const cajaGrafico = useRef<HTMLDivElement | null>(null);
  const sondear = (e: React.PointerEvent) => {
    const caja = cajaGrafico.current?.getBoundingClientRect();
    if (!caja) return;
    const x = e.clientX - caja.left;
    const y = e.clientY - caja.top;
    setSonda(x >= 0 && y >= -10 && x <= caja.width && y <= caja.height + 10 ? { x, y } : null);
  };
  useEffect(() => {
    const r = requestAnimationFrame(() => regresar.current?.focus({ preventScroll: true }));
    return () => cancelAnimationFrame(r);
  }, []);

  // deslizar hacia abajo con el dedo cierra (en el teléfono lo hace el arrastre de la hoja).
  // Con eventos de toque: el navegador puede quedarse el gesto vertical y cancelar el puntero.
  const toque = useRef<{ x: number; y: number } | null>(null);
  const alTocar = {
    onTouchStart: (e: React.TouchEvent) => {
      if (!telefono && e.touches.length === 1) toque.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    },
    onTouchEnd: (e: React.TouchEvent) => {
      const a = toque.current;
      toque.current = null;
      const t = e.changedTouches[0];
      if (a && t && t.clientY - a.y > 90 && Math.abs(t.clientX - a.x) < t.clientY - a.y) alCerrar();
    },
  };

  const esHoy = id === "hoy";
  const tid = (esHoy ? "sillones" : id) as TeselaId;
  const datos = vista.teselas[tid];
  const familia: FamiliaId = esHoy ? (vista.familia === "mezcla" ? "centro" : vista.familia) : (datos.familia ?? (vista.familia === "mezcla" ? "centro" : vista.familia));
  const f = FAMILIAS[familia];
  const c = esHoy ? null : contenido(tid, vista);
  const estado = tid === "sillones" && !esHoy && !datos.fantasma ? estadoSillon(vista.teselas.sillones.g.turnos, ahora) : datos.estado;

  const hoja = telefono
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
    : esHoy
      ? { initial: { opacity: 0, x: 40 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: 40 }, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] as const } }
      : { layoutId: `tesela-${tid}`, transition: { layout: { duration: 0.55, ease: [0.16, 1, 0.3, 1] as const } }, exit: { opacity: 0, transition: { duration: 0.2 } } };

  return (
    <motion.section
      {...hoja}
      className="detalle"
      data-detalle={id}
      data-tinta={f.tinta}
      data-telefono={telefono || undefined}
      role="dialog"
      aria-modal="true"
      aria-label={`Detalle: ${esHoy ? "Hoy" : datos.etiqueta}`}
      ref={(el: HTMLElement | null) => {
        (refT as React.MutableRefObject<HTMLElement | null>).current = el;
        vivo.current = el;
      }}
      onLayoutAnimationStart={() => alMoverse(true)}
      onLayoutAnimationComplete={() => alMoverse(false)}
      {...alTocar}
    >
      <div className="tesela-fondo" style={{ backgroundImage: mt.w ? fondo(esHoy ? "sillones" : tid, f, mt.w * 1.2, mt.h * 1.2, "detalle") : undefined }} aria-hidden="true" />
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
        {esHoy ? (
          <HoyDetalle vista={vista} ahora={ahora} />
        ) : (
          <>
            <header className="detalle-cabeza">
              <h2 className="detalle-etiqueta">{datos.etiqueta}</h2>
              <p className="detalle-cifra">
                {datos.cifra}
                {datos.unidad && <span className="tesela-unidad"> {datos.unidad}</span>}
              </p>
              {estado && <p className="detalle-estado">{estado}</p>}
            </header>
            <div
              className="detalle-grafico"
              ref={(el) => {
                (ref as React.MutableRefObject<HTMLDivElement | null>).current = el;
                cajaGrafico.current = el;
              }}
              data-fantasma={datos.fantasma || undefined}
              onPointerMove={sondear}
              onPointerDown={sondear}
              onPointerLeave={() => setSonda(null)}
            >
              {m.w > 0 && graficoGrande(tid, vista, ahora, { w: m.w, h: m.h, tinta: f.tinta, t, sonda })}
            </div>
            <div className="detalle-texto">
              <ul className="detalle-datos">
                {c!.datos.map((d) => (
                  <li key={d.texto}>
                    <span className="detalle-dato">{d.texto}</span>
                    <span className="detalle-nota">{d.nota}</span>
                  </li>
                ))}
              </ul>
              <div className="detalle-contexto">
                {c!.contexto.map((p) => (
                  <p key={p}>{p}</p>
                ))}
              </div>
            </div>
            {c!.lista && <ListaDetalle lista={c!.lista} alAbrirExpediente={alAbrirExpediente} />}
            {alPantalla && (tid === "pacientes" || tid === "laboratorio" || tid === "imagen") && (
              <motion.button
                layoutId={`pantalla-${tid}`}
                transition={{ layout: CRECER }}
                type="button"
                className="detalle-pantalla"
                data-pantalla={tid}
                onClick={() => alPantalla(tid)}
              >
                {tid === "pacientes" ? "Ver a tus pacientes" : tid === "laboratorio" ? "Abrir el tablero de órdenes" : "Abrir la bandeja de estudios"}
                <span aria-hidden="true"> ↗</span>
              </motion.button>
            )}
          </>
        )}
      </div>
    </motion.section>
  );
}
