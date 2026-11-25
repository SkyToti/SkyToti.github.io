// Los cuadros de Haku (components/dibujo/datos/haku-ciclos.json, fuera de index.ts) entran en un trozo aparte la
// primera vez que se piden. `Lienzo` los pinta en un <svg> ya montado: cada ciclo se agrega al DOM la primera vez
// que se usa y luego cambiar de cuadro es solo alternar `display` entre <g> ya pintados (nada se recalcula).

export type DatosCiclos = {
  nombre: string;
  vb: string;
  ancho: number;
  alto: number;
  piso: number;
  centro: number;
  /** unidades del lienzo que avanza el gato por cuadro de caminata */
  zancada: number;
  fps: number;
  /** <g> de apertura con el estilo de la línea y la escala del gato */
  envoltura: string;
  /** <defs> con las tramas compartidas */
  svg: string;
  cuadros: Record<string, string[]>;
};

export type Ciclo =
  | "caminar" | "sentarse" | "sentado" | "parpadeo" | "cola" | "mirar" | "senalar"
  | "lamerse" | "bostezar" | "susto" | "saltar" | "dormir";

let pedido: Promise<DatosCiclos> | null = null;

export function cargarCiclos(): Promise<DatosCiclos> {
  pedido ??= import("@/components/dibujo/datos/haku-ciclos.json").then((m) => (m.default ?? m) as unknown as DatosCiclos);
  return pedido;
}

const NS = "http://www.w3.org/2000/svg";

export class Lienzo {
  private grupos = new Map<string, SVGGElement[]>();
  private actual: SVGGElement | null = null;
  private raiz: SVGGElement;
  /** lo que este lienzo agregó al <svg> (las tramas y su envoltura): se quita entero al destruirlo */
  private propios: Element[];
  ciclo: Ciclo | null = null;
  cuadro = -1;

  private datos: DatosCiclos;
  private prefijo: string;

  constructor(svg: SVGSVGElement, datos: DatosCiclos, prefijo: string) {
    this.datos = datos;
    this.prefijo = prefijo;
    svg.setAttribute("viewBox", datos.vb);
    // Un <svg> = un lienzo: si quedó algo de un montaje anterior (StrictMode monta dos veces en desarrollo, Fast Refresh
    // vuelve a montar), se limpia antes; si no, el último cuadro del lienzo viejo se quedaba pintado y había dos Haku.
    svg.replaceChildren();
    // las tramas llevan id: uno propio por instancia (el banco pinta varios Haku a la vez)
    svg.insertAdjacentHTML("afterbegin", this.ids(datos.svg) + `${datos.envoltura}</g>`);
    this.propios = [...svg.children];
    this.raiz = svg.lastElementChild as SVGGElement;
  }

  /** quita del <svg> todo lo que pintó este lienzo (al desmontar el guía) */
  destruir() {
    this.propios.forEach((n) => n.remove());
    this.propios = [];
    this.grupos.clear();
    this.actual = null;
    this.ciclo = null;
    this.cuadro = -1;
  }

  private ids(s: string) {
    return s.replace(/id="tr-/g, `id="${this.prefijo}-tr-`).replace(/url\(#tr-/g, `url(#${this.prefijo}-tr-`);
  }

  private preparar(ciclo: Ciclo): SVGGElement[] {
    let gs = this.grupos.get(ciclo);
    if (gs) return gs;
    const g = document.createElementNS(NS, "g");
    g.setAttribute("data-ciclo", ciclo);
    g.innerHTML = (this.datos.cuadros[ciclo] ?? []).map((c, i) => `<g data-cuadro="${i}" style="display:none">${this.ids(c)}</g>`).join("");
    this.raiz.appendChild(g);
    gs = [...g.children] as SVGGElement[];
    this.grupos.set(ciclo, gs);
    return gs;
  }

  /** cuántos cuadros tiene un ciclo */
  largo(ciclo: Ciclo) {
    return this.datos.cuadros[ciclo]?.length ?? 0;
  }

  mostrar(ciclo: Ciclo, i: number) {
    if (ciclo === this.ciclo && i === this.cuadro) return;
    const gs = this.preparar(ciclo);
    const g = gs[Math.max(0, Math.min(gs.length - 1, i))];
    if (!g) return;
    if (this.actual && this.actual !== g) this.actual.style.display = "none";
    g.style.display = "";
    this.actual = g;
    this.ciclo = ciclo;
    this.cuadro = i;
  }

  /** las pupilas del sentado siguen un punto: (dx, dy) en −1..1 */
  pupilas(dx: number, dy: number) {
    if (this.ciclo !== "sentado" || !this.actual) return;
    const r = 3.2;
    const k = Math.hypot(dx, dy) > 1 ? 1 / Math.hypot(dx, dy) : 1;
    const t = `translate(${(dx * k * r).toFixed(2)} ${(dy * k * r).toFixed(2)})`;
    this.actual.querySelectorAll<SVGGElement>('[data-anim^="pupila"]').forEach((p) => p.setAttribute("transform", t));
  }
}
