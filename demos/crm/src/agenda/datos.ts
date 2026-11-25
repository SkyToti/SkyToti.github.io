/**
 * La agenda, DE EJEMPLO (BRIEF-4 §4.C): las citas salen de los turnos de la semana (datos.ts, TURNOS) y de
 * lo que dura cada tratamiento. Pacientes ficticios siempre (regla 6); ningún estado habla de recordatorios
 * ni de confirmaciones automáticas (regla 2); ninguna cita de Centro dice que la agendó el asistente (hoy
 * no lo tiene: su mosaico dice «Sin asistente»).
 */
import { DIAS, DOCTORES, TURNOS, type Dia, type Turno, type UnidadId } from "../datos";

export interface Cita {
  id: string;
  unidad: UnidadId;
  sillon: number;
  dia: Dia;
  doctor: string;
  especialidad: string;
  paciente: string;
  que: string;
  desde: number; // horas, 13.5 = 13:30
  dura: number; // horas
  /** «no llegó» es de ejemplo, para que el día pasado no se vea perfecto */
  falta?: boolean;
  /** la creó quien usa el demo (vive en memoria, se pierde al recargar) */
  nueva?: boolean;
}

export const TRATAMIENTOS: Record<string, [string, number][]> = {
  Cirugía: [["Extracción", 1], ["Extracción de tercer molar", 1.5], ["Valoración quirúrgica", 0.5]],
  Implantes: [["Colocación de implante", 1.5], ["Control de implante", 0.5], ["Valoración para implante", 0.5]],
  Endodoncia: [["Endodoncia", 1.5], ["Retratamiento de conductos", 1.5], ["Valoración", 0.5]],
  Prótesis: [["Prueba de corona", 0.75], ["Toma de impresión", 0.5], ["Entrega de prótesis", 0.75]],
  Periodoncia: [["Raspado y alisado", 1], ["Revisión periodontal", 0.5]],
  Odontopediatría: [["Revisión infantil", 0.5], ["Sellantes", 0.5], ["Aplicación de flúor", 0.5]],
  General: [["Limpieza", 0.75], ["Resina", 0.75], ["Valoración", 0.5], ["Urgencia", 0.5]],
  Ortodoncia: [["Ajuste de brackets", 0.5], ["Control de ortodoncia", 0.5], ["Colocación de brackets", 1.5]],
  Preapertura: [["Valoración de apertura", 0.75], ["Limpieza", 0.75]],
};

/** Nombres ficticios con inicial: sin coincidir con doctores, con el equipo real ni con transcripciones */
export const PACIENTES = [
  "Andrea L.", "Jorge M.", "Fernanda P.", "Ricardo B.", "Sofía N.", "Daniel O.", "Valeria T.", "Arturo G.", "Camila H.", "Rubén E.",
  "Gabriela D.", "Óscar F.", "Natalia I.", "Pablo J.", "Isabel K.", "Mateo V.", "Alicia R.", "Luis A.", "Julieta B.", "Sergio C.",
  "Adriana M.", "Raúl P.", "Mónica S.", "Ernesto L.", "Patricia Z.", "Alejandro Q.", "Beatriz O.", "Hugo N.", "Silvia R.", "Martín D.",
  "Elena C.", "Fabián T.", "Rocío G.", "Gerardo H.", "Teresa M.", "Samuel F.", "Karla V.", "Víctor A.", "Paulina E.", "Ximena L.",
];

