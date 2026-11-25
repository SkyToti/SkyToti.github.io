import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, m as motion} from "motion/react";
import { CRECER, crecerDesde } from "../motor/movimiento";
import { pacientesDe } from "../expedientes/datos";
import { useTelefono } from "../ui/pantalla";
import { DIAS, DOCTORES, TURNOS, type Dia, type Turno, type UnidadId } from "../datos";
import { FAMILIAS, fondo } from "../color";
import { familiaDe } from "../equipo/Equipo";
import Retrato from "../equipo/Retrato";
import { IconoRegresar } from "../ui/iconos";
import { Aviso, primeraVez } from "../ui/Aviso";
import { granoURL, useMedida } from "../ui/medida";
import { citasDe, conMiles, corto, DIA_DE_FECHA, diasDelMes, estadoCita, hh, horario, iso, masDias, PACIENTES, semanaDe, sillonesDe, TRATAMIENTOS, turnosDe, type Cita } from "./datos";
import type { CambiosAgenda, VistaAgenda } from "./cambios";

export type { CambiosAgenda, VistaAgenda } from "./cambios";

const UNIDADES_AGENDA: { id: UnidadId; corto: string }[] = [
  { id: "centro", corto: "Centro" },
  { id: "norte", corto: "Norte" },
  { id: "sur", corto: "Sur" },
];
const NOMBRE_UNIDAD: Partial<Record<UnidadId, string>> = { centro: "Centro", norte: "Norte", sur: "Sur" };
const LARGO = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const MES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const mismoDia = (a: Date, b: Date) => iso(a) === iso(b);
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

/** Las citas de una unidad en una fecha, con lo que movió o creó quien usa el demo */
export function citasDelDia(unidad: UnidadId, fecha: Date, hoy: Date, cambios: CambiosAgenda): Cita[] {
  const dia = DIA_DE_FECHA(fecha);
  if (!dia) return [];
  const base = citasDe(unidad, dia, semanaDe(fecha, hoy)).map((c) => (cambios.movidas[c.id] ? { ...c, ...cambios.movidas[c.id] } : c));
  const nuevas = cambios.nuevas.filter((c) => c.fecha === iso(fecha) && c.unidad === unidad).map((c) => (cambios.movidas[c.id] ? { ...c, ...cambios.movidas[c.id] } : c));
  return [...base, ...nuevas];
}

/** Choques: dos citas encimadas en el mismo sillón, o un doctor en dos lugares a la vez */
export function choquesDe(citas: Cita[]): Set<string> {
  const ids = new Set<string>();
  for (let i = 0; i < citas.length; i++)
    for (let j = i + 1; j < citas.length; j++) {
      const a = citas[i];
      const b = citas[j];
      const encima = a.desde < b.desde + b.dura - 0.001 && b.desde < a.desde + a.dura - 0.001;
      if (encima && (a.sillon === b.sillon || a.doctor === b.doctor)) {
        ids.add(a.id);
        ids.add(b.id);
      }
    }
  return ids;
}

interface Props {
  ahora: Date;
  vista: VistaAgenda;
  unidadInicial: UnidadId;
  alVista: (v: VistaAgenda) => void;
  alCerrar: () => void;
  /** si el paciente de una cita tiene expediente, la ficha lo abre */
  alAbrirExpediente?: (id: string) => void;
  cambios: CambiosAgenda;
  alCambios: (c: CambiosAgenda) => void;
  /** abrir en otra fecha (la próxima cita de un paciente) */
  fechaInicial?: Date;
}

type DatosAvisoAgenda = { texto: string; antes?: CambiosAgenda; choque?: boolean; recarga?: boolean } | null;

/**
 * La agenda a pantalla completa (BRIEF-4 §4.C). Día: los sillones por hora, con los turnos y las citas; se
 * arrastran, se crean en un hueco y los choques se señalan y se deshacen. Semana: qué doctor está en qué clínica.
 * Mes: cuánto se llena cada día. Todo de ejemplo; lo que se cambia vive en memoria.
 */
