"use client";
// El video de una <Vista>. En el HTML no va ni el `src` ni el póster (si fuera, el navegador pide todos los pósters del
// inicio al cargar, ~0.5 MB que compiten con la portada: LCP en celular). Tras la carga, a tres pantallas de entrar se le
// pone el póster (con el espacio ya reservado por width/height); sin JavaScript, el póster va en un <noscript>. A una
// pantalla de entrar se le pone el `src`; con ≥ 50 % a la vista se reproduce solo, sin sonido y en bucle; al salir o con la pestaña oculta se
// pausa (sin vaciarlo: el `src` no se quita ni se cambia nunca). Con menos movimiento o con ahorro de datos NO arranca solo: queda el póster con el botón «Reproducir».
// El botón (visible solo con JavaScript, `html.js`) pausa y reanuda siempre (WCAG 2.2.2); al enfocar dentro aparecen
// también los controles nativos.
// Descarga: con `preload="none"` no baja nada hasta el primer `play()`. Al empezar se pasa a `preload="auto"`: si no,
// Chrome corta la descarga a medias (net::ERR_ABORTED) cada vez que el video se pausa al salir de vista, y la vuelve a
// pedir al volver. Con «auto» la termina aunque esté en pausa.
import { useEffect, useRef, useState } from "react";
import type { Medio } from "@/lib/contenido";
import type { TextosInicio } from "./textos";
import css from "./vista.module.css";

type Props = { medio: Medio; textos: TextosInicio; prioridad?: boolean; className?: string };

/** ¿Puede arrancar solo? No con menos movimiento ni con ahorro de datos. */
function puedeSolo(): boolean {
  const conexion = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  return !matchMedia("(prefers-reduced-motion: reduce)").matches && !conexion?.saveData;
}

export default function VideoVivo({ medio, textos, prioridad, className }: Props) {
  const caja = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const [cerca, setCerca] = useState(Boolean(prioridad));
  const [conPoster, setConPoster] = useState(Boolean(prioridad));
  const [sonando, setSonando] = useState(false);
  const [controles, setControles] = useState(false);
  /** la persona lo pausó: ya no se reanuda solo al volver a verlo */
  const aMano = useRef(false);

  useEffect(() => {
    const el = caja.current;
    const v = video.current;
    if (!el || !v) return;
    const solo = puedeSolo();
    let aLaVista = false;
    const reproducir = () => {
      v.preload = "auto";
      void v.play().catch(() => {}); // si el navegador no deja, se queda el póster
    };
    const acercarse = new IntersectionObserver(
      (e) => {
        if (!e.some((x) => x.isIntersecting)) return;
        acercarse.disconnect();
        setCerca(true);
      },
      { rootMargin: "100% 0px" },
    );
    const mirar = new IntersectionObserver(
      (e) => {
        const ultima = e[e.length - 1];
        aLaVista = Boolean(ultima && ultima.intersectionRatio >= 0.5);
        if (aLaVista && solo && !aMano.current && !document.hidden) reproducir();
        else if (!aLaVista) v.pause();
      },
      { threshold: [0, 0.5] },
    );
    const alCambiarPestana = () => {
      if (document.hidden) v.pause();
      else if (aLaVista && solo && !aMano.current) reproducir();
    };
    // El póster: después de `load` (fuera de la carga inicial) y a tres pantallas de entrar.
    const asomarse = new IntersectionObserver(
      (e) => {
        if (!e.some((x) => x.isIntersecting)) return;
        asomarse.disconnect();
        setConPoster(true);
      },
      { rootMargin: "300% 0px" },
    );
    const alCargar = () => asomarse.observe(el);
    if (document.readyState === "complete") alCargar();
    else window.addEventListener("load", alCargar, { once: true });
    acercarse.observe(el);
    mirar.observe(el);
    document.addEventListener("visibilitychange", alCambiarPestana);
    return () => {
      window.removeEventListener("load", alCargar);
      asomarse.disconnect();
      acercarse.disconnect();
      mirar.disconnect();
      document.removeEventListener("visibilitychange", alCambiarPestana);
    };
  }, []);

  const alternar = () => {
    const v = video.current;
    if (!v) return;
    if (v.paused) {
      aMano.current = false;
      setCerca(true);
      v.preload = "auto";
      void v.play().catch(() => {});
    } else {
      aMano.current = true;
      v.pause();
    }
  };

  return (
    <div
      ref={caja}
      className={css.video}
      data-controles={controles || undefined}
      onFocus={() => setControles(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setControles(false);
      }}
    >
      <video
        ref={video}
        className={className}
        src={cerca ? medio.src : undefined}
        poster={conPoster || cerca ? medio.poster : undefined}
        width={medio.ancho}
        height={medio.alto}
        aria-label={medio.alt}
        muted
        loop
        playsInline
        preload="none"
        controls={controles}
        onPlay={() => setSonando(true)}
        onPause={() => setSonando(false)}
      />
      {!conPoster && medio.poster && (
        <noscript>
          {/* eslint-disable-next-line @next/next/no-img-element -- sitio estático: el póster, solo sin JavaScript */}
          <img className={css.poster} src={medio.poster} width={medio.ancho} height={medio.alto} alt="" loading="lazy" />
        </noscript>
      )}
      <button type="button" className={css.boton} onClick={alternar}>
        <span aria-hidden="true" className={css.icono}>
          {sonando ? "❚❚" : "▶"}
        </span>
        {sonando ? textos.pausar : textos.reproducir}
      </button>
    </div>
  );
}