/** Un generador con semilla: la misma agenda en cada carga, en cada captura y en cada prueba */
function azar(semilla: number) {
  let a = semilla >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function citasDelTurno(t: Turno, n: number, semana = 0): Cita[] {
  const r = azar(n * 7919 + t.sillon * 131 + DIAS.findIndex((d) => d.id === t.dia) * 17 + t.desde * 3 + semana * 104729);
  const lista = TRATAMIENTOS[t.especialidad] ?? TRATAMIENTOS.General;
  const citas: Cita[] = [];
  let h = t.desde;
  let k = 0;
  while (h < t.hasta - 0.24) {
    // a veces queda un hueco de un cuarto de hora (o de media) entre citas
    if (r() < 0.16) h += r() < 0.5 ? 0.25 : 0.5;
    const [que, dura] = lista[Math.floor(r() * lista.length)];
    if (h + dura > t.hasta + 0.01) break;
    citas.push({
      id: `${t.unidad}-${semana}-${t.dia}-${t.sillon}-${t.desde}-${k}`,
      unidad: t.unidad,
      sillon: t.sillon,
      dia: t.dia,
      doctor: t.doctor,
      especialidad: t.especialidad,
      paciente: PACIENTES[Math.floor(r() * PACIENTES.length)],
      que,
      desde: h,
      dura,
      falta: r() < 0.06,
    });
    h += dura;
    k++;
  }
  return citas;
}

/** Las citas de una semana (0 = esta; 1 = la que sigue; -1 = la pasada): los mismos turnos, otros pacientes */
const porSemana = new Map<number, Cita[]>();
export function citasDeLaSemana(semana: number): Cita[] {
  if (!porSemana.has(semana)) porSemana.set(semana, TURNOS.flatMap((t, i) => citasDelTurno(t, i, semana)));
  return porSemana.get(semana)!;
}
export const CITAS: Cita[] = citasDeLaSemana(0);

/**
 * Calcula de a poco, una por vez, las semanas que pide la vista Mes del mes en curso y la que sigue, y los días del Mes.
 * La vista Mes las pedía todas juntas: en frío, en un teléfono lento (CPU 4×) era una tarea de ~140 ms.
 */
export function precalentarSemanas(hoy: Date) {
  const semanas = new Set<number>([1]);
  const ultimo = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
  for (const f = new Date(hoy.getFullYear(), hoy.getMonth(), 1); f <= ultimo; f.setDate(f.getDate() + 1)) semanas.add(semanaDe(f, hoy));
  const pendientes = [...semanas].filter((s) => !porDia.has(s));
  // un temporizador corto por semana (cada una tarda pocos ms): con la muela animándose casi no hay ratos «libres»
  // y al final, los días de la vista Mes de cada unidad con agenda (una por vez)
  const meses: UnidadId[] = ["centro", "norte", "sur"];
  // primero los formatos de es-MX (cifras y orden alfabético: crearlos la primera vez es lo más caro), luego las semanas
  let formatos = true;
  const una = () => {
    const s = formatos ? undefined : pendientes.shift();
    if (formatos) {
      formatos = false;
      conMiles(1166);
      "a".localeCompare("b", "es");
    } else if (s !== undefined) citasDe("centro", "lun", s);
    else {
      const u = meses.shift();
      if (u === undefined) return;
      diasDelMes(u, hoy, hoy);
    }
    window.setTimeout(una, 40);
  };
  window.setTimeout(una, 40);
}

/** Cuántas semanas hay entre el lunes de hoy y el lunes de una fecha */
export function semanaDe(fecha: Date, hoy: Date): number {
  const lunes = (d: Date) => {
    const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
    return x.getTime();
  };
  return Math.round((lunes(fecha) - lunes(hoy)) / (7 * 864e5));
}

export const DIA_DE_FECHA = (f: Date): Dia | null => (["dom", "lun", "mar", "mie", "jue", "vie", "sab"] as const)[f.getDay()] as Dia | null;

export function turnosDe(unidad: UnidadId, dia: Dia): Turno[] {
  return TURNOS.filter((t) => t.unidad === unidad && t.dia === dia).sort((a, b) => a.sillon - b.sillon || a.desde - b.desde);
}
/** Las citas de cada semana, ya separadas por unidad y día: la vista Mes pide unas 30 fechas de golpe */
const porDia = new Map<number, Map<string, Cita[]>>();
export function citasDe(unidad: UnidadId, dia: Dia, semana = 0): Cita[] {
  let indice = porDia.get(semana);
  if (!indice) {
    indice = new Map();
    for (const c of citasDeLaSemana(semana)) {
      const k = `${c.unidad}|${c.dia}`;
      const lista = indice.get(k);
      if (lista) lista.push(c);
      else indice.set(k, [c]);
    }
    porDia.set(semana, indice);
  }
  return indice.get(`${unidad}|${dia}`) ?? [];
}
export const sillonesDe = (unidad: UnidadId) => (unidad === "centro" ? 3 : unidad === "norte" ? 2 : unidad === "sur" ? 1 : 0);
/**
 * Una cifra con separador de miles («1,166»). El formato de es-MX se crea una sola vez, y crearlo la primera vez
 * era casi toda la tarea larga del primer cambio a Mes (fluidez B: ~60 ms con la CPU 4×): se prepara al arrancar.
 */
let miles: Intl.NumberFormat | null = null;
export const conMiles = (n: number) => (miles ??= new Intl.NumberFormat("es-MX")).format(n);

export const horario = (u: UnidadId) => (u === "centro" ? { inicio: 8, fin: 20 } : { inicio: 9, fin: 19 });
export const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export const masDias = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

/** Un día de la vista Mes: lo que dibuja su celda */
export interface DiaDelMes {
  fecha: Date;
  iso: string;
  num: number;
  domingo: boolean;
  fuera: boolean;
  hoy: boolean;
  pasado: boolean;
  citas: number;
  /** qué tanto de su horario está ocupado cada sillón (0 a 1) */
  ocupado: number[];
}
/**
 * Los días de la vista Mes, calculados una vez. En frío, el primer cambio a Mes era una tarea de ~150 ms en un
 * teléfono lento (fluidez B, CPU 4×): ~42 días con sus fechas y sus citas. Sin cambios del demo sale de la caché,
 * que se llena al arrancar (`precalentarSemanas`); con cambios, `citasDelDia` los incluye y no se guarda.
 */
const porMes = new Map<string, { dias: DiaDelMes[]; semanas: number }>();
export function diasDelMes(unidad: UnidadId, fecha: Date, ahora: Date, citasDelDia?: (d: Date) => Cita[]) {
  const clave = `${unidad}|${fecha.getFullYear()}-${fecha.getMonth()}|${iso(ahora)}`;
  const guardado = citasDelDia ? undefined : porMes.get(clave);
  if (guardado) return guardado;
  const primero = new Date(fecha.getFullYear(), fecha.getMonth(), 1);
  const inicio = masDias(primero, -((primero.getDay() + 6) % 7));
  const ultimo = new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0);
  const semanas = Math.ceil((((primero.getDay() + 6) % 7) + ultimo.getDate()) / 7);
  const n = sillonesDe(unidad);
  const { inicio: hi, fin: hf } = horario(unidad);
  const hoy = iso(ahora);
  const dias = Array.from({ length: semanas * 7 }, (_, i): DiaDelMes => {
    const f = masDias(inicio, i);
    const fuera = f.getMonth() !== fecha.getMonth();
    const dia = DIA_DE_FECHA(f);
    const cs = fuera || !dia ? [] : citasDelDia ? citasDelDia(f) : citasDe(unidad, dia, semanaDe(f, ahora));
    const ocupado = Array.from({ length: n }, (_, s) => cs.filter((c) => c.sillon === s + 1).reduce((a, c) => a + c.dura, 0) / (hf - hi));
    const di = iso(f);
    return { fecha: f, iso: di, num: f.getDate(), domingo: f.getDay() === 0, fuera, hoy: di === hoy, pasado: f < ahora && di !== hoy, citas: cs.length, ocupado };
  });
  const r = { dias, semanas };
  if (!citasDelDia) porMes.set(clave, r);
  return r;
}

export const nombreDoctor = (id: string) => (id === "titular" ? "Dr. Robles" : DOCTORES.find((d) => d.id === id)?.nombre ?? id);
export const corto = (id: string) => (id === "titular" ? "Dr. Robles" : (DOCTORES.find((d) => d.id === id)?.nombre ?? id).replace(/^(Dra?\.) (\S+) (\S+)$/, "$1 $3"));

export const hh = (h: number) => `${Math.floor(h)}:${String(Math.round((h % 1) * 60)).padStart(2, "0")}`;

/** El estado de una cita respecto a la hora: atendida, en sillón o por atender. «cuando» dice si su día ya pasó */
export function estadoCita(c: Cita, hoy: Dia | null, ahora: number, cuando: "pasado" | "hoy" | "futuro" = "hoy"): "atendida" | "no llegó" | "en sillón" | "por atender" | "otro día" {
  if (cuando === "pasado") return c.falta ? "no llegó" : "atendida";
  if (cuando === "futuro") return "por atender";
  if (c.dia !== hoy) return "otro día";
  if (c.desde + c.dura <= ahora) return c.falta ? "no llegó" : "atendida";
  if (c.desde <= ahora) return "en sillón";
  return "por atender";
}
