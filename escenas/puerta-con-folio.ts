// `puerta-con-folio`: caso «minecraft-rcon-mcp» (5 pasos). La nota de `filtro` del guion
// («leer · escribir · confirmar · negar», 35 caracteres) pasaba el tope de 26: va resumida y la lista
// completa queda en los pasos del caso.
import type { Escena } from "./tipos";

// En el celular las tres salidas del filtro se reparten a la misma altura.
const reparto = { alto: { via: 2.75 } };

const escena: Escena = {
  nombre: "puerta-con-folio",
  nodos: [
    { id: "agente", tipo: "ia", etiqueta: { es: "AGENTE DE IA", en: "AI AGENT" }, ancho: [1, 3], alto: [1, 1] },
    {
      id: "filtro",
      tipo: "servicio",
      etiqueta: { es: "CLASIFICA", en: "CLASSIFIES" },
      nota: { es: "en 4 niveles de riesgo", en: "into 4 risk levels" },
      ancho: [4, 3],
      alto: [1, 2],
    },
    {
      id: "seguro",
      tipo: "fin",
      etiqueta: { es: "CORRE", en: "RUNS" },
      nota: { es: "lo seguro", en: "the safe ones" },
      ancho: [8, 1],
      alto: [4, 3.5],
    },
    {
      id: "folio",
      tipo: "dato",
      etiqueta: { es: "FOLIO", en: "TICKET" },
      nota: { es: "un solo uso", en: "single use" },
      ancho: [8, 3],
      alto: [2, 4.7],
    },
    {
      id: "persona",
      tipo: "persona",
      etiqueta: { es: "UNA PERSONA", en: "A HUMAN" },
      nota: { es: "aprueba fuera del modelo", en: "approves outside the model" },
      ancho: [8, 5],
      alto: [2, 6],
    },
    { id: "servidor", tipo: "fin", etiqueta: { es: "SERVIDOR", en: "SERVER" }, ancho: [12, 3], alto: [4, 4.7] },
    { id: "negado", tipo: "fin", etiqueta: { es: "NEGADO", en: "DENIED" }, ancho: [4, 6], alto: [1, 3.5] },
  ],
  trazos: [
    { id: "agente-filtro", de: "agente", a: "filtro" },
    { id: "filtro-seguro", de: "filtro", a: "seguro", ...reparto },
    { id: "filtro-folio", de: "filtro", a: "folio", ...reparto },
    { id: "persona-folio", de: "persona", a: "folio" },
    { id: "folio-servidor", de: "folio", a: "servidor" },
    { id: "seguro-servidor", de: "seguro", a: "servidor", ancho: { forma: "hv" } },
    { id: "filtro-negado", de: "filtro", a: "negado", ...reparto },
  ],
  compuertas: [{ id: "candado", en: "folio-servidor", etiqueta: { es: "ESPERA", en: "ON HOLD" } }],
  cotas: [
    { id: "ataques", junto: "filtro", valor: 227, etiqueta: { es: "ataques probados", en: "attacks tested" } },
    { id: "pruebas", junto: "servidor", valor: 1092, etiqueta: { es: "pruebas aprobadas", en: "tests passing" } },
  ],
  pasos: [
    { acciones: [{ enciende: "agente" }, { dibuja: "agente-filtro" }, { pulso: "agente-filtro" }] },
    {
      acciones: [
        { enciende: "filtro" },
        { dibuja: ["filtro-seguro", "filtro-folio", "filtro-negado"] },
        { pulso: "filtro-negado", color: "alto" },
        { marca: "negado", como: "alto" },
        { cuenta: "ataques" },
      ],
    },
    {
      acciones: [
        { pulso: "filtro-seguro" },
        { enciende: "seguro" },
        { dibuja: "seguro-servidor" },
        { pulso: "seguro-servidor" },
        { marca: "seguro", como: "hecho" },
      ],
    },
    {
      acciones: [
        { pulso: "filtro-folio" },
        { enciende: "folio" },
        { dibuja: "folio-servidor" },
        { pulso: "folio-servidor" },
        { compuerta: "candado", estado: "detiene" },
      ],
    },
    {
      acciones: [
        { enciende: "persona" },
        { dibuja: "persona-folio" },
        { pulso: "persona-folio" },
        { compuerta: "candado", estado: "abre" },
        { pulso: "folio-servidor" },
        { marca: "servidor", como: "hecho" },
        { cuenta: "pruebas" },
      ],
    },
  ],
};

export default escena;
