// Las funciones de animación de motion (maquetación compartida y arrastre): bajan en paralelo al arrancar,
// fuera del JS inicial (LazyMotion, BRIEF-5 §2.B3). Los componentes usan m.* en vez de motion.*.
import { domMax } from "motion/react";
export default domMax;
