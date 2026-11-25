"use client";
// Lo que se toca en los escenarios 4, 5 y 7 (cliente). Los tres envuelven su invento (que sigue cargando perezoso por
// InventoPerezoso) y le ponen encima zonas HTML de verdad (botón o deslizador, con nombre accesible y teclado) en
// coordenadas del lienzo de 640×420; desde ahí mueven las anclas del dibujo con GSAP (`data-anim`, con su pivote
// `data-o`) o le piden al dibujo uno de sus gestos con el evento `dibujo:gesto` (DibujoVivo).
//   <BovedaGiratoria>  el volante se gira arrastrando, rozándolo con el cursor o con las flechas; tiene inercia y,
//                      quieto un momento, regresa a su sitio con resorte. Cada vuelta completa baja el sello.
//   <MesaQueSalta>     cada agente salta al tocarlo, señalarlo o enfocarlo y enseña su papel y su modelo; la batuta
//                      repite el golpe y el martilleo en escala.
//   <IslaQueFlota>     la isla flota (CSS) y se inclina hacia el cursor (solo ratón); tocarla la estira.
// Sin `html.mueve` (sin JavaScript o con menos movimiento) nada se anima solo: el volante gira a saltos sin inercia
// ni regreso, los agentes enseñan su etiqueta sin saltar y la isla queda quieta.
import { useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent as PE } from "react";
import Boveda from "@/components/mundo/inventos/Boveda";
import IslaFlotante from "@/components/mundo/inventos/IslaFlotante";
import MesaDeLosSeis from "@/components/mundo/inventos/MesaDeLosSeis";
import type { Idioma } from "@/lib/idioma";
import { gsap, useGSAP } from "@/lib/gsap";
import cssB from "./MinecraftRconMcp.module.css";
import cssI from "./LaIsla.module.css";
import cssT from "./TallerClaude.module.css";
import { TEXTOS_B } from "./textos-b";

type Vars = CSSProperties & Record<`--${string}`, string | number | undefined>;

/** caja en % del lienzo de 640×420 */
const enLienzo = (x: number, y: number, w: number, h: number): Vars => ({
  left: `${(x / 640) * 100}%`,
  top: `${(y / 420) * 100}%`,
  width: `${(w / 640) * 100}%`,
  height: `${(h / 420) * 100}%`,
});

const hayMovimiento = () => document.documentElement.classList.contains("mueve");

/** pide un gesto al dibujo que vive dentro de `raiz` (DibujoVivo escucha `dibujo:gesto` en su contenedor) */
function gesto(raiz: HTMLElement | null, ...nombres: string[]) {
  const vivo = raiz?.querySelector("svg[data-dibujo]")?.parentElement;
  if (!vivo) return;
  for (const n of nombres) vivo.dispatchEvent(new CustomEvent("dibujo:gesto", { detail: { gesto: n } }));
}

// ── 4 · La bóveda ────────────────────────────────────────────────────────────────────────────────────────────
const PASO_TECLA = 45; // grados por tecla
const ESPERA_REGRESO = 1200; // ms quieto antes de regresar a su sitio

