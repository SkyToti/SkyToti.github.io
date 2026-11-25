import { useEffect, useRef, useState } from "react";
import { movimientoReducido, suscribir } from "../motor/bucle";

/**
 * Texto que «se escribe» (la IA del demo, BRIEF-4 §4.E): avanza unas 55 letras por segundo, con un tope de
 * 1.6 s por renglón para que nadie espere de más. Con movimiento reducido aparece completo. Lo que se lee con
 * lector de pantalla es el texto entero, una sola vez, cuando termina (no letra por letra).
 */
export default function Escribe({ texto, alTerminar, className }: { texto: string; alTerminar?: () => void; className?: string }) {
  const [n, setN] = useState(() => (movimientoReducido() ? texto.length : 0));
  const terminar = useRef(alTerminar);
  terminar.current = alTerminar;
  useEffect(() => {
    if (movimientoReducido()) {
      setN(texto.length);
      const t = window.setTimeout(() => terminar.current?.(), 120);
      return () => window.clearTimeout(t);
    }
    const dura = Math.min(1.6, texto.length / 55);
    let t0 = -1;
    let hecho = false;
    const fuera = suscribir((t) => {
      if (t0 < 0) t0 = t;
      const u = Math.min(1, (t - t0) / dura);
      setN(Math.round(u * texto.length));
      if (u >= 1 && !hecho) {
        hecho = true;
        fuera();
        terminar.current?.();
      }
    });
    return fuera;
  }, [texto]);
  const listo = n >= texto.length;
  return (
    <span className={className} data-escribiendo={!listo || undefined}>
      <span aria-hidden="true">{texto.slice(0, n)}</span>
      {listo && <span className="visualmente-oculto">{texto}</span>}
    </span>
  );
}
