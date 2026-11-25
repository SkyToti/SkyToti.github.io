import { useMemo, useState } from "react";
import { FAMILIAS } from "../color";
import { familiaDe } from "../equipo/Equipo";
import Pantalla from "../ui/PantallaCompleta";
import { corto, hh } from "../agenda/datos";
import { directorio, NOMBRE_ORIGEN, type Evento, type PacienteDirectorio } from "../negocio/datos";
import { useTelefono } from "../ui/pantalla";
import type { UnidadId } from "../datos";

const MES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const fechaCorta = (d: Date) => `${d.getDate()} ${MES[d.getMonth()]}`;
/** «hoy, 13:30», «mañana, 9:00» o «26 sep» */
function cuando(d: Date, ahora: Date): string {
  const dias = Math.round((new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() - new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate()).getTime()) / 864e5);
  const hora = d.getHours() ? `, ${hh(d.getHours() + d.getMinutes() / 60)}` : "";
  return dias === 0 ? `hoy${hora}` : dias === 1 ? `mañana${hora}` : fechaCorta(d);
}
/** «hoy», «mañana» o «26 sep» */
const diaDe = (d: Date, ahora: Date) => cuando(new Date(d.getFullYear(), d.getMonth(), d.getDate()), ahora);
/** el punto de una unidad: en las familias claras (tinta oscura) su tono «texto» casi no se ve sobre el papel */
const puntoDe = (u: UnidadId) => {
  const f = FAMILIAS[familiaDe(u)];
  return f.tinta === "oscura" ? f.acento : f.texto;
};
const TIPO: Record<Evento["tipo"], string> = { cita: "Cita", estudio: "Estudio", orden: "Laboratorio", hallazgo: "IA" };
type Filtro = "todos" | "centro" | "norte" | "imagen" | "expediente";

interface Props {
  ahora: Date;
  alCerrar: () => void;
  alAbrirExpediente: (id: string) => void;
  alVerEnAgenda: (fecha: Date) => void;
}

/**
 * Tus pacientes a pantalla completa (BRIEF-4 §4.D): una muestra de ejemplo, con búsqueda y filtros, y la ficha
 * de cada uno con su línea de tiempo (citas, estudios, órdenes del laboratorio y lo que sugirió la IA) y su
 * recorrido por tus unidades («Sigue a un paciente»). Todos ficticios.
 */
export default function Pacientes({ ahora, alCerrar, alAbrirExpediente, alVerEnAgenda }: Props) {
  const lista = useMemo(() => directorio(ahora), [ahora]);
  const telefono = useTelefono();
  const [q, setQ] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [elegido, setElegido] = useState<string | null>(() => (telefono ? null : (lista.find((p) => p.expediente && p.eventos.length > 3)?.nombre ?? lista[0]?.nombre ?? null)));
  const sinAcentos = (s: string) => s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
  const visibles = lista.filter(
    (p) =>
      sinAcentos(p.nombre).includes(sinAcentos(q.trim())) &&
      (filtro === "todos" || (filtro === "expediente" ? !!p.expediente : filtro === "imagen" ? p.eventos.some((e) => e.unidad === "imagen") : p.unidad === filtro)),
  );
  const p = lista.find((x) => x.nombre === elegido) ?? null;
  return (
    <Pantalla
      layoutId="pantalla-pacientes"
      titulo="Pacientes"
      clase="pacientes"
      sub={`${lista.length} pacientes de ejemplo · las bases del ejemplo: 6 mil en Centro y 2 mil en Norte`}
      alCerrar={alCerrar}
      alEsc={() => {
        if (telefono && elegido) {
          setElegido(null);
          return true;
        }
        return false;
      }}
    >
      <div className="pac-cuerpo">
        <div className="pac-lista-col" data-oculta={(telefono && !!p) || undefined}>
          <label className="pac-buscar">
            <span className="visualmente-oculto">Buscar paciente</span>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nombre" name="buscar-paciente" autoComplete="off" />
          </label>
          <div className="pac-filtros" role="group" aria-label="Filtrar">
            {(
              [
                ["todos", "Todos"],
                ["centro", "Centro"],
                ["norte", "Norte"],
                ["imagen", "Imagen Dental"],
                ["expediente", "Con expediente"],
              ] as const
            ).map(([id, nombre]) => (
              <button key={id} type="button" className="agenda-doctor" aria-pressed={filtro === id} onClick={() => setFiltro(id)}>
                {nombre}
              </button>
            ))}
          </div>
          <ul className="pac-lista">
            {visibles.map((x) => {
              const proxima = x.eventos.find((e) => !e.hecho);
              return (
                <li key={x.nombre}>
                  <button type="button" className="pac-fila" data-paciente-dir={x.nombre} aria-pressed={elegido === x.nombre} onClick={() => setElegido(x.nombre)}>
                    <span className="pac-fila-nombre">{x.nombre}</span>
                    <span className="pac-fila-meta">
                      {NOMBRE_ORIGEN[x.unidad]} · {corto(x.doctor)}
                      {x.expediente ? " · expediente" : ""}
                    </span>
                    <span className="pac-fila-proxima">{proxima ? `${proxima.tipo === "orden" ? "Entrega" : "Próxima cita"}: ${cuando(proxima.fecha, ahora)}` : "Sin cita próxima"}</span>
                  </button>
                </li>
              );
            })}
            {visibles.length === 0 && <li className="pac-vacio">Nadie coincide con «{q}». Prueba con otro nombre o quita el filtro.</li>}
          </ul>
        </div>
        {p ? (
          <Ficha p={p} ahora={ahora} alAbrirExpediente={alAbrirExpediente} alVerEnAgenda={alVerEnAgenda} alVolver={telefono ? () => setElegido(null) : undefined} />
        ) : (
          !telefono && <div className="pac-ficha pac-ficha-vacia">Elige a un paciente de la lista para ver su historia.</div>
        )}
      </div>
      <p className="agenda-nota">Muestra de ejemplo · pacientes ficticios · por construir</p>
    </Pantalla>
  );
}

