// `crm-agenda`: caso «CRM dental» (5 pasos).
import type { Escena } from "./tipos";

const escena: Escena = {
  nombre: "crm-agenda",
  nodos: [
    { id: "recepcion", tipo: "persona", etiqueta: { es: "RECEPCIÓN", en: "FRONT DESK" }, ancho: [1, 2], alto: [1, 1] },
    { id: "doctor", tipo: "persona", etiqueta: { es: "DOCTOR", en: "DOCTOR" }, ancho: [1, 5], alto: [1, 4.4] },
    {
      id: "agenda",
      tipo: "dato",
      etiqueta: { es: "AGENDA", en: "SCHEDULE" },
      nota: { es: "por doctor", en: "per doctor" },
      ancho: [5, 1],
      alto: [1, 2],
    },
    { id: "cita", tipo: "dato", etiqueta: { es: "CITA", en: "APPOINTMENT" }, ancho: [5, 3], alto: [1, 3.2] },
    { id: "presu", tipo: "dato", etiqueta: { es: "PRESUPUESTO", en: "TREATMENT QUOTE" }, ancho: [5, 5], alto: [4, 4.4] },
    {
      id: "caja",
      tipo: "fin",
      etiqueta: { es: "CAJA", en: "CHECKOUT" },
      nota: { es: "el corte cuadra", en: "the daily count adds up" },
      ancho: [9, 5],
      alto: [4, 5.5],
    },
    {
      id: "bot",
      tipo: "ia",
      etiqueta: { es: "RECEPCIONISTA IA", en: "AI RECEPTIONIST" },
      nota: { es: "lee de aquí", en: "reads from here" },
      ancho: [11, 2],
      alto: [4, 2],
    },
  ],
  trazos: [
    { id: "recepcion-agenda", de: "recepcion", a: "agenda" },
    { id: "agenda-cita", de: "agenda", a: "cita" },
    { id: "doctor-presu", de: "doctor", a: "presu" },
    { id: "presu-caja", de: "presu", a: "caja" },
    { id: "bot-agenda", de: "bot", a: "agenda", punteado: true },
  ],
  pasos: [
    { acciones: [{ enciende: "recepcion" }, { dibuja: "recepcion-agenda" }, { pulso: "recepcion-agenda" }, { enciende: "agenda" }] },
    { acciones: [{ dibuja: "agenda-cita" }, { pulso: "agenda-cita" }, { marca: "cita", como: "hecho" }] },
    { acciones: [{ enciende: "doctor" }, { dibuja: "doctor-presu" }, { pulso: "doctor-presu" }, { enciende: "presu" }] },
    { acciones: [{ dibuja: "presu-caja" }, { pulso: "presu-caja" }, { marca: "caja", como: "hecho" }] },
    { acciones: [{ dibuja: "bot-agenda" }, { pulso: "bot-agenda", vuelve: true }, { enciende: "bot" }] },
  ],
};

export default escena;
