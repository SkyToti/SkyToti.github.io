/**
 * Expedientes y apoyo al diagnóstico con IA: TODO ES DE EJEMPLO.
 * Pacientes ficticios (regla 6: nunca datos reales de pacientes; nombres con inicial, sin coincidir
 * con transcripciones ni registros), radiografías dibujadas para el concepto (no son imágenes reales)
 * y hallazgos inventados para mostrar cómo se vería la sugerencia de la IA.
 * Reglas del concepto: el apoyo al diagnóstico va «por construir», con la leyenda de la
 * NOM («se sugiere que lo valore el dentista») y sin tomografías en este concepto.
 * Colores y estados clínicos: clinica.ts (BRIEF-4 §3).
 */
import type { FormaMuela } from "../vista";
import { MEDIDAS, PUNTAS, type EstadoClinico, type Marca, type Superficie, type TipoClinico, type TipoPieza } from "./clinica";

/** Lo que el dentista decide sobre una sugerencia de la IA: confirmarla (queda por tratar), descartarla o darla por hecha */
export type Decision = "confirmado" | "descartado" | "realizado";

export interface Hallazgo {
  id: string;
  /** numeración dental internacional (FDI): 11–48 */
  pieza: number;
  texto: string;
  /** de 0 a 1 */
  certeza: number;
  superficie: Superficie;
  tipo: TipoClinico;
}

/** Lo que el dentista ya registró en el odontograma (no viene de la IA) */
export interface Registro {
  pieza: number;
  superficie: Superficie;
  tipo: TipoClinico;
  estado: Exclude<EstadoClinico, "sugerido">;
  texto: string;
}

export interface Visita {
  fecha: string;
  que: string;
  doctor: string; // id de datos.ts
}

export interface Paciente {
  id: string;
  nombre: string;
  edad: number;
  unidad: "centro" | "norte" | "imagen";
  doctor: string;
  motivo: string;
  /** la radiografía ya se analizó (si no, el botón «Analizar con IA» la recorre en vivo) */
  analizada: boolean;
  hallazgos: Hallazgo[];
  registros: Registro[];
  visitas: Visita[];
  proxima?: string;
  /** la muela del héroe toma esta forma al abrir su expediente */
  forma?: Partial<FormaMuela>;
}

