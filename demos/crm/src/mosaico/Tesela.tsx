import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { m as motion} from "motion/react";
import { useDependenciaCubierta } from "../ui/cubierta";
import { FAMILIAS, fondo, veladura, type FamiliaId } from "../color";
import type { Tesela as DatosTesela } from "../vista";
import { IconoAbrir } from "../ui/iconos";
import { granoURL, useMedida } from "../ui/medida";
import type { Tinta } from "../graficos/graficos";
import { useFase } from "../motor/suave";
import Cifra from "../ui/Cifra";

interface Props {
  datos: DatosTesela;
  familia: FamiliaId;
  area: CSSProperties["gridArea"];
  /** el gráfico: recibe el tamaño de su caja, la tinta y la fase continua */
  grafico: (m: { w: number; h: number; tinta: Tinta; t: number; sonda: { x: number; y: number } | null }) => ReactNode;
  /** texto bajo el gráfico, a los lados (como «Younger / Older» o «1 · 100») */
  pie?: ReactNode;
  alAbrir?: () => void;
  /** la primera vez que aparece: las cifras cuentan desde 0 y las líneas se dibujan */
  estreno?: boolean;
  /** retraso de la revelación en la entrada, en segundos */
  retraso?: number;
}

/**
 * Las capas del degradado: al cambiar de familia la nueva se funde sobre la anterior.
 * Si solo cambió el tamaño, la capa de arriba se actualiza en su lugar (sin fundido).
 */
function useCapas(f: string, clave: string) {
  const [capas, setCapas] = useState([{ k: 0, f, clave }]);
  useEffect(() => {
    setCapas((c) => {
      const ultima = c[c.length - 1];
      if (ultima.clave === clave) return ultima.f === f ? c : [...c.slice(0, -1), { ...ultima, f }];
      // con movimiento reducido no hay fundido (ni su fin): la capa nueva reemplaza a la anterior
      if (matchMedia("(prefers-reduced-motion: reduce)").matches) return [{ k: ultima.k + 1, f, clave }];
      return [...c.slice(-1), { k: ultima.k + 1, f, clave }];
    });
  }, [f, clave]);
  const soltar = (k: number) => setCapas((c) => (c.length > 1 && c[c.length - 1].k === k ? c.slice(-1) : c));
  return [capas, soltar] as const;
}

/**
 * Dónde está el texto del mosaico, en píxeles: el fondo de la cabeza (o del estado, si baja más)
 * y el alto de la nota desde abajo. Se vuelve a medir cuando algo cambia de tamaño o de renglones.
 */
function useZonasDeTexto(vivo: React.RefObject<HTMLElement | null>, llave: string) {
  const [z, setZ] = useState({ arriba: 0, abajo: 0 });
  useLayoutEffect(() => {
    const el = vivo.current;
    if (!el) return;
    const medir = () => {
      const c = el.querySelector<HTMLElement>(".tesela-cabeza");
      const e = el.querySelector<HTMLElement>(".tesela-estado");
      const n = el.querySelector<HTMLElement>(".tesela-nota");
      const arriba = Math.max(c ? c.offsetTop + c.offsetHeight : 0, e ? e.offsetTop + e.offsetHeight : 0);
      const abajo = n ? el.offsetHeight - n.offsetTop : 0;
      setZ((a) => (Math.abs(a.arriba - arriba) < 1 && Math.abs(a.abajo - abajo) < 1 ? a : { arriba, abajo }));
    };
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(el);
    el.querySelectorAll(".tesela-cabeza, .tesela-estado, .tesela-nota").forEach((x) => ro.observe(x));
    return () => ro.disconnect();
  }, [vivo, llave]);
  return z;
}

/**
 * Un mosaico: degradado de manchas con grano (se pinta una vez; la capa respira en el compositor),
 * la cifra grande y ligera, su etiqueta, su estado, la ↗ que abre el detalle y su gráfico.
 * Todo el mosaico abre su detalle; la ↗ es la parada del teclado.
 */