export default function Agenda({ ahora, vista, unidadInicial, fechaInicial, alVista, alCerrar, alAbrirExpediente, cambios, alCambios }: Props) {
  const [unidad, setUnidad] = useState<UnidadId>(unidadInicial);
  const [fecha, setFecha] = useState<Date>(() => {
    const d = fechaInicial ?? ahora;
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  });
  const [ficha, setFicha] = useState<Cita | null>(null);
  const [hueco, setHueco] = useState<{ sillon: number; desde: number; turno: Turno; libreHasta: number } | null>(null);
  const [moviendo, setMoviendo] = useState<{ id: string; desde: number; sillon: number } | null>(null);
  const [aviso, setAviso] = useState<DatosAvisoAgenda>(null);
  const [filtro, setFiltro] = useState<string | null>(null);
  const regresar = useRef<HTMLButtonElement>(null);
  const telefono = useTelefono();
  useEffect(() => {
    const r = requestAnimationFrame(() => regresar.current?.focus({ preventScroll: true }));
    return () => cancelAnimationFrame(r);
  }, []);

  const citas = useMemo(() => citasDelDia(unidad, fecha, ahora, cambios), [unidad, fecha, ahora, cambios]);
  const choques = useMemo(() => choquesDe(citas), [citas]);

  const cambiar = (nuevo: CambiosAgenda, texto: string) => {
    const antes = cambios;
    alCambios(nuevo);
    // si el cambio encima dos citas, el aviso lo dice y se queda hasta que se deshaga o se mueva otra cosa
    const hay = choquesDe(citasDelDia(unidad, fecha, ahora, nuevo));
    const nuevosChoques = [...hay].filter((id) => !choques.has(id));
    if (nuevosChoques.length) {
      const c = citasDelDia(unidad, fecha, ahora, nuevo).find((x) => x.id === nuevosChoques[0])!;
      const otra = citasDelDia(unidad, fecha, ahora, nuevo).find((x) => x.id !== c.id && hay.has(x.id) && x.desde < c.desde + c.dura && c.desde < x.desde + x.dura)!;
      const mismoDoctor = otra && otra.doctor === c.doctor && otra.sillon !== c.sillon;
      setAviso({ texto: mismoDoctor ? `Choque: ${corto(c.doctor)} quedaría en dos sillones a las ${hh(c.desde)}` : `Choque: dos citas encimadas en el sillón ${c.sillon} a las ${hh(c.desde)}`, antes, choque: true, recarga: primeraVez() });
    } else setAviso({ texto, antes, recarga: primeraVez() });
  };
  const mover = (id: string, desde: number, sillon: number) => {
    const c = citas.find((x) => x.id === id);
    if (!c || (c.desde === desde && c.sillon === sillon)) return;
    cambiar({ ...cambios, movidas: { ...cambios.movidas, [id]: { desde, sillon } } }, `${c.paciente}: ${hh(desde)}, sillón ${sillon} · guardado en este demo`);
  };
  const deshacer = () => {
    if (aviso?.antes) alCambios(aviso.antes);
    setAviso(null);
  };
  const cerrarAviso = useCallback(() => setAviso(null), []);

  // teclado: Esc cierra lo de más arriba (el hueco, la ficha, el modo mover y al final la agenda);
  // con una cita en modo mover, las flechas la mueven y Enter la deja
  const estado = useRef({ ficha, hueco, moviendo, cambios, citas });
  estado.current = { ficha, hueco, moviendo, cambios, citas };
  const cerrar = useRef(alCerrar);
  cerrar.current = alCerrar;
  const moverRef = useRef(mover);
  moverRef.current = mover;
  const vistaRef = useRef(alVista);
  vistaRef.current = alVista;
  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      const s = estado.current;
      if (s.moviendo) {
        const m = s.moviendo;
        const c = s.citas.find((x) => x.id === m.id);
        const { inicio, fin } = horario(c?.unidad ?? "centro");
        const n = sillonesDe(c?.unidad ?? "centro");
        const paso: Record<string, [number, number]> = { ArrowLeft: [-0.25, 0], ArrowRight: [0.25, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
        if (paso[e.key] && c) {
          e.preventDefault();
          e.stopImmediatePropagation();
          setMoviendo({ ...m, desde: clamp(m.desde + paso[e.key][0], inicio, fin - c.dura), sillon: clamp(m.sillon + paso[e.key][1], 1, n) });
          return;
        }
        if (e.key === "Enter") {
          e.preventDefault();
          e.stopImmediatePropagation();
          moverRef.current(m.id, m.desde, m.sillon);
          setMoviendo(null);
          return;
        }
      }
      // D, S y M: Día, Semana y Mes (BRIEF-5 §2.B2)
      const atajo = ({ d: "dia", s: "semana", m: "mes" } as const)[e.key.toLowerCase() as "d" | "s" | "m"];
      if (atajo && !s.ficha && !s.hueco && !s.moviendo && !e.metaKey && !e.ctrlKey && !e.altKey && !(e.target as HTMLElement | null)?.matches?.("input, textarea, select")) {
        e.preventDefault();
        vistaRef.current(atajo);
        return;
      }
      if (e.key !== "Escape") return;
      e.stopImmediatePropagation();
      if (s.hueco) setHueco(null);
      else if (s.ficha) setFicha(null);
      else if (s.moviendo) setMoviendo(null);
      else cerrar.current();
    };
    window.addEventListener("keydown", tecla, true);
    return () => window.removeEventListener("keydown", tecla, true);
  }, []);

  const hoy = DIA_DE_FECHA(ahora);
  const h = ahora.getHours() + ahora.getMinutes() / 60;
  const lunes = masDias(fecha, -((fecha.getDay() + 6) % 7));
  const sabado = masDias(lunes, 5);
  const titulo =
    vista === "dia"
      ? `${LARGO[fecha.getDay()]} ${fecha.getDate()} de ${MES[fecha.getMonth()]}`
      : vista === "semana"
        ? `semana del ${lunes.getDate()} ${lunes.getMonth() !== sabado.getMonth() ? `de ${MES[lunes.getMonth()]} ` : ""}al ${sabado.getDate()} de ${MES[sabado.getMonth()]}`
        : `${MES[fecha.getMonth()]} de ${fecha.getFullYear()}`;
  const paso = (s: number) => {
    setFicha(null);
    setMoviendo(null);
    if (vista === "dia") {
      let d = masDias(fecha, s);
      if (d.getDay() === 0) d = masDias(d, s);
      setFecha(d);
    } else if (vista === "semana") setFecha(masDias(fecha, 7 * s));
    else setFecha(new Date(fecha.getFullYear(), fecha.getMonth() + s, 1));
  };
  const esHoy = mismoDia(fecha, ahora);

  return (
    <motion.section
      {...(telefono
        ? { initial: { y: "100%" }, animate: { y: 0 }, exit: { y: "100%" }, transition: { type: "spring" as const, stiffness: 380, damping: 40 } }
        : crecerDesde("agenda"))}
      className="agenda"
      data-telefono={telefono || undefined}
      data-vista={vista}
      role="dialog"
      aria-modal="true"
      aria-label="Agenda"
    >
      <header className="agenda-barra">
        <button ref={regresar} className="detalle-regresar agenda-regresar" type="button" onClick={alCerrar} aria-label="Regresar (Esc)">
          <IconoRegresar tam={18} />
          <span>Regresar</span>
        </button>
        <div className="agenda-vistas" role="tablist" aria-label="Vista de la agenda">
          {(
            [
              ["dia", "Día"],
              ["semana", "Semana"],
              ["mes", "Mes"],
            ] as const
          ).map(([id, nombre]) => (
            <button key={id} type="button" role="tab" aria-selected={vista === id} className="agenda-vista" data-vista={id} aria-keyshortcuts={id[0].toUpperCase()} title={`${nombre} (tecla ${id[0].toUpperCase()})`} onClick={() => alVista(id)}>
              {nombre}
            </button>
          ))}
        </div>
      </header>

      <div className="agenda-cabeza">
        <div>
          <h1 className="agenda-titulo">Agenda</h1>
          {vista !== "semana" ? (
            <div className="agenda-unidades" role="tablist" aria-label="Unidad">
              {UNIDADES_AGENDA.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  role="tab"
                  aria-selected={unidad === u.id}
                  className="agenda-unidad"
                  data-unidad-agenda={u.id}
                  onClick={() => {
                    setUnidad(u.id);
                    setFiltro(null);
                  }}
                >
                  {u.corto}
                </button>
              ))}
            </div>
          ) : (
            <p className="agenda-que">Tus doctores y dónde está cada uno</p>
          )}
        </div>
        <div className="agenda-navega">
          <button type="button" className="agenda-flecha" aria-label="Anterior" onClick={() => paso(-1)}>
            ‹
          </button>
          <p className="agenda-fecha" aria-live="polite">
            {titulo}
          </p>
          <button type="button" className="agenda-flecha" aria-label="Siguiente" onClick={() => paso(1)}>
            ›
          </button>
          <button type="button" className="agenda-hoy" data-hoy-activo={esHoy || undefined} onClick={() => setFecha(new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate()))}>
            Hoy
          </button>
        </div>
      </div>

      {vista === "dia" &&
        (telefono ? (
          <ListaDia unidad={unidad} fecha={fecha} ahora={ahora} citas={citas} choques={choques} alFicha={setFicha} />
        ) : (
          <VistaDia
            unidad={unidad}
            fecha={fecha}
            ahora={ahora}
            hoy={hoy}
            h={h}
            citas={citas}
            choques={choques}
            ficha={ficha}
            alFicha={setFicha}
            moviendo={moviendo}
            filtro={filtro}
            alFiltro={setFiltro}
            alMover={mover}
            alHueco={(s, desde, turno) => {
              if (!turno) return setAviso({ texto: `Nadie atiende el sillón ${s} a las ${hh(desde)}` });
              // el hueco llega hasta la siguiente cita de ese sillón (o el fin del turno): no se enciman citas nuevas
              const siguiente = Math.min(turno.hasta, ...citas.filter((c) => c.sillon === s && c.desde >= desde).map((c) => c.desde));
              if (siguiente - desde < 0.25) return setAviso({ texto: `En el sillón ${s} no cabe una cita a las ${hh(desde)}` });
              setHueco({ sillon: s, desde, turno, libreHasta: siguiente });
            }}
          />
        ))}
      {vista === "semana" && <VistaSemana fecha={fecha} ahora={ahora} hoy={hoy} cambios={cambios} />}
      {vista === "mes" && (
        <VistaMes
          fecha={fecha}
          ahora={ahora}
          unidad={unidad}
          cambios={cambios}
          alElegir={(d) => {
            setFecha(d);
            alVista("dia");
          }}
        />
      )}

      <AnimatePresence>
        {ficha && (
          <FichaCita
            key={ficha.id}
            c={ficha}
            estado={estadoCita(ficha, hoy, h, cuandoEs(fecha, ahora))}
            choque={choques.has(ficha.id)}
            alCerrar={() => setFicha(null)}
            alMover={() => {
              setMoviendo({ id: ficha.id, desde: ficha.desde, sillon: ficha.sillon });
              setFicha(null);
              requestAnimationFrame(() => document.querySelector<HTMLElement>(`[data-cita="${ficha.id}"]`)?.focus());
            }}
            alAbrirExpediente={alAbrirExpediente}
          />
        )}
        {hueco && (
          <FichaNueva
            key="nueva"
            unidad={unidad}
            fecha={fecha}
            hueco={hueco}
            alCerrar={() => setHueco(null)}
            alGuardar={(c) => {
              setHueco(null);
              cambiar({ ...cambios, nuevas: [...cambios.nuevas, { ...c, fecha: iso(fecha) }] }, `Cita nueva: ${c.paciente}, ${hh(c.desde)} · guardada en este demo`);
            }}
          />
        )}
      </AnimatePresence>

      {moviendo && (
        <p className="agenda-instruccion" role="status">
          Moviendo la cita: ← → cada 15 min · ↑ ↓ de sillón · Enter para dejarla · Esc para cancelar
        </p>
      )}
      <AnimatePresence>
        {aviso && (
          <Aviso
            key={aviso.texto}
            aviso={{ texto: aviso.texto, choque: aviso.choque, recarga: aviso.recarga, deshacer: aviso.antes ? deshacer : undefined }}
            alCerrar={cerrarAviso}
          />
        )}
      </AnimatePresence>

      <p className="agenda-nota">
        Agenda de ejemplo · pacientes ficticios · por construir · lo que muevas o crees vive solo en esta pestaña
        {vista === "dia" && unidad === "centro" ? " · hasta 4 doctores en un mismo sillón al día: ejemplo" : ""}
        {vista === "semana" ? " · Varela rota entre las tres clínicas (su agenda, de ejemplo)" : ""}
      </p>
    </motion.section>
  );
}

