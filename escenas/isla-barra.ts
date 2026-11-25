// `isla-barra`: caso «La Isla» (4 pasos). Cadena simple: un nodo por paso.
import type { Escena, Nodo, Paso, Trazo } from "./tipos";

const NODOS: Omit<Nodo, "ancho" | "alto">[] = [
  {
    id: "motor",
    tipo: "servicio",
    etiqueta: { es: "MOTOR EN RUST", en: "RUST ENGINE" },
    nota: { es: "vigila el sistema", en: "watches the system" },
  },
  { id: "canal", tipo: "servicio", etiqueta: { es: "CANAL LOCAL", en: "LOCAL CHANNEL" } },
  { id: "panel", tipo: "dato", etiqueta: { es: "PANEL", en: "PANEL" }, nota: { es: "nace y se destruye", en: "opens, then is destroyed" } },
  { id: "respaldo", tipo: "fin", etiqueta: { es: "RESPALDO", en: "FALLBACK" } },
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

const escena: Escena = { nombre: "isla-barra", nodos, trazos, pasos };

export default escena;
