import { useEffect, useLayoutEffect, useRef, useState } from "react";

/**
 * Mide un elemento (ancho y alto en px CSS) y se actualiza al cambiar de tamaño.
 * El elemento puede aparecer después del montaje: la agenda Día de un domingo devuelve «no hay consulta»
 * y su lienzo aparece al pasar al lunes (antes nunca se medía y los sillones no salían). Por eso se revisa
 * en cada dibujo si el elemento cambió, y solo entonces se vuelve a observar.
 */
export function useMedida<T extends HTMLElement | SVGElement>() {
  const ref = useRef<T>(null);
  const [m, setM] = useState({ w: 0, h: 0 });
  const observado = useRef<{ el: T; ro: ResizeObserver } | null>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (observado.current?.el === el) return;
    observado.current?.ro.disconnect();
    observado.current = null;
    if (!el) return;
    const leer = () => {
      // tamaño de maquetación: no cambia con las transformaciones (un detalle que crece se anima con escala)
      const h = el as HTMLElement;
      const r = typeof h.offsetWidth === "number" ? { width: h.offsetWidth, height: h.offsetHeight } : el.getBoundingClientRect();
      setM((a) => (Math.abs(a.w - r.width) < 0.5 && Math.abs(a.h - r.height) < 0.5 ? a : { w: r.width, h: r.height }));
    };
    leer();
    const ro = new ResizeObserver(leer);
    ro.observe(el);
    observado.current = { el, ro };
  });
  useEffect(
    () => () => {
      observado.current?.ro.disconnect();
      observado.current = null;
    },
    [],
  );
  return [ref, m] as const;
}

/** El grano de película: un solo PNG de ruido, calculado una vez y compartido por todos los mosaicos */
let grano = "";
export function granoURL(): string {
  if (grano || typeof document === "undefined") return grano;
  const n = 180;
  const c = document.createElement("canvas");
  c.width = c.height = n;
  const g = c.getContext("2d")!;
  const img = g.createImageData(n, n);
  let s = 1234567;
  const azar = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < img.data.length; i += 4) {
    // ruido gaussiano aproximado (suma de tres uniformes), centrado en gris medio
    const v = Math.max(0, Math.min(255, 128 + (azar() + azar() + azar() - 1.5) * 64));
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  grano = c.toDataURL("image/png");
  return grano;
}
