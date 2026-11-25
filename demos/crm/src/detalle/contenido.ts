/**
 * Lo que dice cada detalle (BRIEF.md §3.4): sus datos con su procedencia y dos o tres líneas de
 * contexto. Mismas reglas que vista.ts: lo real con su fuente; lo demás, «ejemplo».
 */
import type { TeselaId } from "../color";
import type { Vista } from "../vista";

export interface Dato {
  texto: string;
  nota: string;
}
export interface Fila {
  texto: string;
  sub: string;
  /** estados que se recorren con un toque (órdenes del laboratorio) */
  estados?: string[];
  /** 0–1: una línea con su punto lima (qué tanto pesa) */
  medida?: number;
  /** abre el expediente de este paciente ficticio */
  expediente?: string;
}
export interface Lista {
  titulo: string;
  filas: Fila[];
  nota: string;
}
export interface Contenido {
  datos: Dato[];
  contexto: string[];
  lista?: Lista;
}

const ORDEN = ["En proceso", "Lista", "Entregada"];

export function contenido(id: TeselaId, v: Vista): Contenido {
  const t = v.teselas[id];
  switch (id) {
    case "pacientes": {
      const g = v.teselas.pacientes.g;
      if (t.fantasma) return { datos: [{ texto: "Todavía sin datos", nota: "ejemplo" }], contexto: ["Sus servicios y su base están por mapear: aquí no inventamos ninguno."] };
      const esEstudio = v.id === "imagen" || v.id === "laboratorio";
      return {
        datos: [
          { texto: `${g.nombres[0]}: ${cuenta(g.arriba, esEstudio)}`, nota: t.nota },
          { texto: `${g.nombres[1]}: ${g.abajo < 0.1 ? "desde cero" : cuenta(g.abajo, esEstudio)}`, nota: t.nota },
          ...(v.id === "sucursal" ? [{ texto: "Sur arranca desde cero, sin base que migrar", nota: "ejemplo" }] : []),
        ],
        contexto: [
          "El área de cada esfera es proporcional a su base: por eso la de arriba se ve casi dos veces más ancha.",
          "El punto lima marca la unidad que elegiste; en «Todo tu negocio» queda en la unión.",
        ],
      };
    }
    case "whatsapp":
      if (t.fantasma)
        return {
          datos: [{ texto: "El asistente llega primero a las tres clínicas y después a esta unidad", nota: "ejemplo" }],
          contexto: ["El haz queda en fantasma: esta unidad no está en la primera etapa del asistente."],
        };
      return {
        datos: [
          { texto: v.id === "sucursal" ? `Unas ${t.cifra} conversaciones al mes` : "Unas 900 conversaciones al mes en Centro", nota: "ejemplo" },
          { texto: "De 40 a 55 WhatsApps al día en Centro; unos 30 en un día tranquilo", nota: "ejemplo" },
          { texto: "Un asistente que contesta en las tres clínicas, por construir", nota: "ejemplo" },
        ],
        contexto: [
          "Cada hebra recorre el mes del día 1 al 30. El haz se ensancha cuando hay más conversaciones y se estrecha los domingos; el reparto por día es de ejemplo.",
          "El punto lima es hoy.",
        ],
        lista: {
          titulo: "De qué te escriben",
          filas: [
            { texto: "Agendar o mover una cita", sub: "46 %", medida: 0.46 },
            { texto: "Dudas de un tratamiento", sub: "23 %", medida: 0.23 },
            { texto: "Ubicación y horarios", sub: "18 %", medida: 0.18 },
            { texto: "Urgencias", sub: "13 %", medida: 0.13 },
          ],
          nota: "ejemplo",
        },
      };
    case "sillones": {
      if (t.fantasma) return { datos: [{ texto: "Consultorios por mapear", nota: "ejemplo" }], contexto: ["Sin datos todavía: el arco queda en fantasma."] };
      const turnos = v.teselas.sillones.g.turnos;
      const conNombre = turnos.filter((x) => x.quien);
      return {
        datos: [
          ...(v.id === "todo" || v.id === "centro" ? [{ texto: "Hasta 4 doctores en un mismo sillón al día: cirugía, endodoncia, prótesis y general", nota: "ejemplo" }] : []),
          ...(v.id === "todo" || v.id === "centro" ? [{ texto: "Las clínicas se organizan por sillón", nota: "ejemplo" }] : []),
          ...(conNombre.length ? [{ texto: conNombre.map((x) => `${x.quien} hasta las ${x.fin}:00`).join(" · "), nota: "horarios: ejemplo" }] : []),
          ...(!conNombre.length ? [{ texto: `${turnos.length} ${v.id === "imagen" ? "estudios" : "piezas"} hoy, cada uno termina donde aterriza su arco`, nota: "ejemplo" }] : []),
        ],
        contexto: [
          v.id === "imagen" || v.id === "laboratorio"
            ? "Cada arco sale a las 8:00 y aterriza a la hora en que termina su trabajo."
            : "Cada arco es un doctor: sale a la apertura y aterriza a la hora en que deja el sillón.",
          "El punto lima es la hora actual.",
        ],
      };
    }
    case "rotan":
      return {
        datos: [
          { texto: "Los doctores rotan entre las tres clínicas", nota: "ejemplo" },
          { texto: "Hoy hay que darlo de alta en cada agenda y bloquearle los días", nota: "ejemplo" },
          { texto: "Dr. Andrés Varela: lunes y jueves en Centro, martes y viernes en Norte, miércoles y sábado en Sur", nota: "doctor ficticio · agenda: ejemplo" },
        ],
        contexto: ["Un punto por clínica en la órbita; el lima es donde está hoy el doctor que rota.", "Aquí se asoma el universo: cada clínica, una órbita."],
      };
    case "laboratorio":
      return {
        datos: [
          { texto: "Hace las piezas que ponen las clínicas: removibles y coronas", nota: "ejemplo" },
          { texto: "Las coronas de zirconia, las más pedidas", nota: "ejemplo" },
          { texto: `${t.cifra} ${t.unidad ?? "órdenes"} este mes · 5 días de entrega en promedio`, nota: "ejemplo" },
        ],
        contexto: ["Una elipse por orden, de la más vieja del mes (arriba) a la de hoy, que baja al punto lima."],
        lista: {
          titulo: "Órdenes de esta semana",
          filas: [
            { texto: "Corona de zirconia, pieza 36", sub: "Mariana R. · Centro", estados: ORDEN },
            { texto: "Removible superior", sub: "Héctor S. · Centro", estados: ORDEN },
            { texto: "Corona de zirconia, pieza 16", sub: "Héctor S. · Centro", estados: [ORDEN[1], ORDEN[2], ORDEN[0]] },
            { texto: "Retenedor", sub: "Lucía C. · Norte", estados: [ORDEN[2], ORDEN[0], ORDEN[1]] },
          ],
          nota: "pacientes ficticios · toca una orden para cambiar su estado",
        },
      };
    case "imagen":
      return {
        datos: [
          { texto: "Escaneo y radiología", nota: "ejemplo" },
          { texto: "Su mercado: las referencias de otros dentistas", nota: "ejemplo" },
          { texto: "Este mes: 26 de Centro, 15 de Norte y 23 de otros dentistas", nota: "ejemplo" },
        ],
        contexto: ["Cada arco es un haz que llega a Imagen Dental: una línea por cada 5 estudios de su fuente."],
        lista: {
          titulo: "Estudios de hoy",
          filas: [
            { texto: "Panorámica, referida por otro dentista", sub: "Emilio T. · la IA ya la revisó", expediente: "emilio" },
            { texto: "Periapical de la 46", sub: "Mariana R. · de Centro", expediente: "mariana" },
            { texto: "Escaneo intraoral", sub: "Lucía C. · de Norte", expediente: "lucia" },
          ],
          nota: "pacientes ficticios · toca un estudio para abrir su expediente",
        },
      };
    case "expansion":
      return {
        datos: [
          { texto: "Sur, la siguiente sucursal, abre pronto", nota: "ejemplo" },
          { texto: "Entre 2 y 3 clínicas más en la región", nota: "ejemplo" },
          { texto: "Por lo menos 3 en otra ciudad", nota: "ejemplo" },
        ],
        contexto: ["Llenos: las clínicas de hoy. Lima: Sur, la que sigue. Huecos: los planes; el último de cada grupo va punteado porque es «o 3» y «como mínimo»."],
      };
  }
}

function cuenta(n: number, estudios: boolean): string {
  if (estudios) return `${Math.round(n)}`;
  return `${Math.round(n)} mil`;
}
