"use client";
// La parte viva de <Repisa>: qué objeto está elegido, su globo, y la caída de los objetos cuando la repisa despierta
// (evento `dibujo:desperto` de la base). Tocar a Haku en la base también abre el dato «haku».
import { useCallback, useEffect, useId, useRef, useState, type CSSProperties, type FocusEvent, type ReactNode } from "react";
import TambaleoPerezoso from "@/components/dibujo/TambaleoPerezoso";
import type { DatoRepisa } from "./Repisa";
import css from "./estaciones.module.css";

type Hueco = { x: number; y: number; w: number; h: number };
export type ComposicionRepisa = {
  id: "h" | "v";
  base: ReactNode;
  huecos: Record<string, Hueco>;
  objetos: Record<string, ReactNode>;
};

const LIMITE = { h: [18, 82], v: [50, 50] } as const;
const RETRASO = 0.45; // s tras despertar antes de que caiga el primero
const ENTRE = 0.14; // s entre objeto y objeto

export default function RepisaViva({
  idioma,
  datos,
  composiciones,
  className,
}: {
  idioma: "es" | "en";
  datos: DatoRepisa[];
  composiciones: ComposicionRepisa[];
  className?: string;
}) {
  const raiz = useRef<HTMLDivElement>(null);
  const [elegido, setElegido] = useState<string | null>(null);
  const [golpes, setGolpes] = useState<Record<string, number>>({});
  const [desperto, setDesperto] = useState(false);

  const elegir = useCallback((clave: string) => {
    setElegido(clave);
    setGolpes((g) => ({ ...g, [clave]: (g[clave] ?? 0) + 1 }));
  }, []);

  useEffect(() => {
    const el = raiz.current;
    if (!el) return;
    const alDespertar = () => setDesperto(true);
    const alTocar = (ev: Event) => { if ((ev as CustomEvent<{ zona?: string }>).detail?.zona === "haku") elegir("haku"); };
    const alTecla = (ev: KeyboardEvent) => { if (ev.key === "Escape") setElegido(null); };
    el.addEventListener("dibujo:desperto", alDespertar);
    el.addEventListener("dibujo:toca", alTocar);
    el.addEventListener("keydown", alTecla);
    return () => {
      el.removeEventListener("dibujo:desperto", alDespertar);
      el.removeEventListener("dibujo:toca", alTocar);
      el.removeEventListener("keydown", alTecla);
    };
  }, [elegir]);

  const dato = datos.find((d) => d.clave === elegido);
  return (
    <div ref={raiz} className={`${css.repisa} ${className ?? ""}`} lang={idioma} data-repisa="">
      {composiciones.map((c) => (
        <Composicion key={c.id} c={c} datos={datos} dato={dato} golpes={golpes} desperto={desperto} elegir={elegir} />
      ))}
    </div>
  );
}

function Composicion({
  c,
  datos,
  dato,
  golpes,
  desperto,
  elegir,
}: {
  c: ComposicionRepisa;
  datos: DatoRepisa[];
  dato: DatoRepisa | undefined;
  golpes: Record<string, number>;
  desperto: boolean;
  elegir: (clave: string) => void;
}) {
  const idGlobo = useId();
  const h = dato ? c.huecos[dato.clave] : undefined;
  let globo: CSSProperties | undefined;
  if (h) {
    const centro = h.x + h.w / 2;
    const [min, max] = LIMITE[c.id];
    const left = Math.min(max, Math.max(min, centro));
    globo = { left: `${left}%`, bottom: `${100 - h.y + 2}%`, ["--d" as string]: centro - left };
  }
  const alEnfocar = (clave: string) => (ev: FocusEvent<HTMLButtonElement>) => {
    if (ev.currentTarget.matches(":focus-visible")) elegir(clave);
  };
  return (
    <div className={`${css.comp} ${c.id === "h" ? css.compH : css.compV}`} data-comp={c.id}>
      <div className={css.lienzo}>{c.base}</div>
      {datos.map((d, i) => {
        const hueco = c.huecos[d.clave];
        if (!hueco) return null;
        return (
          <TambaleoPerezoso
            key={d.clave}
            className={css.objeto}
            style={{ left: `${hueco.x}%`, top: `${hueco.y}%`, width: `${hueco.w}%`, height: `${hueco.h}%` }}
            sacude={golpes[d.clave] ?? 0}
            cae={desperto}
            retraso={RETRASO + i * ENTRE}
            datos={{ "data-objeto": d.clave }}
          >
            <button
              type="button"
              className={css.boton}
              aria-label={d.titulo}
              aria-expanded={dato?.clave === d.clave}
              aria-controls={idGlobo}
              onClick={() => elegir(d.clave)}
              onFocus={alEnfocar(d.clave)}
            >
              {c.objetos[d.clave]}
            </button>
          </TambaleoPerezoso>
        );
      })}
      <div id={idGlobo} className={css.globo} style={globo} role="status" aria-live="polite" data-globo="">
        {dato && h ? (
          <>
            <strong>{dato.titulo}</strong>
            {dato.texto}
          </>
        ) : null}
      </div>
    </div>
  );
}
