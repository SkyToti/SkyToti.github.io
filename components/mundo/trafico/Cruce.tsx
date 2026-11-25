"use client";
// <Cruce tipo>: una banda de orilla a orilla (100vw) ENTRE dos escenarios, donde pasa algo dibujado con el scroll.
// En el HTML solo va la banda vacía con su alto ya reservado (CSS por tipo): sin JavaScript no se pinta nada y no hay
// saltos. A menos de una pantalla de entrar se importa el cruce (next/dynamic sin SSR: un trozo por tipo, con sus
// dibujos dentro). Decorativa: aria-hidden y sin puntero (salvo la moneda, que se puede tocar).
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import css from "./trafico.module.css";

const VIVOS = {
  carrito: dynamic(() => import("./cruces/Carrito"), { ssr: false }),
  avion: dynamic(() => import("./cruces/Avion"), { ssr: false }),
  viga: dynamic(() => import("./cruces/Viga"), { ssr: false }),
  moneda: dynamic(() => import("./cruces/Moneda"), { ssr: false }),
  nubes: dynamic(() => import("./cruces/Nubes"), { ssr: false }),
};

export type TipoCruce = keyof typeof VIVOS;

type Props = {
  tipo: TipoCruce;
  /** solo `carrito`: el número del letrero («02»): anuncia el siguiente proyecto */
  numero?: string;
  className?: string;
};

export default function Cruce({ tipo, numero, className }: Props) {
  const caja = useRef<HTMLDivElement>(null);
  const [cerca, setCerca] = useState(false);

  useEffect(() => {
    const el = caja.current;
    if (!el) return;
    const vista = new IntersectionObserver(
      (entradas) => {
        if (!entradas.some((e) => e.isIntersecting)) return;
        vista.disconnect();
        setCerca(true);
      },
      { rootMargin: "100% 0px" },
    );
    vista.observe(el);
    return () => vista.disconnect();
  }, []);

  const Vivo = VIVOS[tipo];
  return (
    <div ref={caja} className={`${css.cruce} ${css[tipo]} ${className ?? ""}`} data-cruce={tipo} aria-hidden="true">
      {cerca && <Vivo numero={numero} />}
    </div>
  );
}
