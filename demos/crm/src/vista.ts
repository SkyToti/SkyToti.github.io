/**
 * Qué muestra la pantalla principal para cada unidad. Demo de diseño: todos los datos son de ejemplo y
 * cada uno lo dice en su nota al pie.
 */
import type { FamiliaId, TeselaId } from "./color";
import type { Ancla } from "./objeto/Objeto";
import { TURNOS } from "./datos";

/** Las unidades de siempre; las que se crean en el demo («Nueva unidad», BRIEF-4 §4.D) son «nueva-1», «nueva-2»… */
export type VistaBase = "todo" | "centro" | "sucursal" | "imagen" | "laboratorio" | "especialidades";
export type VistaId = VistaBase | `nueva-${number}`;
export const ORDEN_VISTAS: VistaBase[] = ["todo", "centro", "sucursal", "imagen", "laboratorio", "especialidades"];

export type Glifo = "corona" | "implante" | "brackets" | "escaneo";

export interface Llamada {
  id: string;
  /** «cifra»: número grande con su unidad; «glifo»: dibujo de dato con título; «texto»: solo texto */
  tipo: "cifra" | "glifo" | "texto";
  cifra?: string;
  unidad?: string;
  glifo?: Glifo;
  titulo: string;
  nota: string;
  /** punto sobre la muela (espacio del modelo) */
  ancla: Ancla;
  /** dónde va la etiqueta, en % del héroe; «lado» dice hacia dónde sale la línea */
  x: number;
  y: number;
  lado: "izq" | "der";
  /** en un expediente: el color clínico de la marca (rojo por tratar, azul realizado) y si es sugerencia (trama) */
  color?: string;
  trama?: boolean;
}

/** Los parámetros de cada gráfico: lo que codifica */
export interface Graficos {
  pacientes: { arriba: number; abajo: number; elegido: "arriba" | "abajo" | "ambos"; nombres: [string, string] };
  whatsapp: { escala: number };
  sillones: { turnos: { fin: number; quien: string }[] };
  rotan: { puntos: string[] };
  laboratorio: { ordenes: number };
  imagen: { fuentes: { nombre: string; n: number; fuerte?: boolean }[]; elegido: boolean };
  expansion: { grupos: { cuantos: number; tipo: "hoy" | "abre" | "plan"; extra?: boolean; rotulo: string; nombres?: string[] }[] };
}

export interface Tesela<K extends TeselaId = TeselaId> {
  id: K;
  etiqueta: string;
  cifra: string;
  unidad?: string;
  estado?: string;
  nota: string;
  familia?: FamiliaId;
  /** la unidad no tiene este dato: el gráfico se dibuja en fantasma */
  fantasma?: boolean;
  /** un renglón bajo la cifra (en los mosaicos chicos, en vez del estado a la derecha) */
  sub?: string;
  g: Graficos[K];
}

/** La forma de la muela en cada unidad (0–1): se interpola al cambiar */
export interface FormaMuela {
  implante: number;
  corona: number;
  brackets: number;
  escaneo: number;
  fantasma: number;
}

export interface Vista {
  id: VistaId;
  /** el nombre en dos líneas: es el título y es el selector */
  nombre: [string, string];
  corto: string;
  /** una línea: qué es (se lee en el selector) */
  que: string;
  familia: FamiliaId | "mezcla";
  llamadas: Llamada[];
  teselas: { [K in TeselaId]: Tesela<K> };
  muela: FormaMuela;
  /** la tira de hoy: cuántos sillones o equipos y qué se cuenta */
  hoy: { que: string; lugares: number; vacia?: boolean } | null;
}

/** Las anclas sobre la muela (espacio del modelo; la corona arriba, las raíces abajo) */
export const ANCLAS = {
  cuspide: [0.42, 1.12, 0.28] as Ancla,
  coronaIzq: [-0.94, 0.42, 0.22] as Ancla,
  coronaDer: [0.9, 0.5, 0.36] as Ancla,
  bracket: [0.05, 0.46, 0.93] as Ancla,
  cuello: [0.62, -0.18, 0.4] as Ancla,
  raiz: [0.5, -1.25, 0.36] as Ancla,
  raizIzq: [-0.55, -1.05, 0.3] as Ancla,
  fisura: [0.0, 0.95, 0.05] as Ancla,
};

