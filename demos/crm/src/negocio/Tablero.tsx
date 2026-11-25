import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, m as motion} from "motion/react";
import Pantalla from "../ui/PantallaCompleta";
import { Aviso, primeraVez } from "../ui/Aviso";
import { corto } from "../agenda/datos";
import { CRECER } from "../motor/movimiento";
import { ESTADOS_ORDEN, NOMBRE_ORIGEN, type EstadoOrden, type Orden } from "./datos";

/** la cabeza de cada columna cuenta órdenes: «2 recibidas», no «2 recibida» */
const COLUMNA: Record<EstadoOrden, string> = { Recibida: "Recibidas", "En proceso": "En proceso", Lista: "Listas", Entregada: "Entregadas" };

interface Props {
  ordenes: Orden[];
  alOrdenes: (o: Orden[]) => void;
  alCerrar: () => void;
}

/**
 * El tablero del laboratorio (BRIEF-4 §4.D): las órdenes por estado. Se arrastran entre columnas (o se mueven
 * con los botones ‹ › de cada tarjeta) y cada cambio ofrece «Deshacer». Órdenes y pacientes de ejemplo.
 * Ejemplo: el laboratorio vive en la principal y hace coronas y removibles.
 */
export default function Tablero({ ordenes, alOrdenes, alCerrar }: Props) {
  const [aviso, setAviso] = useState<{ texto: string; antes: Orden[]; recarga: boolean } | null>(null);
  const cerrarAviso = useCallback(() => setAviso(null), []);
  const columnas = useRef<(HTMLElement | null)[]>([]);
  const arrastre = useRef<{ id: string; col: number; x0: number; y0: number; movio: boolean; el: HTMLElement; r: DOMRect; copia: HTMLElement | null; destino: number } | null>(null);
  // si la pantalla se cierra a medio arrastre (Esc), la copia no se queda flotando
  useEffect(() => () => arrastre.current?.copia?.remove(), []);
  const soltar = (x: number | null) => {
    const a = arrastre.current;
    arrastre.current = null;
    if (!a) return;
    a.copia?.remove();
    delete a.el.dataset.arrastrando;
    if (a.destino >= 0) delete columnas.current[a.destino]?.dataset.destino;
    if (!a.movio || x == null) return;
    const c = columnaEn(x);
    if (c >= 0) mover(a.id, ESTADOS_ORDEN[c]);
  };
  const mover = (id: string, estado: EstadoOrden) => {
    const o = ordenes.find((x) => x.id === id);
    if (!o || o.estado === estado) return;
    setAviso({ texto: `${o.trabajo} de ${o.paciente}: ${estado.toLowerCase()} · guardado en este demo`, antes: ordenes, recarga: primeraVez() });
    alOrdenes(ordenes.map((x) => (x.id === id ? { ...x, estado } : x)));
  };
  const columnaEn = (x: number) => columnas.current.findIndex((c) => {
    const r = c?.getBoundingClientRect();
    return r && x >= r.left && x <= r.right;
  });
  return (
    <Pantalla
      layoutId="pantalla-laboratorio"
      titulo="Laboratorio"
      clase="tablero"
      sub="Las órdenes de tus clínicas, por estado · arrastra una tarjeta a otra columna"
      alCerrar={alCerrar}
    >
      <div className="tab-columnas">
        {ESTADOS_ORDEN.map((estado, i) => {
          const lista = ordenes.filter((o) => o.estado === estado);
          return (
            <section key={estado} className="tab-columna" data-estado-orden={estado} ref={(el) => void (columnas.current[i] = el)} aria-label={`${COLUMNA[estado]}: ${lista.length}`}>
              <header className="tab-cabeza">
                <span className="agenda-cifra-valor">{lista.length}</span>
                <span className="tab-nombre">{COLUMNA[estado]}</span>
              </header>
              <ul className="tab-lista">
                <AnimatePresence initial={false}>
                  {lista.map((o) => (
                    <motion.li key={o.id} layout layoutId={`orden-${o.id}`} transition={{ layout: CRECER }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <article
                        className="tab-tarjeta"
                        data-orden={o.id}
                        tabIndex={0}
                        aria-label={`${o.trabajo}${o.pieza ? `, pieza ${o.pieza}` : ""}, ${o.paciente}, ${estado}. Arrástrala o usa las flechas para cambiar su estado`}
                        onKeyDown={(e) => {
                          if (e.key === "ArrowRight" && i < ESTADOS_ORDEN.length - 1) mover(o.id, ESTADOS_ORDEN[i + 1]);
                          if (e.key === "ArrowLeft" && i > 0) mover(o.id, ESTADOS_ORDEN[i - 1]);
                        }}
                        onPointerDown={(e) => {
                          if (e.button !== 0 || (e.target as HTMLElement).closest("button")) return;
                          arrastre.current = { id: o.id, col: i, x0: e.clientX, y0: e.clientY, movio: false, el: e.currentTarget, r: e.currentTarget.getBoundingClientRect(), copia: null, destino: -1 };
                          // el recorrido automático arrastra con un puntero sin captura posible: no pasa nada si falla
                          try {
                            e.currentTarget.setPointerCapture(e.pointerId);
                          } catch {}
                        }}
                        onPointerMove={(e) => {
                          const a = arrastre.current;
                          if (!a) return;
                          const dx = e.clientX - a.x0;
                          const dy = e.clientY - a.y0;
                          if (!a.movio && Math.hypot(dx, dy) < 5) return;
                          if (!a.movio) {
                            // una copia fija sigue al puntero por encima de las columnas (sus listas recortan lo que sale)
                            const copia = a.el.cloneNode(true) as HTMLElement;
                            copia.classList.add("tab-copia");
                            copia.removeAttribute("tabindex");
                            copia.setAttribute("aria-hidden", "true");
                            Object.assign(copia.style, { left: `${a.r.left}px`, top: `${a.r.top}px`, width: `${a.r.width}px` });
                            document.body.appendChild(copia);
                            a.copia = copia;
                            a.movio = true;
                            a.el.dataset.arrastrando = "1";
                          }
                          a.copia!.style.translate = `${dx}px ${dy}px`;
                          const c = columnaEn(e.clientX);
                          const destino = c >= 0 && c !== a.col ? c : -1;
                          if (destino !== a.destino) {
                            if (a.destino >= 0) delete columnas.current[a.destino]?.dataset.destino;
                            if (destino >= 0) columnas.current[destino]!.dataset.destino = "1";
                            a.destino = destino;
                          }
                        }}
                        onPointerUp={(e) => soltar(e.clientX)}
                        onPointerCancel={() => soltar(null)}
                      >
                        <p className="tab-trabajo">
                          {o.trabajo}
                          {o.pieza ? <span className="tab-pieza"> · pieza {o.pieza}</span> : null}
                        </p>
                        <p className="tab-quien">{o.paciente}</p>
                        <p className="tab-meta">
                          {NOMBRE_ORIGEN[o.origen]} · {corto(o.doctor)} · entrega {o.entrega}
                        </p>
                        <div className="tab-mover">
                          <button type="button" aria-label={`Regresar a ${ESTADOS_ORDEN[i - 1] ?? ""}`} disabled={i === 0} onClick={() => mover(o.id, ESTADOS_ORDEN[i - 1])}>
                            ‹
                          </button>
                          <button type="button" aria-label={`Pasar a ${ESTADOS_ORDEN[i + 1] ?? ""}`} disabled={i === ESTADOS_ORDEN.length - 1} onClick={() => mover(o.id, ESTADOS_ORDEN[i + 1])}>
                            ›
                          </button>
                        </div>
                      </article>
                    </motion.li>
                  ))}
                </AnimatePresence>
                {lista.length === 0 && <li className="tab-vacio">Nada {estado === "Entregada" ? "entregado" : `en «${estado.toLowerCase()}»`} por ahora.</li>}
              </ul>
            </section>
          );
        })}
      </div>
      <AnimatePresence>
        {aviso && (
          <Aviso key={aviso.texto} aviso={{ texto: aviso.texto, recarga: aviso.recarga, deshacer: () => alOrdenes(aviso.antes) }} alCerrar={cerrarAviso} />
        )}
      </AnimatePresence>
      <p className="agenda-nota">Órdenes de ejemplo · pacientes ficticios · lo que muevas vive solo en esta pestaña</p>
    </Pantalla>
  );
}
