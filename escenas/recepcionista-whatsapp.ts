// `recepcionista-whatsapp`: caso «Recepcionista con IA» (5 pasos). Texto 100 % ficticio.
import type { Escena } from "./tipos";

// En el celular las cuatro salidas de la IA bajan por un mismo tronco a la izquierda.
const bus = { alto: { forma: "vh" as const } };
const salida = { ancho: { via: 8.5 } };

const escena: Escena = {
  nombre: "recepcionista-whatsapp",
  nodos: [
    { id: "paciente", tipo: "persona", etiqueta: { es: "PACIENTE", en: "PATIENT" }, ancho: [1, 3], alto: [1, 1] },
    {
      id: "wa",
      tipo: "servicio",
      etiqueta: { es: "WHATSAPP", en: "WHATSAPP" },
      nota: { es: "el número de la clínica", en: "the clinic's number" },
      ancho: [4, 3],
      alto: [1, 2.4],
    },
    { id: "ia", tipo: "ia", etiqueta: { es: "RECEPCIONISTA IA", en: "AI RECEPTIONIST" }, ancho: [7, 3], alto: [1, 3.6] },
    {
      id: "reglas",
      tipo: "dato",
      etiqueta: { es: "PRECIOS Y HORARIOS", en: "PRICES AND HOURS" },
      nota: { es: "lo que la clínica aprobó", en: "what the clinic approved" },
      ancho: [7, 1],
      alto: [2.6, 4.7],
    },
    { id: "agenda", tipo: "dato", etiqueta: { es: "AGENDA", en: "SCHEDULE" }, ancho: [10, 1], alto: [2.6, 5.8] },
    { id: "cita", tipo: "fin", etiqueta: { es: "CITA AGENDADA", en: "BOOKED" }, ancho: [10, 3], alto: [2.6, 6.8] },
    {
      id: "equipo",
      tipo: "persona",
      etiqueta: { es: "EQUIPO", en: "STAFF" },
      nota: { es: "si hace falta", en: "when needed" },
      ancho: [10, 5],
      alto: [2.6, 7.8],
    },
  ],
  trazos: [
    { id: "paciente-wa", de: "paciente", a: "wa" },
    { id: "wa-ia", de: "wa", a: "ia" },
    { id: "ia-reglas", de: "ia", a: "reglas", ...bus },
    { id: "ia-agenda", de: "ia", a: "agenda", ...bus, ...salida },
    { id: "ia-cita", de: "ia", a: "cita", ...bus },
    { id: "ia-equipo", de: "ia", a: "equipo", punteado: true, ...bus, ...salida },
  ],
  globos: [
    {
      id: "g1",
      junto: "paciente",
      lado: "entra",
      texto: { es: "¿Tienen cita mañana a las 10?", en: "Any opening tomorrow at 10?" },
    },
    {
      id: "g2",
      junto: "wa",
      lado: "sale",
      texto: { es: "A las 10 está ocupado. Tengo 10:30 u 11:00.", en: "10 is taken. I have 10:30 or 11:00." },
    },
  ],
  pasos: [
    {
      acciones: [
        { enciende: "paciente" },
        { globo: "g1" },
        { dibuja: ["paciente-wa", "wa-ia"] },
        { pulso: "paciente-wa" },
        { enciende: "wa" },
        { pulso: "wa-ia" },
        { enciende: "ia" },
      ],
    },
    { acciones: [{ dibuja: "ia-reglas" }, { pulso: "ia-reglas", vuelve: true }, { enciende: "reglas" }] },
    { acciones: [{ dibuja: "ia-agenda" }, { pulso: "ia-agenda", vuelve: true }, { enciende: "agenda" }, { globo: "g2" }] },
    { acciones: [{ dibuja: "ia-cita" }, { pulso: "ia-cita" }, { marca: "cita", como: "hecho" }] },
    { acciones: [{ dibuja: "ia-equipo" }, { pulso: "ia-equipo" }, { enciende: "equipo" }] },
  ],
};

export default escena;