export default function Tesela({ datos, familia, area, grafico, pie, alAbrir, estreno, retraso = 0 }: Props) {
  const f = FAMILIAS[familia];
  const [refT, mt] = useMedida<HTMLElement>();
  const [ref, m] = useMedida<HTMLDivElement>();
  const vivo = useRef<HTMLElement>(null);
  const t = useFase(vivo, !datos.fantasma);
  // la sonda: el gráfico dice su valor donde está el cursor
  const [sonda, setSonda] = useState<{ x: number; y: number } | null>(null);
  const sondear = (e: React.PointerEvent) => {
    if (e.pointerType === "touch") return;
    const caja = ref.current?.getBoundingClientRect();
    if (!caja) return;
    const x = e.clientX - caja.left;
    const y = e.clientY - caja.top;
    setSonda(x >= -8 && y >= -8 && x <= caja.width + 8 && y <= caja.height + 8 ? { x, y } : null);
  };
  const [capas, soltar] = useCapas(mt.w ? fondo(datos.id, f, mt.w * 1.2, mt.h * 1.2) : "", familia);
  const zonas = useZonasDeTexto(vivo, `${datos.etiqueta}|${datos.sub}|${datos.estado}|${datos.nota}`);
  const cubierta = useDependenciaCubierta();
  const [velos, soltarVelo] = useCapas(mt.h ? veladura(f, mt.h, zonas.arriba, zonas.abajo) : "", familia);
  return (
    <motion.article
      layoutId={`tesela-${datos.id}`}
      layoutDependency={cubierta}
      transition={{ layout: { duration: 0.55, ease: [0.16, 1, 0.3, 1] } }}
      className="tesela"
      data-tesela={datos.id}
      data-tinta={f.tinta}
      data-fantasma={datos.fantasma || undefined}
      data-estreno={estreno || undefined}
      style={{ gridArea: area, ["--retraso" as string]: `${retraso}s` }}
      ref={(el: HTMLElement | null) => {
        (refT as React.MutableRefObject<HTMLElement | null>).current = el;
        vivo.current = el;
      }}
      onClick={alAbrir}
      onPointerMove={sondear}
      onPointerLeave={() => setSonda(null)}
    >
      {capas.map((c, i) => (
        <div
          key={c.k}
          className="tesela-fondo"
          data-entra={i > 0 || undefined}
          style={{ backgroundImage: c.f || undefined }}
          onAnimationEnd={(e) => e.animationName === "funde" && soltar(c.k)}
          aria-hidden="true"
        />
      ))}
      {velos.map((c, i) => (
        <div
          key={c.k}
          className="tesela-velo"
          data-entra={i > 0 || undefined}
          style={{ backgroundImage: c.f || undefined }}
          onAnimationEnd={(e) => e.animationName === "funde" && soltarVelo(c.k)}
          aria-hidden="true"
        />
      ))}
      <div className="tesela-grano" style={{ backgroundImage: `url(${granoURL()})` }} aria-hidden="true" />
      <header className="tesela-cabeza">
        <h2 className="tesela-etiqueta">{datos.etiqueta}</h2>
        <p className="tesela-cifra" data-texto={/^[^d]/.test(datos.cifra) || undefined}>
          <Cifra valor={datos.cifra} desdeCero={estreno} />
          {datos.unidad && <span className="tesela-unidad"> {datos.unidad}</span>}
        </p>
        {datos.sub && <p className="tesela-sub">{datos.sub}</p>}
      </header>
      {datos.estado && <p className="tesela-estado">{datos.estado}</p>}
      <button
        className="tesela-abrir"
        type="button"
        data-abrir={datos.id}
        aria-label={`Abrir el detalle: ${datos.etiqueta}`}
        onClick={(e) => {
          e.stopPropagation();
          alAbrir?.();
        }}
      >
        <IconoAbrir tam={18} />
      </button>
      <div className="tesela-grafico" ref={ref}>
        {m.w > 0 && grafico({ w: m.w, h: m.h, tinta: f.tinta, t, sonda })}
      </div>
      {pie && <div className="tesela-pie">{pie}</div>}
      <p className="tesela-nota">
        {datos.nota.split(" · ").map((parte) => (
          <span key={parte} className="nota-parte">
            {parte}
          </span>
        ))}
      </p>
    </motion.article>
  );
}
