"use client";
// Letras que ruedan en los enlaces de la navegación (web-cinematica, patrón 28): al pasar el ratón o llegar con
// el teclado, las letras suben una por una y la misma palabra entra desde abajo (la copia es un text-shadow,
// ver app/globals.css). En pantallas táctiles, con menos movimiento o sin JavaScript no se parte nada.
// Marcado: <a data-rueda><span data-rueda-texto>Trabajo</span></a>
import { useRef, type ReactNode } from "react";
import { gsap, SplitText, useGSAP } from "@/lib/gsap";

export default function LetrasQueRuedan({ children, className }: { children: ReactNode; className?: string }) {
  const raiz = useRef<HTMLDivElement>(null);

  useGSAP(
    (_contexto, contextSafe) => {
      const el = raiz.current;
      if (!el || !contextSafe || !document.documentElement.classList.contains("mueve")) return;
      const conRaton = matchMedia("(hover: hover) and (pointer: fine)");
      const quitar: (() => void)[] = [];
      let vivo = true;

      const iniciar = contextSafe(() => {
        if (!vivo) return;
        el.querySelectorAll<HTMLElement>("[data-rueda]").forEach((enlace) => {
          const texto = enlace.querySelector<HTMLElement>("[data-rueda-texto]");
          if (!texto) return;
          const partido = SplitText.create(texto, { type: "chars", charsClass: "rueda-letra" });
          const rodar = contextSafe((arriba: boolean) => {
            gsap.to(partido.chars, {
              yPercent: arriba ? -100 : 0,
              duration: arriba ? 0.45 : 0.38,
              ease: "power3.inOut",
              overwrite: true,
              stagger: { each: 0.012, from: arriba ? "start" : "end" },
            });
          });
          const entra = () => conRaton.matches && rodar(true);
          const sale = () => conRaton.matches && !enlace.matches(":focus-visible") && rodar(false);
          const foco = () => enlace.matches(":focus-visible") && rodar(true);
          const desenfoque = () => rodar(false);
          enlace.addEventListener("mouseenter", entra);
          enlace.addEventListener("mouseleave", sale);
          enlace.addEventListener("focus", foco);
          enlace.addEventListener("blur", desenfoque);
          quitar.push(() => {
            enlace.removeEventListener("mouseenter", entra);
            enlace.removeEventListener("mouseleave", sale);
            enlace.removeEventListener("focus", foco);
            enlace.removeEventListener("blur", desenfoque);
          });
        });
      });
      document.fonts.ready.then(iniciar);

      return () => {
        vivo = false;
        quitar.forEach((f) => f());
      };
    },
    { scope: raiz },
  );

  return (
    <div ref={raiz} className={className}>
      {children}
    </div>
  );
}