const cuandoEs = (fecha: Date, ahora: Date): "pasado" | "hoy" | "futuro" => (mismoDia(fecha, ahora) ? "hoy" : fecha < ahora ? "pasado" : "futuro");

/** Una cifra grande y ligera con su etiqueta chica (como las de los mosaicos) */
function Cifra({ valor, etiqueta }: { valor: string | number; etiqueta: string }) {
  return (
    <p className="agenda-cifra">
      <span className="agenda-cifra-valor">{valor}</span>
      <span className="agenda-cifra-etiqueta">{etiqueta}</span>
    </p>
  );
}

interface PropsDia {
  unidad: UnidadId;
  fecha: Date;
  ahora: Date;
  hoy: Dia | null;
  h: number;
  citas: Cita[];
  choques: Set<string>;
  ficha: Cita | null;
  alFicha: (c: Cita | null) => void;
  moviendo: { id: string; desde: number; sillon: number } | null;
  filtro: string | null;
  alFiltro: (id: string | null) => void;
  alMover: (id: string, desde: number, sillon: number) => void;
  alHueco: (sillon: number, desde: number, turno: Turno | null) => void;
}

function VistaDia({ unidad, fecha, ahora, hoy, h, citas, choques, ficha, alFicha, moviendo, filtro, alFiltro, alMover, alHueco }: PropsDia) {
  const [ref, m] = useMedida<HTMLDivElement>();
  const dia = DIA_DE_FECHA(fecha);
  const cuando = cuandoEs(fecha, ahora);
  const turnos = dia ? turnosDe(unidad, dia) : [];
  const n = sillonesDe(unidad);
  const { inicio, fin } = horario(unidad);
  const estados = citas.map((c) => estadoCita(c, hoy, h, cuando));
  const atendidas = estados.filter((e) => e === "atendida").length;
  const porAtender = estados.filter((e) => e === "por atender" || e === "en sillón").length;
  const doctores = [...new Set(turnos.map((t) => t.doctor))];
  const fam = FAMILIAS[familiaDe(unidad)];
  const izq = 96;
  const ancho = Math.max(10, m.w - izq - 8);
  const pxHora = ancho / (fin - inicio);
  const X = (hora: number) => izq + (hora - inicio) * pxHora;
  const horas = Array.from({ length: fin - inicio + 1 }, (_, i) => inicio + i);
  // los carriles llenan el alto (en el iPad vertical quedaba un hueco abajo con el tope de 210 px)
  const carril = n ? Math.max(110, Math.min(320, (m.h - 40) / n - 10)) : 0;
  // arrastrar: el bloque sigue al dedo o al mouse con una transformación; al soltar se guarda donde cayó
  const arrastre = useRef<{ id: string; x0: number; y0: number; desde: number; sillon: number; dura: number; movio: boolean; el: HTMLElement } | null>(null);
  // el clic que llega justo después de soltar un arrastre no abre la ficha (un plazo: si la cita cambió de
  // sillón, su botón se vuelve a montar y ese clic nunca llega; una bandera se quedaba puesta)
  const suprimirHasta = useRef(0);
  const [recienMovida, setRecienMovida] = useState<string | null>(null);
  // al arrastrar, dónde caería la cita: su hora y su sillón, y con quién chocaría (antes de soltar)
  type Previa = { id: string; desde: number; sillon: number; dura: number; choca: string | null };
  const [previa, setPrevia] = useState<Previa | null>(null);
  const previaRef = useRef<Previa | null>(null);
  const fijarPrevia = (p: Previa | null) => {
    previaRef.current = p;
    setPrevia(p);
  };

  if (!dia) return <div className="agenda-vacia">Los domingos no hay consulta.</div>;
  if (!n || !turnos.length)
    return <div className="agenda-vacia">{unidad === "sur" ? "Sur abre pronto: esta semana solo hay preapertura (miércoles y sábado)." : "Este día no hay turnos en esta unidad."}</div>;

  const soltar = (e: React.PointerEvent) => {
    const a = arrastre.current;
    arrastre.current = null;
    fijarPrevia(null);
    if (!a) return;
    a.el.style.translate = "";
    delete a.el.dataset.arrastrando;
    if (!a.movio) return;
    suprimirHasta.current = performance.now() + 300;
    const desde = clamp(a.desde + Math.round(((e.clientX - a.x0) / pxHora) * 4) / 4, inicio, fin - a.dura);
    const sillon = clamp(a.sillon + Math.round((e.clientY - a.y0) / (carril + 10)), 1, n);
    setRecienMovida(a.id);
    requestAnimationFrame(() => requestAnimationFrame(() => setRecienMovida(null)));
    alMover(a.id, desde, sillon);
  };

  return (
    <div className="agenda-dia">
      <div className="agenda-resumen">
        <Cifra valor={citas.length} etiqueta={cuando === "hoy" ? "citas hoy" : "citas"} />
        <Cifra valor={atendidas} etiqueta="atendidas" />
        <Cifra valor={porAtender} etiqueta="por atender" />
        <Cifra valor={n} etiqueta={n === 1 ? "sillón" : "sillones"} />
        <div className="agenda-doctores" role="group" aria-label="Resaltar a un doctor">
          {doctores.map((d) => (
            <button key={d} type="button" className="agenda-doctor" aria-pressed={filtro === d} onClick={() => alFiltro(filtro === d ? null : d)}>
              {corto(d)}
            </button>
          ))}
        </div>
      </div>
      <div className="agenda-lienzo" ref={ref} data-filtro={filtro || undefined}>
        {m.w > 0 && (
          <>
            <div className="agenda-horas" aria-hidden="true">
              {horas.map((hr) => (
                <span key={hr} className="agenda-hora" style={{ left: X(hr) }}>
                  {hr}:00
                </span>
              ))}
            </div>
            {Array.from({ length: n }, (_, i) => i + 1).map((s, i) => {
              const ts = turnos.filter((t) => t.sillon === s);
              const cs = citas.filter((c) => (moviendo?.id === c.id ? moviendo.sillon : c.sillon) === s);
              return (
                <section
                  key={s}
                  className="agenda-carril"
                  data-sillon={s}
                  style={{ top: 30 + i * (carril + 10), height: carril }}
                  aria-label={`Sillón ${s}`}
                  onClick={(e) => {
                    if ((e.target as HTMLElement).closest(".agenda-cita")) return;
                    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
                    const desde = clamp(Math.floor((inicio + (e.clientX - r.left - izq) / pxHora) * 4) / 4, inicio, fin - 0.5);
                    alHueco(s, desde, ts.find((t) => desde >= t.desde && desde < t.hasta) ?? null);
                  }}
                >
                  <div className="tesela-fondo" style={{ backgroundImage: fondo(s === 1 ? "sillones" : s === 2 ? "whatsapp" : "rotan", fam, m.w * 1.2, carril * 1.2, "detalle") }} aria-hidden="true" />
                  <div className="tesela-grano" style={{ backgroundImage: `url(${granoURL()})` }} aria-hidden="true" />
                  {cuando !== "futuro" && <div className="agenda-pasado" style={{ width: cuando === "pasado" ? m.w : Math.max(0, Math.min(m.w, X(clamp(h, inicio, fin)))) }} aria-hidden="true" />}
                  <p className="agenda-sillon">
                    Sillón <span className="agenda-sillon-n">{s}</span>
                  </p>
                  {ts.map((t) => (
                    <div key={t.desde} className="agenda-turno" data-doctor-turno={t.doctor} style={{ left: X(t.desde), width: X(t.hasta) - X(t.desde) }}>
                      <span className="agenda-turno-linea" />
                      <span className="agenda-turno-quien">
                        {corto(t.doctor)} · {t.especialidad.toLowerCase()}
                      </span>
                    </div>
                  ))}
                  {cs.map((c) => {
                    const desde = moviendo?.id === c.id ? moviendo.desde : c.desde;
                    return (
                      <BloqueCita
                        key={c.id}
                        c={c}
                        estado={estadoCita(c, hoy, h, cuando)}
                        x={X(desde)}
                        w={X(desde + c.dura) - X(desde)}
                        abierta={ficha?.id === c.id}
                        choque={choques.has(c.id)}
                        moviendo={moviendo?.id === c.id}
                        atenuada={!!filtro && c.doctor !== filtro}
                        sinAnimar={recienMovida === c.id}
                        onPointerDown={(e) => {
                          if (e.button !== 0 || moviendo) return;
                          arrastre.current = { id: c.id, x0: e.clientX, y0: e.clientY, desde: c.desde, sillon: c.sillon, dura: c.dura, movio: false, el: e.currentTarget as HTMLElement };
                          // el recorrido automático arrastra con un puntero sin captura posible: no pasa nada si falla
                          try {
                            (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
                          } catch {}
                        }}
                        onPointerMove={(e) => {
                          const a = arrastre.current;
                          if (!a) return;
                          const dx = e.clientX - a.x0;
                          const dy = e.clientY - a.y0;
                          if (!a.movio && Math.hypot(dx, dy) < 5) return;
                          a.movio = true;
                          a.el.dataset.arrastrando = "1";
                          a.el.style.translate = `${dx}px ${dy}px`;
                          const desde = clamp(a.desde + Math.round((dx / pxHora) * 4) / 4, inicio, fin - a.dura);
                          const sillon = clamp(a.sillon + Math.round(dy / (carril + 10)), 1, n);
                          const pv = previaRef.current;
                          if (!pv || pv.desde !== desde || pv.sillon !== sillon) {
                            const hip = citas.map((x) => (x.id === a.id ? { ...x, desde, sillon } : x));
                            const ch = choquesDe(hip);
                            const otra = ch.has(a.id) ? hip.find((x) => x.id !== a.id && ch.has(x.id) && x.desde < desde + a.dura && desde < x.desde + x.dura) : undefined;
                            fijarPrevia({ id: a.id, desde, sillon, dura: a.dura, choca: otra ? `${otra.paciente.split(" ")[0]}, ${hh(otra.desde)}` : null });
                          }
                        }}
                        onPointerUp={soltar}
                        onPointerCancel={() => {
                          const a = arrastre.current;
                          arrastre.current = null;
                          fijarPrevia(null);
                          if (a) {
                            a.el.style.translate = "";
                            delete a.el.dataset.arrastrando;
                          }
                        }}
                        alAbrir={() => {
                          if (performance.now() < suprimirHasta.current) return;
                          alFicha(c);
                        }}
                      />
                    );
                  })}
                </section>
              );
            })}
            {previa && (
              <div
                className="agenda-previa"
                data-choca={previa.choca ? "" : undefined}
                style={{ left: X(previa.desde) + 1.5, width: Math.max(8, X(previa.desde + previa.dura) - X(previa.desde) - 3), top: 30 + (previa.sillon - 1) * (carril + 10) + 40, height: carril - 50 }}
                aria-hidden="true"
              >
                <span className="agenda-previa-texto">
                  {hh(previa.desde)} · sillón {previa.sillon}
                  {previa.choca ? ` · choca con ${previa.choca}` : ""}
                </span>
              </div>
            )}
            {cuando === "hoy" &&
              h >= inicio &&
              h <= fin &&
              (() => {
                // la línea de «ahora» se interrumpe sobre la cita en curso: ella ya lo dice con su contorno lima,
                // y la línea le tachaba la hora (medido: 1.2:1 sobre el blanco de «12:45» en el iPad vertical)
                const alto = 30 + n * (carril + 10);
                const cortes = Array.from({ length: n }, (_, i) => i + 1).flatMap((s, i) =>
                  citas.some((c) => c.sillon === s && c.desde <= h && h < c.desde + c.dura) ? [[30 + i * (carril + 10) + 36, 30 + i * (carril + 10) + carril - 6] as const] : [],
                );
                const tramos: [number, number][] = [];
                let y = 0;
                for (const [a, b] of cortes) {
                  tramos.push([y, a]);
                  y = b;
                }
                tramos.push([y, alto]);
                return (
                  <div className="agenda-ahora" style={{ left: X(h), height: alto }} aria-hidden="true">
                    {tramos.map(([a, b]) => (
                      <span key={a} className="agenda-ahora-tramo" style={{ top: a, height: Math.max(0, b - a) }} />
                    ))}
                    <span className="agenda-ahora-hora">{hh(h)}</span>
                  </div>
                );
              })()}
          </>
        )}
      </div>
    </div>
  );
}

interface PropsBloque {
  c: Cita;
  estado: ReturnType<typeof estadoCita>;
  x: number;
  w: number;
  abierta: boolean;
  choque: boolean;
  moviendo: boolean;
  atenuada: boolean;
  sinAnimar: boolean;
  alAbrir: () => void;
  onPointerDown: (e: React.PointerEvent) => void;
  onPointerMove: (e: React.PointerEvent) => void;
  onPointerUp: (e: React.PointerEvent) => void;
  onPointerCancel: () => void;
}

function BloqueCita({ c, estado, x, w, abierta, choque, moviendo, atenuada, sinAnimar, alAbrir, onPointerDown, onPointerMove, onPointerUp, onPointerCancel }: PropsBloque) {
  // ancha: hora, paciente y tratamiento; media: hora y paciente; angosta (menos de media hora a este ancho): la hora de lado
  const tam = w >= 118 ? "ancha" : w >= 56 ? "media" : "angosta";
  // nunca en vertical (BRIEF-5 §2.B2): si «10:30» no cabe en un renglón, va en dos
  const partida = tam === "angosta" && w < 40;
  const [horas, minutos] = hh(c.desde).split(":");
  return (
    <motion.button
      layoutId={`cita-${c.id}`}
      transition={{ layout: sinAnimar || moviendo ? { duration: 0 } : CRECER }}
      type="button"
      className="agenda-cita"
      data-cita={c.id}
      data-estado={estado}
      data-tam={tam}
      data-abierta={abierta || undefined}
      data-choque={choque || undefined}
      data-moviendo={moviendo || undefined}
      data-atenuada={atenuada || undefined}
      data-nueva={c.nueva || undefined}
      onClick={alAbrir}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      style={{ left: x + 1.5, width: Math.max(8, w - 3) }}
      aria-label={`${hh(c.desde)}, ${c.paciente}, ${c.que}, ${estado}${choque ? ", choca con otra cita" : ""}. Arrástrala o ábrela para moverla`}
    >
      <span className="agenda-cita-hora" data-partida={partida || undefined}>
        {horas}
        <span className="agenda-cita-min">:{minutos}</span>
      </span>
      {tam !== "angosta" && <span className="agenda-cita-quien">{tam === "media" ? c.paciente.split(" ")[0] : c.paciente}</span>}
      {tam === "ancha" && <span className="agenda-cita-que">{c.que}</span>}
      {tam === "media" && <span className="agenda-cita-que">{c.que.split(" ")[0]}</span>}
      {estado === "en sillón" && <span className="agenda-cita-ahora" aria-hidden="true" />}
    </motion.button>
  );
}

/** En el teléfono: la lista del día por hora; cada cita abre su ficha (hoja desde abajo) */
function ListaDia({ unidad, fecha, ahora, citas, choques, alFicha }: { unidad: UnidadId; fecha: Date; ahora: Date; citas: Cita[]; choques: Set<string>; alFicha: (c: Cita) => void }) {
  const cuando = cuandoEs(fecha, ahora);
  const hoy = DIA_DE_FECHA(ahora);
  const h = ahora.getHours() + ahora.getMinutes() / 60;
  if (!DIA_DE_FECHA(fecha)) return <div className="agenda-vacia">Los domingos no hay consulta.</div>;
  if (!citas.length) return <div className="agenda-vacia">{unidad === "sur" ? "Sur abre pronto." : "Este día no hay citas."}</div>;
  const orden = [...citas].sort((a, b) => a.desde - b.desde || a.sillon - b.sillon);
  const porHora = new Map<number, Cita[]>();
  for (const c of orden) porHora.set(Math.floor(c.desde), [...(porHora.get(Math.floor(c.desde)) ?? []), c]);
  return (
    <ol className="agenda-lista">
      {[...porHora.entries()].map(([hr, cs]) => (
        <li key={hr} className="agenda-lista-hora" data-ahora={cuando === "hoy" && Math.floor(h) === hr ? "" : undefined}>
          <span className="agenda-lista-h">{hr}:00</span>
          <ul>
            {cs.map((c) => (
              <li key={c.id}>
                <button type="button" className="agenda-lista-cita" data-cita={c.id} data-estado={estadoCita(c, hoy, h, cuando)} data-choque={choques.has(c.id) || undefined} onClick={() => alFicha(c)}>
                  <span className="agenda-lista-quien">
                    {hh(c.desde)} · {c.paciente}
                  </span>
                  <span className="agenda-lista-que">
                    {c.que} · sillón {c.sillon} · {corto(c.doctor)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ol>
  );
}

function VistaSemana({ fecha, ahora, hoy, cambios }: { fecha: Date; ahora: Date; hoy: Dia | null; cambios: CambiosAgenda }) {
  const [ref, m] = useMedida<HTMLDivElement>();
  const telefono = useTelefono();
  const quienes = useMemo(() => ["titular", ...DOCTORES.map((d) => d.id)].filter((id) => TURNOS.some((t) => t.doctor === id)), []);
  const unidades = new Set(TURNOS.map((t) => t.unidad));
  const rotan = DOCTORES.filter((d) => new Set(Object.values(d.agenda)).size > 1);
  const lunes = masDias(fecha, -((fecha.getDay() + 6) % 7));
  const estaSemana = semanaDe(fecha, ahora) === 0;
  const cab = 210;
  const cw = m.w ? (m.w - cab) / DIAS.length : 0;
  // con columnas angostas (el iPad vertical) la hora y las citas van en dos renglones: la fila crece a lo que sobra de alto
  const fila = m.h ? Math.max(40, Math.min(cw < 130 ? 84 : 64, (m.h - 34) / quienes.length)) : 0;
  const celda = (doctor: string, di: number) => {
    const d = DIAS[di].id;
    const ts = TURNOS.filter((t) => t.doctor === doctor && t.dia === d);
    if (!ts.length) return null;
    const dia = masDias(lunes, di);
    const u = ts[0].unidad;
    const citas = ts.reduce((a, t) => a + citasDelDia(t.unidad, dia, ahora, cambios).filter((c) => c.doctor === doctor && c.sillon === t.sillon && c.desde >= t.desde && c.desde < t.hasta).length, 0);
    return { u, citas, desde: Math.min(...ts.map((t) => t.desde)), hasta: Math.max(...ts.map((t) => t.hasta)), pre: ts.some((t) => t.especialidad === "Preapertura") };
  };
  const centro = (fi: number, di: number) => [cab + di * cw + cw / 2, 34 + fi * fila + fila - 5];
  // en el teléfono la rejilla no cabe: una lista por doctor con sus seis días
  if (telefono)
    return (
      <ul className="agenda-semana-lista">
        {quienes.map((id) => {
          const doc = DOCTORES.find((d) => d.id === id);
          return (
            <li key={id} className="agenda-semana-fila">
              <span className="agenda-quien-texto">
                <span className="agenda-quien-nombre">{doc ? corto(id) : "Dr. Robles"}</span>
                <span className="agenda-quien-que">{doc ? doc.especialidad : "Tus clínicas"}</span>
              </span>
              <span className="agenda-semana-dias">
                {DIAS.map((d, di) => {
                  const c = celda(id, di);
                  return (
                    <span
                      key={d.id}
                      className="agenda-semana-chip"
                      data-libre={!c || undefined}
                      data-hoy={(estaSemana && d.id === hoy) || undefined}
                      style={c ? { background: FAMILIAS[familiaDe(c.u)].texto } : undefined}
                      aria-label={`${d.largo}: ${c ? NOMBRE_UNIDAD[c.u] : "libre"}`}
                    >
                      {d.corto[0]}
                    </span>
                  );
                })}
              </span>
            </li>
          );
        })}
      </ul>
    );
  return (
    <div className="agenda-semana">
      <div className="agenda-resumen">
        <Cifra valor={quienes.length} etiqueta="doctores" />
        <Cifra valor={unidades.size} etiqueta="clínicas" />
        <Cifra valor={rotan.length} etiqueta={rotan.length === 1 ? "rota entre ellas" : "rotan entre ellas"} />
      </div>
      <div className="agenda-rejilla" ref={ref}>
        {m.w > 0 && (
          <>
            {DIAS.map((d, di) => (
              <p key={d.id} className="agenda-dia-nombre" data-hoy={(estaSemana && d.id === hoy) || undefined} style={{ left: cab + di * cw, width: cw }}>
                {d.largo} {masDias(lunes, di).getDate()}
                {estaSemana && d.id === hoy && <span className="agenda-dia-hoy"> · hoy</span>}
              </p>
            ))}
            {quienes.map((id, fi) => {
              const doc = DOCTORES.find((d) => d.id === id);
              return (
                <div key={id} className="agenda-fila" style={{ top: 34 + fi * fila, height: fila }}>
                  <div className="agenda-quien" style={{ width: cab - 12 }}>
                    <Retrato iniciales={doc ? doc.iniciales : "R"} tam={Math.min(36, fila - 8)} rota={!!doc && new Set(Object.values(doc.agenda)).size > 1} />
                    <span className="agenda-quien-texto">
                      <span className="agenda-quien-nombre">{doc ? corto(id) : "Dr. Robles"}</span>
                      <span className="agenda-quien-que">{doc ? doc.especialidad : "Tus clínicas"}</span>
                    </span>
                  </div>
                  {DIAS.map((d, di) => {
                    const c = celda(id, di);
                    const fam = c ? FAMILIAS[familiaDe(c.u)] : null;
                    return (
                      <div
                        key={d.id}
                        className="agenda-celda"
                        data-libre={!c || undefined}
                        data-hoy={(estaSemana && d.id === hoy) || undefined}
                        data-pre={c?.pre || undefined}
                        style={{ left: cab + di * cw + 3, width: cw - 6, height: fila - 6 }}
                      >
                        {c && fam && (
                          <>
                            <span className="agenda-celda-fondo" style={{ backgroundImage: fondo("rotan", fam, cw * 1.2, fila * 1.2, "detalle") }} aria-hidden="true" />
                            <span className="agenda-celda-u">{NOMBRE_UNIDAD[c.u]}</span>
                            <span className="agenda-celda-h" data-dos={cw < 130 || undefined}>
                              <span>
                                {hh(c.desde)}–{hh(c.hasta)}
                              </span>
                              {(c.pre || c.citas > 0) && (
                                <>
                                  <span className="agenda-celda-sep"> · </span>
                                  <span>{c.pre ? "preapertura" : `${c.citas} ${c.citas === 1 ? "cita" : "citas"}`}</span>
                                </>
                              )}
                            </span>
                            <span className="agenda-celda-dia" aria-hidden="true">
                              <span className="agenda-celda-tramo" style={{ left: `${((c.desde - 8) / 12) * 100}%`, width: `${((c.hasta - c.desde) / 12) * 100}%` }} />
                            </span>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
            <svg className="agenda-rutas" width={m.w} height={34 + quienes.length * fila} aria-hidden="true">
              {rotan.map((d) => {
                const fi = quienes.indexOf(d.id);
                const pts = DIAS.flatMap((dd, di) => (d.agenda[dd.id] ? [centro(fi, di)] : []));
                return <polyline key={d.id} points={pts.map((p) => p.join(",")).join(" ")} fill="none" className="agenda-ruta" />;
              })}
              {estaSemana &&
                rotan.map((d) => {
                  const fi = quienes.indexOf(d.id);
                  const di = DIAS.findIndex((dd) => dd.id === hoy);
                  if (di < 0 || !d.agenda[DIAS[di].id]) return null;
                  const [x, y] = centro(fi, di);
                  return <circle key={d.id} cx={x} cy={y} r={4} className="agenda-ruta-hoy" />;
                })}
            </svg>
          </>
        )}
      </div>
    </div>
  );
}

/** El mes: cuánto se llena cada día (una línea por sillón) y cuántas citas; tocar un día abre su Día */
function VistaMes({ fecha, ahora, unidad, cambios, alElegir }: { fecha: Date; ahora: Date; unidad: UnidadId; cambios: CambiosAgenda; alElegir: (d: Date) => void }) {
  // sin cambios del demo, los días salen de la caché que se llenó al arrancar (el primer Mes ya no es una tarea larga)
  const sinCambios = !cambios.nuevas.length && !Object.keys(cambios.movidas).length;
  const { dias: datos, semanas } = diasDelMes(unidad, fecha, ahora, sinCambios ? undefined : (d) => citasDelDia(unidad, d, ahora, cambios));
  const total = datos.reduce((a, x) => a + x.citas, 0);
  const lleno = Math.max(1, ...datos.map((x) => x.citas));
  return (
    <div className="agenda-mes">
      <div className="agenda-resumen">
        <Cifra valor={conMiles(total)} etiqueta="citas en el mes" />
        <Cifra valor={datos.filter((x) => x.citas).length} etiqueta="días con consulta" />
      </div>
      <div className="agenda-mes-rejilla" style={{ gridTemplateRows: `auto repeat(${semanas}, minmax(0, 1fr))` }}>
        {["lun", "mar", "mié", "jue", "vie", "sáb", "dom"].map((d) => (
          <p key={d} className="agenda-mes-dia">
            {d}
          </p>
        ))}
        {datos.map(({ fecha: d, iso: clave, num, domingo, fuera, hoy, pasado, citas, ocupado }) => {
          return (
            <button
              key={clave}
              type="button"
              className="agenda-mes-celda"
              data-fuera={fuera || undefined}
              data-domingo={domingo || undefined}
              data-hoy={hoy || undefined}
              data-pasado={pasado || undefined}
              disabled={fuera || domingo}
              onClick={() => alElegir(d)}
              aria-label={`${LARGO[d.getDay()]} ${num}: ${domingo ? "no hay consulta" : `${citas} citas`}`}
            >
              <span className="agenda-mes-num">{num}</span>
              {!fuera && !domingo && citas > 0 && (
                <>
                  <span className="agenda-mes-citas">
                    {citas}
                    <span className="agenda-mes-citas-p"> citas</span>
                  </span>
                  <span className="agenda-mes-lineas" aria-hidden="true" style={{ opacity: 0.45 + 0.55 * (citas / lleno) }}>
                    {ocupado.map((o, i) => (
                      <span key={i} className="agenda-mes-linea">
                        <span style={{ width: `${Math.min(100, o * 100)}%` }} />
                      </span>
                    ))}
                  </span>
                  {/* en el teléfono, una sola barra: la ocupación promedio de los sillones */}
                  <span className="agenda-mes-linea agenda-mes-media" aria-hidden="true" style={{ opacity: 0.45 + 0.55 * (citas / lleno) }}>
                    <span style={{ width: `${Math.min(100, (ocupado.reduce((a, o) => a + o, 0) / Math.max(1, ocupado.length)) * 100)}%` }} />
                  </span>
                </>
              )}
              {!fuera && domingo && <span className="agenda-mes-citas">cerrado</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const DURA = (h: number) => (h < 1 ? `${Math.round(h * 60)} min` : h === 1 ? "1 hora" : `${Math.floor(h)} h ${Math.round((h % 1) * 60)} min`.replace(" 0 min", ""));
const ESTADO_TEXTO: Record<string, string> = { atendida: "Atendida", "no llegó": "No llegó", "en sillón": "En el sillón ahora", "por atender": "Por atender", "otro día": "Otro día" };

/** La ficha de una cita: crece desde su bloque y regresa a él (BRIEF-4 §2) */
function FichaCita({ c, estado, choque, alCerrar, alMover, alAbrirExpediente }: { c: Cita; estado: ReturnType<typeof estadoCita>; choque: boolean; alCerrar: () => void; alMover: () => void; alAbrirExpediente?: (id: string) => void }) {
  const expediente = pacientesDe("todo").find((p) => p.nombre === c.paciente);
  const cerrarRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const r = requestAnimationFrame(() => cerrarRef.current?.focus({ preventScroll: true }));
    return () => cancelAnimationFrame(r);
  }, []);
  return (
    <>
      <motion.div className="agenda-velo" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={alCerrar} aria-hidden="true" />
      <motion.div {...crecerDesde(`cita-${c.id}`)} className="agenda-ficha" role="dialog" aria-label={`Cita de ${c.paciente}`}>
        <div className="agenda-ficha-cuerpo">
          <p className="agenda-ficha-hora">
            {hh(c.desde)}
            <span className="agenda-ficha-dura"> · {DURA(c.dura)}</span>
          </p>
          <h3 className="agenda-ficha-quien">{c.paciente}</h3>
          <p className="agenda-ficha-que">{c.que}</p>
          <dl className="agenda-ficha-datos">
            <div>
              <dt>Doctor</dt>
              <dd>
                {corto(c.doctor)} · {c.especialidad.toLowerCase()}
              </dd>
            </div>
            <div>
              <dt>Lugar</dt>
              <dd>
                {NOMBRE_UNIDAD[c.unidad]}, sillón {c.sillon}
              </dd>
            </div>
            <div>
              <dt>Estado</dt>
              <dd data-estado={estado}>
                {ESTADO_TEXTO[estado]}
                {choque ? " · choca con otra cita" : ""}
              </dd>
            </div>
          </dl>
          <div className="agenda-ficha-acciones">
            <button type="button" className="agenda-accion" data-accion-cita="mover" onClick={alMover}>
              Mover con el teclado
            </button>
            {expediente && alAbrirExpediente && (
              <button type="button" className="agenda-accion" data-secundaria onClick={() => alAbrirExpediente(expediente.id)}>
                Abrir su expediente
              </button>
            )}
            <button ref={cerrarRef} type="button" className="agenda-accion" data-secundaria onClick={alCerrar}>
              Cerrar
            </button>
          </div>
          <p className="agenda-nota">{c.nueva ? "cita creada en este demo" : "paciente ficticio · cita de ejemplo"}</p>
        </div>
      </motion.div>
    </>
  );
}

/** Crear una cita en un hueco: el doctor es el del turno; se guarda solo en esta pestaña */
function FichaNueva({ unidad, fecha, hueco, alCerrar, alGuardar }: { unidad: UnidadId; fecha: Date; hueco: { sillon: number; desde: number; turno: Turno; libreHasta: number }; alCerrar: () => void; alGuardar: (c: Cita) => void }) {
  const lista = TRATAMIENTOS[hueco.turno.especialidad] ?? TRATAMIENTOS.General;
  const maxDura = hueco.libreHasta - hueco.desde;
  const [paciente, setPaciente] = useState("");
  const [que, setQue] = useState(lista[0][0]);
  const [dura, setDura] = useState(Math.min(lista[0][1], maxDura));
  const campo = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const r = requestAnimationFrame(() => campo.current?.focus({ preventScroll: true }));
    return () => cancelAnimationFrame(r);
  }, []);
  const dia = DIA_DE_FECHA(fecha)!;
  return (
    <>
      <motion.div className="agenda-velo" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={alCerrar} aria-hidden="true" />
      <motion.form
        className="agenda-ficha agenda-nueva"
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.97 }}
        transition={{ duration: 0.25 }}
        aria-label="Nueva cita"
        onSubmit={(e) => {
          e.preventDefault();
          alGuardar({
            id: `nueva-${Date.now().toString(36)}`,
            unidad,
            sillon: hueco.sillon,
            dia,
            doctor: hueco.turno.doctor,
            especialidad: hueco.turno.especialidad,
            paciente: paciente.trim() || "Paciente nuevo",
            que,
            desde: hueco.desde,
            dura: Math.min(dura, maxDura),
            nueva: true,
          });
        }}
      >
        <div className="agenda-ficha-cuerpo">
          <p className="agenda-ficha-hora">
            {hh(hueco.desde)}
            <span className="agenda-ficha-dura">
              {" "}
              · sillón {hueco.sillon} · {corto(hueco.turno.doctor)}
            </span>
          </p>
          <h3 className="agenda-ficha-quien">Nueva cita</h3>
          <label className="agenda-campo">
            <span>Paciente</span>
            <input ref={campo} list="agenda-pacientes" value={paciente} onChange={(e) => setPaciente(e.target.value)} placeholder="Nombre ficticio" name="paciente" autoComplete="off" />
            <datalist id="agenda-pacientes">
              {PACIENTES.map((p) => (
                <option key={p} value={p} />
              ))}
            </datalist>
          </label>
          <label className="agenda-campo">
            <span>Tratamiento</span>
            <select
              value={que}
              name="tratamiento"
              onChange={(e) => {
                setQue(e.target.value);
                setDura(Math.min(lista.find((t) => t[0] === e.target.value)?.[1] ?? 0.5, maxDura));
              }}
            >
              {lista.map(([t]) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <label className="agenda-campo">
            <span>Dura</span>
            <select value={dura} name="duracion" onChange={(e) => setDura(Number(e.target.value))}>
              {[0.25, 0.5, 0.75, 1, 1.5, 2].filter((x) => x <= maxDura).map((x) => (
                <option key={x} value={x}>
                  {DURA(x)}
                </option>
              ))}
            </select>
          </label>
          <div className="agenda-ficha-acciones">
            <button type="submit" className="agenda-accion">
              Guardar en este demo
            </button>
            <button type="button" className="agenda-accion" data-secundaria onClick={alCerrar}>
              Cancelar
            </button>
          </div>
          <p className="agenda-nota">se guarda solo en esta pestaña · al recargar desaparece</p>
        </div>
      </motion.form>
    </>
  );
}
