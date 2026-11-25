"use client";
// Tambaleo (capa «Tacto», Motion): envuelve un objeto dibujado o un elemento HTML y le da vida a la mano.
//  · al pasar el cursor se ladea con resorte; al tocarlo (o al cambiar `sacude`) se tambalea con un impulso de giro
//    que el resorte amortigua (física de verdad, no fotogramas);
//  · con puntero fino se puede arrastrar un poco y regresa elástico a su sitio (`drag` + `dragSnapToOrigin`);
//  · `cae`: entra cayendo con rebote cuando pasa a true (los objetos llegando a la repisa, el sello del buzón);
//  · con `prefers-reduced-motion` (useReducedMotion) nada se mueve: queda en su sitio y visible.
// NO se importa directo: usa <TambaleoPerezoso> (components/dibujo/TambaleoPerezoso.tsx), que trae Motion aparte
// para que no entre en la carga inicial.
import { animate, motion, useMotionValue, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from "react";

const PUNTERO_FINO = "(pointer: fine)";
const suscribir = (cb: () => void) => {
  const m = window.matchMedia(PUNTERO_FINO);
  m.addEventListener("change", cb);
  return () => m.removeEventListener("change", cb);
};

export type PropsTambaleo = {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  /** cambia este número para sacudirlo desde fuera (al elegir, enfocar…); si no se da, se sacude solo al tocarlo.
   *  Sin `onTap` de Motion a propósito: haría enfocable al envoltorio y el Tab pararía dos veces. */
  sacude?: number;
  /** undefined = está desde el principio; false = oculto esperando; true = cae a su sitio */
  cae?: boolean;
  /** s antes de caer */
  retraso?: number;
  /** de dónde cae (px hacia arriba) */
  altura?: number;
  /** arrastre corto con regreso elástico (solo con puntero fino) */
  arrastre?: boolean;
  /** de dónde gira: por defecto la base, como algo apoyado en una repisa */
  origen?: string;
  /** fuerza del impulso (grados por segundo) */
  fuerza?: number;
  /** atributos de datos para las pruebas y los estilos */
  datos?: Record<`data-${string}`, string>;
};

export default function Tambaleo({
  children,
  className,
  style,
  sacude,
  cae,
  retraso = 0,
  altura = 70,
  arrastre = true,
  origen = "50% 100%",
  fuerza = 320,
  datos,
}: PropsTambaleo) {
  const quieto = useReducedMotion() ?? false;
  const giro = useMotionValue(0);
  // espera arriba y oculto solo si va a caer y hay movimiento (html.mueve); si no, ya está en su sitio
  const [arriba] = useState(() => cae !== undefined && !quieto && typeof document !== "undefined" && document.documentElement.classList.contains("mueve"));
  const y = useMotionValue(arriba ? -altura : 0);
  const opacidad = useMotionValue(arriba ? 0 : 1);
  const fino = useSyncExternalStore(suscribir, () => window.matchMedia(PUNTERO_FINO).matches, () => false);
  const lado = useRef(1);

  // un golpe de giro que el resorte amortigua: se balancea y se queda quieto
  const sacudir = (k = 1) => {
    if (quieto) return;
    lado.current = -lado.current;
    animate(giro, 0, { type: "spring", velocity: fuerza * k * lado.current, stiffness: 320, damping: 7, mass: 0.8 });
  };

  const primera = useRef(true);
  useEffect(() => {
    if (primera.current) { primera.current = false; return; }
    sacudir();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sacude]);

  useEffect(() => {
    if (!arriba) return;
    if (quieto) { y.set(0); opacidad.set(1); return; }
    if (!cae) return;
    const a = animate(opacidad, 1, { duration: 0.12, delay: retraso });
    const b = animate(y, 0, { type: "spring", stiffness: 520, damping: 17, mass: 0.9, delay: retraso, onComplete: () => sacudir(0.55) });
    return () => { a.stop(); b.stop(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cae, quieto, arriba]);

  const puedeArrastrar = arrastre && fino && !quieto;
  return (
    <motion.div
      {...datos}
      className={className}
      style={{ ...style, rotate: giro, y, opacity: opacidad, transformOrigin: origen, touchAction: puedeArrastrar ? "none" : undefined }}
      whileHover={quieto ? undefined : { scale: 1.04, transition: { type: "spring", stiffness: 420, damping: 14 } }}
      onHoverStart={() => sacudir(0.45)}
      onPointerDown={sacude === undefined ? () => sacudir() : undefined}
      drag={puedeArrastrar}
      dragSnapToOrigin
      dragElastic={0.18}
      dragConstraints={{ left: -14, right: 14, top: -12, bottom: 4 }}
      dragTransition={{ bounceStiffness: 420, bounceDamping: 11 }}
      whileDrag={{ scale: 1.06 }}
    >
      {children}
    </motion.div>
  );
}
