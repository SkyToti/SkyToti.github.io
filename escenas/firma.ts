// `firma`: portada y «Cómo trabajo» (4 pasos, como «Cómo trabajo» de contenido/perfil.es.md).
import type { Escena } from "./tipos";

const agente = { es: "AGENTE", en: "AGENT" };
// Los tres trazos a producción se juntan en la columna 9 y siguen como uno.
const juntaEnPruebas = { ancho: { via: 9 } };

const escena: Escena = {
  nombre: "firma",
  nodos: [
    {
      id: "idea",
      tipo: "persona",
      etiqueta: { es: "DIEGO", en: "DIEGO" },
      nota: { es: "decide qué se construye", en: "decides what gets built" },
      ancho: [1, 3],
      alto: [2.5, 1],
    },
    { id: "plan", tipo: "ia", etiqueta: { es: "PLANIFICADOR", en: "PLANNER" }, ancho: [4, 3], alto: [2.5, 2.3] },
    { id: "a1", tipo: "ia", etiqueta: agente, ancho: [7, 1], alto: [1, 3.3] },
    { id: "a2", tipo: "ia", etiqueta: agente, ancho: [7, 3], alto: [2.5, 3.3] },
    { id: "a3", tipo: "ia", etiqueta: agente, ancho: [7, 5], alto: [4, 3.3] },
    { id: "prod", tipo: "fin", etiqueta: { es: "EN PRODUCCIÓN", en: "IN PRODUCTION" }, ancho: [12, 3], alto: [2.5, 5.6] },
  ],
  trazos: [
    { id: "idea-plan", de: "idea", a: "plan" },
    { id: "plan-a1", de: "plan", a: "a1" },
    { id: "plan-a2", de: "plan", a: "a2" },
    { id: "plan-a3", de: "plan", a: "a3" },
    { id: "a1-prod", de: "a1", a: "prod", ...juntaEnPruebas },
    { id: "a2-prod", de: "a2", a: "prod", ...juntaEnPruebas },
    { id: "a3-prod", de: "a3", a: "prod", ...juntaEnPruebas },
  ],
  compuertas: [{ id: "pruebas", en: "a2-prod", etiqueta: { es: "PRUEBAS", en: "TESTS" } }],
  cotas: [{ id: "n", junto: "pruebas", valor: 2000, prefijo: "+", etiqueta: { es: "pruebas aprobadas", en: "tests passing" } }],
  pasos: [
    { acciones: [{ enciende: "idea" }, { dibuja: "idea-plan" }, { pulso: "idea-plan" }, { enciende: "plan" }] },
    {
      acciones: [
        { dibuja: ["plan-a1", "plan-a2", "plan-a3"] },
        { pulsos: ["plan-a1", "plan-a2", "plan-a3"] },
        { enciende: ["a1", "a2", "a3"] },
      ],
    },
    {
      acciones: [
        { dibuja: ["a1-prod", "a2-prod", "a3-prod"] },
        { pulso: "a1-prod", vuelve: true, color: "alto" },
        { compuerta: "pruebas", estado: "detiene" },
        { compuerta: "pruebas", estado: "abre" },
        { pulso: "a1-prod" },
        { cuenta: "n" },
      ],
    },
    { acciones: [{ pulso: "a2-prod" }, { marca: "prod", como: "hecho" }] },
  ],
};

export default escena;
