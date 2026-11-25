"use client";
// Haku, el guía (el trozo pesado; entra por <HakuGuia>, que lo pide con next/dynamic cuando el navegador está libre).
// React solo pinta el armazón: el botón con el <svg> vacío, el globo y el interruptor. Los cuadros los pone `Lienzo` y
// la máquina de estados vive en `Motor` (sin re-renders). El globo es HTML de verdad, rotulado con la letra del kit.
// Regla de UN solo Haku: las estaciones que traen su propio Haku dibujado lo marcan con `data-haku="propio"`; cuando ese
// dibujo entra en la ventana el guía corre hasta él, salta y desaparece (y el dibujo muestra a su Haku: evento
// `haku:entra-en-escena`); al salir, el dibujo lo esconde (`haku:sale-de-escena`) y el guía vuelve a caer al piso.
// Haku camina directo sobre la página (sin franja ni fondo), siempre entero y a tamaño completo. Al sentarse busca en
// todo el ancho el hueco más cercano donde no pise texto, botones, vistas ni diagramas (camina hasta él; corre si está a
// más de 500 px); si no lo hay en todo el ancho, se sienta donde paró. El globo esquiva el
// texto si puede; si no, se pega a Haku por el lado con más espacio (nunca «sin globo»).
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type ComponentType } from "react";
import type { PropsTambaleo } from "@/components/dibujo/Tambaleo";
import { precargarTambaleo } from "@/components/dibujo/TambaleoPerezoso";
import { cargarCiclos, Lienzo, type DatosCiclos } from "./ciclos";
import { cajaGato, colocarGlobo, type Caja, type Silueta } from "./logica";
import { Motor } from "./motor";
import css from "./guia.module.css";

export type PropsGuia = {
  idioma: "es" | "en";
  /** frases por estación (clave = data-estacion), en orden */
  frases: Record<string, string[]>;
  /** para cuando se agotan las de la estación */
  repuesto?: string[];
};

const TEXTOS = {
  es: { haku: "Haku, el guía: toca para otro comentario", interruptor: "Haku: guía / silencio", cerrar: "Cerrar el comentario de Haku" },
  en: { haku: "Haku, the guide: tap for another comment", interruptor: "Haku: guide / quiet", cerrar: "Close Haku’s comment" },
} as const;

const CLAVE = "haku-guia";
const TECHO = 64; // la cabecera fija: el globo nunca va debajo de ella
/** el gato sentado dentro de su caja (medido en el lienzo de 160×120): media anchura del lado más ancho, alto y el
 *  hueco entre sus patas y la orilla, como fracción de la caja */
const SILUETA = { medio: 0.31, alto: 0.775, pie: 0.04 };
const silueta = (c: HTMLElement): Silueta => ({
  medio: c.offsetWidth * SILUETA.medio,
  alto: c.offsetHeight * SILUETA.alto,
  pie: c.offsetHeight * SILUETA.pie,
});
const PLACA_LADO = 170; // px: con menos sitio a los lados de Haku, la placa va encima de él
function leerSilencio() {
  try {
    return localStorage.getItem(CLAVE) === "silencio";
  } catch {
    return false;
  }
}
function guardarSilencio(si: boolean) {
  try {
    localStorage.setItem(CLAVE, si ? "silencio" : "guia");
  } catch {
    /* sin almacenamiento: solo dura esta visita */
  }
}
const estaQuieto = () =>
  !document.documentElement.classList.contains("mueve") || matchMedia("(prefers-reduced-motion: reduce)").matches;

const enVentana = (r: DOMRect | Caja) => {
  const w = "width" in r ? r.width : r.w, h = "height" in r ? r.height : r.h;
  const x = "left" in r ? r.left : r.x, y = "top" in r ? r.top : r.y;
  return w > 1 && h > 1 && y + h > 0 && y < innerHeight && x + w > 0 && x < innerWidth;
};

/**
 * Lo que el globo no debe tapar: cada renglón de texto visible (Range.getClientRects de los nodos de texto de títulos,
 * párrafos, listas, enlaces y botones), los controles, las vistas y los `[data-obstaculo]`. Se salta lo que contiene
 * el punto al que apunta el globo (el dibujo del Haku de una estación) y lo propio del guía.
 */
