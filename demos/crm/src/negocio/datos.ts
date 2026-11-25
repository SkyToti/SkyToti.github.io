/**
 * El negocio de ejemplo para las funciones de prototipo (BRIEF-4 §4.D): órdenes del laboratorio, estudios de
 * Imagen Dental y el directorio de pacientes. TODO ES DE EJEMPLO: pacientes ficticios (regla 6), fechas y
 * trabajos inventados. El laboratorio hace coronas y removibles e Imagen Dental vive de las
 * referencias: también de ejemplo.
 */
import { DIAS, type UnidadId } from "../datos";
import { citasDeLaSemana } from "../agenda/datos";
import { PACIENTES as EXPEDIENTES } from "../expedientes/datos";

export type EstadoOrden = "Recibida" | "En proceso" | "Lista" | "Entregada";
export const ESTADOS_ORDEN: EstadoOrden[] = ["Recibida", "En proceso", "Lista", "Entregada"];

export interface Orden {
  id: string;
  paciente: string;
  trabajo: string;
  pieza?: number;
  doctor: string;
  origen: UnidadId;
  estado: EstadoOrden;
  entrega: string; // «lun 28»
}

export const ORDENES: Orden[] = [
  { id: "o1", paciente: "Mariana R.", trabajo: "Corona de zirconia", pieza: 36, doctor: "mendez", origen: "centro", estado: "En proceso", entrega: "mar 29" },
  { id: "o2", paciente: "Héctor S.", trabajo: "Removible superior", doctor: "mendez", origen: "centro", estado: "En proceso", entrega: "jue 1" },
  { id: "o3", paciente: "Héctor S.", trabajo: "Corona de zirconia", pieza: 16, doctor: "mendez", origen: "centro", estado: "Lista", entrega: "vie 25" },
  { id: "o4", paciente: "Lucía C.", trabajo: "Retenedor", doctor: "campos", origen: "norte", estado: "Recibida", entrega: "sáb 3" },
  { id: "o5", paciente: "Ricardo B.", trabajo: "Corona metal-porcelana", pieza: 46, doctor: "mendez", origen: "centro", estado: "Recibida", entrega: "lun 5" },
  { id: "o6", paciente: "Sofía N.", trabajo: "Guarda oclusal", doctor: "aguilar", origen: "norte", estado: "En proceso", entrega: "mié 30" },
  { id: "o7", paciente: "Arturo G.", trabajo: "Corona sobre implante", pieza: 46, doctor: "solis", origen: "centro", estado: "Recibida", entrega: "mar 6" },
  { id: "o8", paciente: "Adriana M.", trabajo: "Carilla", pieza: 11, doctor: "mendez", origen: "centro", estado: "Lista", entrega: "vie 25" },
  { id: "o9", paciente: "Jorge M.", trabajo: "Removible inferior", doctor: "varela", origen: "norte", estado: "Entregada", entrega: "mié 23" },
  { id: "o10", paciente: "Valeria T.", trabajo: "Corona de zirconia", pieza: 26, doctor: "mendez", origen: "centro", estado: "Entregada", entrega: "jue 24" },
];

export type EstadoEstudio = "Por revisar" | "En el expediente";
export interface Estudio {
  id: string;
  paciente: string;
  tipo: string;
  origen: "centro" | "norte" | "externo";
  hora: string;
  estado: EstadoEstudio;
  /** si el paciente tiene expediente en este demo */
  expediente?: string;
}

export const ESTUDIOS: Estudio[] = [
  { id: "e1", paciente: "Emilio T.", tipo: "Panorámica", origen: "externo", hora: "9:10", estado: "En el expediente", expediente: "emilio" },
  { id: "e2", paciente: "Mariana R.", tipo: "Periapical de la 46", origen: "centro", hora: "10:00", estado: "En el expediente", expediente: "mariana" },
  { id: "e3", paciente: "Lucía C.", tipo: "Escaneo intraoral", origen: "norte", hora: "11:20", estado: "En el expediente", expediente: "lucia" },
  { id: "e4", paciente: "Paola G.", tipo: "Panorámica", origen: "centro", hora: "12:05", estado: "Por revisar", expediente: "paola" },
  { id: "e5", paciente: "Daniel O.", tipo: "Aleta de mordida", origen: "externo", hora: "12:40", estado: "Por revisar" },
  { id: "e6", paciente: "Camila H.", tipo: "Escaneo intraoral", origen: "norte", hora: "13:30", estado: "Por revisar" },
  { id: "e7", paciente: "Rubén E.", tipo: "Panorámica", origen: "externo", hora: "16:00", estado: "Por revisar" },
];

export const NOMBRE_ORIGEN: Record<string, string> = { centro: "Centro", norte: "Norte", sur: "Sur", externo: "otro dentista", imagen: "Imagen Dental" };

/** Un momento en la vida de un paciente con tu negocio */
export interface Evento {
  fecha: Date;
  tipo: "cita" | "estudio" | "orden" | "hallazgo";
  que: string;
  unidad: UnidadId;
  /** ya pasó, o está por venir */
  hecho: boolean;
}

