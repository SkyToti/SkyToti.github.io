// Plugins de GSAP del kit de dibujo (DrawSVG para trazar, MotionPath para la chispa), registrados sobre la MISMA
// copia de gsap de lib/gsap.ts: dentro de components/dibujo/ se importa gsap y useGSAP desde aquí.
import { gsap, useGSAP } from "@/lib/gsap";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";

if (typeof window !== "undefined") {
  gsap.registerPlugin(DrawSVGPlugin, MotionPathPlugin);
}

export { gsap, useGSAP };
