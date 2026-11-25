/**
 * Armar un expediente y mandárselo a la IA (BRIEF-4 §4.E). TODO ES GUIONADO: no hay modelo ni internet;
 * lo que «lee» la IA sale de reglas fijas sobre lo que se armó (motivo, antecedentes, marcas y estudios),
 * así responde a lo que pusiste sin inventar que existe. El apoyo al diagnóstico está por construir; la IA
 * sugiere y decide el dentista (la leyenda de la NOM: «se sugiere que lo valore el dentista»).
 * Pacientes ficticios siempre (regla 6); las radiografías son dibujos.
 */
import type { Hallazgo, Paciente, Registro } from "../expedientes/datos";
import { nombrePieza, NOMBRE_SUPERFICIE, type Superficie, type TipoClinico } from "../expedientes/clinica";

export type EstudioDibujado = "panoramica" | "periapical" | "aleta";
export const ESTUDIOS_DIBUJADOS: { id: EstudioDibujado; nombre: string; que: string }[] = [
  { id: "panoramica", nombre: "Panorámica", que: "toda la boca" },
  { id: "periapical", nombre: "Periapical", que: "una pieza y su raíz" },
  { id: "aleta", nombre: "Aleta de mordida", que: "las coronas de atrás" },
];
/** El tipo de un estudio de la bandeja de Imagen Dental, como estudio dibujado (el escaneo intraoral no es radiografía) */
export function estudioDeBandeja(tipo: string): EstudioDibujado | null {
  if (tipo.startsWith("Panor")) return "panoramica";
  if (tipo.startsWith("Periapical")) return "periapical";
  if (tipo.startsWith("Aleta")) return "aleta";
  return null;
}

export const ANTECEDENTES = ["Diabetes", "Hipertensión", "Alergia a la penicilina", "Toma anticoagulantes", "Fuma", "Embarazo"];
export const MOTIVOS = ["Dolor al masticar", "Revisión", "Sensibilidad al frío", "Valoración para implante"];

export interface MarcaArmado {
  pieza: number;
  superficie: Superficie;
  estado: "por-tratar" | "realizado";
  tipo: TipoClinico;
}

export interface Armado {
  nombre: string;
  edad: number;
  unidad: Paciente["unidad"];
  motivo: string;
  antecedentes: string[];
  marcas: MarcaArmado[];
  estudios: EstudioDibujado[];
  notas: string;
}

/** Qué tipo de marca deja el pincel en cada zona: rojo = por tratar, azul = realizado */
export function tipoDeMarca(superficie: Superficie, estado: MarcaArmado["estado"], ausente = false): TipoClinico {
  if (ausente) return estado === "realizado" ? "ausente" : "extraccion";
  if (superficie === "conducto") return "endodoncia";
  return estado === "realizado" ? "restauracion" : "caries";
}

export interface Lectura {
  /** lo que la IA «lee», paso por paso */
  pasos: string[];
  resumen: string;
  hallazgos: Hallazgo[];
  /** respuestas guionadas a las dos preguntas sugeridas */
  primero: string;
  paciente: string;
}

const pct = (c: number) => `${Math.round(c * 100)} %`;
const lista = (xs: string[]) => (xs.length < 2 ? xs.join("") : `${xs.slice(0, -1).join(", ")} y ${xs.at(-1)}`);

