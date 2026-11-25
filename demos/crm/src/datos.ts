/**
 * Datos del concepto (demo de diseño).
 *
 * TODO ES DE EJEMPLO: la clínica, sus sucursales, los doctores y las cifras son inventados para enseñar el
 * diseño. No hay pacientes con nombre completo ni precios.
 */

/** De dónde sale un dato. En esta demo, todo es «ejemplo». */
export type Procedencia = { tipo: "ejemplo" };

const ejemplo: Procedencia = { tipo: "ejemplo" };

export function textoProcedencia(_p: Procedencia): string {
  return "ejemplo";
}

export interface Dato {
  texto: string;
  procedencia: Procedencia;
}

export type UnidadId = "centro" | "norte" | "sur" | "imagen" | "especialidades";

export type Dia = "lun" | "mar" | "mie" | "jue" | "vie" | "sab";
export const DIAS: { id: Dia; corto: string; largo: string }[] = [
  { id: "lun", corto: "Lun", largo: "lunes" },
  { id: "mar", corto: "Mar", largo: "martes" },
  { id: "mie", corto: "Mié", largo: "miércoles" },
  { id: "jue", corto: "Jue", largo: "jueves" },
  { id: "vie", corto: "Vie", largo: "viernes" },
  { id: "sab", corto: "Sáb", largo: "sábado" },
];

export interface Doctor {
  id: string;
  nombre: string;
  iniciales: string;
  especialidad: string;
  /** Unidad donde vive (su color) */
  unidad: UnidadId;
  /** Qué días atiende en qué unidad: DE EJEMPLO */
  agenda: Partial<Record<Dia, UnidadId>>;
  sillon: string;
  nota: string;
  /** El que viaja entre las clínicas */
  rota?: boolean;
}

/** Todos ficticios. */
export const DOCTORES: Doctor[] = [
  {
    id: "varela",
    nombre: "Dr. Andrés Varela",
    iniciales: "AV",
    especialidad: "Odontología general",
    unidad: "centro",
    agenda: { lun: "centro", mar: "norte", mie: "sur", jue: "centro", vie: "norte", sab: "sur" },
    sillon: "Sillón 2 en Centro · sillón 1 en Norte y Sur",
    nota: "Rota entre las tres clínicas: hay que darlo de alta en cada agenda y bloquearle los días.",
    rota: true,
  },
  {
    id: "solis",
    nombre: "Dra. Regina Solís",
    iniciales: "RS",
    especialidad: "Cirugía e implantes",
    unidad: "centro",
    agenda: { lun: "centro", mie: "centro", vie: "centro" },
    sillon: "Sillón 1 en Centro",
    nota: "Comparte el sillón 1 con endodoncia: mañana y tarde.",
  },
  {
    id: "ibarra",
    nombre: "Dr. Tomás Ibarra",
    iniciales: "TI",
    especialidad: "Endodoncia",
    unidad: "centro",
    agenda: { mar: "centro", jue: "centro", sab: "centro" },
    sillon: "Sillón 1 en Centro",
    nota: "Recibe las referencias de las dos sucursales.",
  },
  {
    id: "mendez",
    nombre: "Dra. Paula Méndez",
    iniciales: "PM",
    especialidad: "Prótesis",
    unidad: "centro",
    agenda: { lun: "centro", mar: "centro", jue: "centro" },
    sillon: "Sillón 3 en Centro",
    nota: "Trabaja de la mano con el laboratorio.",
  },
  {
    id: "campos",
    nombre: "Dra. Julia Campos",
    iniciales: "JC",
    especialidad: "Ortodoncia",
    unidad: "norte",
    agenda: { lun: "norte", mie: "norte", vie: "norte", sab: "norte" },
    sillon: "Sillón 2 en Norte",
    nota: "Lleva los tratamientos de brackets.",
  },
  {
    id: "rangel",
    nombre: "Dr. Mauricio Rangel",
    iniciales: "MR",
    especialidad: "Periodoncia",
    unidad: "centro",
    agenda: {},
    sillon: "Sillones 1 y 2 en Centro",
    nota: "Encías y limpiezas profundas; recibe a los pacientes de implante antes de la cirugía.",
  },
  {
    id: "olvera",
    nombre: "Dra. Carmen Olvera",
    iniciales: "CO",
    especialidad: "Odontopediatría",
    unidad: "centro",
    agenda: {},
    sillon: "Sillón 3 en Centro",
    nota: "Los niños: revisiones, sellantes y flúor.",
  },
  {
    id: "quiroz",
    nombre: "Dr. Iván Quiroz",
    iniciales: "IQ",
    especialidad: "Odontología general",
    unidad: "centro",
    agenda: {},
    sillon: "Sillón 2 en Centro",
    nota: "Cubre las mañanas del sillón 2 cuando Varela está en otra clínica.",
  },
  {
    id: "aguilar",
    nombre: "Dra. Lorena Aguilar",
    iniciales: "LA",
    especialidad: "Odontología general",
    unidad: "norte",
    agenda: {},
    sillon: "Sillón 1 en Norte",
    nota: "La doctora de planta de Norte.",
  },
];

