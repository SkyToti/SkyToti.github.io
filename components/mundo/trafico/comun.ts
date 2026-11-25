// Lo que comparten los cruces del tráfico: medidas de los dibujos (iguales a dibujo/piezas/trafico-*.mjs; las
// comprueba pruebas/trafico.test.mjs), el marcado con ids propios y el ciclo de caminata cuadro a cuadro.
import type { DatosDibujo } from "@/components/dibujo/tipos";
import { prefijarIds } from "@/components/dibujo/ids";

/** unidades que avanza el agente por cuadro (= lo que retrocede su pie apoyado: así no patina) */
export const PASO = 12;
/** radio de las ruedas del carrito (unidades) */
export const RUEDA = 9;
/** radio de la moneda hexagonal (unidades) */
export const RADIO_MONEDA = 22;
/** viewBox [x, y, w, h] de cada actor (agente + lo que lleva) */
export const LIENZO_CARRITO = [-44, -186, 202, 192] as const;
export const LIENZO_VIGA = [-64, -126, 334, 132] as const;
export const LIENZO_TABLA = [-50, -126, 112, 132] as const;
export const AGENTES_VIGA = [216, 108, 0] as const;
export const LETRERO = { x: 100, y: -147 } as const;

export const vb = (l: readonly number[]) => l.join(" ");
export const marcado = (d: unknown, prefijo: string) => prefijarIds((d as DatosDibujo).svg, prefijo);

/** ¿se permite movimiento? (el guion de arranque pone `html.mueve`; sin eso, viñeta quieta) */
export const puedeMover = () => document.documentElement.classList.contains("mueve");

/** pone el cuadro k (0–3) de un agente: el CSS enseña solo los grupos `paso<k>-…` */
export function ponerCuadro(g: Element, k: number) {
  const v = String(((k % 4) + 4) % 4);
  if ((g as HTMLElement).dataset.c !== v) (g as HTMLElement).dataset.c = v;
}

/** catmull-rom → curvas de Bézier (camino SVG) por una lista de puntos */
export function curva(pts: [number, number][]): string {
  const P = [pts[0]!, ...pts, pts.at(-1)!];
  let d = `M${pts[0]![0].toFixed(1)} ${pts[0]![1].toFixed(1)}`;
  for (let i = 1; i < P.length - 2; i++) {
    const [p0, p1, p2, p3] = [P[i - 1]!, P[i]!, P[i + 1]!, P[i + 2]!];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${c1[0]!.toFixed(1)} ${c1[1]!.toFixed(1)} ${c2[0]!.toFixed(1)} ${c2[1]!.toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d;
}