/** La lectura guionada de un expediente armado */
export function leer(a: Armado, id: string): Lectura {
  const faltan = new Set(a.marcas.filter((m) => m.tipo === "ausente" || m.tipo === "extraccion").map((m) => m.pieza));
  const libre = (p: number, s: Superficie) => !faltan.has(p) && !a.marcas.some((m) => m.pieza === p && m.superficie === s);
  const elige = (candidatas: number[], s: Superficie) => candidatas.find((p) => libre(p, s));
  const riesgo = a.antecedentes.some((x) => x === "Diabetes" || x === "Fuma");
  const porTratar = a.marcas.filter((m) => m.estado === "por-tratar" && m.tipo !== "extraccion");
  const hs: Hallazgo[] = [];

  // la pieza que más le preocupa al dentista: la de más marcas por tratar (si no marcó nada, el primer molar de abajo)
  const cuenta = new Map<number, number>();
  for (const m of porTratar) cuenta.set(m.pieza, (cuenta.get(m.pieza) ?? 0) + 1);
  const foco = [...cuenta.entries()].sort((x, y) => y[1] - x[1])[0]?.[0] ?? elige([36, 46, 16, 26], "oclusal") ?? 36;

  if (a.estudios.includes("panoramica")) {
    const conducto = a.marcas.find((m) => m.superficie === "conducto" && m.estado === "realizado" && libre(m.pieza, "periapical"));
    const p = conducto?.pieza ?? elige([46, 36, 16, 26], "periapical");
    if (p)
      hs.push({
        id: `${id}-pano-apice`,
        pieza: p,
        texto: conducto ? "Imagen periapical en una pieza con conducto: a vigilar" : "Posible imagen periapical",
        certeza: conducto ? 0.71 : 0.62,
        superficie: "periapical",
        tipo: "lesion-periapical",
      });
    const q = elige([37, 47, 17, 27], "cervical");
    if (q) hs.push({ id: `${id}-pano-hueso`, pieza: q, texto: "Posible pérdida ósea horizontal leve", certeza: riesgo ? 0.68 : 0.57, superficie: "cervical", tipo: "perdida-osea" });
  }
  if (a.estudios.includes("aleta")) {
    const p = elige([25, 15, 35, 45], "distal");
    if (p) hs.push({ id: `${id}-aleta`, pieza: p, texto: "Posible caries interproximal distal", certeza: 0.76, superficie: "distal", tipo: "caries" });
  }
  if (a.estudios.includes("periapical") && !hs.some((h) => h.pieza === foco && h.superficie === "periapical") && libre(foco, "periapical")) {
    hs.push({
      id: `${id}-peri`,
      pieza: foco,
      texto: cuenta.has(foco) ? "La lesión podría acercarse a la pulpa: valorar vitalidad" : "Espacio del ligamento algo ensanchado: a vigilar",
      certeza: cuenta.has(foco) ? 0.66 : 0.54,
      superficie: "periapical",
      tipo: "lesion-periapical",
    });
  }
  hs.sort((x, y) => y.certeza - x.certeza);

  const nombres = ESTUDIOS_DIBUJADOS.filter((e) => a.estudios.includes(e.id));
  const pasos = [
    `Leo el motivo de consulta: «${a.motivo.trim() || "sin motivo escrito"}».`,
    a.antecedentes.length ? `Tomo en cuenta sus antecedentes: ${lista(a.antecedentes.map((x) => x.toLowerCase()))}.` : "Sin antecedentes que cambien la lectura.",
    ...nombres.map((e) =>
      e.id === "panoramica" ? "Recorro la panorámica pieza por pieza." : e.id === "aleta" ? "Reviso la aleta de mordida: las caras entre pieza y pieza." : `Miro la periapical de la ${foco}: corona, raíz y ápice.`,
    ),
    a.marcas.length
      ? `Comparo con tu odontograma: ${porTratar.length} ${porTratar.length === 1 ? "marca" : "marcas"} por tratar y ${a.marcas.filter((m) => m.estado === "realizado").length} realizadas.`
      : "Tu odontograma va sin marcas: todo lo que sugiera es nuevo.",
  ];

  const edad = a.edad ? `, ${a.edad} años` : "";
  const resumen = hs.length
    ? `${a.nombre.trim()}${edad}. Encontré ${hs.length} ${hs.length === 1 ? "zona que vale" : "zonas que valen"} la pena que revises, además de lo que ya marcaste. ${riesgo ? "Por sus antecedentes, vigilaría el hueso alrededor de las piezas de atrás. " : ""}${porTratar.length ? `Tus ${porTratar.length === 1 ? "marca por tratar se ve" : `${porTratar.length} marcas por tratar se ven`} también en el estudio.` : ""}`.trim()
    : `${a.nombre.trim()}${edad}. En estos estudios no encontré nada más de lo que ya marcaste.`;

  const h0 = hs[0];
  const h1 = hs[1];
  const primero = h0
    ? `Por certeza, empezaría por la ${h0.pieza} (${h0.texto.toLowerCase()}, ${pct(h0.certeza)})${h1 ? ` y después la ${h1.pieza} (${pct(h1.certeza)})` : ""}.${porTratar.length ? ` Lo que ya marcaste por tratar va antes que cualquier sugerencia.` : ""} El orden lo decides tú: esto solo es una sugerencia.`
    : "Con lo que marcaste basta: no hay sugerencias nuevas que ordenar.";
  const paciente = h0
    ? `«En tus radiografías se ven ${hs.length} ${hs.length === 1 ? "zona" : "zonas"} que vamos a revisar juntos: ${lista(hs.map((h) => `tu ${nombrePieza(h.pieza).toLowerCase()} (cara ${NOMBRE_SUPERFICIE[h.superficie]})`))}. Todavía no es un diagnóstico: te lo confirmo en la consulta.»`
    : "«Tus radiografías se ven como esperábamos. Seguimos con lo que ya platicamos.»";

  return { pasos, resumen, hallazgos: hs, primero, paciente };
}

const MES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const DOCTOR: Record<Paciente["unidad"], string> = { centro: "varela", norte: "campos", imagen: "ibarra" };

/** El expediente que queda al «Llevar al expediente»: lo marcado es del dentista; lo de la IA, sugerido */
export function aPaciente(a: Armado, l: Lectura, id: string, hoy: Date): Paciente {
  const registros: Registro[] = a.marcas.map((m) => ({
    pieza: m.pieza,
    superficie: m.superficie,
    tipo: m.tipo,
    estado: m.estado,
    texto: m.tipo === "ausente" ? "Ausente" : m.tipo === "extraccion" ? "Extracción indicada" : m.tipo === "endodoncia" ? (m.estado === "realizado" ? "Endodoncia" : "Endodoncia por hacer") : m.estado === "realizado" ? "Restauración" : "Caries",
  }));
  const doctor = DOCTOR[a.unidad];
  return {
    id,
    nombre: a.nombre.trim(),
    edad: a.edad || 30,
    unidad: a.unidad,
    doctor,
    motivo: a.motivo.trim() || "Sin motivo escrito",
    analizada: true,
    hallazgos: l.hallazgos,
    registros,
    visitas: [{ fecha: `${hoy.getDate()} ${MES[hoy.getMonth()]}`, que: "Expediente armado; lo leyó la IA (demo)", doctor }],
  };
}
