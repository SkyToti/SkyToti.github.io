// Registro único de GSAP para todo el sitio: importa gsap, ScrollTrigger, SplitText y useGSAP SIEMPRE desde aquí,
// así hay una sola copia de cada plugin y un solo `registerPlugin` (dos versiones de ScrollTrigger a la vez fue
// una trampa real; ver la calidad de web-cinematica).
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP);
  // Provisionales: la curva y duración finales salen de la dirección visual (tokens --curva-entrada / --dur-entrada).
  gsap.defaults({ ease: "expo.out", duration: 0.9 });
}

export { gsap, ScrollTrigger, SplitText, useGSAP };
