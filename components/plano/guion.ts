// Guion de una escena: de los pasos (acciones) a eventos con su tiempo, sin tocar GSAP. PlanoVivo lo convierte en
// UNA línea de tiempo; las pruebas lo usan para medir duraciones. Puro (solo tipos importados).
//
// Reglas de tiempo (DIRECCION.md §5): el pulso viaja a 220 px/s reales (por eso se pasa cuántos px mide una unidad
// del viewBox), `ease: none`; una línea se dibuja en --dur-trazo (1.2 s). Si la escena se pasa del máximo, primero
// se acortan los trazos y las pausas, y solo al final se acelera todo (timeScale).
import type { Escena } from "../../escenas/tipos";

const lista = (x: string | string[]) => (Array.isArray(x) ? x : [x]);

export const VELOCIDAD_PULSO = 220; // px/s en pantalla
const DUR_ENCIENDE = 0.4;
const ESCALON = 0.08;
const DUR_COMPUERTA = 0.45;
const DUR_CUENTA = 1;
const DUR_GLOBO = 0.4;
const LECTURA_GLOBO = 0.7;
const DUR_MARCA = 0.35;
/** distancia antes de la compuerta en la que se detiene un pulso (unidades del viewBox) */
const ANTES_DE_COMPUERTA = 10;

export type Color = "ambar" | "alto";
/** Un tramo de un pulso: de una fracción del trazo a otra. `t0` es relativo al inicio del pulso. */
export type Tramo = { t0: number; d: number; de: number; a: number; color: Color };

export type Evento =
  | { tipo: "dibuja"; ids: string[]; t: number; d: number }
  | { tipo: "enciende"; ids: string[]; t: number; d: number; escalon: number }
  | { tipo: "pulso"; trazo: string; t: number; tramos: Tramo[]; queda: boolean }
  | { tipo: "compuerta"; id: string; estado: "abre" | "detiene"; t: number; d: number }
  | { tipo: "cuenta"; id: string; t: number; d: number }
  | { tipo: "globo"; id: string; t: number; d: number }
  | { tipo: "marca"; id: string; como: "hecho" | "alto"; t: number; d: number };

export type Guion = {
  eventos: Evento[];
  /** inicio de cada paso (segundos, sin escalar) */
  pasos: number[];
  duracion: number;
  /** timeScale para no pasar del máximo (1 si no hace falta) */
  escala: number;
};

export type TrazoMedido = { largo: number; cortes: { compuerta: string; t: number }[] };

export type OpcionesGuion = {
  pxPorUnidad: number;
  /** duración de un trazo dibujándose (s); por omisión 1.2 */
  durTrazo?: number;
  /** duración máxima total (s) */
  maximo: number;
};

