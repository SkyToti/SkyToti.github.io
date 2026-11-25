// `caja-libreria`: caso «Punto de venta de mi librería» (5 pasos). Cadena simple: un nodo por paso.
import type { Escena, Nodo, Paso, Trazo } from "./tipos";

const NODOS: Omit<Nodo, "ancho" | "alto">[] = [
  { id: "busca", tipo: "persona", etiqueta: { es: "BUSCA EL LIBRO", en: "FINDS THE BOOK" }, nota: { es: "nombre o código", en: "by name or code" } },
  { id: "carrito", tipo: "dato", etiqueta: { es: "CARRITO", en: "CART" }, nota: { es: "efectivo o tarjeta", en: "cash or card" } },
  { id: "inventario", tipo: "dato", etiqueta: { es: "INVENTARIO", en: "INVENTORY" }, nota: { es: "se descuenta solo", en: "updates on its own" } },
  { id: "aviso", tipo: "servicio", etiqueta: { es: "AVISO", en: "ALERT" }, nota: { es: "quedan pocos", en: "running low" } },
  { id: "reporte", tipo: "fin", etiqueta: { es: "REPORTE", en: "REPORT" }, nota: { es: "en Excel", en: "in Excel" } },
];

const nodos: Nodo[] = NODOS.map((n, i) => ({ ...n, ancho: [1 + (i * 11) / 4, 3], alto: [2.5, 1 + i * 1.15] }));
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

const escena: Escena = { nombre: "caja-libreria", nodos, trazos, pasos };

export default escena;
