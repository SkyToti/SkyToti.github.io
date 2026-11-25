import { m as motion} from "motion/react";
import { useDependenciaCubierta } from "../ui/cubierta";
import { CRECER } from "../motor/movimiento";
import { useCallback, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import Objeto, { type ProyeccionAncla } from "../objeto/Objeto";
import type { MetaClinica, TipoPieza } from "../expedientes/clinica";
import { ORDEN_VISTAS, VISTAS, type Glifo, type Vista, type VistaId } from "../vista";
const OPCIONES_BASE = ORDEN_VISTAS.map((id) => VISTAS[id]);
import { Arcada, GlifoBrackets, GlifoCorona, GlifoEscaneo, GlifoImplante, IconoBuscar, IconoEquipo, IconoExpediente, IconoMuela } from "../ui/iconos";
import TiraHoy from "./TiraHoy";
import Selector from "./Selector";

export type Seccion = "inicio" | "equipo" | "hoy" | "expedientes";

interface Props {
  vista: Vista;
  ahora: Date;
  seccion: Seccion;
  /** 0 = niebla normal; 1 = todo niebla (la entrada la abre) */
  niebla: number;
  alCambiarUnidad: (id: VistaId) => void;
  /** las unidades del selector (las de siempre más las creadas en el demo) y crear una */
  opciones?: Vista[];
  alNuevaUnidad?: () => void;
  /** una pantalla completa tapa el héroe: la muela no se dibuja */
  pausada?: boolean;
  alIr: (s: Seccion) => void;
  alBuscar: () => void;
  alPerfil: () => void;
  alAbrirHoy: () => void;
  /** la búsqueda se despliega dentro de la cabeza del héroe */
  busqueda?: ReactNode;
  alTocarLlamada?: (id: string) => void;
  llamadaTocable?: (id: string) => boolean;
  /** la llamada resaltada (un hallazgo señalado en el expediente) */
  focoLlamada?: string | null;
  /** los colores clínicos de la pieza elegida en un expediente */
  clinica?: MetaClinica | null;
  /** hacia dónde gira la muela para enseñar la zona elegida */
  orientacion?: { guinada: number; cabeceo: number } | null;
  /** con un expediente abierto: la pieza que se ve (en lugar del selector de unidad) */
  contexto?: { titulo: string; sub: string } | null;
  /** el tipo de pieza que toma la muela */
  tipo?: TipoPieza;
  /** el gesto escondido: mantener apretada la marca 1.5 s arranca el recorrido automático (BRIEF-5 §2.B1) */
  alPresentar?: () => void;
}

/** Las cuatro ranuras de las llamadas (todas las vistas usan las mismas); cada tamaño las acomoda en el CSS */
const RANURAS: Record<string, number> = { "72,13": 0, "75,39": 1, "5,52": 2, "66,63": 3 };
const ranura = (x: number, y: number) => RANURAS[`${x},${y}`] ?? 1;

const GLIFOS: Record<Glifo, () => ReactNode> = {
  corona: () => <GlifoCorona />,
  implante: () => <GlifoImplante />,
  brackets: () => <GlifoBrackets />,
  escaneo: () => <GlifoEscaneo />,
};

/**
 * El héroe claro (BRIEF.md §2.1): la marca, el título que es también el selector de unidad,
 * la barra vertical, la muela esmerilada con sus llamadas y la tira de hoy.
 */
export default function Heroe({ vista, ahora, seccion, niebla, alCambiarUnidad, opciones = OPCIONES_BASE, alNuevaUnidad, pausada, alIr, alBuscar, alPerfil, alAbrirHoy, busqueda, alTocarLlamada, llamadaTocable, focoLlamada, clinica, orientacion, contexto, tipo, alPresentar }: Props) {
  const raiz = useRef<HTMLDivElement>(null);
  const lienzo = useRef<HTMLDivElement>(null);
  const lineas = useRef<(SVGPolylineElement | null)[]>([]);
  const puntos = useRef<(HTMLDivElement | null)[]>([]);
  const etiquetas = useRef<(HTMLDivElement | null)[]>([]);
  // dónde termina cada línea guía (se mide al cambiar de tamaño o de unidad, no en cada cuadro)
  const metas = useRef<{ x: number; y: number; x2: number }[]>([]);
  const n = vista.llamadas.length;
  // el gesto escondido: nada se ve si solo se toca; a los 0.4 s un anillo fino empieza a llenarse
  const [apretando, setApretando] = useState(false);
  const cubierta = useDependenciaCubierta();
  const temporizador = useRef(0);
  const soltarMarca = () => {
    window.clearTimeout(temporizador.current);
    setApretando(false);
  };
  const apretarMarca = (e: React.PointerEvent) => {
    if (!alPresentar || !e.isPrimary || e.button > 0) return;
    setApretando(true);
    window.clearTimeout(temporizador.current);
    temporizador.current = window.setTimeout(() => {
      setApretando(false);
      alPresentar();
    }, 1500);
  };

  useLayoutEffect(() => {
    const medir = () => {
      const r = raiz.current!.getBoundingClientRect();
      metas.current = vista.llamadas.map((l, i) => {
        const el = etiquetas.current[i];
        if (!el) return { x: 0, y: 0, x2: 0 };
        const e = el.getBoundingClientRect();
        const regla = el.querySelector(".llamada-regla") as HTMLElement | null;
        const y = e.top - r.top + (regla ? regla.offsetTop : 0);
        return l.lado === "izq" ? { x: e.right - r.left + 10, y, x2: e.left - r.left } : { x: e.left - r.left - 10, y, x2: e.right - r.left };
      });
    };
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(raiz.current!);
    return () => ro.disconnect();
  }, [vista]);

  // el hallazgo señalado en el expediente hace latir su punto sobre la muela
  useLayoutEffect(() => {
    vista.llamadas.forEach((l, i) => puntos.current[i]?.toggleAttribute("data-activo", !!focoLlamada && l.id === focoLlamada));
  }, [focoLlamada, vista]);

  const alProyectar = useCallback((ps: ProyeccionAncla[]) => {
    const c = lienzo.current;
    if (!c) return;
    const ox = c.offsetLeft;
    const oy = c.offsetTop;
    ps.forEach((p, i) => {
      const x = ox + p.x;
      const y = oy + p.y;
      const pt = puntos.current[i];
      if (pt) pt.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
      const m = metas.current[i];
      const l = lineas.current[i];
      if (m && l) {
        // del halo sale en diagonal hasta la altura de la etiqueta y luego corre bajo ella
        const dx = m.x - x;
        const codo = { x: m.x - Math.sign(dx) * Math.min(Math.abs(dx) * 0.35, 26), y: m.y };
        const ang = Math.atan2(codo.y - y, Math.abs(codo.x - x));
        const inicio = { x: x + Math.sign(codo.x - x) * 13 * Math.cos(ang), y: y + 13 * Math.sin(ang) };
        l.setAttribute("points", `${inicio.x.toFixed(1)},${inicio.y.toFixed(1)} ${codo.x.toFixed(1)},${codo.y.toFixed(1)} ${m.x2.toFixed(1)},${m.y.toFixed(1)}`);
      }
    });
  }, []);

  return (
    <div className="heroe" ref={raiz} data-seccion={seccion}>
      <div className="heroe-lienzo" ref={lienzo}>
        <Objeto className="objeto" forma={vista.muela} anclas={vista.llamadas.map((l) => l.ancla)} alProyectar={alProyectar} niebla={niebla} clinica={clinica} orientacion={orientacion} tipo={tipo} pausada={pausada} />
      </div>

      <svg className="llamadas-lineas" aria-hidden="true" key={`l-${vista.id}`}>
        {vista.llamadas.map((l, i) => (
          <polyline key={l.id} data-ranura={ranura(l.x, l.y)} ref={(el) => void (lineas.current[i] = el)} fill="none" />
        ))}
      </svg>
      {Array.from({ length: 4 }, (_, i) => (
        <div
          key={i}
          className="llamada-punto"
          data-oculto={i >= n || undefined}
          data-ranura={i < n ? ranura(vista.llamadas[i].x, vista.llamadas[i].y) : undefined}
          data-clinico={(i < n && !!vista.llamadas[i].color) || undefined}
          data-trama={(i < n && vista.llamadas[i].trama) || undefined}
          style={i < n && vista.llamadas[i].color ? ({ ["--punto"]: vista.llamadas[i].color } as React.CSSProperties) : undefined}
          ref={(el) => void (puntos.current[i] = el)}
          aria-hidden="true"
        />
      ))}

      <header className="heroe-cabeza">
        <div className="marca" data-apretando={apretando || undefined} onPointerDown={apretarMarca} onPointerUp={soltarMarca} onPointerLeave={soltarMarca} onPointerCancel={soltarMarca} onContextMenu={(e) => e.preventDefault()}>
          <span className="marca-signo">
            <Arcada tam={22} />
            <svg className="marca-anillo" viewBox="0 0 48 48" aria-hidden="true">
              <rect x="1" y="1" width="46" height="46" rx="11" pathLength="100" />
            </svg>
          </span>
          <span className="marca-nombre">Tu CRM</span>
        </div>
        <div className="heroe-acciones">
          {busqueda}
          <button className="boton-icono" type="button" aria-label="Buscar (tecla /)" data-accion="buscar" onClick={alBuscar}>
            <IconoBuscar tam={19} />
          </button>
          <motion.button layoutId="doctor-titular" layoutDependency={cubierta} transition={{ layout: CRECER }} className="boton-icono boton-perfil" type="button" aria-label="Tu perfil: Dr. Robles (ejemplo)" data-accion="perfil" onClick={alPerfil}>
            R
          </motion.button>
        </div>
      </header>

      <Selector actual={vista.id} opciones={opciones} alElegir={alCambiarUnidad} oculto={!!contexto} alNueva={alNuevaUnidad} />
      {contexto && (
        <div className="heroe-contexto" key={contexto.titulo}>
          <h1 className="heroe-contexto-titulo">{contexto.titulo}</h1>
          <p className="heroe-contexto-sub">{contexto.sub}</p>
        </div>
      )}

      <nav className="barra" aria-label="Secciones">
        {(
          [
            ["inicio", "Inicio", <IconoMuela tam={19} key="i" />],
            ["equipo", "Tu equipo", <IconoEquipo tam={19} key="e" />],
            ["expedientes", "Expedientes", <IconoExpediente tam={19} key="x" />],
          ] as const
        ).map(([id, nombre, icono]) => (
          <button
            key={id}
            className="boton-icono"
            type="button"
            aria-label={nombre}
            aria-current={seccion === id ? "page" : undefined}
            data-seccion={id}
            onClick={() => alIr(id)}
          >
            {icono}
            <span className="barra-nombre" aria-hidden="true">
              {nombre}
            </span>
          </button>
        ))}
      </nav>

      <div className="llamadas" key={vista.id + vista.llamadas.map((l) => l.id).join("")}>
        {vista.llamadas.map((l, i) => {
          const tocable = llamadaTocable?.(l.id) ?? false;
          const Etiqueta = tocable ? "button" : "div";
          const activar = (si: boolean) => {
            const pt = puntos.current[i];
            const ln = lineas.current[i];
            if (pt) pt.toggleAttribute("data-activo", si);
            if (ln) ln.toggleAttribute("data-activo", si);
          };
          return (
          <Etiqueta
            key={l.id}
            className="llamada"
            data-tipo={l.tipo}
            data-lado={l.lado}
            data-ranura={ranura(l.x, l.y)}
            data-llamada={l.id}
            data-accion={tocable || undefined}
            data-foco={focoLlamada === l.id || undefined}
            style={{ animationDelay: `${0.12 + i * 0.07}s` }}
            ref={(el: HTMLElement | null) => void (etiquetas.current[i] = el as HTMLDivElement | null)}
            {...(tocable
              ? {
                  type: "button" as const,
                  onClick: () => alTocarLlamada?.(l.id),
                  onPointerEnter: () => activar(true),
                  onPointerLeave: () => activar(false),
                  onFocus: () => activar(true),
                  onBlur: () => activar(false),
                }
              : {})}
          >
            {l.tipo === "cifra" ? (
              <>
                <span className="llamada-cifra">
                  {l.cifra}
                  <span className="llamada-unidad"> {l.unidad}</span>
                </span>
                <span className="llamada-sub llamada-regla">{l.titulo}</span>
              </>
            ) : (
              <>
                {l.glifo && <span className="llamada-glifo">{GLIFOS[l.glifo]()}</span>}
                <span className="llamada-titulo llamada-regla">{l.titulo}</span>
                <span className="llamada-sub">{l.unidad}</span>
              </>
            )}
            <span className="llamada-nota">{l.nota}</span>
          </Etiqueta>
          );
        })}
      </div>

      <TiraHoy ahora={ahora} vista={vista} alAbrir={alAbrirHoy} />
      <p className="firma">Demo de diseño · datos de ejemplo</p>
    </div>
  );
}