export function obstaculos(propios: Element | null, ancla?: { x: number; y: number }, desde = 0): Caja[] {
  const out: Caja[] = [];
  // (`desde`: solo lo que llega más abajo de esa y; para el piso de Haku basta la franja de abajo)
  const poner = (r: DOMRect, m = 4, blando = false) => {
    if (enVentana(r) && r.bottom + m > desde) out.push({ x: r.left - m, y: r.top - m, w: r.width + 2 * m, h: r.height + 2 * m, blando });
  };
  const rango = document.createRange();
  for (const el of document.querySelectorAll("h1, h2, h3, p, li, a[href], button, dt, dd, label, figcaption, blockquote")) {
    if (propios?.contains(el) || el.closest(".sr-only, [aria-hidden='true']")) continue;
    const caja = el.getBoundingClientRect();
    if (!enVentana(caja) || caja.bottom < desde) continue;
    const e = getComputedStyle(el);
    if (e.visibility === "hidden" || parseFloat(e.opacity) < 0.05) continue;
    if (el.matches("a[href], button")) poner(caja);
    const recorrer = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    for (let n = recorrer.nextNode(); n; n = recorrer.nextNode()) {
      if (!n.textContent?.trim()) continue;
      const padre = n.parentElement;
      if (padre && padre !== el && padre.closest(".sr-only")) continue;
      rango.selectNodeContents(n);
      for (const r of rango.getClientRects()) if (r.width > 2 && r.height > 2) poner(r);
    }
  }
  // los rótulos dentro de un dibujo o diagrama (<text> de svg) también se leen
  for (const el of document.querySelectorAll("svg text")) {
    if (propios?.contains(el) || el.closest("[data-linea-viva]")) continue;
    const r = el.getBoundingClientRect();
    if (r.width > 2 && r.height > 2 && parseFloat(getComputedStyle(el).opacity) >= 0.05) poner(r);
  }
  for (const el of document.querySelectorAll("[data-obstaculo], [data-vista], video, input, select, textarea, [role='button'], summary")) {
    if (propios?.contains(el)) continue;
    const r = el.getBoundingClientRect();
    if (ancla && r.left <= ancla.x && r.right >= ancla.x && r.top <= ancla.y && r.bottom >= ancla.y) continue;
    // un dibujo (sin ser vista, video ni control) es blando: Haku sentado puede quedar delante si no hay otro hueco
    poner(r, 2, el.matches("[data-obstaculo]") && !el.matches("[data-vista], video, input, select, textarea, [role='button'], summary"));
  }
  return out;
}

/** la caja en pantalla del Haku dibujado de una estación (la unión de sus grupos `haku-*` visibles) */
function cajaHakuPropio(el: Element): DOMRect | null {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const g of el.querySelectorAll('[data-g^="haku"]')) {
    const r = g.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) continue;
    x0 = Math.min(x0, r.left); y0 = Math.min(y0, r.top); x1 = Math.max(x1, r.right); y1 = Math.max(y1, r.bottom);
  }
  if (x0 === Infinity) {
    const r = el.getBoundingClientRect();
    return r.width > 1 ? r : null;
  }
  return new DOMRect(x0, y0, x1 - x0, y1 - y0);
}

/** cuándo despertó el dibujo de cada estación con Haku propio (para la red: si su entrada no avisa que terminó) */
const despertares = new WeakMap<Element, number>();
const ENTRADA_TOPE = 6000; // ms: despierto hace más que esto cuenta como dibujado aunque no haya avisado
const RED_MS = 1000; // ms a la vista tras los que el Haku de una estación se muestra aunque no quepa entero

/** el Haku de esa estación ya está dibujado (la entrada del dibujo terminó): solo entonces el guía se convierte en él */
function propioListo(el: Element) {
  if (estaQuieto() || el.querySelector("[data-entro]")) return true;
  const t = despertares.get(el);
  return t !== undefined && performance.now() - t > ENTRADA_TOPE;
}

