"use client";
// La parte viva de <Buzon>: escucha `correo:copiado` en document y deja caer la estampa sobre el buzón.
import { useEffect, useRef, useState, type ReactNode } from "react";
import TambaleoPerezoso, { precargarTambaleo } from "@/components/dibujo/TambaleoPerezoso";
import css from "./estaciones.module.css";

// la estampa centrada en el cuerpo del buzón (440, 238 de 560×420), 19.5 % del ancho
const ESTAMPA = { left: "68.8%", top: "43.7%", width: "19.5%" };

export default function BuzonVivo({ dibujo, estampa, className }: { dibujo: ReactNode; estampa: ReactNode; className?: string }) {
  const raiz = useRef<HTMLDivElement>(null);
  const [copias, setCopias] = useState(0);

  useEffect(() => {
    precargarTambaleo();
    const alCopiar = () => {
      setCopias((n) => n + 1);
      raiz.current?.querySelector("svg[data-dibujo]")?.dispatchEvent(new CustomEvent("dibujo:gesto", { bubbles: true, detail: { gesto: "banderitaTiembla" } }));
    };
    document.addEventListener("correo:copiado", alCopiar);
    return () => document.removeEventListener("correo:copiado", alCopiar);
  }, []);

  return (
    <div ref={raiz} className={`${css.buzon} ${className ?? ""}`} data-buzon="" data-copiado={copias > 0 ? "" : undefined}>
      {dibujo}
      {copias > 0 && (
        <TambaleoPerezoso key={copias} className={css.estampa} style={ESTAMPA} cae altura={90} arrastre={false} origen="50% 50%" fuerza={420} datos={{ "data-estampa": "" }}>
          {estampa}
        </TambaleoPerezoso>
      )}
    </div>
  );
}
