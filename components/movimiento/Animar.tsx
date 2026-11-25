"use client";
// El movimiento de un bloque de la página (DIRECCION.md §5), solo dentro de su `scope`:
//   [data-lineas]       título por líneas con máscara (patrón 1). data-lineas="ya": al cargar, sin esperar scroll.
//   [data-contar="…"]   contador (patrón 4). El HTML ya trae el valor final; aquí baja a 0 y sube al entrar en vista.
//   [data-revelar]      revelado en lote al entrar (patrón 5, con la corrección del salto lejos).
// Nada corre sin `html.mueve` (lib/arranque.ts): con menos movimiento o sin JavaScript todo se ve completo.
//
// Nada se queda oculto (scripts/nada-oculto.mjs):
//   · Las posiciones de ScrollTrigger se vuelven a medir cuando cargan las fuentes, cuando termina `load` y cada vez
//     que cambia el alto del bloque (imágenes perezosas, escenas que se montan). Si se midieran antes, el disparador
//     de lo de abajo puede quedar más allá del final de la página y nunca entrar.
//   · Red de seguridad independiente de GSAP: un IntersectionObserver que, si algo lleva más de 1.5 s en vista y
//     sigue oculto, lo muestra sin animar (clase `.a-salvo`, ver globals.css).
import { useRef, type ReactNode } from "react";
import { escribirCifra, partirCifra } from "@/lib/cifras";
import { gsap, ScrollTrigger, SplitText, useGSAP } from "@/lib/gsap";

const ESPERA_RED = 1500;

