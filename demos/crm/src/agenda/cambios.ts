import type { Cita } from "./datos";

/** Las vistas de la agenda */
export type VistaAgenda = "dia" | "semana" | "mes";

/** Lo que cambió quien usa el demo: citas movidas y citas nuevas. Vive en memoria: al recargar, todo vuelve.
 *  Vive aparte de Agenda.tsx para que la app lo tenga desde el arranque sin cargar la agenda (BRIEF-5 §2.B3). */
export interface CambiosAgenda {
  movidas: Record<string, { desde: number; sillon: number }>;
  nuevas: (Cita & { fecha: string })[];
}
export const SIN_CAMBIOS: CambiosAgenda = { movidas: {}, nuevas: [] };
