"use client";
// Lo vivo de la página de caso (cliente). En el caso no hay línea viva: aquí se cumple su contrato a mano.
//   <Llegadas>  cada `[data-estacion]` de la página recibe `llego` y despacha `estacion:llega` (una vez) cuando entra en
//               la mitad de arriba de la ventana: los inventos se arman y Haku presenta esa estación.
//   <Paralaje>  lo que lleva `data-paralaje="<factor>"` se desliza un poco en vertical con el scroll (escritorio, con
//               movimiento): el acompañante de la prueba principal flota a otra velocidad que la captura.
//   <VistaSinPrisa>  una <Vista> de video cuyo póster se pide DESPUÉS de la carga (si no, los pósters compiten con la
//               letra del título y retrasan el LCP en celular). Sin JavaScript, el póster va en un <noscript>.
import { useEffect, useRef, useState } from "react";
import Vista, { type PropsVista } from "@/components/paginas/inicio/Vista";
import { gsap, useGSAP } from "@/lib/gsap";

export function Llegadas() {
  useEffect(() => {
    const estaciones = [...document.querySelectorAll<HTMLElement>("[data-estacion]")];
    if (!estaciones.length) return;
    const llegar = (el: HTMLElement) => {
      if (el.classList.contains("llego")) return;
      el.classList.add("llego");
      el.dispatchEvent(
        new CustomEvent("estacion:llega", {
          bubbles: true,
          detail: { nombre: el.dataset.estacion ?? "", quieto: false },
        }),
      );
    };
    // la estación cuenta cuando su parte de arriba cruza el 60 % de la ventana (o cuando ya está entera a la vista)
    const vista = new IntersectionObserver(
      (entradas) => {
        for (const e of entradas) {
          if (!e.isIntersecting) continue;
          vista.unobserve(e.target);
          llegar(e.target as HTMLElement);
        }
      },
      { rootMargin: "0px 0px -40% 0px" },
    );
    estaciones.forEach((el) => vista.observe(el));
    return () => vista.disconnect();
  }, []);
  return null;
}

export function Paralaje() {
  const raiz = useRef<HTMLSpanElement>(null);
  useGSAP(
    () => {
      if (!document.documentElement.classList.contains("mueve")) return;
      const mm = gsap.matchMedia();
      mm.add("(min-width: 1024px) and (prefers-reduced-motion: no-preference)", () => {
        document.querySelectorAll<HTMLElement>("[data-paralaje]").forEach((el) => {
          const f = parseFloat(el.dataset.paralaje ?? "0") || 0;
          gsap.fromTo(
            el,
            { y: () => innerHeight * 0.12 * f },
            {
              y: () => -innerHeight * 0.12 * f,
              ease: "none",
              scrollTrigger: {
                trigger: el,
                start: "top bottom",
                end: "bottom top",
                scrub: 0.6,
                invalidateOnRefresh: true,
              },
            },
          );
        });
      });
      return () => mm.revert();
    },
    { scope: raiz },
  );
  return <span ref={raiz} hidden />;
}

export function VistaSinPrisa(props: PropsVista & { clasePoster?: string }) {
  const { clasePoster, ...vista } = props;
  const [listo, setListo] = useState(false);
  useEffect(() => {
    let idle: number | undefined;
    const ya = () => {
      if ("requestIdleCallback" in window)
        idle = window.requestIdleCallback(() => setListo(true), {
          timeout: 2000,
        });
      else setListo(true);
    };
    if (document.readyState === "complete") ya();
    else addEventListener("load", ya, { once: true });
    return () => {
      removeEventListener("load", ya);
      if (idle !== undefined) window.cancelIdleCallback(idle);
    };
  }, []);
  const { medio } = vista;
  return (
    <>
      <Vista {...vista} medio={listo ? medio : { ...medio, poster: undefined }} />
      {!listo && medio.poster && (
        <noscript>
          {/* eslint-disable-next-line @next/next/no-img-element -- sitio estático: el póster, solo sin JavaScript */}
          <img
            className={clasePoster}
            src={medio.poster}
            width={medio.ancho}
            height={medio.alto}
            alt=""
            loading="lazy"
          />
        </noscript>
      )}
    </>
  );
}
