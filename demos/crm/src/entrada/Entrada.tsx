import { useEffect, useRef } from "react";
import { movimientoReducido, suscribir } from "../motor/bucle";

interface Props {
  fase: "saludo" | "niebla";
  alAbrirNiebla: () => void;
  alNiebla: (v: number) => void;
  alTerminar: () => void;
}

/**
 * La entrada (BRIEF.md §3.5), una sola coreografía de menos de 3 s que se puede interrumpir:
 *   1. sobre blanco aparece «Bienvenido a tu CRM» (texto de Diego: no se cambia);
 *   2. la niebla se abre y aparece la muela;
 *   3. los mosaicos revelan su degradado mientras sus líneas se dibujan y las cifras cuentan.
 * Con movimiento reducido es un fundido. Un clic, un toque o una tecla la saltan.
 */
export default function Entrada({ fase, alAbrirNiebla, alNiebla, alTerminar }: Props) {
  const hecho = useRef(false);
  const saltar = useRef(() => {});
  saltar.current = () => {
    if (hecho.current) return;
    hecho.current = true;
    alNiebla(0);
    alTerminar();
  };

  useEffect(() => {
    const reducido = movimientoReducido();
    // 1. el saludo se queda 1.05 s (0.7 s con movimiento reducido) y la niebla empieza a abrirse
    const t1 = window.setTimeout(alAbrirNiebla, reducido ? 700 : 1050);
    const cualquiera = () => saltar.current();
    window.addEventListener("keydown", cualquiera, { once: true });
    window.addEventListener("pointerdown", cualquiera, { once: true });
    return () => {
      window.clearTimeout(t1);
      window.removeEventListener("keydown", cualquiera);
      window.removeEventListener("pointerdown", cualquiera);
    };
  }, [alAbrirNiebla]);

  useEffect(() => {
    if (fase !== "niebla") return;
    if (movimientoReducido()) {
      alNiebla(0);
      const t = window.setTimeout(() => saltar.current(), 450);
      return () => window.clearTimeout(t);
    }
    // 2. la niebla se abre en 1.2 s con salida exponencial; 3. los mosaicos ya se revelan debajo
    let t0 = -1;
    const fuera = suscribir((t) => {
      if (t0 < 0) t0 = t;
      const u = Math.min(1, (t - t0) / 1.2);
      alNiebla(Math.pow(1 - u, 3));
      if (u >= 1) {
        fuera();
        window.setTimeout(() => saltar.current(), 450);
      }
    });
    return fuera;
  }, [fase, alNiebla]);

  return (
    <div className="entrada" data-fase={fase} aria-live="polite">
      <h1 className="entrada-titulo">Bienvenido a tu CRM</h1>
    </div>
  );
}