function armar(escena: Escena, trazos: Record<string, TrazoMedido>, pxPorUnidad: number, durTrazo: number, pausaPaso: number) {
  const eventos: Evento[] = [];
  const pasos: number[] = [];
  const estado: Record<string, "cerrada" | "abre" | "detiene"> = {};
  const llegada: Record<string, number> = {};
  const vel = VELOCIDAD_PULSO / Math.max(pxPorUnidad, 0.05); // unidades por segundo
  let t = 0;

  /** Arma un pulso: viaja hasta la primera compuerta cerrada (y vuelve si `vuelve`) o hasta el final. */
  const pulso = (id: string, vuelve: boolean, color: Color | undefined, inicio: number) => {
    const m = trazos[id];
    if (!m) return { fin: inicio, ev: null };
    const cerrada = [...m.cortes].sort((a, b) => a.t - b.t).find((c) => estado[c.compuerta] !== "abre");
    const tramos: Tramo[] = [];
    let queda = false;
    if (cerrada) {
      const hasta = Math.max(0.02, cerrada.t - ANTES_DE_COMPUERTA / m.largo);
      const d = (hasta * m.largo) / vel;
      tramos.push({ t0: 0, d, de: 0, a: hasta, color: "ambar" });
      llegada[cerrada.compuerta] = inicio + d;
      if (vuelve) tramos.push({ t0: d, d, de: hasta, a: 0, color: color ?? "ambar" });
      else queda = true; // se queda esperando en la compuerta
    } else {
      const d = m.largo / vel;
      tramos.push({ t0: 0, d, de: 0, a: 1, color: color ?? "ambar" });
      if (vuelve) tramos.push({ t0: d, d, de: 1, a: 0, color: color ?? "ambar" });
    }
    const fin = inicio + tramos.reduce((s, x) => s + x.d, 0);
    const ev: Evento = { tipo: "pulso", trazo: id, t: inicio, tramos, queda };
    return { fin, ev };
  };

  for (const paso of escena.pasos) {
    pasos.push(t);
    for (const a of paso.acciones) {
      if ("dibuja" in a) {
        eventos.push({ tipo: "dibuja", ids: lista(a.dibuja), t, d: durTrazo });
        t += durTrazo;
      } else if ("enciende" in a) {
        const ids = lista(a.enciende);
        eventos.push({ tipo: "enciende", ids, t, d: DUR_ENCIENDE, escalon: ESCALON });
        t += DUR_ENCIENDE * 0.75 + ESCALON * (ids.length - 1);
      } else if ("pulso" in a) {
        const { fin, ev } = pulso(a.pulso, Boolean(a.vuelve), a.color, t);
        if (ev) eventos.push(ev);
        t = fin;
      } else if ("pulsos" in a) {
        let fin = t;
        for (const id of a.pulsos) {
          const r = pulso(id, false, undefined, t);
          if (r.ev) eventos.push(r.ev);
          fin = Math.max(fin, r.fin);
        }
        t = fin;
      } else if ("compuerta" in a) {
        if (a.estado === "detiene") {
          // Se marca cuando el pulso llega a la barra, aunque el pulso ya haya regresado.
          const cuando = llegada[a.compuerta] ?? t;
          eventos.push({ tipo: "compuerta", id: a.compuerta, estado: "detiene", t: cuando, d: DUR_COMPUERTA });
          t = Math.max(t, cuando + DUR_COMPUERTA);
        } else {
          eventos.push({ tipo: "compuerta", id: a.compuerta, estado: "abre", t, d: DUR_COMPUERTA });
          t += DUR_COMPUERTA;
        }
        estado[a.compuerta] = a.estado;
      } else if ("cuenta" in a) {
        eventos.push({ tipo: "cuenta", id: a.cuenta, t, d: DUR_CUENTA });
        t += DUR_CUENTA;
      } else if ("globo" in a) {
        eventos.push({ tipo: "globo", id: a.globo, t, d: DUR_GLOBO });
        t += DUR_GLOBO + LECTURA_GLOBO;
      } else if ("marca" in a) {
        eventos.push({ tipo: "marca", id: a.marca, como: a.como, t, d: DUR_MARCA });
        t += DUR_MARCA;
      } else if ("espera" in a) {
        t += a.espera;
      }
    }
    t += pausaPaso;
  }
  return { eventos, pasos, duracion: t - pausaPaso };
}

export function planificar(escena: Escena, trazos: Record<string, TrazoMedido>, o: OpcionesGuion): Guion {
  const base = o.durTrazo ?? 1.2;
  let durTrazo = base;
  let pausa = 0.45;
  let r = armar(escena, trazos, o.pxPorUnidad, durTrazo, pausa);
  // Se acortan trazos y pausas antes de acelerar los pulsos.
  while (r.duracion > o.maximo && durTrazo > 0.5) {
    durTrazo = Math.max(0.5, durTrazo - 0.1);
    pausa = Math.max(0.2, pausa - 0.05);
    r = armar(escena, trazos, o.pxPorUnidad, durTrazo, pausa);
  }
  const escala = r.duracion > o.maximo ? r.duracion / o.maximo : 1;
  return { ...r, escala };
}

/** Píxeles por unidad del viewBox a los que se diseña cada composición (para pruebas y como respaldo). */
export const PX_NOMINAL = { ancho: 1100 / 1200, alto: 350 / 360 } as const;