const MUELA_LISA: FormaMuela = { implante: 0, corona: 0, brackets: 0, escaneo: 0, fantasma: 0 };

// ── Piezas que se repiten entre vistas ─────────────────────────────────────
// el sillón 1 de Centro hoy, de la misma tabla de turnos que la agenda (datos.ts): así nunca se contradicen.
// En domingo (no hay consulta) se muestra el lunes, como las capturas.
const DIA_HOY = (["lun", "lun", "mar", "mie", "jue", "vie", "sab"] as const)[new Date().getDay()];
const TURNOS_CENTRO = TURNOS.filter((t) => t.unidad === "centro" && t.sillon === 1 && t.dia === DIA_HOY).map((t) => ({ fin: t.hasta, quien: t.especialidad }));
const DOCTORES_SILLON = String(new Set(TURNOS.filter((t) => t.unidad === "centro" && t.sillon === 1 && t.dia === DIA_HOY).map((t) => t.doctor)).size);
const PLANES: Graficos["expansion"] = {
  grupos: [
    { cuantos: 2, tipo: "hoy", rotulo: "Hoy", nombres: ["Centro", "Norte"] },
    { cuantos: 1, tipo: "abre", rotulo: "Sur" },
    { cuantos: 2, tipo: "plan", extra: true, rotulo: "Región, 2 o 3" },
    { cuantos: 3, tipo: "plan", extra: true, rotulo: "Fuera, mínimo 3" },
  ],
};
const ROTAN: Graficos["rotan"] = { puntos: ["Centro", "Norte", "Sur"] };
const REFERENCIAS = [
  { nombre: "Centro", n: 26 },
  { nombre: "Norte", n: 15 },
  { nombre: "Otros", n: 23 },
];
const conFuerte = (...nombres: string[]) => REFERENCIAS.map((f) => ({ ...f, fuerte: nombres.includes(f.nombre) }));
const T = {
  rotan: (familia?: FamiliaId): Tesela<"rotan"> => ({ id: "rotan", etiqueta: "Doctores que rotan", cifra: "3", unidad: "clínicas", nota: "ejemplo", familia, g: ROTAN }),
  laboratorio: (familia?: FamiliaId): Tesela<"laboratorio"> => ({ id: "laboratorio", etiqueta: "Laboratorio", cifra: "27", unidad: "órdenes", nota: "ejemplo", familia, g: { ordenes: 27 } }),
  expansion: (familia?: FamiliaId): Tesela<"expansion"> => ({ id: "expansion", etiqueta: "Tus planes", cifra: "5", unidad: "clínicas más, como mínimo", nota: "ejemplo", familia, g: PLANES }),
};