/**
 * El dibujo con Haku propio que está «en escena»: ya dibujado y con su Haku entero entre la cabecera y la orilla de
 * abajo. Red: si lleva más de `RED_MS` a la vista (centro dentro y casi todo él en la ventana) sin caber entero, también.
 */
function escenaPropia(vista: Map<Element, number>): HTMLElement | null {
  const ahora = performance.now();
  // si caben dos (el buzón y el pie al final de la página): al final manda el pie; si no, el más cerca del centro
  const alFinal = scrollY + innerHeight >= document.documentElement.scrollHeight - 4;
  let mejor: HTMLElement | null = null, dMejor = Infinity;
  let red: HTMLElement | null = null;
  for (const el of document.querySelectorAll<HTMLElement>('[data-haku="propio"]:not([data-haku-modo="portada"])')) {
    const r = cajaHakuPropio(el);
    if (!r) {
      vista.delete(el);
      continue;
    }
    const cx = r.left + r.width / 2;
    const dentroX = cx > 0 && cx < innerWidth;
    const casi = dentroX && r.top > TECHO - r.height * 0.3 && r.bottom < innerHeight + r.height * 0.3;
    if (!casi) vista.delete(el);
    else if (!vista.has(el)) vista.set(el, ahora);
    if (!propioListo(el)) continue;
    if (r.top > TECHO && r.bottom < innerHeight - 4 && dentroX) {
      const pie = alFinal && el.closest('[data-estacion="pie"]');
      const d = pie ? -1 : Math.abs(r.top + r.height / 2 - innerHeight / 2);
      if (d < dMejor) {
        dMejor = d;
        mejor = el;
      }
    } else if (!red && casi && ahora - (vista.get(el) ?? ahora) >= RED_MS) red = el;
  }
  return mejor ?? red;
}