export const PACIENTES: Paciente[] = [
  {
    id: "mariana",
    nombre: "Mariana R.",
    edad: 47,
    unidad: "centro",
    doctor: "ibarra",
    motivo: "Dolor al masticar del lado izquierdo",
    analizada: true,
    hallazgos: [
      { id: "m1", pieza: 36, texto: "Posible caries interproximal distal", certeza: 0.82, superficie: "distal", tipo: "caries" },
      { id: "m2", pieza: 46, texto: "Imagen periapical a vigilar", certeza: 0.64, superficie: "periapical", tipo: "lesion-periapical" },
      { id: "m3", pieza: 37, texto: "Posible pérdida ósea horizontal leve", certeza: 0.58, superficie: "cervical", tipo: "perdida-osea" },
    ],
    registros: [
      { pieza: 25, superficie: "oclusal", tipo: "restauracion", estado: "realizado", texto: "Resina (2 jul)" },
      { pieza: 16, superficie: "oclusal", tipo: "restauracion", estado: "realizado", texto: "Resina antigua" },
    ],
    visitas: [
      { fecha: "14 mar", que: "Limpieza", doctor: "varela" },
      { fecha: "2 jul", que: "Resina en la 25", doctor: "varela" },
      { fecha: "12 sep", que: "Valoración", doctor: "ibarra" },
    ],
    proxima: "30 sep",
  },
  {
    id: "hector",
    nombre: "Héctor S.",
    edad: 58,
    unidad: "centro",
    doctor: "solis",
    motivo: "Valoración para implante",
    analizada: true,
    hallazgos: [
      { id: "h1", pieza: 46, texto: "Ausencia de pieza: espacio para implante", certeza: 0.91, superficie: "raiz", tipo: "ausente" },
      { id: "h2", pieza: 16, texto: "Restauración con posible filtración marginal", certeza: 0.66, superficie: "distal", tipo: "restauracion-desadaptada" },
      { id: "h3", pieza: 16, texto: "Posible lesión periapical", certeza: 0.57, superficie: "periapical", tipo: "lesion-periapical" },
    ],
    registros: [
      { pieza: 16, superficie: "oclusal", tipo: "restauracion", estado: "realizado", texto: "Resina oclusal (2021)" },
      { pieza: 16, superficie: "conducto", tipo: "endodoncia", estado: "realizado", texto: "Endodoncia (2021)" },
      { pieza: 26, superficie: "oclusal", tipo: "restauracion", estado: "realizado", texto: "Resina" },
      { pieza: 36, superficie: "oclusal", tipo: "restauracion", estado: "realizado", texto: "Resina" },
      { pieza: 46, superficie: "raiz", tipo: "ausente", estado: "realizado", texto: "Extracción (9 ene)" },
    ],
    visitas: [
      { fecha: "9 ene", que: "Extracción de la 46", doctor: "solis" },
      { fecha: "20 jun", que: "Limpieza", doctor: "varela" },
      { fecha: "18 sep", que: "Valoración para implante", doctor: "solis" },
    ],
    proxima: "7 oct",
    forma: { implante: 1 },
  },
  {
    id: "lucia",
    nombre: "Lucía C.",
    edad: 29,
    unidad: "norte",
    doctor: "campos",
    motivo: "Brackets: control mensual",
    analizada: true,
    hallazgos: [
      { id: "l1", pieza: 31, texto: "Apiñamiento anterior inferior", certeza: 0.77, superficie: "vestibular", tipo: "apinamiento" },
      { id: "l2", pieza: 26, texto: "Posible caries oclusal incipiente", certeza: 0.55, superficie: "oclusal", tipo: "caries" },
    ],
    registros: [],
    visitas: [
      { fecha: "10 may", que: "Colocación de brackets", doctor: "campos" },
      { fecha: "12 jul", que: "Control", doctor: "campos" },
      { fecha: "16 ago", que: "Control", doctor: "campos" },
      { fecha: "20 sep", que: "Control", doctor: "campos" },
    ],
    proxima: "18 oct",
    forma: { brackets: 1 },
  },
  {
    id: "paola",
    nombre: "Paola G.",
    edad: 41,
    unidad: "centro",
    doctor: "varela",
    motivo: "Limpieza y revisión",
    analizada: false,
    hallazgos: [
      { id: "p1", pieza: 47, texto: "Posible caries interproximal mesial", certeza: 0.73, superficie: "mesial", tipo: "caries" },
      { id: "p2", pieza: 17, texto: "Cálculo supragingival", certeza: 0.61, superficie: "cervical", tipo: "calculo" },
    ],
    registros: [{ pieza: 14, superficie: "oclusal", tipo: "restauracion", estado: "realizado", texto: "Resina" }],
    visitas: [
      { fecha: "3 feb", que: "Limpieza", doctor: "varela" },
      { fecha: "24 sep", que: "Radiografía panorámica", doctor: "varela" },
    ],
    proxima: "1 oct",
  },
  {
    id: "ramiro",
    nombre: "Ramiro Á.",
    edad: 35,
    unidad: "norte",
    doctor: "varela",
    motivo: "Revisión de rutina",
    analizada: true,
    hallazgos: [],
    registros: [{ pieza: 36, superficie: "oclusal", tipo: "sellante", estado: "realizado", texto: "Sellante" }],
    visitas: [
      { fecha: "11 abr", que: "Limpieza", doctor: "varela" },
      { fecha: "22 sep", que: "Revisión", doctor: "varela" },
    ],
  },
  {
    id: "emilio",
    nombre: "Emilio T.",
    edad: 63,
    unidad: "imagen",
    doctor: "ibarra",
    motivo: "Radiografía referida por otro dentista",
    analizada: true,
    hallazgos: [
      { id: "e1", pieza: 36, texto: "Imagen radiolúcida periapical", certeza: 0.69, superficie: "periapical", tipo: "lesion-periapical" },
      { id: "e2", pieza: 45, texto: "Tratamiento de conducto previo: a vigilar", certeza: 0.52, superficie: "conducto", tipo: "endodoncia" },
    ],
    registros: [
      { pieza: 45, superficie: "conducto", tipo: "endodoncia", estado: "realizado", texto: "Endodoncia previa" },
      { pieza: 15, superficie: "oclusal", tipo: "restauracion", estado: "realizado", texto: "Resina" },
      { pieza: 18, superficie: "raiz", tipo: "ausente", estado: "realizado", texto: "Ausente" },
      { pieza: 28, superficie: "raiz", tipo: "ausente", estado: "realizado", texto: "Ausente" },
    ],
    visitas: [{ fecha: "23 sep", que: "Radiografía panorámica en Imagen Dental", doctor: "ibarra" }],
  },
];

export const pacientePorId = (id: string) => PACIENTES.find((p) => p.id === id);

export const NOMBRE_UNIDAD_PACIENTE: Record<Paciente["unidad"], string> = {
  centro: "Clínica Dental Ejemplo, Centro",
  norte: "Clínica Dental Ejemplo, Norte",
  imagen: "Imagen Dental",
};