function Ficha({ p, ahora, alAbrirExpediente, alVerEnAgenda, alVolver }: { p: PacienteDirectorio; ahora: Date; alAbrirExpediente: (id: string) => void; alVerEnAgenda: (fecha: Date) => void; alVolver?: () => void }) {
  const proxima = p.eventos.find((e) => !e.hecho);
  const hechos = p.eventos.filter((e) => e.hecho).length;
  // el recorrido por tus unidades: cada cambio de unidad es una estación
  const estaciones = p.eventos.reduce<Evento[]>((a, e) => (a.length && a[a.length - 1].unidad === e.unidad ? a : [...a, e]), []);
  return (
    <section className="pac-ficha" aria-label={`Ficha de ${p.nombre}`} key={p.nombre}>
      {alVolver && (
        <button type="button" className="agenda-hoy pac-volver" onClick={alVolver}>
          ‹ Todos
        </button>
      )}
      <header className="pac-ficha-cabeza" style={{ ["--pac" as string]: puntoDe(p.unidad) }}>
        <h2 className="pac-nombre">{p.nombre}</h2>
        <p className="pac-meta">
          {NOMBRE_ORIGEN[p.unidad]} · {corto(p.doctor)} · paciente ficticio
        </p>
        <div className="agenda-resumen">
          <p className="agenda-cifra">
            <span className="agenda-cifra-valor">{hechos}</span>
            <span className="agenda-cifra-etiqueta">{hechos === 1 ? "visita" : "visitas"}</span>
          </p>
          {proxima && (
            <p className="agenda-cifra">
              <span className="agenda-cifra-valor">{diaDe(proxima.fecha, ahora)}</span>
              <span className="agenda-cifra-etiqueta">
                su próxima {proxima.tipo === "orden" ? "entrega" : "cita"}
                {proxima.fecha.getHours() ? `, ${hh(proxima.fecha.getHours() + proxima.fecha.getMinutes() / 60)}` : ""}
              </span>
            </p>
          )}
        </div>
      </header>

      <div className="pac-hilo" aria-label="Sigue a este paciente: su recorrido por tus unidades">
        <p className="pac-seccion">Sigue a este paciente</p>
        <ol className="pac-estaciones">
          {estaciones.map((e, i) => {
                        const ahoraEs = proxima && e.fecha.getTime() <= proxima.fecha.getTime() && (estaciones[i + 1]?.fecha.getTime() ?? Infinity) > proxima.fecha.getTime();
            return (
              <li key={i} className="pac-estacion" data-ahora={ahoraEs || undefined} data-hecha={e.hecho || undefined}>
                <span className="pac-estacion-punto" style={{ background: puntoDe(e.unidad) }} aria-hidden="true" />
                <span className="pac-estacion-u">{NOMBRE_ORIGEN[e.unidad]}</span>
                <span className="pac-estacion-f">{fechaCorta(e.fecha)}</span>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="pac-linea">
        <p className="pac-seccion">Su historia</p>
        <ol className="pac-eventos">
          {p.eventos.map((e, i) => (
            <li key={i} className="pac-evento" data-hecho={e.hecho || undefined} data-proximo={e === proxima || undefined}>
              <span className="pac-evento-f">{fechaCorta(e.fecha)}</span>
              <span className="pac-evento-punto" aria-hidden="true" />
              <span className="pac-evento-texto">
                <span className="pac-evento-tipo">{TIPO[e.tipo]}</span> {e.que}
                <span className="pac-evento-u"> · {NOMBRE_ORIGEN[e.unidad]}</span>
              </span>
            </li>
          ))}
        </ol>
      </div>

      <div className="agenda-ficha-acciones">
        {p.expediente && (
          <button type="button" className="agenda-accion" onClick={() => alAbrirExpediente(p.expediente!)}>
            Abrir su expediente
          </button>
        )}
        {proxima && proxima.tipo === "cita" && proxima.fecha > ahora && (
          <button type="button" className="agenda-accion" data-secundaria onClick={() => alVerEnAgenda(proxima.fecha)}>
            Ver su cita en la agenda
          </button>
        )}
      </div>
    </section>
  );
}
