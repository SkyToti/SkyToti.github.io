"use client";
// Lo que se toca en la segunda mitad del inicio (cliente):
//   <CuadernoQueSigue>  el cuaderno de «También» (InventoPerezoso, carga al acercarse) se inclina hacia el cursor
//                       (solo ratón, con resorte) y al tocarlo, señalarlo con Enter o Espacio levanta sus hojas
//                       (gesto `levanta` del dibujo, y una ráfaga).
//   <CopiarConSello>    el botón «Copiar» de siempre (CopiarCorreo, intacto) más el aviso al buzón: cuando el estado
//                       del botón anuncia «copiado», despacha `correo:copiado` en document (baja el sello del buzón).
// Sin `html.mueve` (sin JavaScript o con menos movimiento) nada se inclina; los gestos saltan a su último cuadro.
import { useEffect, useRef, type KeyboardEvent } from "react";
import InventoPerezoso from "@/components/mundo/InventoPerezoso";
import CopiarCorreo from "@/components/movimiento/CopiarCorreo";
import type { Idioma } from "@/lib/idioma";
import { gsap, useGSAP } from "@/lib/gsap";

const hayMovimiento = () => document.documentElement.classList.contains("mueve");

/** pide un gesto al dibujo que vive dentro de `raiz` (DibujoVivo escucha `dibujo:gesto` en su contenedor) */
function gesto(raiz: HTMLElement | null, ...nombres: string[]) {
  const vivo = raiz?.querySelector("svg[data-dibujo]")?.parentElement;
  if (!vivo) return;
  for (const n of nombres) vivo.dispatchEvent(new CustomEvent("dibujo:gesto", { detail: { gesto: n } }));
}

// ── También · el cuaderno ─────────────────────────────────────────────────────────────────────────────────────
const GIRO_MAX = 4; // grados que se suma o resta a su inclinación hacia el cursor
const ALZA_MAX = 14; // px que se acerca al cursor

export function CuadernoQueSigue({ idioma, etiqueta, className }: { idioma: Idioma; etiqueta: string; className?: string }) {
  const raiz = useRef<HTMLDivElement>(null);
  const hoja = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = raiz.current;
      const capa = hoja.current;
      if (!el || !capa) return;
      const mm = gsap.matchMedia();
      mm.add("(min-width: 1024px) and (pointer: fine) and (prefers-reduced-motion: no-preference)", () => {
        if (!hayMovimiento()) return;
        const gira = gsap.quickTo(capa, "rotation", { duration: 0.9, ease: "elastic.out(1, 0.55)" });
        const sx = gsap.quickTo(capa, "x", { duration: 0.7, ease: "power3.out" });
        const sy = gsap.quickTo(capa, "y", { duration: 0.7, ease: "power3.out" });
        const escena = el.closest<HTMLElement>("[data-estacion]") ?? el;
        const mueve = (e: PointerEvent) => {
          if (e.pointerType !== "mouse") return;
          const r = el.getBoundingClientRect();
          const dx = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / (r.width / 2 + 200)));
          const dy = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height / 2)) / (r.height / 2 + 200)));
          gira(-dx * GIRO_MAX);
          sx(dx * ALZA_MAX);
          sy(dy * ALZA_MAX * 0.6);
        };
        const sale = () => {
          gira(0);
          sx(0);
          sy(0);
        };
        escena.addEventListener("pointermove", mueve, { passive: true });
        escena.addEventListener("pointerleave", sale);
        return () => {
          escena.removeEventListener("pointermove", mueve);
          escena.removeEventListener("pointerleave", sale);
          gsap.set(capa, { clearProps: "transform" });
        };
      });
      return () => mm.revert();
    },
    { scope: raiz },
  );

  const hojear = () => gesto(raiz.current, "levanta", "rafaga1");
  const tecla = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    e.preventDefault();
    hojear();
  };

  // un <div role="button"> y no un <button>: el invento lleva bloques (div, img) que un <button> no admite
  return (
    <div ref={raiz} className={className}>
      <div ref={hoja} role="button" tabIndex={0} aria-label={etiqueta} onClick={hojear} onKeyDown={tecla} data-cuaderno="">
        <InventoPerezoso invento="cuaderno" idioma={idioma} />
      </div>
    </div>
  );
}

// ── Contacto · copiar el correo y avisar al buzón ─────────────────────────────────────────────────────────────
export function CopiarConSello({
  correo,
  copiar,
  copiado,
  noSeCopio,
}: {
  correo: string;
  copiar: string;
  copiado: string;
  noSeCopio: string;
}) {
  const raiz = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const estado = raiz.current?.querySelector('[role="status"]');
    if (!estado) return;
    const boton = raiz.current?.querySelector("button");
    // CopiarCorreo escribe `copiado` en su estado (aria-live) solo cuando el portapapeles aceptó el correo. Se avisa
    // al cambiar a «copiado» o, si ya decía «copiado» (otro clic antes de 3 s), poco después del clic.
    let pendiente = false;
    let reloj = 0;
    const avisa = () => {
      pendiente = false;
      document.dispatchEvent(new CustomEvent("correo:copiado"));
    };
    const vigia = new MutationObserver(() => {
      if (pendiente && estado.textContent === copiado) avisa();
    });
    vigia.observe(estado, { childList: true, characterData: true, subtree: true });
    const alPulsar = () => {
      pendiente = true;
      window.clearTimeout(reloj);
      reloj = window.setTimeout(() => {
        if (pendiente && estado.textContent === copiado) avisa();
      }, 400);
    };
    boton?.addEventListener("click", alPulsar);
    return () => {
      vigia.disconnect();
      window.clearTimeout(reloj);
      boton?.removeEventListener("click", alPulsar);
    };
  }, [copiado]);

  return (
    <span ref={raiz} className="contents">
      <CopiarCorreo correo={correo} copiar={copiar} copiado={copiado} noSeCopio={noSeCopio} />
    </span>
  );
}
