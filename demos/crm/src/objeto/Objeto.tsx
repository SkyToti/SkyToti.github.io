import { useEffect, useRef } from "react";
import { Muela, proyectar, type ClinicaMuela, type EstadoMuela } from "./muela";
import { PUNTAS, rgb01, TIPOS_PIEZA, ZONAS_MUELA, type MetaClinica, type TipoPieza } from "../expedientes/clinica";
import { suscribir, movimientoReducido } from "../motor/bucle";
import type { FormaMuela } from "../vista";

/** Puntos sobre la muela (espacio del modelo) de los que salen las llamadas */
export type Ancla = [number, number, number];

export interface ProyeccionAncla {
  x: number; // px dentro del lienzo
  y: number;
}

interface Props {
  forma: FormaMuela;
  /** Se llama en cada cuadro con la posición en pantalla de cada ancla */
  anclas?: Ancla[];
  alProyectar?: (p: ProyeccionAncla[]) => void;
  /** 0 = niebla normal, 1 = todo niebla (la entrada la abre) */
  niebla?: number;
  /** los colores clínicos de la pieza elegida (BRIEF-4 §3); null = escala de grises */
  clinica?: MetaClinica | null;
  /** hacia dónde gira para enseñar una zona (radianes); null = su postura de siempre */
  orientacion?: { guinada: number; cabeceo: number } | null;
  /** el tipo de pieza (en un expediente); si no, el primer molar superior de siempre */
  tipo?: TipoPieza;
  /** una pantalla completa la tapa: no se dibuja (se queda el último cuadro) */
  pausada?: boolean;
  className?: string;
}

const CLAVES = ["implante", "corona", "brackets", "escaneo", "fantasma"] as const;

/** ¿Ya terminó de transformarse la muela? (señal para las pruebas, junto con __crmQuieta) */
export const estadoMuela = {
  quieta: true,
  dibujos: 0,
  forma: { implante: 0, corona: 0, brackets: 0, escaneo: 0, fantasma: 0 } as FormaMuela,
  /** zonas teñidas (fuerza > 0.5), para las pruebas: zona, color y si va en trama */
  zonas: [] as { zona: string; color: string; trama: boolean }[],
  /** el tipo de pieza que más pesa en la muela */
  tipo: "molar-superior" as TipoPieza,
};
const hex = (r: number, g: number, b: number) => "#" + [r, g, b].map((v) => Math.round(v * 255).toString(16).padStart(2, "0")).join("");

/**
 * La muela esmerilada, viva: respira con un balanceo lento (±17° en 22 s) y cambia de forma
 * con la unidad (se acerca a su forma nueva de manera exponencial: se puede interrumpir).
 * Con movimiento reducido se dibuja quieta y los cambios son inmediatos.
 */