export default function GuiaMotor({ idioma, frases, repuesto }: PropsGuia) {
  const t = TEXTOS[idioma];
  const raiz = useRef<HTMLDivElement>(null);
  const caja = useRef<HTMLDivElement>(null);
  const espejo = useRef<HTMLDivElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const globo = useRef<HTMLDivElement>(null);
  const interruptor = useRef<HTMLButtonElement>(null);
  const motor = useRef<Motor | null>(null);
  /** el dibujo con Haku propio en el que el guía se convirtió (el globo apunta a él) */
  const escena = useRef<HTMLElement | null>(null);
  const uid = useId().replace(/[^A-Za-z0-9_-]/g, "");
  const [texto, setTexto] = useState<string | null>(null);
  const [silencio, setSilencio] = useState(leerSilencio);
  // los cuadros y Motion (arrastre con resorte) llegan juntos, en trozos aparte; hasta entonces no se pinta a Haku.
  // Se esperan los dos ANTES de montar el <svg>: si Motion llegara después, cambiaría el envoltorio y React
  // volvería a crear el <svg> (y los cuadros ya pintados se perderían).
  const [base, setBase] = useState<{ datos: DatosCiclos; Tambaleo: ComponentType<PropsTambaleo> } | null>(null);

  useEffect(() => {
    let vivo = true;
    Promise.all([cargarCiclos(), precargarTambaleo()]).then(([datos, Tambaleo]) => {
      if (vivo) setBase({ datos, Tambaleo });
    });
    return () => {
      vivo = false;
    };
  }, []);

  // arranque: con el <svg> ya montado, pinta el lienzo y enciende el motor. Al desmontar (o en el doble montaje de
  // StrictMode y Fast Refresh) se quita TODO: lienzo, escuchas, relojes y la marca del <html>.
  useEffect(() => {
    if (!base || !svg.current || !caja.current || !espejo.current || !raiz.current) return;
    const html = document.documentElement;
    const r = raiz.current;
    const datos = base.datos;
    const lienzo = new Lienzo(svg.current, datos, `hk${uid}`);
    const m = new Motor({
      lienzo,
      datos,
      caja: caja.current,
      espejo: espejo.current,
      interruptor: interruptor.current,
      quieto: estaQuieto(),
      silencio: leerSilencio(),
      frases,
      repuesto,
      decir: (s) => setTexto(s),
      visible: () => getComputedStyle(r).visibility !== "hidden",
      // siempre entero y a tamaño completo (a la derecha del interruptor). Busca en TODO el ancho la x más cercana
      // donde su gato no pise texto, botones, vistas ni dibujos/diagramas; si no la hay, una donde solo quede delante
      // de un dibujo (nunca de lo que se lee); y si tampoco, se queda donde paró
      hueco: (x) => {
        const c = caja.current;
        if (!c) return null;
        const s = silueta(c);
        const b = interruptor.current?.getBoundingClientRect();
        const min = (b?.width ? b.right + 6 : 8) + s.medio, max = innerWidth - 8 - s.medio;
        const x0 = Math.min(max, Math.max(min, x));
        const todo = obstaculos(r, undefined, innerHeight - s.alto - s.pie - 8);
        const duro = todo.filter((o) => !o.blando);
        const libre = (cx: number, lista: Caja[]) => {
          const g = cajaGato(cx, s, innerHeight);
          return !lista.some((o) => o.x < g.x + g.w && g.x < o.x + o.w && o.y < g.y + g.h && g.y < o.y + o.h);
        };
        for (const lista of [todo, duro])
          for (let d = 0; d <= innerWidth; d += 8)
            for (const cx of d ? [x0 + d, x0 - d] : [x0])
              if (cx >= min && cx <= max && libre(cx, lista)) return { x: cx, escala: 1, libre: true };
        // sin hueco limpio en todo el ancho: donde menos pise lo que se lee (a igual tapado, lo más cerca de donde paró)
        const pisa = (cx: number) => {
          const g = cajaGato(cx, s, innerHeight);
          return duro.reduce(
            (t, o) =>
              t +
              Math.max(0, Math.min(g.x + g.w, o.x + o.w) - Math.max(g.x, o.x)) *
                Math.max(0, Math.min(g.y + g.h, o.y + o.h) - Math.max(g.y, o.y)),
            0,
          );
        };
        let mejor = x0, menos = pisa(x0);
        for (let d = 8; d <= innerWidth && menos > 0; d += 8)
          for (const cx of [x0 + d, x0 - d]) {
            if (cx < min || cx > max) continue;
            const t = pisa(cx);
            if (t < menos - 0.5) {
              menos = t;
              mejor = cx;
            }
          }
        return { x: mejor, escala: 1, libre: false };
      },
      ocultar: (si, cae) => {
        if (si) r.setAttribute("data-oculto", "");
        else r.removeAttribute("data-oculto");
        const c = caja.current;
        if (!c) return;
        c.removeAttribute("data-cae");
        if (!si && cae) {
          void c.offsetWidth;
          c.setAttribute("data-cae", "");
        }
      },
    });
    motor.current = m;
    // listo ANTES de iniciar: el motor pregunta si el guía se ve para presentar la estación actual
    r.setAttribute("data-listo", "");
    m.iniciar();
    // desde aquí el guía decide cuándo se ve el Haku de cada estación (sin el guía, se ven siempre)
    html.setAttribute("data-haku-guia-vivo", "");

    // ── un solo Haku: el guía o el de la estación ──
    let cuadro = 0;
    const vista = new Map<Element, number>();
    const revisar = () => {
      cuadro = 0;
      const nueva = escenaPropia(vista);
      const vieja = escena.current;
      if (nueva === vieja) return;
      if (vieja) {
        vieja.removeAttribute("data-haku-estado");
        const nombre = vieja.closest<HTMLElement>("[data-estacion]")?.dataset.estacion ?? "";
        vieja.dispatchEvent(new CustomEvent("haku:sale-de-escena", { bubbles: true, detail: { nombre } }));
        escena.current = null;
        m.salirDeEscena();
      }
      if (nueva) {
        escena.current = nueva;
        const nombre = nueva.closest<HTMLElement>("[data-estacion]")?.dataset.estacion ?? "";
        const rh = cajaHakuPropio(nueva);
        const x = rh ? rh.left + rh.width / 2 : m.posicion();
        m.entrarEnEscena(nombre, x, () => {
          if (escena.current !== nueva) return;
          nueva.setAttribute("data-haku-estado", "dentro");
          nueva.dispatchEvent(new CustomEvent("haku:entra-en-escena", { bubbles: true, detail: { nombre } }));
        });
      }
    };
    const pedir = () => {
      if (!cuadro) cuadro = requestAnimationFrame(revisar);
    };
    // también cuando un dibujo termina de entrar (su Haku ya está dibujado) y, de red, cada medio segundo: lo que se
    // revela o se acomoda sin scroll (letras, imágenes) también cuenta
    const alDespertar = (ev: Event) => {
      const p = (ev.target instanceof Element ? ev.target : null)?.closest('[data-haku="propio"]');
      if (p && !despertares.has(p)) despertares.set(p, performance.now());
    };
    addEventListener("scroll", pedir, { passive: true });
    addEventListener("resize", pedir, { passive: true });
    document.addEventListener("dibujo:entro", pedir);
    document.addEventListener("dibujo:desperto", alDespertar);
    const red = setInterval(() => !document.hidden && pedir(), 500);
    revisar();
    return () => {
      cancelAnimationFrame(cuadro);
      clearInterval(red);
      removeEventListener("scroll", pedir);
      removeEventListener("resize", pedir);
      document.removeEventListener("dibujo:entro", pedir);
      document.removeEventListener("dibujo:desperto", alDespertar);
      m.destruir();
      motor.current = null;
      escena.current?.removeAttribute("data-haku-estado");
      escena.current = null;
      html.removeAttribute("data-haku-guia-vivo");
      r.removeAttribute("data-listo");
      r.removeAttribute("data-oculto");
    };
    // las frases nuevas entran por el efecto de abajo; el motor se crea una sola vez
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [base, uid]);

  useEffect(() => {
    motor.current?.ponerFrases(frases, repuesto);
  }, [frases, repuesto]);

  // El globo: sin salir de la ventana, esquivando texto, controles y vistas. Si no cabe sin tapar nada, PLACA pegada a
  // Haku por el lado con más espacio (o encima de él): nunca «sin globo». Se cierra a los 6 s (con menos movimiento se
  // queda), con Escape o, en celular, con su botón.
  useLayoutEffect(() => {
    const g = globo.current, c = caja.current, r0 = raiz.current;
    if (!texto || !g || !c || !r0) return;
    let placa = false;
    const colocar = () => {
      const propio = escena.current ? cajaHakuPropio(escena.current) : null;
      const r = propio ?? c.getBoundingClientRect();
      // el gato sentado del guía ocupa el centro-abajo de su caja; el dibujado, toda la suya
      const s = silueta(c);
      const cx = propio ? r.left + r.width / 2 : (motor.current?.posicion() ?? r.left + r.width / 2);
      const gato = propio ? { x: r.left, y: r.top, w: r.width, h: r.height } : cajaGato(cx, s, innerHeight);
      if (!placa) {
        const haku = propio
          ? { x: r.left, y: r.top - r.height * 0.4, w: r.width, h: r.height }
          : { x: r.left + r.width * 0.25, y: r.top, w: r.width * 0.5, h: r.height };
        // (solo el dibujo del Haku de una estación se salta: el globo va junto a él; el guía no se salta nada)
        const evitar = obstaculos(r0, propio ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : undefined);
        const sitio = colocarGlobo(haku, g.offsetWidth, g.offsetHeight, innerWidth, innerHeight, evitar, 12, TECHO);
        if (sitio) {
          g.removeAttribute("data-placa");
          g.style.maxWidth = "";
          g.style.left = `${sitio.x}px`;
          g.style.top = `${sitio.y}px`;
          g.style.setProperty("--flecha", `${sitio.flecha}px`);
          return;
        }
        placa = true;
      }
      // la placa, pegada a Haku por el lado con más espacio (a la derecha del interruptor), o encima si no cabe al lado
      const b = interruptor.current?.getBoundingClientRect();
      const desde = (b?.width ? b.right : 0) + 10;
      const izq = gato.x - 10 - desde, der = innerWidth - 10 - (gato.x + gato.w + 10);
      const lado = Math.max(izq, der) >= PLACA_LADO ? (der >= izq ? "izq" : "der") : "arriba";
      g.setAttribute("data-placa", lado);
      if (lado === "arriba") {
        g.style.maxWidth = `${Math.min(304, innerWidth - 24)}px`;
        const w = g.offsetWidth, h = g.offsetHeight;
        const x = Math.min(innerWidth - w - 12, Math.max(12, gato.x + gato.w / 2 - w / 2));
        g.style.left = `${Math.round(x)}px`;
        g.style.top = `${Math.round(Math.max(TECHO + 4, gato.y - h - 14))}px`;
        g.style.setProperty("--flecha", `${Math.min(w - 18, Math.max(18, gato.x + gato.w / 2 - x))}px`);
        return;
      }
      g.style.maxWidth = `${Math.round(Math.min(352, lado === "izq" ? der : izq))}px`;
      const w = g.offsetWidth, h = g.offsetHeight;
      const x = lado === "izq" ? gato.x + gato.w + 10 : gato.x - 10 - w;
      // a la altura de la cabeza de Haku, sin salirse por abajo
      const y = Math.min(innerHeight - h - 8, gato.y + Math.min(gato.h * 0.35, 40) - h / 2);
      g.style.left = `${Math.round(x)}px`;
      g.style.top = `${Math.round(Math.max(TECHO + 4, y))}px`;
    };
    colocar();
    // la letra del kit llega después (font-display: swap) y ensancha el globo: se vuelve a colocar. Y lo de alrededor se
    // sigue revelando (líneas que suben, inventos que entran): se revisa cada 400 ms mientras está abierto.
    const ro = new ResizeObserver(() => colocar());
    ro.observe(g);
    const vigia = setInterval(colocar, 400);
    return () => {
      ro.disconnect();
      clearInterval(vigia);
    };
  }, [texto]);

  useEffect(() => {
    if (!texto) return;
    const tecla = (e: KeyboardEvent) => e.key === "Escape" && setTexto(null);
    document.addEventListener("keydown", tecla);
    const reloj = estaQuieto() ? undefined : setTimeout(() => setTexto(null), 6000);
    return () => {
      clearTimeout(reloj);
      document.removeEventListener("keydown", tecla);
    };
  }, [texto]);

  const alternar = useCallback(() => {
    const n = !silencio;
    setSilencio(n);
    guardarSilencio(n);
    motor.current?.ponerSilencio(n);
    if (n) setTexto(null);
  }, [silencio]);

  const Tambaleo = base?.Tambaleo;
  return (
    <div ref={raiz} className={css.guia} data-guia="" data-silencio={silencio ? "1" : "0"}>
      {/* un interruptor de verdad, compacto: un icono (globo de diálogo; tachado en silencio) con su nombre accesible */}
      <button
        type="button"
        role="switch"
        aria-checked={!silencio}
        aria-label={t.interruptor}
        title={t.interruptor}
        className={css.interruptor}
        onClick={alternar}
        data-haku-interruptor=""
        ref={interruptor}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="M4 4h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-8l-5 4v-4H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
          {silencio ? <path d="M3 21 21 3" /> : <path className={css.puntos} d="M8.5 10.5h.01M15.5 10.5h.01" />}
        </svg>
      </button>
      <div ref={caja} className={css.caja}>
        {Tambaleo ? (
        <Tambaleo className={css.tambaleo} arrastre sacude={0} fuerza={180} datos={{ "data-haku-tambaleo": "" }}>
          <div ref={espejo} className={css.espejo} data-espejo="0">
            <button type="button" className={css.haku} aria-label={t.haku} onClick={() => motor.current?.tocar()} data-haku="">
              <svg ref={svg} xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false" />
            </button>
          </div>
        </Tambaleo>
        ) : null}
      </div>
      <div className={css.vivo} aria-live="polite">
        {texto ? (
          <div ref={globo} className={css.globo} data-haku-globo="" key={texto}>
            {texto}
            <button type="button" className={css.cerrar} aria-label={t.cerrar} onClick={() => setTexto(null)}>
              <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
                <path d="M3.5 3.5l9 9M12.5 3.5l-9 9" />
              </svg>
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
