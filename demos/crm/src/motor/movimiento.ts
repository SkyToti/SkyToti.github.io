/**
 * Una sola gramática de movimiento (BRIEF-4 §2): lo que se abre crece desde lo que tocaste y regresa a él
 * (elemento compartido, layoutId), con la curva y la duración de mosaico → detalle. En el teléfono, hojas
 * desde abajo; con movimiento reducido, MotionConfig vuelve los crecimientos fundidos.
 */
export const CURVA = [0.16, 1, 0.3, 1] as const;
export const CRECER = { duration: 0.55, ease: CURVA };

/** El panel que crece desde su origen (en PC y tableta); si no hay origen a la vista, entra con un fundido */
export const crecerDesde = (layoutId: string) => ({
  layoutId,
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0, transition: { duration: 0.2 } },
  // el fundido es corto: si hay origen, casi no se nota bajo el crecimiento; si no lo hay, es la entrada
  transition: { layout: CRECER, opacity: { duration: 0.15 } },
});