/** Qué pacientes se ven en cada vista (las que no tienen pacientes propios muestran todos) */
export function pacientesDe(vista: string): Paciente[] {
  if (vista === "centro") return PACIENTES.filter((p) => p.unidad === "centro");
  if (vista === "sucursal") return PACIENTES.filter((p) => p.unidad === "norte");
  if (vista === "imagen") return PACIENTES.filter((p) => p.unidad === "imagen");
  return PACIENTES;
}

/** Las piezas ausentes y las tratadas (para la radiografía dibujada) */
export const ausentesDe = (p: Paciente) => p.registros.filter((r) => r.tipo === "ausente" || r.tipo === "extraccion").map((r) => r.pieza);
export const tratadasDe = (p: Paciente) => [...new Set(p.registros.filter((r) => r.estado === "realizado" && r.tipo !== "ausente" && r.tipo !== "extraccion").map((r) => r.pieza))];

/** El estado clínico de un hallazgo según lo que decidió el dentista (descartado = no se muestra) */
export function estadoDeHallazgo(d: Decision | undefined): EstadoClinico | null {
  if (d === "descartado") return null;
  if (d === "confirmado") return "por-tratar";
  if (d === "realizado") return "realizado";
  return "sugerido";
}

/** Todas las marcas clínicas de una pieza: lo registrado por el dentista y lo que sugirió la IA */
export function marcasDe(p: Paciente, pieza: number, decisiones: Record<string, Decision>, analizada: boolean): (Marca & { texto: string; hallazgo?: Hallazgo; tipo: TipoClinico })[] {
  const registradas = p.registros.filter((r) => r.pieza === pieza).map((r) => ({ superficie: r.superficie, estado: r.estado as EstadoClinico, texto: r.texto, tipo: r.tipo }));
  const sugeridas = analizada
    ? p.hallazgos.flatMap((h) => {
        if (h.pieza !== pieza) return [];
        const e = estadoDeHallazgo(decisiones[h.id]);
        return e ? [{ superficie: h.superficie, estado: e, texto: h.texto, tipo: h.tipo, hallazgo: h }] : [];
      })
    : [];
  return [...registradas, ...sugeridas];
}

/** La pieza que se enseña al abrir un expediente: la del primer hallazgo; si no hay, la primera registrada */
export const piezaInicial = (p: Paciente) => p.hallazgos[0]?.pieza ?? p.registros[0]?.pieza ?? 16;

/** Dónde queda cada zona sobre la muela del héroe (espacio del modelo) y en qué ranura va su llamada */
export const ANCLA_SUPERFICIE: Record<Superficie, { ancla: [number, number, number]; ranura: [number, number] }> = {
  oclusal: { ancla: [0.05, 1.0, 0.12], ranura: [72, 13] },
  mesial: { ancla: [0.95, 0.52, 0.04], ranura: [75, 39] },
  distal: { ancla: [-0.95, 0.5, 0.02], ranura: [5, 52] },
  vestibular: { ancla: [0.05, 0.5, 0.88], ranura: [75, 39] },
  palatina: { ancla: [0.0, 0.48, -0.85], ranura: [5, 52] },
  cervical: { ancla: [0.62, -0.1, 0.42], ranura: [5, 52] },
  raiz: { ancla: [0.35, -1.0, 0.38], ranura: [66, 63] },
  periapical: { ancla: [0.164, -1.95, 0.457], ranura: [66, 63] },
  conducto: { ancla: [0.2, -0.85, 0.3], ranura: [66, 63] },
};

/** El ancla de una cara según el tipo de pieza: en un incisivo, «mesial» queda mucho más cerca del centro */
export function anclaDe(s: Superficie, tipo: TipoPieza): [number, number, number] {
  const m = MEDIDAS[tipo];
  const una = tipo === "premolar" || tipo === "canino" || tipo === "incisivo";
  switch (s) {
    case "oclusal":
      return [0.05, m.cima, 0.1];
    case "mesial":
      return [m.cx + 0.02, m.medio, 0.04];
    case "distal":
      return [-(m.cx + 0.02), m.medio, 0.02];
    case "vestibular":
      return [0.05, m.medio, m.cz + 0.02];
    case "palatina":
      return [0.0, m.medio, -(m.cz + 0.01)];
    case "cervical":
      return [m.cx * 0.6, -0.1, m.cz * 0.45];
    case "raiz":
      return una ? [0.02, -1.0, 0.25] : tipo === "molar-inferior" ? [0.45, -1.0, 0.26] : ANCLA_SUPERFICIE.raiz.ancla;
    case "periapical":
      return PUNTAS[tipo][0];
    case "conducto":
      return una ? [-0.03, -0.85, 0.2] : ANCLA_SUPERFICIE.conducto.ancla;
  }
}