export function BovedaGiratoria({ idioma }: { idioma: Idioma }) {
  const raiz = useRef<HTMLDivElement>(null);
  const perilla = useRef<HTMLDivElement>(null);
  const aviso = useRef<HTMLParagraphElement>(null);
  const tx = TEXTOS_B[idioma];
  const invento = useMemo(() => <Boveda idioma={idioma} />, [idioma]);
  const api = useRef<{
    tecla: (signo: number) => void;
    agarra: (e: PE<HTMLDivElement>) => void;
    mueve: (e: PE<HTMLDivElement>) => void;
    suelta: (e: PE<HTMLDivElement>) => void;
    sale: () => void;
  } | null>(null);

  useGSAP(
    (_c, contextSafe) => {
      if (!contextSafe) return;
      const s = { ang: 0, vel: 0, arrastra: false, previo: null as number | null, t: 0, desdeSello: 0 };
      let espera = 0;
      let regreso: gsap.core.Tween | null = null;
      const volante = () => raiz.current?.querySelector<SVGGElement>('[data-anim="volante"]') ?? null;
      const centro = () => {
        const r = perilla.current!.getBoundingClientRect();
        return [r.left + r.width / 2, r.top + r.height / 2] as const;
      };
      const anguloDe = (e: PE<HTMLDivElement>) => {
        const [cx, cy] = centro();
        return (Math.atan2(e.clientY - cy, e.clientX - cx) * 180) / Math.PI;
      };
      const pinta = () => {
        const v = volante();
        if (v) gsap.set(v, { rotation: s.ang, svgOrigin: v.dataset.o ?? "512 254" });
        const g = ((Math.round(s.ang) % 360) + 360) % 360;
        perilla.current?.setAttribute("aria-valuenow", String(g));
        perilla.current?.setAttribute("aria-valuetext", tx.grados(g));
      };
      const sellar = () => {
        gesto(raiz.current, "sellar", "marcar");
        raiz.current?.setAttribute("data-aprobado", "");
        if (aviso.current) aviso.current.textContent = "";
        window.setTimeout(() => aviso.current && (aviso.current.textContent = tx.aprobado), 60);
      };
      const gira = (delta: number) => {
        s.ang += delta;
        s.desdeSello += delta;
        if (Math.abs(s.desdeSello) >= 360) {
          s.desdeSello -= 360 * Math.sign(s.desdeSello);
          sellar();
        }
        pinta();
      };
      const programaRegreso = () => {
        window.clearTimeout(espera);
        if (!hayMovimiento()) return;
        espera = window.setTimeout(
          contextSafe(() => {
            const meta = Math.round(s.ang / 360) * 360;
            s.desdeSello = 0;
            regreso = gsap.to(s, { ang: meta, duration: 1.1, ease: "elastic.out(1, 0.45)", onUpdate: pinta });
          }),
          ESPERA_REGRESO,
        );
      };
      const para = () => {
        regreso?.kill();
        regreso = null;
        window.clearTimeout(espera);
      };
      // inercia: gira con su velocidad y se frena sola
      const inercia = () => {
        const dt = Math.min(0.05, gsap.ticker.deltaRatio() / 60);
        gira(s.vel * dt);
        s.vel *= Math.exp(-2.6 * dt);
        if (Math.abs(s.vel) < 15) {
          gsap.ticker.remove(inercia);
          s.vel = 0;
          programaRegreso();
        }
      };
      const lanza = () => {
        gsap.ticker.remove(inercia);
        if (hayMovimiento() && Math.abs(s.vel) > 15) gsap.ticker.add(inercia);
        else programaRegreso();
      };

      api.current = {
        tecla: contextSafe((signo: number) => {
          para();
          gsap.ticker.remove(inercia);
          if (!hayMovimiento()) {
            gira(signo * PASO_TECLA);
            return;
          }
          const o = { v: 0 };
          let hecho = 0;
          gsap.to(o, {
            v: signo * PASO_TECLA,
            duration: 0.28,
            ease: "back.out(2)",
            onUpdate: () => {
              gira(o.v - hecho);
              hecho = o.v;
            },
            onComplete: programaRegreso,
          });
        }),
        agarra: contextSafe((e: PE<HTMLDivElement>) => {
          para();
          gsap.ticker.remove(inercia);
          s.arrastra = true;
          s.vel = 0;
          s.previo = anguloDe(e);
          s.t = performance.now();
          e.currentTarget.setPointerCapture(e.pointerId);
        }),
        mueve: contextSafe((e: PE<HTMLDivElement>) => {
          // arrastrando (cualquier puntero) o rozándolo con el ratón
          if (!s.arrastra && e.pointerType !== "mouse") return;
          const a = anguloDe(e);
          const ahora = performance.now();
          if (s.previo === null) {
            s.previo = a;
            s.t = ahora;
            return;
          }
          let d = a - s.previo;
          if (d > 180) d -= 360;
          if (d < -180) d += 360;
          const dt = Math.max(0.008, (ahora - s.t) / 1000);
          s.previo = a;
          s.t = ahora;
          if (!s.arrastra) {
            // roce: empuja con la mitad del giro y deja que la inercia haga lo demás
            if (!hayMovimiento()) return;
            para();
            s.vel = s.vel * 0.6 + ((d * 0.5) / dt) * 0.4;
            gira(d * 0.5);
            lanza();
            return;
          }
          para();
          s.vel = s.vel * 0.5 + (d / dt) * 0.5;
          gira(d);
        }),
        suelta: contextSafe((e: PE<HTMLDivElement>) => {
          if (!s.arrastra) return;
          s.arrastra = false;
          s.previo = null;
          if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
          lanza();
        }),
        sale: () => {
          if (!s.arrastra) s.previo = null;
        },
      };
      return () => {
        gsap.ticker.remove(inercia);
        window.clearTimeout(espera);
      };
    },
    { scope: raiz },
  );

  const teclas = (e: KeyboardEvent<HTMLDivElement>) => {
    const signo = e.key === "ArrowRight" || e.key === "ArrowUp" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowDown" ? -1 : 0;
    if (!signo) return;
    e.preventDefault();
    api.current?.tecla(signo);
  };

  return (
    <div ref={raiz} className={cssB.lienzo}>
      {invento}
      <div
        ref={perilla}
        role="slider"
        tabIndex={0}
        aria-label={tx.volante}
        aria-valuemin={0}
        aria-valuemax={359}
        aria-valuenow={0}
        aria-valuetext={tx.grados(0)}
        className={cssB.volante}
        style={enLienzo(456, 198, 112, 112)}
        onKeyDown={teclas}
        onPointerDown={(e) => api.current?.agarra(e)}
        onPointerMove={(e) => api.current?.mueve(e)}
        onPointerUp={(e) => api.current?.suelta(e)}
        onPointerCancel={(e) => api.current?.suelta(e)}
        onPointerLeave={() => api.current?.sale()}
      />
      <p ref={aviso} className="sr-only" aria-live="polite" />
    </div>
  );
}

