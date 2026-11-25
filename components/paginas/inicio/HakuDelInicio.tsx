"use client";
// Haku en el inicio (MUNDO.md, «Haku, el guía»). En la portada Haku está DIBUJADO sobre el escritorio; el guía
// (components/mundo/guia, perezoso: entra tras `load` + ocioso) vive abajo en la ventana. Aquí solo se decide cuál se ve:
//   · arriba del todo (scroll < 24 px) → `html[data-haku-guia="arriba"]`: el guía se esconde y Haku sigue en la mesa;
//   · al primer scroll → "abajo": el de la mesa desaparece y el guía cae al piso con un salto (solo con movimiento) y,
//     ya en el piso, dice la frase de la portada (o salta, si está en silencio); al volver arriba, regresa a la mesa.
// También hace que el único «ver de nuevo» de la portada (el de la cajonera) repita los tres dibujos del escritorio.
import { useEffect, useRef } from "react";
import HakuGuia, { type PropsGuia } from "@/components/mundo/guia/HakuGuia";
import css from "./HakuDelInicio.module.css";

const ARRIBA = 24;
const quieto = () =>
  !document.documentElement.classList.contains("mueve") || matchMedia("(prefers-reduced-motion: reduce)").matches;

export default function HakuDelInicio(props: PropsGuia) {
  const caja = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const html = document.documentElement;
    let estado: "arriba" | "abajo" | null = null;
    let salto: ReturnType<typeof setTimeout> | undefined;
    let habla: ReturnType<typeof setTimeout> | undefined;
    // con menos movimiento no hay salto: el guía queda sentado en su esquina desde el principio (y el Haku del
    // escritorio se esconde): nunca hay dos Haku a la vista
    const sinMovimiento = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const poner = () => {
      const nuevo = sinMovimiento || scrollY >= ARRIBA ? "abajo" : "arriba";
      if (nuevo === estado) return;
      const antes = estado;
      estado = nuevo;
      html.dataset.hakuGuia = nuevo;
      clearTimeout(salto);
      clearTimeout(habla);
      const el = caja.current;
      if (!el) return;
      el.removeAttribute("data-salta");
      if (nuevo !== "abajo" || antes === null || quieto()) return;
      // fuerza un nuevo cuadro para reiniciar la animación del salto
      void el.offsetWidth;
      el.setAttribute("data-salta", "");
      salto = setTimeout(() => el.removeAttribute("data-salta"), 700);
      // ya en el piso: «toca» al guía (frase de la estación o, en silencio, un salto). Solo si ya cargó.
      // (solo si la portada sigue siendo la estación de en medio: si ya bajó más, Haku presenta lo que toque él solo)
      habla = setTimeout(() => {
        const portada = document.querySelector('[data-estacion="portada"]')?.getBoundingClientRect();
        if (estado !== "abajo" || !portada || portada.bottom < innerHeight / 2) return;
        if (el.querySelector("[data-guia][data-listo]")) el.querySelector<HTMLButtonElement>("[data-haku]")?.click();
      }, 760);
    };
    poner();
    addEventListener("scroll", poner, { passive: true });

    // «ver de nuevo» de la cajonera → también la mesa y la ventana (sus botones van escondidos por CSS)
    const repetir = (e: MouseEvent) => {
      const b = (e.target as Element | null)?.closest?.('[data-portada-escena="cajonera"] button:not([data-lampara])');
      if (!b) return;
      document
        .querySelectorAll<HTMLButtonElement>('[data-portada-escena="mesa"] button:not([data-lampara]), [data-portada-escena="ventana"] button:not([data-lampara])')
        .forEach((otro) => otro.click());
    };
    document.addEventListener("click", repetir);
    return () => {
      removeEventListener("scroll", poner);
      document.removeEventListener("click", repetir);
      clearTimeout(salto);
      clearTimeout(habla);
      delete html.dataset.hakuGuia;
    };
  }, []);

  return (
    <div ref={caja} className={css.guia}>
      <HakuGuia {...props} />
    </div>
  );
}