export const VISTAS: Record<VistaBase, Vista> = {
  todo: {
    id: "todo",
    nombre: ["Todo tu", "negocio"],
    corto: "Todo tu negocio",
    que: "Tus cinco unidades juntas",
    familia: "mezcla",
    muela: MUELA_LISA,
    hoy: { que: "citas", lugares: 5 },
    llamadas: [
      { id: "lab", tipo: "glifo", glifo: "corona", titulo: "Laboratorio", unidad: "coronas y removibles", nota: "ejemplo", ancla: ANCLAS.cuspide, x: 72, y: 13, lado: "der" },
      { id: "whatsapp", tipo: "cifra", cifra: "900", unidad: "al mes", titulo: "conversaciones de WhatsApp en Centro", nota: "ejemplo", ancla: ANCLAS.coronaDer, x: 75, y: 39, lado: "der" },
      { id: "pacientes", tipo: "cifra", cifra: "8 mil", unidad: "pacientes", titulo: "6 mil en Centro y 2 mil en Norte", nota: "ejemplo", ancla: ANCLAS.coronaIzq, x: 5, y: 52, lado: "izq" },
      { id: "rotan", tipo: "cifra", cifra: "3", unidad: "clínicas", titulo: "los doctores rotan entre ellas", nota: "ejemplo", ancla: ANCLAS.raiz, x: 66, y: 63, lado: "der" },
    ],
    teselas: {
      pacientes: { id: "pacientes", etiqueta: "Pacientes", cifra: "8 mil", unidad: "en dos bases", nota: "ejemplo", familia: "centro", g: { arriba: 6, abajo: 2, elegido: "ambos", nombres: ["Centro", "Norte"] } },
      whatsapp: { id: "whatsapp", etiqueta: "WhatsApp de Centro", cifra: "900", unidad: "al mes", estado: "Sin asistente", nota: "ejemplo", familia: "sucursal", g: { escala: 1 } },
      sillones: { id: "sillones", etiqueta: "Un sillón de Centro, hoy", cifra: DOCTORES_SILLON, unidad: "doctores", nota: "horarios: ejemplo", familia: "especialidades", g: { turnos: TURNOS_CENTRO } },
      rotan: T.rotan("sucursal"),
      laboratorio: T.laboratorio("laboratorio"),
      imagen: { id: "imagen", etiqueta: "Imagen Dental", cifra: "64", unidad: "estudios", nota: "ejemplo", familia: "imagen", g: { fuentes: conFuerte("Centro", "Otros"), elegido: false } },
      expansion: T.expansion("centro"),
    },
  },

  centro: {
    id: "centro",
    nombre: ["Clínica Dental", "Ejemplo"],
    corto: "Clínica Dental Ejemplo",
    que: "La clínica principal, en Centro",
    familia: "centro",
    muela: { ...MUELA_LISA, implante: 1 },
    hoy: { que: "citas", lugares: 3 },
    llamadas: [
      { id: "lab", tipo: "glifo", glifo: "corona", titulo: "Laboratorio", unidad: "coronas y removibles", nota: "ejemplo", ancla: ANCLAS.cuspide, x: 72, y: 13, lado: "der" },
      { id: "sillones", tipo: "cifra", cifra: "3", unidad: "sillones", titulo: "hasta 4 doctores en cada uno al día", nota: "ejemplo", ancla: ANCLAS.coronaDer, x: 75, y: 39, lado: "der" },
      { id: "pacientes", tipo: "cifra", cifra: "6 mil", unidad: "pacientes", titulo: "en la clínica principal", nota: "ejemplo", ancla: ANCLAS.coronaIzq, x: 5, y: 52, lado: "izq" },
      { id: "implantes", tipo: "glifo", glifo: "implante", titulo: "Implantes", unidad: "el tratamiento más pedido", nota: "ejemplo", ancla: ANCLAS.raiz, x: 66, y: 63, lado: "der" },
    ],
    teselas: {
      pacientes: { id: "pacientes", etiqueta: "Pacientes", cifra: "6 mil", unidad: "en Centro", nota: "ejemplo", g: { arriba: 6, abajo: 2, elegido: "arriba", nombres: ["Centro", "Norte"] } },
      whatsapp: { id: "whatsapp", etiqueta: "Conversaciones de WhatsApp", cifra: "900", unidad: "al mes", estado: "Sin asistente", nota: "ejemplo", g: { escala: 1 } },
      sillones: { id: "sillones", etiqueta: "Un sillón, hoy", cifra: DOCTORES_SILLON, unidad: "doctores", nota: "horarios: ejemplo", g: { turnos: TURNOS_CENTRO } },
      rotan: T.rotan(),
      laboratorio: { ...T.laboratorio(), cifra: "9", unidad: "órdenes de Centro", g: { ordenes: 9 } },
      imagen: { id: "imagen", etiqueta: "Imagen Dental", cifra: "26", unidad: "estudios", nota: "ejemplo", g: { fuentes: conFuerte("Centro"), elegido: false } },
      expansion: T.expansion(),
    },
  },

  sucursal: {
    id: "sucursal",
    nombre: ["Sucursales", "Norte y Sur"],
    corto: "Sucursales",
    que: "Norte y Sur, por abrir",
    familia: "sucursal",
    muela: { ...MUELA_LISA, brackets: 1 },
    hoy: { que: "citas", lugares: 2 },
    llamadas: [
      { id: "brackets", tipo: "glifo", glifo: "brackets", titulo: "Brackets", unidad: "el tratamiento más pedido", nota: "ejemplo", ancla: ANCLAS.bracket, x: 72, y: 13, lado: "der" },
      { id: "sucursales", tipo: "cifra", cifra: "2", unidad: "sucursales", titulo: "Norte y Sur, por abrir", nota: "ejemplo", ancla: ANCLAS.coronaDer, x: 75, y: 39, lado: "der" },
      { id: "pacientes", tipo: "cifra", cifra: "2 mil", unidad: "pacientes", titulo: "en Norte", nota: "ejemplo", ancla: ANCLAS.coronaIzq, x: 5, y: 52, lado: "izq" },
      { id: "licencias", tipo: "texto", titulo: "Agenda propia", unidad: "cada sucursal con sus sillones y sus doctores", nota: "ejemplo", ancla: ANCLAS.raiz, x: 66, y: 63, lado: "der" },
    ],
    teselas: {
      pacientes: { id: "pacientes", etiqueta: "Pacientes", cifra: "2 mil", unidad: "en Norte", sub: "Sur arranca desde cero", nota: "ejemplo", g: { arriba: 2, abajo: 0.02, elegido: "arriba", nombres: ["Norte", "Sur"] } },
      whatsapp: { id: "whatsapp", etiqueta: "Conversaciones de WhatsApp", cifra: "420", unidad: "al mes", estado: "Sin asistente", nota: "ejemplo", g: { escala: 0.34 } },
      sillones: {
        id: "sillones",
        etiqueta: "Un sillón de Norte, hoy",
        cifra: "2",
        unidad: "doctores",
        nota: "ejemplo",
        g: {
          turnos: [
            { fin: 14, quien: "General" },
            { fin: 20, quien: "Ortodoncia" },
          ],
        },
      },
      rotan: T.rotan(),
      laboratorio: { ...T.laboratorio(), cifra: "18", unidad: "órdenes de Norte", g: { ordenes: 18 } },
      imagen: { id: "imagen", etiqueta: "Imagen Dental", cifra: "15", unidad: "estudios", nota: "ejemplo", g: { fuentes: conFuerte("Norte"), elegido: false } },
      expansion: T.expansion(),
    },
  },

  imagen: {
    id: "imagen",
    nombre: ["Imagen", "Dental"],
    corto: "Imagen Dental",
    que: "Escaneo y radiología",
    familia: "imagen",
    muela: { ...MUELA_LISA, escaneo: 1 },
    hoy: { que: "estudios", lugares: 1 },
    llamadas: [
      { id: "escaneo", tipo: "glifo", glifo: "escaneo", titulo: "Escaneo y radiología", unidad: "para las clínicas y otros dentistas", nota: "ejemplo", ancla: ANCLAS.cuspide, x: 72, y: 13, lado: "der" },
      { id: "estudios", tipo: "cifra", cifra: "64", unidad: "estudios", titulo: "este mes: 41 de las clínicas", nota: "ejemplo", ancla: ANCLAS.coronaDer, x: 75, y: 39, lado: "der" },
      { id: "mercado", tipo: "texto", titulo: "Su mercado", unidad: "las referencias de otros dentistas", nota: "ejemplo", ancla: ANCLAS.coronaIzq, x: 5, y: 52, lado: "izq" },
      { id: "etapa", tipo: "texto", titulo: "El asistente, después", unidad: "primero llega a las clínicas y después aquí", nota: "ejemplo", ancla: ANCLAS.raiz, x: 66, y: 63, lado: "der" },
    ],
    teselas: {
      pacientes: { id: "pacientes", etiqueta: "Estudios", cifra: "64", unidad: "este mes", nota: "ejemplo", g: { arriba: 41, abajo: 23, elegido: "ambos", nombres: ["Las clínicas", "Otros dentistas"] } },
      whatsapp: { id: "whatsapp", etiqueta: "Conversaciones de WhatsApp", cifra: "3.ª", unidad: "etapa", sub: "El asistente llega después de las clínicas", nota: "ejemplo", fantasma: true, g: { escala: 0.2 } },
      sillones: {
        id: "sillones",
        etiqueta: "El escáner, hoy",
        cifra: "7",
        unidad: "estudios",
        nota: "ejemplo",
        g: {
          turnos: [
            { fin: 9.5, quien: "" },
            { fin: 11, quien: "" },
            { fin: 12.5, quien: "" },
            { fin: 14, quien: "" },
            { fin: 16, quien: "" },
            { fin: 17.5, quien: "" },
            { fin: 19, quien: "" },
          ],
        },
      },
      rotan: T.rotan(),
      laboratorio: T.laboratorio(),
      imagen: { id: "imagen", etiqueta: "Referencias", cifra: "64", unidad: "estudios", nota: "ejemplo", g: { fuentes: conFuerte("Centro", "Norte", "Otros"), elegido: true } },
      expansion: T.expansion(),
    },
  },

  laboratorio: {
    id: "laboratorio",
    nombre: ["Laboratorio", "dental"],
    corto: "Laboratorio dental",
    que: "Coronas y removibles, en la principal",
    familia: "laboratorio",
    muela: { ...MUELA_LISA, corona: 1 },
    hoy: { que: "entregas", lugares: 1 },
    llamadas: [
      { id: "piezas", tipo: "glifo", glifo: "corona", titulo: "Coronas y removibles", unidad: "las piezas que ponen las clínicas", nota: "ejemplo", ancla: ANCLAS.cuspide, x: 72, y: 13, lado: "der" },
      { id: "ordenes", tipo: "cifra", cifra: "27", unidad: "órdenes", titulo: "este mes: 18 de Norte y 9 de Centro", nota: "ejemplo", ancla: ANCLAS.coronaDer, x: 75, y: 39, lado: "der" },
      { id: "zirconia", tipo: "texto", titulo: "Zirconia", unidad: "las coronas más pedidas", nota: "ejemplo", ancla: ANCLAS.coronaIzq, x: 5, y: 52, lado: "izq" },
      { id: "entrega", tipo: "cifra", cifra: "5", unidad: "días", titulo: "de entrega en promedio", nota: "ejemplo", ancla: ANCLAS.cuello, x: 66, y: 63, lado: "der" },
    ],
    teselas: {
      pacientes: { id: "pacientes", etiqueta: "Órdenes por clínica", cifra: "27", unidad: "este mes", nota: "ejemplo", g: { arriba: 18, abajo: 9, elegido: "ambos", nombres: ["Norte", "Centro"] } },
      whatsapp: { id: "whatsapp", etiqueta: "Conversaciones de WhatsApp", cifra: "—", estado: "No aplica", nota: "el asistente es para las tres clínicas", fantasma: true, g: { escala: 0.2 } },
      sillones: {
        id: "sillones",
        etiqueta: "Piezas en proceso, hoy",
        cifra: "5",
        unidad: "piezas",
        nota: "ejemplo",
        g: {
          turnos: [
            { fin: 10, quien: "" },
            { fin: 12, quien: "Corona" },
            { fin: 15, quien: "" },
            { fin: 17, quien: "Removible" },
            { fin: 19, quien: "" },
          ],
        },
      },
      rotan: T.rotan(),
      laboratorio: T.laboratorio(),
      imagen: { id: "imagen", etiqueta: "Imagen Dental", cifra: "64", unidad: "estudios", nota: "ejemplo", g: { fuentes: conFuerte(), elegido: false } },
      expansion: T.expansion(),
    },
  },

  especialidades: {
    id: "especialidades",
    nombre: ["Especialidades", "médicas"],
    corto: "Clínica de especialidades médicas",
    que: "Por mapear",
    familia: "especialidades",
    muela: { ...MUELA_LISA, fantasma: 1 },
    hoy: null,
    llamadas: [
      { id: "mapear", tipo: "texto", titulo: "Por mapear", unidad: "sus servicios todavía no se cargan", nota: "ejemplo", ancla: ANCLAS.coronaDer, x: 75, y: 39, lado: "der" },
    ],
    teselas: {
      pacientes: { id: "pacientes", etiqueta: "Pacientes", cifra: "Por mapear", nota: "ejemplo", fantasma: true, g: { arriba: 1, abajo: 1, elegido: "ambos", nombres: ["", ""] } },
      whatsapp: { id: "whatsapp", etiqueta: "Conversaciones de WhatsApp", cifra: "Por mapear", nota: "ejemplo", fantasma: true, g: { escala: 0.2 } },
      sillones: { id: "sillones", etiqueta: "Consultorios, hoy", cifra: "Por mapear", nota: "ejemplo", fantasma: true, g: { turnos: [{ fin: 20, quien: "" }] } },
      rotan: T.rotan(),
      laboratorio: T.laboratorio(),
      imagen: { id: "imagen", etiqueta: "Imagen Dental", cifra: "64", unidad: "estudios", nota: "ejemplo", g: { fuentes: conFuerte(), elegido: false } },
      expansion: T.expansion(),
    },
  },
};

