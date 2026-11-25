// `itinerario-privado`: caso «Tierra de Viajes» (4 pasos). Cadena simple: un nodo por paso.
import type { Escena, Nodo, Paso, Trazo } from "./tipos";

const NODOS: Omit<Nodo, "ancho" | "alto">[] = [
  { id: "anuncio", tipo: "servicio", etiqueta: { es: "ANUNCIO", en: "AD" } },
  { id: "pagina", tipo: "servicio", etiqueta: { es: "PÁGINA", en: "WEBSITE" } },
  {
    id: "panel",
    tipo: "persona",
    etiqueta: { es: "PANEL", en: "ADMIN PANEL" },
    nota: { es: "arma el itinerario", en: "builds the itinerary" },
  },
  {
    id: "enlace",
    tipo: "fin",
    etiqueta: { es: "ENLACE PRIVADO", en: "PRIVATE LINK" },
    nota: { es: "uno por viajero", en: "one per traveler" },
  },
];

const nodos: Nodo[] = NODOS.map((n, i) => ({ ...n, ancho: [1 + (i * 11) / 3, 3], alto: [2.5, 1 + i * 1.15] }));
const trazos: Trazo[] = nodos.slice(1).map((n, i) => ({ id: `${nodos[i]!.id}-${n.id}`, de: nodos[i]!.id, a: n.id }));
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

const escena: Escena = { nombre: "itinerario-privado", nodos, trazos, pasos };

export default escena;