// ── 5 · La mesa de los seis ──────────────────────────────────────────────────────────────────────────────────
const PARTES = ["brillo", "cuerpo", "cabeza", "brazos", "delante"];

export function MesaQueSalta({ idioma }: { idioma: Idioma }) {
  const raiz = useRef<HTMLDivElement>(null);
  const tx = TEXTOS_B[idioma];
  const [activo, setActivo] = useState<number | null>(null);
  const reloj = useRef(0);
  const invento = useMemo(() => <MesaDeLosSeis idioma={idioma} />, [idioma]);
  const api = useRef<{ brinca: (k: number) => void; batuta: (aunqueSuene: boolean) => void } | null>(null);

  useGSAP(
    (_c, contextSafe) => {
      if (!contextSafe) return;
      let golpe = -Infinity;
      api.current = {
        brinca: contextSafe((k: number) => {
          if (!hayMovimiento()) return;
          const partes = PARTES.flatMap((p) => [...(raiz.current?.querySelectorAll(`[data-g="a${k + 1}-${p}"]`) ?? [])]);
          if (!partes.length || gsap.isTweening(partes)) return;
          gsap
            .timeline()
            .to(partes, { y: -34, duration: 0.2, ease: "power2.out" })
            .to(partes, { y: 0, duration: 0.6, ease: "bounce.out" });
        }),
        // el cursor no repite el golpe mientras aún martillan (≈ 1.7 s); el clic y el teclado, siempre
        batuta: (aunqueSuene: boolean) => {
          const ahora = performance.now();
          if (!aunqueSuene && ahora - golpe < 1700) return;
          golpe = ahora;
          gesto(raiz.current, "batuta", "martillo1", "martillo2", "martillo3", "martillo4", "martillo5", "martillo6");
        },
      };
    },
    { scope: raiz },
  );

  const salta = (k: number) => {
    setActivo(k);
    window.clearTimeout(reloj.current);
    reloj.current = window.setTimeout(() => setActivo((a) => (a === k ? null : a)), 2600);
    api.current?.brinca(k);
  };

  return (
    <div ref={raiz} className={cssT.lienzo}>
      {invento}
      {tx.agentes.map((a, k) => (
        <button
          key={a.papel}
          type="button"
          className={cssT.agente}
          data-activo={activo === k || undefined}
          style={enLienzo(40 + 86 * k, k === 5 ? 206 : 228, 76, k === 5 ? 132 : 110)}
          onClick={() => salta(k)}
          onFocus={() => salta(k)}
          onPointerEnter={(e) => e.pointerType === "mouse" && salta(k)}
        >
          <span className={cssT.etiqueta}>
            {a.papel} · <span className={cssT.modelo}>{a.modelo}</span>
          </span>
        </button>
      ))}
      <button
        type="button"
        className={cssT.batuta}
        aria-label={tx.batuta}
        style={enLienzo(548, 140, 92, 120)}
        onClick={() => api.current?.batuta(true)}
        onPointerEnter={(e) => e.pointerType === "mouse" && api.current?.batuta(false)}
      />
    </div>
  );
}

