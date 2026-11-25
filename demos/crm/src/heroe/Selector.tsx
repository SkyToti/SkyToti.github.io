import { useEffect, useId, useRef, useState } from "react";
import type { Vista, VistaId } from "../vista";
import { IconoChevron } from "../ui/iconos";

interface Props {
  actual: VistaId;
  opciones: Vista[];
  alElegir: (id: VistaId) => void;
  /** con un expediente abierto, el título es la pieza: el selector se esconde */
  oculto?: boolean;
  /** la última opción: crear una unidad (BRIEF-4 §4.D) */
  alNueva?: () => void;
}

/**
 * El título es el selector de unidad (BRIEF.md §3.2): se lee «Clínica Dental Ejemplo ˅», texto y
 * chevron sin caja, como el «Dates 2026 ˅» de la referencia. Despliega las cinco unidades más
 * «Todo tu negocio». Flechas para moverse, Enter para elegir y Esc para cerrar.
 */
export default function Selector({ actual, opciones, alElegir, oculto, alNueva }: Props) {
  const [abierto, setAbierto] = useState(false);
  const [foco, setFoco] = useState(0);
  const boton = useRef<HTMLButtonElement>(null);
  const lista = useRef<HTMLUListElement>(null);
  const id = useId();
  const v = opciones.find((o) => o.id === actual) ?? opciones[0];
  const total = opciones.length + (alNueva ? 1 : 0);

  useEffect(() => {
    if (!abierto) return;
    setFoco(Math.max(0, opciones.findIndex((o) => o.id === actual)));
    const fuera = (e: PointerEvent) => {
      if (!lista.current?.contains(e.target as Node) && !boton.current?.contains(e.target as Node)) setAbierto(false);
    };
    window.addEventListener("pointerdown", fuera);
    return () => window.removeEventListener("pointerdown", fuera);
  }, [abierto, actual, opciones]);

  useEffect(() => {
    if (abierto) (lista.current?.children[foco] as HTMLElement | undefined)?.focus();
  }, [abierto, foco]);

  const elegir = (i: number) => {
    setAbierto(false);
    if (i >= opciones.length) return alNueva?.();
    alElegir(opciones[i].id);
    boton.current?.focus();
  };

  return (
    <div className="selector" data-oculto={oculto || undefined} inert={oculto || undefined}>
      <button
        ref={boton}
        className="titulo"
        type="button"
        aria-haspopup="listbox"
        aria-expanded={abierto}
        aria-controls={id}
        aria-label={`Unidad: ${v.corto}. Cambiar de unidad`}
        onClick={() => setAbierto((a) => !a)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setAbierto(true);
          }
        }}
      >
        <span className="titulo-texto" key={v.id}>
          <span className="titulo-linea">{v.nombre[0]}</span>
          <span className="titulo-linea">
            {v.nombre[1]}
            <IconoChevron className="titulo-chevron" tam={26} />
          </span>
        </span>
      </button>
      {abierto && (
        <ul
          ref={lista}
          id={id}
          className="selector-lista"
          role="listbox"
          aria-label="Unidades"
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setFoco((f) => (f + 1) % total);
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setFoco((f) => (f - 1 + total) % total);
            } else if (e.key === "Escape") {
              e.preventDefault();
              e.stopPropagation();
              setAbierto(false);
              boton.current?.focus();
            } else if (e.key === "Tab") {
              setAbierto(false);
            }
          }}
        >
          {opciones.map((o, i) => (
            <li
              key={o.id}
              role="option"
              tabIndex={-1}
              aria-selected={o.id === actual}
              data-unidad={o.id}
              className="selector-opcion"
              onClick={() => elegir(i)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  elegir(i);
                }
              }}
            >
              <span className="selector-nombre">{o.corto}</span>
              <span className="selector-que">{o.que}</span>
            </li>
          ))}
          {alNueva && (
            <li
              role="option"
              tabIndex={-1}
              aria-selected={false}
              data-nueva-unidad
              className="selector-opcion selector-nueva"
              onClick={() => elegir(opciones.length)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  elegir(opciones.length);
                }
              }}
            >
              <span className="selector-nombre">Nueva unidad</span>
              <span className="selector-que">Una clínica, un laboratorio o un radiológico</span>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
