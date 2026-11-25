// `jefe-del-mar`: caso «La Elegía y Coliseo» (5 pasos). Cadena simple: un nodo por paso.
import type { Escena, Nodo, Paso, Trazo } from "./tipos";

const NODOS: Omit<Nodo, "ancho" | "alto">[] = [
  { id: "script", tipo: "ia", etiqueta: { es: "SCRIPT", en: "SCRIPT" }, nota: { es: "dibuja y arma", en: "draws and builds" } },
  { id: "prueba", tipo: "servicio", etiqueta: { es: "PRUEBA", en: "TEST" }, nota: { es: "el modelo carga", en: "the model loads" } },
  { id: "pelea", tipo: "ia", etiqueta: { es: "PELEA", en: "FIGHT" }, nota: { es: "IA del jefe", en: "the boss's own AI" } },
  { id: "bot", tipo: "servicio", etiqueta: { es: "BOT DE PRUEBA", en: "TEST BOT" } },
  { id: "servidor", tipo: "fin", etiqueta: { es: "SERVIDOR", en: "SERVER" } },
];

const nodos: Nodo[] = NODOS.map((n, i) => ({ ...n, ancho: [1 + i * 2.75, 3], alto: [2.5, 1 + i * 1.15] }));
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

const escena: Escena = { nombre: "jefe-del-mar", nodos, trazos, pasos };

export default escena;
