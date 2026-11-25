/**
 * Transiciones de datos (BRIEF.md §3.2): al cambiar de unidad las líneas cambian de forma sin saltos
 * y las cifras cuentan hasta su número. Todo corre en el bucle único y se detiene al llegar.
 */
import { useEffect, useRef, useState } from "react";
import { movimientoReducido, suscribir } from "./bucle";

/** Cuántas transiciones siguen en curso (señal para las pruebas: __crmQuieta) */
export const enCurso = { n: 0 };

type Numerico = number | Numerico[] | { [k: string]: Numerico | string | boolean | undefined };

function mezclar<T>(a: T, b: T, u: number): T {
  if (typeof a === "number" && typeof b === "number") return (a + (b - a) * u) as T;
  if (Array.isArray(a) && Array.isArray(b)) return b.map((v, i) => (i < a.length ? mezclar(a[i], v, u) : v)) as T;
  if (a && b && typeof a === "object" && typeof b === "object") {
    const r: Record<string, unknown> = {};
    for (const k of Object.keys(b)) r[k] = mezclar((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k], u);
    return r as T;
  }
  return b;
}

const suavizar = (u: number) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);

/** Interpola los números de un valor (objeto, arreglo o número) hacia su nueva meta en `ms` */
export function useSuave<T extends Numerico>(meta: T, ms = 1100, inicial?: T): T {
  const [valor, setValor] = useState(inicial ?? meta);
  const desde = useRef(inicial ?? meta);
  const actual = useRef(inicial ?? meta);
  const clave = JSON.stringify(meta);
  useEffect(() => {
    if (JSON.stringify(actual.current) === clave) return;
    if (movimientoReducido()) {
      actual.current = meta;
      setValor(meta);
      return;
    }
    desde.current = actual.current;
    let t0 = -1;
    enCurso.n++;
    let vivo = true;
    const fuera = suscribir((t) => {
      if (t0 < 0) t0 = t;
      const u = Math.min(1, ((t - t0) * 1000) / ms);
      const v = mezclar(desde.current, meta, suavizar(u));
      actual.current = v;
      setValor(v);
      if (u >= 1 && vivo) {
        vivo = false;
        enCurso.n--;
        fuera();
      }
    });
    return () => {
      if (vivo) {
        vivo = false;
        enCurso.n--;
      }
      fuera();
    };
    // la meta se compara por contenido, no por identidad
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clave, ms]);
  return valor;
}

/**
 * La fase continua de un gráfico (segundos), a 30 Hz: los haces fluyen y las esferas giran despacio.
 * Se detiene fuera de pantalla, con la pestaña oculta y con movimiento reducido.
 */
export function useFase(ref: React.RefObject<Element | null>, activa = true): number {
  const [t, setT] = useState(0);
  useEffect(() => {
    if (!activa) return;
    let visible = false;
    const el = ref.current;
    const io = el ? new IntersectionObserver(([e]) => (visible = e.isIntersecting)) : null;
    if (el && io) io.observe(el);
    let ultimo = 0;
    const fuera = suscribir((tiempo) => {
      if (!visible || movimientoReducido()) return;
      if (tiempo - ultimo < 1 / 30) return;
      ultimo = tiempo;
      setT(tiempo);
    });
    return () => {
      fuera();
      io?.disconnect();
    };
  }, [ref, activa]);
  return t;
}

/** Separa una cifra en su número y lo demás: «6 mil» → 6 · « mil»; «1,900» → 1900 */
export function partirCifra(c: string): { n: number | null; pre: string; post: string; decimales: number; miles: boolean } {
  const m = c.match(/^([^\d]*)([\d,]+(?:\.\d+)?)(.*)$/);
  if (!m || /ª/.test(c)) return { n: null, pre: c, post: "", decimales: 0, miles: false };
  const crudo = m[2];
  const decimales = crudo.includes(".") ? crudo.split(".")[1].length : 0;
  return { n: Number(crudo.replace(/,/g, "")), pre: m[1], post: m[3], decimales, miles: crudo.includes(",") };
}

export function formatear(n: number, decimales: number, miles: boolean): string {
  const s = n.toFixed(decimales);
  if (!miles && Math.abs(n) < 1000) return s;
  const [ent, dec] = s.split(".");
  return ent.replace(/\B(?=(\d{3})+(?!\d))/g, ",") + (dec ? "." + dec : "");
}