/**
 * Los turnos de la semana, DE EJEMPLO: qué doctor ocupa qué sillón, de qué hora a qué hora. El sillón 1 de
 * Centro lo comparten hasta 4 doctores en un día; su viernes es el del mosaico «Un sillón de Centro, hoy».
 * Sur abre pronto: sus turnos son de preapertura. La semana de cada doctor (su perfil) sale de esta tabla.
 */
export interface Turno {
  unidad: UnidadId;
  sillon: number;
  dia: Dia;
  doctor: string; // id, o «titular»
  especialidad: string;
  desde: number;
  hasta: number;
}
const T = (unidad: UnidadId, sillon: number, dia: Dia, doctor: string, especialidad: string, desde: number, hasta: number): Turno => ({ unidad, sillon, dia, doctor, especialidad, desde, hasta });
export const TURNOS: Turno[] = [
  // Centro: el sillón 1 es el compartido (cuatro turnos de 3 h entre semana)
  T("centro", 1, "lun", "solis", "Cirugía", 8, 11), T("centro", 1, "lun", "mendez", "Prótesis", 11, 14), T("centro", 1, "lun", "rangel", "Periodoncia", 14, 17), T("centro", 1, "lun", "titular", "General", 17, 20),
  T("centro", 2, "lun", "varela", "General", 8, 14), T("centro", 2, "lun", "quiroz", "General", 14, 20),
  T("centro", 3, "lun", "olvera", "Odontopediatría", 8, 14), T("centro", 3, "lun", "mendez", "Prótesis", 14, 20),
  T("centro", 1, "mar", "ibarra", "Endodoncia", 8, 11), T("centro", 1, "mar", "rangel", "Periodoncia", 11, 14), T("centro", 1, "mar", "mendez", "Prótesis", 14, 17), T("centro", 1, "mar", "titular", "General", 17, 20),
  T("centro", 2, "mar", "titular", "General", 8, 14), T("centro", 2, "mar", "quiroz", "General", 14, 20),
  T("centro", 3, "mar", "mendez", "Prótesis", 8, 14), T("centro", 3, "mar", "olvera", "Odontopediatría", 14, 20),
  T("centro", 1, "mie", "solis", "Cirugía", 8, 11), T("centro", 1, "mie", "olvera", "Odontopediatría", 11, 14), T("centro", 1, "mie", "ibarra", "Endodoncia", 14, 17), T("centro", 1, "mie", "titular", "General", 17, 20),
  T("centro", 2, "mie", "quiroz", "General", 8, 14), T("centro", 2, "mie", "rangel", "Periodoncia", 14, 20),
  T("centro", 3, "mie", "mendez", "Prótesis", 8, 14), T("centro", 3, "mie", "olvera", "Odontopediatría", 14, 20),
  T("centro", 1, "jue", "ibarra", "Endodoncia", 8, 11), T("centro", 1, "jue", "rangel", "Periodoncia", 11, 14), T("centro", 1, "jue", "mendez", "Prótesis", 14, 17), T("centro", 1, "jue", "varela", "General", 17, 20),
  T("centro", 2, "jue", "varela", "General", 8, 14), T("centro", 2, "jue", "titular", "General", 14, 20),
  T("centro", 3, "jue", "olvera", "Odontopediatría", 8, 14), T("centro", 3, "jue", "quiroz", "General", 14, 20),
  T("centro", 1, "vie", "solis", "Cirugía", 8, 11), T("centro", 1, "vie", "ibarra", "Endodoncia", 11, 14), T("centro", 1, "vie", "mendez", "Prótesis", 14, 17), T("centro", 1, "vie", "titular", "General", 17, 20),
  T("centro", 2, "vie", "quiroz", "General", 8, 14), T("centro", 2, "vie", "rangel", "Periodoncia", 14, 20),
  T("centro", 3, "vie", "olvera", "Odontopediatría", 8, 14), T("centro", 3, "vie", "solis", "Implantes", 14, 20),
  T("centro", 1, "sab", "ibarra", "Endodoncia", 8, 11), T("centro", 1, "sab", "solis", "Cirugía", 11, 14),
  T("centro", 2, "sab", "titular", "General", 8, 14), T("centro", 3, "sab", "olvera", "Odontopediatría", 8, 14),
  // Norte: dos sillones, de 9 a 19 (sábado a 15)
  T("norte", 1, "lun", "aguilar", "General", 9, 19), T("norte", 2, "lun", "campos", "Ortodoncia", 9, 19),
  T("norte", 1, "mar", "varela", "General", 9, 19), T("norte", 2, "mar", "aguilar", "General", 9, 19),
  T("norte", 1, "mie", "aguilar", "General", 9, 19), T("norte", 2, "mie", "campos", "Ortodoncia", 9, 19),
  T("norte", 1, "jue", "aguilar", "General", 9, 19),
  T("norte", 1, "vie", "varela", "General", 9, 19), T("norte", 2, "vie", "campos", "Ortodoncia", 9, 19),
  T("norte", 1, "sab", "aguilar", "General", 9, 15), T("norte", 2, "sab", "campos", "Ortodoncia", 9, 15),
  // Sur: por abrir; Varela hace la preapertura
  T("sur", 1, "mie", "varela", "Preapertura", 9, 15), T("sur", 1, "sab", "varela", "Preapertura", 9, 15),
];

