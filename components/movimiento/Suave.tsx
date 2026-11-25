"use client";
// Scroll suave con Lenis, sincronizado con ScrollTrigger por el ticker de GSAP.
// Con prefers-reduced-motion no se crea Lenis (scroll nativo). En el celular Lenis deja el scroll nativo
// (sin syncTouch). Todo se limpia al desmontar.
import Lenis from "lenis";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";

declare global {
  interface Window {
    __movimientoListo?: boolean;
  }
}

export default function Suave() {
  useGSAP(() => {
    window.__movimientoListo = true;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({ lerp: 0.11 });
    lenis.on("scroll", ScrollTrigger.update);
    const avanzar = (tiempo: number) => lenis.raf(tiempo * 1000);
    gsap.ticker.add(avanzar);
    gsap.ticker.lagSmoothing(0);

    // Con las fuentes ya cargadas, medir de nuevo lo que dependa de su tamaño.
    let vivo = true;
    document.fonts?.ready.then(() => vivo && ScrollTrigger.refresh());

    return () => {
      vivo = false;
      gsap.ticker.remove(avanzar);
      gsap.ticker.lagSmoothing(500, 33);
      lenis.destroy();
    };
  });
  return null;
}