/** Conversaciones por día del mes (EJEMPLO): entre semana más, el sábado menos y el domingo casi nada */
export const DIAS_WHATSAPP = Array.from({ length: 30 }, (_, i) => {
  const dia = (i + 2) % 7; // el 1 cae en martes
  return dia === 0 ? 12 : dia === 6 ? 40 : 52;
});

/** Los tipos de unidad que se pueden crear: clínica de uno a tres sillones, laboratorio o radiológico */
export type TipoUnidad = "clinica" | "laboratorio" | "radiologico";
export const NOMBRE_TIPO: Record<TipoUnidad, string> = { clinica: "Clínica", laboratorio: "Laboratorio", radiologico: "Radiológico" };

/**
 * Una unidad creada en el demo («Nueva unidad», BRIEF-4 §4.D). Nace sin datos: gris cálido y la muela en
 * fantasma (como lo que está por mapear), y cada mosaico dice qué lo va a llenar. Vive solo en esta pestaña.
 */
export function nuevaVista(n: number, d: { nombre: string; tipo: TipoUnidad; sillones: number }): Vista {
  const nombre = d.nombre.trim().replace(/\s+/g, " ");
  const palabras = nombre.split(" ");
  const lineas: [string, string] = palabras.length > 1 ? [palabras[0], palabras.slice(1).join(" ")] : [NOMBRE_TIPO[d.tipo], nombre];
  const primera = { clinica: "su primera cita", laboratorio: "su primera orden", radiologico: "su primer estudio" }[d.tipo];
  const que = d.tipo === "clinica" ? `Clínica de ${d.sillones} ${d.sillones === 1 ? "sillón" : "sillones"}` : NOMBRE_TIPO[d.tipo];
  const nota = "creada en este demo";
  return {
    id: `nueva-${n}`,
    nombre: lineas,
    corto: nombre,
    que: `${que} · nueva`,
    familia: "especialidades",
    muela: { ...MUELA_LISA, fantasma: 1 },
    hoy: { que: d.tipo === "clinica" ? "citas" : d.tipo === "laboratorio" ? "entregas" : "estudios", lugares: d.tipo === "clinica" ? d.sillones : 1, vacia: true },
    llamadas: [{ id: "nueva", tipo: "texto", titulo: "Recién creada", unidad: `${que}: sus datos llegan con ${primera}`, nota, ancla: ANCLAS.coronaDer, x: 75, y: 39, lado: "der" }],
    teselas: {
      pacientes: {
        id: "pacientes",
        etiqueta: d.tipo === "clinica" ? "Pacientes" : d.tipo === "laboratorio" ? "Órdenes" : "Estudios",
        cifra: "0",
        sub: `Llegan con ${primera}`,
        nota,
        fantasma: true,
        g: { arriba: 1, abajo: 1, elegido: "ambos", nombres: ["", ""] },
      },
      whatsapp: { id: "whatsapp", etiqueta: "Conversaciones de WhatsApp", cifra: "0", estado: "Sin asistente", nota, fantasma: true, g: { escala: 0.2 } },
      sillones: {
        id: "sillones",
        etiqueta: d.tipo === "clinica" ? "Un sillón, hoy" : d.tipo === "laboratorio" ? "Piezas en proceso, hoy" : "El escáner, hoy",
        cifra: "0",
        unidad: d.tipo === "clinica" ? "doctores" : d.tipo === "laboratorio" ? "piezas" : "estudios",
        sub: "Sin turnos todavía",
        nota,
        fantasma: true,
        g: { turnos: [{ fin: 20, quien: "" }] },
      },
      // lo que es de toda la empresa lo dice, para que no se lea como de la unidad nueva
      rotan: T.rotan(),
      laboratorio: { ...T.laboratorio(), nota: "de todo tu negocio · ejemplo" },
      imagen: { id: "imagen", etiqueta: "Imagen Dental", cifra: "64", unidad: "estudios", nota: "de todo tu negocio · ejemplo", g: { fuentes: conFuerte(), elegido: false } },
      expansion: T.expansion(),
    },
  };
}
