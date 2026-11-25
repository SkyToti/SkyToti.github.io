"use client";
// Hoja de ciclos (solo para el banco /laboratorio/tanda-5/): cada ciclo de Haku en bucle a su ritmo, con un botón
// de pausa. Un solo intervalo para todos; con menos movimiento arrancan en pausa (primer cuadro).
import { useEffect, useRef, useState } from "react";
import { cargarCiclos, Lienzo, type Ciclo } from "./ciclos";

const RITMO: Record<Ciclo, number> = {
  caminar: 10, sentarse: 6, sentado: 1, parpadeo: 6, cola: 6, mirar: 2, senalar: 3,
  lamerse: 6, bostezar: 4, susto: 5, saltar: 8, dormir: 1.2,
};

function Ficha({ ciclo, largo, pausa, onPausa, registrar }: { ciclo: Ciclo; largo: number; pausa: boolean; onPausa: () => void; registrar: (svg: SVGSVGElement | null) => void }) {
  return (
    <figure data-ficha={ciclo} style={{ margin: 0, background: "#121B2E", borderRadius: 6, padding: 10, display: "grid", gap: 6 }}>
      <svg ref={registrar} width={160} height={120} aria-hidden="true" focusable="false" style={{ width: "100%", height: "auto", display: "block" }} />
      <figcaption style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13, color: "#A7A698" }}>
        <span>
          <b style={{ color: "#F5B455" }}>{ciclo}</b> · {largo} {largo === 1 ? "cuadro" : "cuadros"} · {RITMO[ciclo]} c/s
        </span>
        <button type="button" onClick={onPausa} aria-pressed={pausa} data-pausa={ciclo} style={{ font: "inherit", color: "#EDE6D6", background: "#2A3854", border: 0, borderRadius: 4, padding: "3px 8px", cursor: "pointer" }}>
          {pausa ? "seguir" : "pausa"}
        </button>
      </figcaption>
    </figure>
  );
}

export default function HojaCiclos() {
  const [ciclos, setCiclos] = useState<{ ciclo: Ciclo; largo: number }[]>([]);
  const [pausas, setPausas] = useState<Record<string, boolean>>({});
  const svgs = useRef(new Map<Ciclo, SVGSVGElement>());
  const lienzos = useRef(new Map<Ciclo, Lienzo>());
  const pausaRef = useRef(pausas);

  useEffect(() => {
    pausaRef.current = pausas;
  }, [pausas]);

  useEffect(() => {
    let vivo = true;
    cargarCiclos().then((d) => {
      if (!vivo) return;
      const lista = (Object.keys(d.cuadros) as Ciclo[]).map((ciclo) => ({ ciclo, largo: d.cuadros[ciclo]?.length ?? 0 }));
      if (matchMedia("(prefers-reduced-motion: reduce)").matches) setPausas(Object.fromEntries(lista.map((c) => [c.ciclo, true])));
      setCiclos(lista);
    });
    return () => {
      vivo = false;
    };
  }, []);

  useEffect(() => {
    if (!ciclos.length) return;
    let vivo = true;
    let t = 0;
    cargarCiclos().then((d) => {
      if (!vivo) return;
      for (const { ciclo } of ciclos) {
        const svg = svgs.current.get(ciclo);
        if (!svg || lienzos.current.has(ciclo)) continue;
        const l = new Lienzo(svg, d, `hoja-${ciclo}`);
        l.mostrar(ciclo, 0);
        lienzos.current.set(ciclo, l);
      }
    });
    const reloj = setInterval(() => {
      if (document.hidden) return;
      t += 50;
      for (const { ciclo, largo } of ciclos) {
        if (pausaRef.current[ciclo]) continue;
        const i = Math.floor((t / 1000) * RITMO[ciclo]) % Math.max(1, largo);
        lienzos.current.get(ciclo)?.mostrar(ciclo, i);
      }
    }, 50);
    return () => {
      vivo = false;
      clearInterval(reloj);
    };
  }, [ciclos]);

  return (
    <div data-banco="hoja" style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}>
      {ciclos.map(({ ciclo, largo }) => (
        <Ficha
          key={ciclo}
          ciclo={ciclo}
          largo={largo}
          pausa={!!pausas[ciclo]}
          onPausa={() => setPausas((p) => ({ ...p, [ciclo]: !p[ciclo] }))}
          registrar={(svg) => {
            if (svg) svgs.current.set(ciclo, svg);
          }}
        />
      ))}
    </div>
  );
}
