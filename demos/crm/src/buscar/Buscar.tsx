import { useEffect, useMemo, useRef, useState } from "react";
import { DOCTORES } from "../datos";
import { ORDEN_VISTAS, VISTAS } from "../vista";
import { PACIENTES, NOMBRE_UNIDAD_PACIENTE } from "../expedientes/datos";

export interface Resultado {
  tipo: "unidad" | "doctor" | "paciente" | "dato" | "comando";
  id: string;
  titulo: string;
  sub: string;
  claves: string;
}

const sinAcentos = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Todo lo que se puede buscar: unidades, doctores y los mosaicos (con sus palabras de uso) */
const INDICE: Resultado[] = [
  ...ORDEN_VISTAS.map((id) => ({ tipo: "unidad" as const, id, titulo: VISTAS[id].corto, sub: VISTAS[id].que, claves: `${VISTAS[id].corto} ${VISTAS[id].que} ${id === "sucursal" ? "norte sur sucursal" : ""} ${id === "imagen" ? "rayos x radiologia escaneo" : ""} ${id === "laboratorio" ? "coronas removibles zirconia" : ""}` })),
  ...DOCTORES.map((d) => ({ tipo: "doctor" as const, id: d.id, titulo: d.nombre, sub: d.especialidad, claves: `${d.nombre} ${d.especialidad} ${d.rota ? "rota" : ""}` })),
  ...PACIENTES.map((p) => ({
    tipo: "paciente" as const,
    id: p.id,
    titulo: `${p.nombre} (ficticio)`,
    sub: `${p.motivo} · ${NOMBRE_UNIDAD_PACIENTE[p.unidad]}`,
    claves: `${p.nombre} expediente radiografia diagnostico ia ${p.hallazgos.map((h) => `${h.pieza} ${h.texto}`).join(" ")}`,
  })),
  { tipo: "dato", id: "pacientes", titulo: "Pacientes", sub: "Tus bases de pacientes", claves: "pacientes base expedientes" },
  { tipo: "dato", id: "whatsapp", titulo: "Conversaciones de WhatsApp", sub: "Por día, del 1 al 30", claves: "whatsapp mensajes conversaciones asistente chats" },
  { tipo: "dato", id: "sillones", titulo: "Un sillón, hoy", sub: "Quién pasa por el sillón", claves: "sillones sillon turnos agenda doctores" },
  { tipo: "dato", id: "rotan", titulo: "Doctores que rotan", sub: "Dónde está hoy el que rota", claves: "rotan rotacion varela agenda" },
  { tipo: "dato", id: "laboratorio", titulo: "Órdenes al laboratorio", sub: "Coronas y removibles", claves: "ordenes laboratorio coronas removibles piezas" },
  { tipo: "dato", id: "imagen", titulo: "Referencias a Imagen Dental", sub: "Estudios del mes", claves: "referencias estudios imagen radiografias" },
  { tipo: "dato", id: "expansion", titulo: "Tus planes", sub: "La región y otra ciudad", claves: "planes expansion region ciudad nuevas" },
  { tipo: "dato", id: "hoy", titulo: "Hoy", sub: "La agenda del día", claves: "hoy agenda citas dia" },
];

const TIPOS = { unidad: "Unidad", doctor: "Doctor", paciente: "Expediente", dato: "Dato", comando: "Modo presentación" };

/** El comando escondido del modo presentación: solo aparece si se escribe «recorrido» (BRIEF-5 §2.B1) */
const RECORRIDO: Resultado = { tipo: "comando", id: "recorrido", titulo: "Recorrido guiado", sub: "El demo se enseña solo, capítulo por capítulo", claves: "" };

/**
 * Buscar (BRIEF.md §3.4): un campo que se abre en la cabeza del héroe y una lista corta debajo.
 * No es una paleta de catálogo: escribes, eliges con las flechas y Enter te lleva.
 */
export default function Buscar({ alElegir, alCerrar }: { alElegir: (r: Resultado) => void; alCerrar: () => void }) {
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const campo = useRef<HTMLInputElement>(null);
  useEffect(() => {
    campo.current?.focus();
  }, []);
  const resultados = useMemo(() => {
    const t = sinAcentos(q.trim());
    if (!t) return INDICE.filter((r) => r.tipo === "unidad");
    if (t.length >= 6 && "recorrido".startsWith(t)) return [RECORRIDO];
    return INDICE.filter((r) => sinAcentos(`${r.titulo} ${r.sub} ${r.claves}`).includes(t)).slice(0, 6);
  }, [q]);
  useEffect(() => setSel(0), [q]);
  return (
    <div className="buscar" role="search">
      <input
        ref={campo}
        className="buscar-campo"
        type="search"
        value={q}
        placeholder="Buscar una unidad, un doctor o un dato"
        aria-label="Buscar"
        aria-controls="buscar-lista"
        aria-activedescendant={resultados[sel] ? `r-${resultados[sel].tipo}-${resultados[sel].id}` : undefined}
        onChange={(e) => setQ(e.target.value)}
        onBlur={(e) => {
          if (!e.relatedTarget?.closest(".buscar")) alCerrar();
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setSel((s) => Math.min(resultados.length - 1, s + 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setSel((s) => Math.max(0, s - 1));
          } else if (e.key === "Enter" && resultados[sel]) {
            e.preventDefault();
            alElegir(resultados[sel]);
          } else if (e.key === "Escape") {
            e.preventDefault();
            e.stopPropagation();
            alCerrar();
          }
        }}
      />
      <ul id="buscar-lista" className="buscar-lista" role="listbox" aria-label="Resultados">
        {resultados.length === 0 && <li className="buscar-vacio">Nada con «{q}». Prueba con una unidad, un doctor o «hoy».</li>}
        {resultados.map((r, i) => (
          <li
            key={`${r.tipo}-${r.id}`}
            id={`r-${r.tipo}-${r.id}`}
            role="option"
            aria-selected={i === sel}
            className="buscar-fila"
            tabIndex={-1}
            onMouseEnter={() => setSel(i)}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => alElegir(r)}
          >
            <span className="buscar-titulo">{r.titulo}</span>
            <span className="buscar-sub">
              {TIPOS[r.tipo]} · {r.sub}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
