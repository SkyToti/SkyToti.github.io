// `historia-scroll`: caso «yacontesto.com» (5 pasos). Cadena simple: un nodo por paso.
// Las etiquetas del guion («EL ASISTENTE CONTESTA», «CITA EN EL CALENDARIO»…) pasaban el tope de 18
// caracteres: van acortadas. En `ancho` van en zigzag: cinco etiquetas largas no caben en una fila a 12 px.
import type { Escena, Nodo, Paso, Trazo } from "./tipos";

const NODOS: Omit<Nodo, "alto">[] = [
  { id: "historia", tipo: "persona", etiqueta: { es: "EMPIEZA EL RELATO", en: "THE STORY STARTS" }, ancho: [1, 2] },
  { id: "mensaje", tipo: "servicio", etiqueta: { es: "LLEGA UN MENSAJE", en: "A MESSAGE ARRIVES" }, ancho: [3.75, 4] },
  { id: "contesta", tipo: "ia", etiqueta: { es: "ASISTENTE CONTESTA", en: "ASSISTANT REPLIES" }, ancho: [6.5, 2] },
  { id: "cita", tipo: "dato", etiqueta: { es: "CITA EN CALENDARIO", en: "BOOKED ON CALENDAR" }, ancho: [9.25, 4] },
  { id: "demo", tipo: "fin", etiqueta: { es: "PIDE UNA DEMO", en: "ASKS FOR A DEMO" }, ancho: [12, 2] },
];

const nodos: Nodo[] = NODOS.map((n, i) => ({ ...n, alto: [2.5, 1 + i * 1.15] }));
// En zigzag cada trazo es una L: sale por el lado y entra al siguiente por arriba o por abajo.
const trazos: Trazo[] = nodos
  .slice(1)
  .map((n, i) => ({ id: `${nodos[i]!.id}-${n.id}`, de: nodos[i]!.id, a: n.id, ancho: { forma: "hv" as const } }));
const pasos: Paso[] = nodos.map((n, i) =>
  i === 0
    ? { acciones: [{ enciende: n.id }, { espera: 0.5 }] }
    : {
        acciones: [
          { dibuja: trazos[i - 1]!.id },
          { pulso: trazos[i - 1]!.id },
          i === nodos.length - 1 ? { marca: n.id, como: "hecho" } : { enciende: n.id },
        ],
      },
);

const escena: Escena = { nombre: "historia-scroll", nodos, trazos, pasos };

export default escena;
