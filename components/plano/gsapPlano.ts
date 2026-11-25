// Plugins de GSAP que solo usa el plano (DrawSVG para los trazos, MotionPath para los pulsos). Se registran sobre
// la MISMA copia de gsap de lib/gsap.ts: importa gsap, ScrollTrigger y useGSAP desde aquí dentro de components/plano/.
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";

if (typeof window !== "undefined") {
  gsap.registerPlugin(DrawSVGPlugin, MotionPathPlugin);
}

export { gsap, ScrollTrigger, useGSAP };