export interface PacienteDirectorio {
  nombre: string;
  unidad: UnidadId;
  doctor: string;
  expediente?: string;
  eventos: Evento[];
}

const MES_CORTO: Record<string, number> = { ene: 0, feb: 1, mar: 2, abr: 3, may: 4, jun: 5, jul: 6, ago: 7, sep: 8, oct: 9, nov: 10, dic: 11 };
const deTexto = (t: string, anio: number) => {
  const [d, m] = t.split(" ");
  return new Date(anio, MES_CORTO[m] ?? 8, Number(d));
};

/** El directorio: las citas de dos semanas atrás a dos adelante, los expedientes, las órdenes y los estudios */
export function directorio(hoy: Date): PacienteDirectorio[] {
  const lunes = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - ((hoy.getDay() + 6) % 7));
  const porNombre = new Map<string, PacienteDirectorio>();
  const de = (nombre: string, unidad: UnidadId, doctor: string) => {
    if (!porNombre.has(nombre)) porNombre.set(nombre, { nombre, unidad, doctor, eventos: [] });
    return porNombre.get(nombre)!;
  };
  // la agenda de ejemplo reparte pocos nombres entre muchas citas: para que cada historia sea creíble se toman
  // sus dos últimas visitas (con una semana o más entre ellas) y su siguiente cita, que sí está en la agenda
  const porPaciente = new Map<string, { fecha: Date; c: (ReturnType<typeof citasDeLaSemana>)[number] }[]>();
  for (let s = -2; s <= 2; s++)
    for (const c of citasDeLaSemana(s)) {
      const fecha = new Date(lunes.getFullYear(), lunes.getMonth(), lunes.getDate() + s * 7 + DIAS.findIndex((d) => d.id === c.dia), Math.floor(c.desde), Math.round((c.desde % 1) * 60));
      if (!porPaciente.has(c.paciente)) porPaciente.set(c.paciente, []);
      porPaciente.get(c.paciente)!.push({ fecha, c });
    }
  for (const [nombre, lista] of porPaciente) {
    lista.sort((a, b) => a.fecha.getTime() - b.fecha.getTime());
    const pasadas: typeof lista = [];
    for (const x of lista.filter((x) => x.fecha < hoy).reverse()) {
      if (pasadas.length === 2) break;
      if (!pasadas.length || pasadas[pasadas.length - 1].fecha.getTime() - x.fecha.getTime() >= 7 * 864e5) pasadas.push(x);
    }
    const siguiente = lista.find((x) => x.fecha >= hoy);
    for (const { fecha, c } of [...pasadas.reverse(), ...(siguiente ? [siguiente] : [])])
      de(nombre, c.unidad, c.doctor).eventos.push({ fecha, tipo: "cita", que: c.que, unidad: c.unidad, hecho: fecha < hoy });
  }
  for (const p of EXPEDIENTES) {
    const d = de(p.nombre, p.unidad === "imagen" ? "centro" : (p.unidad as UnidadId), p.doctor);
    d.expediente = p.id;
    for (const v of p.visitas) {
      const f = deTexto(v.fecha, 2026);
      d.eventos.push({ fecha: f, tipo: v.que.startsWith("Radiograf") ? "estudio" : "cita", que: v.que, unidad: v.que.includes("Imagen Dental") ? "imagen" : d.unidad, hecho: f < hoy });
    }
    if (p.proxima) {
      const f = deTexto(p.proxima, 2026);
      d.eventos.push({ fecha: f, tipo: "cita", que: "Seguimiento", unidad: d.unidad, hecho: false });
    }
    if (p.hallazgos.length) d.eventos.push({ fecha: deTexto(p.visitas.at(-1)?.fecha ?? "24 sep", 2026), tipo: "hallazgo", que: `${p.hallazgos.length} sugerencias en su radiografía`, unidad: "imagen", hecho: true });
  }
  for (const o of ORDENES) {
    const d = de(o.paciente, o.origen, o.doctor);
    const [, num] = o.entrega.split(" ");
    const n = Number(num);
    const f = new Date(hoy.getFullYear(), n < 15 && hoy.getDate() > 15 ? hoy.getMonth() + 1 : hoy.getMonth(), n);
    d.eventos.push({ fecha: f, tipo: "orden", que: `${o.trabajo}${o.pieza ? `, pieza ${o.pieza}` : ""} (${o.estado.toLowerCase()})`, unidad: "centro", hecho: o.estado === "Entregada" });
  }
  for (const e of ESTUDIOS) {
    const d = de(e.paciente, e.origen === "externo" ? "imagen" : e.origen, "ibarra");
    const [h, m] = e.hora.split(":").map(Number);
    d.eventos.push({ fecha: new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), h, m), tipo: "estudio", que: `${e.tipo} en Imagen Dental`, unidad: "imagen", hecho: true });
  }
  for (const d of porNombre.values()) d.eventos.sort((a, b) => a.fecha.getTime() - b.fecha.getTime());
  return [...porNombre.values()].sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
}