export default function Objeto({ forma, anclas = [], alProyectar, niebla = 0, clinica = null, orientacion = null, tipo = "molar-superior", pausada = false, className }: Props) {
  const lienzo = useRef<HTMLCanvasElement>(null);
  const props = useRef({ forma, anclas, alProyectar, niebla, clinica, orientacion, tipo, pausada });
  props.current = { forma, anclas, alProyectar, niebla, clinica, orientacion, tipo, pausada };

  useEffect(() => {
    const c = lienzo.current!;
    const m = Muela.crear(c);
    if (!m) {
      c.dataset.sinWebgl = "1";
      return;
    }
    let visible = true;
    let ancho = 0;
    let alto = 0;
    let escala = 1;
    let sucio = true;
    const actual: FormaMuela = { ...props.current.forma };
    // los colores clínicos también se acercan a su meta: el color se funde y la fuerza sube o baja
    const cl: ClinicaMuela = { zonas: new Float32Array(32), tramas: new Float32Array(8), conducto: new Float32Array(4), conductoTrama: 0, pulso: 1 };
    // girarla con el dedo o el mouse: el arrastre suma a la guiñada y al cabeceo; al soltar, regresa sola
    const giro = { activo: false, x: 0, y: 0, g: 0, c: 0 };
    // la postura: gira sola hacia la zona que se quiere enseñar (y el balanceo se achica)
    const postura = { g: -0.42, c: 0.17, vaiven: 1 };
    // el tipo de pieza: los pesos se acercan a su meta (suman 1) y se funde de una forma a otra
    const pesos = new Float32Array([1, 0, 0, 0, 0]);
    const puntas = new Float32Array(9);
    let nPuntas = 3;
    const abajo = (e: PointerEvent) => {
      giro.activo = true;
      giro.x = e.clientX;
      giro.y = e.clientY;
      // el recorrido automático gira la muela con un puntero sin captura posible: no pasa nada si falla
      try {
        c.setPointerCapture(e.pointerId);
      } catch {}
      c.dataset.girando = "1";
    };
    const mueve = (e: PointerEvent) => {
      if (!giro.activo) return;
      giro.g += (e.clientX - giro.x) * 0.012;
      giro.c = Math.max(-0.4, Math.min(0.4, giro.c + (e.clientY - giro.y) * 0.006));
      giro.x = e.clientX;
      giro.y = e.clientY;
      sucio = true;
    };
    const arriba = () => {
      giro.activo = false;
      delete c.dataset.girando;
    };
    c.addEventListener("pointerdown", abajo);
    c.addEventListener("pointermove", mueve);
    c.addEventListener("pointerup", arriba);
    c.addEventListener("pointercancel", arriba);
    let anc: Ancla[] = props.current.anclas.map((a) => [...a] as Ancla);
    let ultimoT = 0;
    let dibujada = false;
    const medir = () => {
      const r = c.getBoundingClientRect();
      escala = Math.min(window.devicePixelRatio || 1, 1.5);
      ancho = Math.max(2, Math.round(r.width * escala));
      alto = Math.max(2, Math.round(r.height * escala));
      m.medir(ancho, alto);
      // en lienzos bajos (el teléfono) la cámara se acerca para que la muela no se pierda
      m.camara.foco = r.height < 420 ? 2.85 : 2.25;
      sucio = true;
      // cambiar el tamaño del lienzo lo borra: se vuelve a dibujar aquí mismo, antes de que el
      // navegador pinte, para que nunca se vea un cuadro vacío ni estirado (girar el iPad, la ventana)
      if (dibujada && visible) pintar(ultimoT, 0);
    };
    const pintar = (t: number, dt: number) => {
      const quieto = movimientoReducido();
      const { forma: meta, anclas: metaAnc, alProyectar: f, niebla: metaNiebla, clinica: metaCl, orientacion: metaOr, tipo: metaTipo } = props.current;
      // la forma y las anclas se acercan a su meta (o saltan con movimiento reducido)
      const k = quieto ? 1 : 1 - Math.exp(-dt * 3.2);
      if (!giro.activo) {
        // regresa a su balanceo con una salida suave
        const r = quieto ? 0 : Math.exp(-dt * 2.4);
        giro.g *= r;
        giro.c *= r;
      }
      let lejos = Math.abs(giro.g) + Math.abs(giro.c) > 0.004 ? 1 : 0;
      const kp = quieto ? 1 : 1 - Math.exp(-dt * 2.6);
      const og = metaOr?.guinada ?? -0.42;
      const oc = metaOr?.cabeceo ?? 0.17;
      postura.g += (og - postura.g) * kp;
      postura.c += (oc - postura.c) * kp;
      postura.vaiven += ((metaOr ? 0.35 : 1) - postura.vaiven) * kp;
      lejos = Math.max(lejos, Math.abs(og - postura.g) + Math.abs(oc - postura.c));
      for (const clave of CLAVES) {
        actual[clave] += (meta[clave] - actual[clave]) * k;
        lejos = Math.max(lejos, Math.abs(meta[clave] - actual[clave]));
      }
      if (anc.length !== metaAnc.length) anc = metaAnc.map((a, i) => (anc[i] ? anc[i] : ([...a] as Ancla)));
      anc = anc.map((a, i) => {
        const b = metaAnc[i];
        const n: Ancla = [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
        lejos = Math.max(lejos, Math.abs(b[0] - n[0]) + Math.abs(b[1] - n[1]));
        return n;
      });
      // colores clínicos: la fuerza, el color y la trama se acercan a su meta
      const acercar = (i: number, color: string, fuerza: number, trama: number, rgba: Float32Array, o: number) => {
        if (fuerza > 0) {
          const [r, g, b] = rgb01(color);
          // si la zona estaba apagada, el color entra ya puesto (solo sube la fuerza)
          const recien = rgba[o + 3] < 0.01;
          rgba[o] = recien ? r : rgba[o] + (r - rgba[o]) * k;
          rgba[o + 1] = recien ? g : rgba[o + 1] + (g - rgba[o + 1]) * k;
          rgba[o + 2] = recien ? b : rgba[o + 2] + (b - rgba[o + 2]) * k;
          lejos = Math.max(lejos, Math.abs(r - rgba[o]) + Math.abs(g - rgba[o + 1]) + Math.abs(b - rgba[o + 2]));
        }
        rgba[o + 3] += (fuerza - rgba[o + 3]) * k;
        lejos = Math.max(lejos, Math.abs(fuerza - rgba[o + 3]));
        if (i >= 0) {
          cl.tramas[i] += (trama - cl.tramas[i]) * k;
          lejos = Math.max(lejos, Math.abs(trama - cl.tramas[i]));
        } else {
          cl.conductoTrama += (trama - cl.conductoTrama) * k;
          lejos = Math.max(lejos, Math.abs(trama - cl.conductoTrama));
        }
      };
      ZONAS_MUELA.forEach((_, i) => {
        const z = metaCl?.zonas[i];
        acercar(i, z?.color ?? "#000000", z?.fuerza ?? 0, z?.trama ?? 0, cl.zonas, i * 4);
      });
      acercar(-1, metaCl?.conducto.color ?? "#000000", metaCl?.conducto.fuerza ?? 0, metaCl?.conducto.trama ?? 0, cl.conducto, 0);
      cl.pulso = quieto ? 1 : 0.5 + 0.5 * Math.sin((t * Math.PI * 2) / 2.4);
      // con un hallazgo en la raíz, el ápice o el conducto, la niebla baja: se ve lo que está abajo
      const abajo = Math.max(cl.zonas[6 * 4 + 3], cl.zonas[7 * 4 + 3], cl.conducto[3]);
      TIPOS_PIEZA.forEach((t, i) => {
        const m = t === metaTipo ? 1 : 0;
        pesos[i] += (m - pesos[i]) * k;
        lejos = Math.max(lejos, Math.abs(m - pesos[i]));
      });
      // las puntas de las raíces son las del tipo que más pesa
      const dominante = TIPOS_PIEZA[pesos.indexOf(Math.max(...pesos))];
      PUNTAS[dominante].forEach((p, j) => puntas.set(p, j * 3));
      nPuntas = PUNTAS[dominante].length;
      estadoMuela.tipo = dominante;
      estadoMuela.quieta = lejos < 0.004;
      estadoMuela.zonas = ZONAS_MUELA.flatMap((z, i) =>
        cl.zonas[i * 4 + 3] > 0.5 ? [{ zona: z, color: hex(cl.zonas[i * 4], cl.zonas[i * 4 + 1], cl.zonas[i * 4 + 2]), trama: cl.tramas[i] > 0.5 }] : [],
      );
      if (cl.conducto[3] > 0.5) estadoMuela.zonas.push({ zona: "conducto", color: hex(cl.conducto[0], cl.conducto[1], cl.conducto[2]), trama: cl.conductoTrama > 0.5 });
      const e: EstadoMuela = {
        guinada: postura.g + giro.g + (quieto ? 0 : 0.3 * postura.vaiven * Math.sin((t * Math.PI * 2) / 22)),
        cabeceo: postura.c + giro.c + (quieto ? 0 : 0.03 * postura.vaiven * Math.sin((t * Math.PI * 2) / 13)),
        niebla: metaNiebla,
        // con el implante la niebla baja: se ve la rosca
        nivel: -0.5 - 0.5 * actual.implante - 0.62 * abajo + (quieto ? 0 : 0.07 * Math.sin((t * Math.PI * 2) / 17)),
        tiempo: quieto ? 0.4 : t,
        forma: actual,
        clinica: cl,
        tipo: pesos,
        puntas,
        nPuntas,
      };
      m.dibujar(e, escala);
      estadoMuela.dibujos++;
      estadoMuela.forma = { ...actual };
      if (f && anc.length) {
        const r = c.getBoundingClientRect();
        f(
          anc.map((p) => {
            const q = proyectar(p, e, m.camara, ancho / alto);
            return { x: q.x * r.width, y: q.y * r.height };
          }),
        );
      }
    };
    medir();
    const ro = new ResizeObserver(() => medir());
    ro.observe(c);
    const io = new IntersectionObserver(([en]) => (visible = en.isIntersecting));
    io.observe(c);
    let firma = "";
    const fuera = suscribir((t, dt) => {
      if (!visible || props.current.pausada) return;
      if (movimientoReducido()) {
        // quieta: se vuelve a dibujar solo si algo cambió (tamaño, forma, niebla o anclas)
        const ahora = JSON.stringify([props.current.forma, props.current.anclas, props.current.niebla, props.current.clinica, props.current.orientacion, props.current.tipo]);
        if (!sucio && ahora === firma && !giro.activo && Math.abs(giro.g) < 0.001) return;
        firma = ahora;
      }
      sucio = false;
      ultimoT = t;
      dibujada = true;
      pintar(t, dt);
    });
    return () => {
      fuera();
      ro.disconnect();
      io.disconnect();
      c.removeEventListener("pointerdown", abajo);
      c.removeEventListener("pointermove", mueve);
      c.removeEventListener("pointerup", arriba);
      c.removeEventListener("pointercancel", arriba);
      m.destruir();
    };
  }, []);

  return <canvas ref={lienzo} className={className} aria-hidden="true" />;
}
