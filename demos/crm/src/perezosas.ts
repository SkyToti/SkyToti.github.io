/**
 * Carga ligera (BRIEF-5 §2.B3): las pantallas completas, los detalles y el modo presentación no bajan con la
 * primera vista. Se piden todas en cuanto se ve la muela (en la entrada normal, todavía bajo la niebla) y, ya
 * llegadas, se dibujan directo: React.lazy suspendería el primer render aunque el módulo ya estuviera, y React
 * retrasa ~300 ms lo que sale de un Suspense; para entonces el mosaico o el botón de origen ya cambió y la
 * pantalla no crecería desde él. Sus estilos siguen en la hoja inicial (main.tsx): comparten clases.
 */
import { createElement, lazy, type ComponentType } from "react";

/** Un componente que baja aparte: mientras no llega, lazy(); ya llegado, el componente tal cual */
function perezosa<P extends object>(cargar: () => Promise<{ default: ComponentType<P> }>) {
  let listo: ComponentType<P> | null = null;
  const pedir = () =>
    cargar().then((m) => {
      listo = m.default;
      return m;
    });
  const Diferida = lazy(pedir);
  const Componente = (props: P) => createElement((listo ?? Diferida) as ComponentType<P>, props);
  return { Componente, pedir };
}

const agenda = perezosa(() => import("./agenda/Agenda"));
const pacientes = perezosa(() => import("./pacientes/Pacientes"));
const tablero = perezosa(() => import("./negocio/Tablero"));
const bandeja = perezosa(() => import("./negocio/Bandeja"));
const armar = perezosa(() => import("./armar/Armar"));
const nuevaUnidad = perezosa(() => import("./negocio/NuevaUnidad"));
const expediente = perezosa(() => import("./expedientes/Expediente"));
const recorrido = perezosa(() => import("./recorrido/Recorrido"));
// tampoco se ven en la primera vista: el detalle de un mosaico, el perfil, tu equipo, los expedientes y buscar
const detalle = perezosa(() => import("./detalle/Detalle"));
const perfil = perezosa(() => import("./equipo/Perfil"));
const equipo = perezosa(() => import("./equipo/Equipo"));
const expedientes = perezosa(() => import("./expedientes/Expedientes"));
const buscar = perezosa(() => import("./buscar/Buscar"));
const todas: { pedir: () => Promise<unknown> }[] = [agenda, pacientes, tablero, bandeja, armar, nuevaUnidad, expediente, recorrido, detalle, perfil, equipo, expedientes, buscar];

export const Agenda = agenda.Componente;
export const Pacientes = pacientes.Componente;
export const Tablero = tablero.Componente;
export const Bandeja = bandeja.Componente;
export const Armar = armar.Componente;
export const NuevaUnidad = nuevaUnidad.Componente;
export const Expediente = expediente.Componente;
export const Detalle = detalle.Componente;
export const Perfil = perfil.Componente;
export const Equipo = equipo.Componente;
export const Expedientes = expedientes.Componente;
export const Buscar = buscar.Componente;
// genérico: el envoltorio pierde el parámetro de tipo, así que se conserva la firma del componente
export const Recorrido = recorrido.Componente as unknown as typeof import("./recorrido/Recorrido").default;

/** Resuelve en cuanto la muela ya se ve (su primer cuadro); con «reposo», además espera un momento libre.
 *  Lo que baja después no le quita red ni procesador a la primera vista */
export function trasLaMuela(reposo = true): Promise<void> {
  const w = window as unknown as { __crmMuela?: () => { dibujos: number }; requestIdleCallback?: (f: () => void, o?: { timeout: number }) => number };
  return new Promise((listo) => {
    const t0 = performance.now();
    const revisar = () => {
      if ((w.__crmMuela?.().dibujos ?? 0) > 0 || performance.now() - t0 > 6000) {
        if (!reposo) listo();
        else if (w.requestIdleCallback) w.requestIdleCallback(() => listo(), { timeout: 1200 });
        else window.setTimeout(listo, 300);
      } else window.setTimeout(revisar, 100);
    };
    revisar();
  });
}

let pedida = false;
/** Ya llegaron todas (la señal de «quieta» de las pruebas la espera) */
export const precargas = { listas: false };
/** Las pide todas, una sola vez, en cuanto se ve la muela: en la entrada normal, todavía bajo la niebla */
export function precargar() {
  if (pedida) return;
  pedida = true;
  void trasLaMuela(false)
    .then(() => Promise.all(todas.map((t) => t.pedir().catch(() => {}))))
    .then(() => void (precargas.listas = true));
}