// la semana de cada doctor sale de los turnos (así su perfil, tu equipo y la agenda dicen lo mismo)
for (const d of DOCTORES) {
  d.agenda = {};
  for (const t of TURNOS) if (t.doctor === d.id && !d.agenda[t.dia]) d.agenda[t.dia] = t.unidad;
}

/** El perfil del usuario: el doctor titular, de ejemplo (el dock lo abre) */
export const TITULAR = {
  nombre: "Dr. Robles",
  rol: "Titular de Clínica Dental Ejemplo · nombre de ejemplo",
  cita: "«Quiero saber cómo va cada sillón sin tener que llamar a nadie»",
  citaProcedencia: ejemplo,
  datos: [
    { texto: "8 mil pacientes: 6 mil en Centro y 2 mil en Norte", procedencia: ejemplo },
    { texto: "Los doctores rotan entre las tres clínicas", procedencia: ejemplo },
    { texto: "En planes: 2 o 3 clínicas más en la región y mínimo 3 en otra ciudad", procedencia: ejemplo },
  ] as Dato[],
  idea: "«Cambiar de sucursal sin cambiar de sistema: de Centro a Norte en un toque»",
  ideaProcedencia: ejemplo,
};

export const doctorPorId = (id: string) => DOCTORES.find((d) => d.id === id);
export const doctoresEn = (id: UnidadId) =>
  DOCTORES.filter((d) => d.unidad === id || Object.values(d.agenda).includes(id));
