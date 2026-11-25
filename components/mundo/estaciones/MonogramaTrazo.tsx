"use client";
// Traza el monograma con stroke-dashoffset (Web Animations API): al cargar y al pasar el cursor o enfocar.
// Solo con `html.mueve`; sin eso el monograma ya está dibujado y quieto.
import { useEffect, useRef, type ReactNode } from "react";
import css from "./estaciones.module.css";

const DURA = 760;

export default function MonogramaTrazo({ href, etiqueta, className, children }: { href: string; etiqueta: string; className?: string; children: ReactNode }) {
  const enlace = useRef<HTMLAnchorElement>(null);
  const corriendo = useRef(false);

  const trazar = () => {
    const a = enlace.current;
    if (!a || corriendo.current || !document.documentElement.classList.contains("mueve")) return;
    const trazos = [...a.querySelectorAll<SVGPathElement>(".f0 path.t")];
    const chispa = [...a.querySelectorAll<SVGElement>('[data-g="chispa"]')];
    if (!trazos.length) return;
    corriendo.current = true;
    const total = trazos.map((p) => p.getTotalLength());
    const suma = total.reduce((x, y) => x + y, 0) || 1;
    let t = 0;
    const anims = trazos.map((p, i) => {
      const l = total[i]!, d = (DURA * l) / suma;
      p.style.strokeDasharray = `${l} ${l}`;
      const an = p.animate([{ strokeDashoffset: l }, { strokeDashoffset: 0 }], { duration: d, delay: t, easing: "cubic-bezier(.55,0,.35,1)", fill: "backwards" });
      t += d;
      return an;
    });
    chispa.forEach((c) => { c.style.transformBox = "fill-box"; c.style.transformOrigin = "center"; });
    chispa.forEach((c) => c.animate([{ opacity: 0, transform: "scale(.2)" }, { opacity: 1, transform: "scale(1.5)" }, { opacity: 1, transform: "scale(1)" }], { duration: 260, delay: t - 60, fill: "backwards", easing: "ease-out" }));
    Promise.all(anims.map((x) => x.finished)).catch(() => {}).finally(() => {
      trazos.forEach((p) => { p.style.strokeDasharray = ""; });
      corriendo.current = false;
    });
  };

  useEffect(() => trazar(), []);

  return (
    // <a> y no <Link>: en la exportación estática la precarga de next/link pide archivos que dan 404 (eslint.config.mjs)
    <a ref={enlace} href={href} aria-label={etiqueta} className={`${css.monograma} ${className ?? ""}`} onPointerEnter={trazar} onFocus={trazar} data-monograma="">
      {children}
    </a>
  );
}
