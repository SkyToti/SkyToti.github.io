/**
 * Un solo bucle de requestAnimationFrame para todo lo que se mueve (BRIEF.md §5, «Líneas»).
 * Cada pieza se suscribe con una función que recibe el tiempo en segundos y el paso del cuadro.
 * El bucle se detiene solo cuando nadie está suscrito y con la pestaña oculta.
 */
type Tarea = (t: number, dt: number) => void;

const tareas = new Set<Tarea>();
let id = 0;
let ultimo = 0;
let reloj = 0;

function cuadro(ahora: number) {
  const dt = ultimo ? Math.min((ahora - ultimo) / 1000, 1 / 20) : 1 / 60;
  ultimo = ahora;
  reloj += dt;
  for (const f of tareas) f(reloj, dt);
  id = tareas.size && !document.hidden ? requestAnimationFrame(cuadro) : 0;
  if (!id) ultimo = 0;
}

function arrancar() {
  if (!id && tareas.size && !document.hidden) id = requestAnimationFrame(cuadro);
}

if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", arrancar);
}

export function suscribir(f: Tarea): () => void {
  tareas.add(f);
  arrancar();
  return () => {
    tareas.delete(f);
  };
}

/** Tiempo del bucle en segundos (para que todo comparta la misma fase) */
export const tiempo = () => reloj;

/** ¿Pidió la persona menos movimiento? Se lee en vivo: puede cambiar con la app abierta. */
const consulta = typeof window !== "undefined" ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;
export const movimientoReducido = () => !!consulta?.matches;
export function alCambiarMovimiento(f: () => void): () => void {
  consulta?.addEventListener("change", f);
  return () => consulta?.removeEventListener("change", f);
}