// ── 7 · La isla ──────────────────────────────────────────────────────────────────────────────────────────────
export function IslaQueFlota({ idioma }: { idioma: Idioma }) {
  const raiz = useRef<HTMLDivElement>(null);
  const inclina = useRef<HTMLDivElement>(null);
  const tx = TEXTOS_B[idioma];
  const invento = useMemo(() => <IslaFlotante idioma={idioma} />, [idioma]);

  useGSAP(
    () => {
      const el = raiz.current;
      const capa = inclina.current;
      const escena = el?.closest("section");
      if (!el || !capa || !escena || !hayMovimiento()) return;
      gsap.set(capa, { transformPerspective: 1200 });
      const ry = gsap.quickTo(capa, "rotationY", { duration: 0.9, ease: "power3.out" });
      const rx = gsap.quickTo(capa, "rotationX", { duration: 0.9, ease: "power3.out" });
      const x = gsap.quickTo(capa, "x", { duration: 1.1, ease: "power3.out" });
      const y = gsap.quickTo(capa, "y", { duration: 1.1, ease: "power3.out" });
      const limita = (v: number) => Math.max(-1, Math.min(1, v));
      const mover = (e: PointerEvent) => {
        if (e.pointerType !== "mouse") return;
        const r = el.getBoundingClientRect();
        const dx = limita((e.clientX - (r.left + r.width / 2)) / (window.innerWidth / 2));
        const dy = limita((e.clientY - (r.top + r.height / 2)) / (window.innerHeight / 2));
        ry(dx * 12);
        rx(-dy * 9);
        x(dx * 18);
        y(dy * 12);
      };
      const salir = () => {
        ry(0);
        rx(0);
        x(0);
        y(0);
      };
      escena.addEventListener("pointermove", mover);
      escena.addEventListener("pointerleave", salir);
      return () => {
        escena.removeEventListener("pointermove", mover);
        escena.removeEventListener("pointerleave", salir);
      };
    },
    { scope: raiz },
  );

  const estira = () => gesto(raiz.current, "estira");

  return (
    <div ref={raiz} className={cssI.islaCaja}>
      <div ref={inclina} className={cssI.inclina}>
        <div className={cssI.flota}>
          <div className={cssI.recorte} data-obstaculo="">
            <div className={cssI.lienzo}>{invento}</div>
          </div>
          <button
            type="button"
            className={cssI.tocaIsla}
            aria-label={tx.isla}
            onClick={estira}
            onPointerEnter={(e) => e.pointerType === "mouse" && estira()}
          />
        </div>
      </div>
    </div>
  );
}