export default function Animar({ children, className }: { children: ReactNode; className?: string }) {
  const raiz = useRef<HTMLDivElement>(null);

  useGSAP(
    (_contexto, contextSafe) => {
      const el = raiz.current;
      if (!el || !contextSafe || !document.documentElement.classList.contains("mueve")) return;
      let vivo = true;
      /** Lo que se rescata sin animar: deshacer la partición y matar su animación. */
      const deshacer = new Map<HTMLElement, () => void>();
      const corriendo = new Map<HTMLElement, gsap.core.Tween>();

      // 1. Títulos por líneas: partir DESPUÉS de cargar las fuentes (si no, las líneas salen mal cortadas).
      const partir = contextSafe(() => {
        if (!vivo) return;
        el.querySelectorAll<HTMLElement>("[data-lineas]").forEach((titulo) => {
          if (titulo.classList.contains("a-salvo")) return;
          const partido = SplitText.create(titulo, { type: "lines", mask: "lines" });
          titulo.classList.add("partido");
          const animacion = gsap.from(partido.lines, {
            yPercent: 105,
            duration: 0.9,
            ease: "expo.out",
            stagger: 0.08,
            // Al terminar se deshace la partición: el título vuelve a ser texto normal (y se reacomoda solo).
            onComplete: () => {
              partido.revert();
              deshacer.delete(titulo);
            },
            scrollTrigger: titulo.dataset.lineas === "ya" ? undefined : { trigger: titulo, start: "top 86%", once: true },
          });
          corriendo.set(titulo, animacion);
          deshacer.set(titulo, () => {
            animacion.scrollTrigger?.kill();
            animacion.kill();
            partido.revert();
          });
        });
        ScrollTrigger.refresh();
      });
      document.fonts.ready.then(partir);

      // 2. Contadores: conservan prefijo, sufijo, decimales y separador de miles («~14,000», «1.8 MB»).
      el.querySelectorAll<HTMLElement>("[data-contar]").forEach((numero) => {
        const final = numero.dataset.contar ?? "";
        const cifra = partirCifra(final);
        if (!cifra) return;
        const o = { v: 0 };
        numero.textContent = escribirCifra(cifra, 0);
        gsap.to(o, {
          v: cifra.numero,
          duration: 1.4,
          ease: "power2.out",
          scrollTrigger: { trigger: numero, start: "top 92%", once: true },
          onUpdate: () => {
            numero.textContent = escribirCifra(cifra, cifra.decimales ? o.v : Math.round(o.v));
          },
          onComplete: () => {
            numero.textContent = final;
          },
        });
      });

      // 3. Revelado en lote. Al saltar lejos (ancla, «Ver trabajo»), el lote trae lo que quedó arriba: eso se
      //    pone visible al instante y solo lo demás se escalona (total ≤ 0.5 s).
      const piezas = gsap.utils.toArray<HTMLElement>("[data-revelar]", el);
      if (piezas.length) {
        ScrollTrigger.batch(piezas, {
          start: "top 90%",
          once: true,
          onEnter: (lote) => {
            // Solo lo que sigue en la página y sin rescatar (la red de seguridad pudo mostrarlo ya): un lote vacío
            // haría que GSAP avise «target not found».
            const elementos = (lote as HTMLElement[]).filter((p) => p.isConnected && !p.classList.contains("a-salvo"));
            const arriba = elementos.filter((p) => p.getBoundingClientRect().bottom < 0);
            const resto = elementos.filter((p) => !arriba.includes(p));
            if (arriba.length) gsap.set(arriba, { opacity: 1, y: 0 });
            if (resto.length)
              gsap.to(resto, {
                opacity: 1,
                y: 0,
                duration: 0.9,
                ease: "expo.out",
                stagger: Math.min(0.06, 0.5 / Math.max(resto.length, 1)),
                overwrite: true,
              });
          },
        });
      }

      // 4. Volver a medir cuando cambian las posiciones: al terminar `load` y cuando el bloque cambia de alto.
      const medir = () => vivo && ScrollTrigger.refresh();
      if (document.readyState !== "complete") window.addEventListener("load", medir, { once: true });
      let altoAntes = el.offsetHeight;
      let espera = 0;
      const vigiaAlto = new ResizeObserver(() => {
        const alto = el.offsetHeight;
        if (Math.abs(alto - altoAntes) < 2) return;
        altoAntes = alto;
        window.clearTimeout(espera);
        espera = window.setTimeout(medir, 200);
      });
      vigiaAlto.observe(el);

      // 5. Red de seguridad: lo que lleva > 1.5 s en vista y sigue oculto se muestra sin animar.
      const relojes = new Map<Element, number>();
      const sigueOculto = (pieza: HTMLElement) => {
        if (pieza.hasAttribute("data-revelar")) return parseFloat(getComputedStyle(pieza).opacity) < 0.99;
        return !pieza.classList.contains("partido") || deshacer.has(pieza);
      };
      const animando = (pieza: HTMLElement) =>
        gsap.isTweening(pieza) || (corriendo.get(pieza)?.isActive() ?? false);
      const rescatar = (pieza: HTMLElement) => {
        relojes.delete(pieza);
        if (!vivo || !sigueOculto(pieza)) return;
        // Si su animación ya va en camino, se le da tiempo de terminar y se vuelve a revisar.
        if (animando(pieza)) {
          relojes.set(pieza, window.setTimeout(() => rescatar(pieza), ESPERA_RED));
          return;
        }
        deshacer.get(pieza)?.();
        deshacer.delete(pieza);
        gsap.killTweensOf(pieza);
        gsap.set(pieza, { clearProps: "opacity,transform" });
        pieza.classList.add("a-salvo");
      };
      const vigiaVista = new IntersectionObserver((entradas) => {
        for (const e of entradas) {
          if (e.isIntersecting && !relojes.has(e.target)) {
            relojes.set(e.target, window.setTimeout(() => rescatar(e.target as HTMLElement), ESPERA_RED));
          } else if (!e.isIntersecting && relojes.has(e.target)) {
            window.clearTimeout(relojes.get(e.target));
            relojes.delete(e.target);
          }
        }
      });
      el.querySelectorAll("[data-lineas], [data-revelar]").forEach((p) => vigiaVista.observe(p));

      return () => {
        vivo = false;
        window.removeEventListener("load", medir);
        window.clearTimeout(espera);
        vigiaAlto.disconnect();
        vigiaVista.disconnect();
        relojes.forEach((r) => window.clearTimeout(r));
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
