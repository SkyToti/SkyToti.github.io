// `orquesta-agentes`: caso «taller-claude» (5 pasos). Un planificador reparte a seis agentes según su costo;
// los informes vuelven por una compuerta.
import type { Escena, Nodo, Trazo } from "./tipos";

const AGENTES: [id: string, es: string, en: string, modelo: string, alto: [number, number]][] = [
  ["explorador", "EXPLORADOR", "EXPLORER", "Haiku", [1, 3.3]],
  ["cartografo", "CARTÓGRAFO", "MAPPER", "Haiku", [4, 3.3]],
  ["investigador", "INVESTIGADOR", "RESEARCHER", "Sonnet", [1, 4.3]],
  ["redactor", "REDACTOR", "WRITER", "Sonnet", [4, 4.3]],
  ["verificador", "VERIFICADOR", "VERIFIER", "Sonnet", [1, 5.3]],
  ["programador", "PROGRAMADOR", "PROGRAMMER", "Opus", [4, 5.3]],
];
const ids = AGENTES.map(([id]) => id);

const agentes: Nodo[] = AGENTES.map(([id, es, en, modelo, alto], i) => ({
  id,
  tipo: "ia",
  etiqueta: { es, en },
  nota: { es: modelo, en: modelo },
  ancho: [7, i + 1],
  alto,
}));

// En el celular el reparto y los informes bajan por el mismo eje central.
const reparto: Trazo[] = ids.map((id) => ({ id: `plan-${id}`, de: "plan", a: id, ancho: { via: 5.3 }, alto: { forma: "vh" } }));
const informes: Trazo[] = ids.map((id) => ({
  id: `${id}-informe`,
  de: id,
  a: "informe",
  ancho: { via: 8.45 },
  alto: { forma: "hv" },
}));

const escena: Escena = {
  nombre: "orquesta-agentes",
  nodos: [
    { id: "encargo", tipo: "persona", etiqueta: { es: "ENCARGO", en: "REQUEST" }, ancho: [1, 3], alto: [2.5, 1] },
    { id: "plan", tipo: "ia", etiqueta: { es: "PLANIFICADOR", en: "PLANNER" }, ancho: [3.6, 3], alto: [2.5, 2.1] },
    ...agentes,
    {
      id: "informe",
      tipo: "dato",
      etiqueta: { es: "INFORME CORTO", en: "SHORT REPORT" },
      nota: { es: "formato fijo", en: "fixed format" },
      ancho: [9.5, 3],
      alto: [2.5, 6.5],
    },
    { id: "listo", tipo: "fin", etiqueta: { es: "INTEGRADO", en: "MERGED" }, ancho: [12, 3], alto: [2.5, 8] },
  ],
  trazos: [{ id: "encargo-plan", de: "encargo", a: "plan" }, ...reparto, ...informes, { id: "informe-listo", de: "informe", a: "listo" }],
  compuertas: [{ id: "control", en: "informe-listo", etiqueta: { es: "CONTROLES", en: "CHECKS" } }],
  cotas: [{ id: "seis", junto: "plan", valor: 6, etiqueta: { es: "agentes", en: "agents" } }],
  pasos: [
    { acciones: [{ enciende: "encargo" }, { dibuja: "encargo-plan" }, { pulso: "encargo-plan" }, { enciende: "plan" }] },
    { acciones: [{ dibuja: reparto.map((t) => t.id) }, { pulsos: reparto.map((t) => t.id) }, { cuenta: "seis" }] },
    { acciones: [{ enciende: ids }] },
    { acciones: [{ dibuja: informes.map((t) => t.id) }, { pulsos: informes.map((t) => t.id) }, { enciende: "informe" }] },
    {
      acciones: [
        { dibuja: "informe-listo" },
        { pulso: "informe-listo", vuelve: true, color: "alto" },
        { compuerta: "control", estado: "detiene" },
        { compuerta: "control", estado: "abre" },
        { pulso: "informe-listo" },
        { marca: "listo", como: "hecho" },
      ],
    },
  ],
};

export default escena;
