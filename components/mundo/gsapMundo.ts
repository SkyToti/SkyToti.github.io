// Plugins que usa la línea viva (MotionPath para la chispa; el trazo y los aros van por stroke-dashoffset sobre
// pathLength="1", sin DrawSVG), registrados sobre la MISMA copia de gsap de lib/gsap.ts. Dentro de components/mundo/
// se importa gsap desde aquí. DrawSVG sigue registrado para quien lo use dentro de mundo/ (tráfico, estaciones).
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";

if (typeof window !== "undefined") {
  gsap.registerPlugin(DrawSVGPlugin, MotionPathPlugin);
}

export { gsap, ScrollTrigger, useGSAP };
