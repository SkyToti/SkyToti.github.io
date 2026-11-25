"use client";
// <InventoPerezoso>: un invento que NO viaja en el HTML. En su lugar va un marcador ligero en un hueco con las
// proporciones exactas del dibujo (la portada real del caso como <img> 16:10, o un recuadro del plano si no hay
// portada). Cuando el hueco está a menos de una pantalla de entrar, se importa SOLO ese invento (sus datos son un
// trozo propio; la base se comparte) y sustituye al marcador con un fundido corto. Sin JavaScript queda la foto;
// con menos movimiento se carga igual y aparece dibujado y quieto (DibujoVivo no anima sin `html.mueve`).
import { useEffect, useRef, useState, type ComponentType } from "react";
import type { DatosDibujo } from "@/components/dibujo/tipos";
import type { HuecoFijo, PropsInvento } from "./inventos/Invento";
import { cargarInvento, huecoDe, LIENZO, type NombreInvento } from "./inventos/registro";
import css from "./inventos/inventos.module.css";

type Base = ComponentType<PropsInvento & { datos: DatosDibujo; hueco?: HuecoFijo }>;
type Cargado = { Base: Base; datos: DatosDibujo };

export default function InventoPerezoso({
  invento,
  idioma = "es",
  foto,
  className,
}: PropsInvento & { invento: NombreInvento }) {
  const caja = useRef<HTMLDivElement>(null);
  const [cargado, setCargado] = useState<Cargado | null>(null);
  const [sinMarcador, setSinMarcador] = useState(false);

  useEffect(() => {
    const el = caja.current;
    if (!el) return;
    let vivo = true;
    const cargar = () =>
      Promise.all([import("./inventos/Invento"), cargarInvento(invento, idioma)])
        .then(([m, datos]) => vivo && setCargado({ Base: m.default, datos }))
        .catch(() => {}); // si falla la red, se queda el marcador
    const vista = new IntersectionObserver(
      (entradas) => {
        if (!entradas.some((e) => e.isIntersecting)) return;
        vista.disconnect();
        void cargar();
      },
      { rootMargin: "100% 0px" },
    );
    vista.observe(el);
    return () => {
      vivo = false;
      vista.disconnect();
    };
  }, [invento, idioma]);

  // el marcador se va cuando termina el fundido (para no dejar dos veces la misma foto con su alt)
  useEffect(() => {
    if (!cargado) return;
    const t = window.setTimeout(() => setSinMarcador(true), 400);
    return () => window.clearTimeout(t);
  }, [cargado]);

  return (
    <div
      ref={caja}
      className={`${css.perezoso} ${cargado ? css.listo : ""} ${className ?? ""}`}
      style={{ aspectRatio: `${LIENZO.ancho} / ${LIENZO.alto}` }}
      data-invento-perezoso={invento}
      // la línea viva rodea el invento entero (todo su lienzo), no solo lo que ya se dibujó
      data-obstaculo=""
    >
      {!sinMarcador &&
        (foto ? (
          // eslint-disable-next-line @next/next/no-img-element -- sitio estático (output: export): sin optimizador de imágenes
          <img className={css.marcador} src={foto.src} alt={foto.alt} width={1600} height={1000} loading="lazy" decoding="async" />
        ) : (
          <span className={css.recuadro} aria-hidden="true" />
        ))}
      {cargado && <cargado.Base datos={cargado.datos} idioma={idioma} foto={foto} hueco={huecoDe(invento)} />}
    </div>
  );
}
