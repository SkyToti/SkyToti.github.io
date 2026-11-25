"use client";
// <HakuGuia>: la puerta del guía. No pesa en la carga inicial: espera al `load` y a que el navegador esté libre
// (requestIdleCallback) y solo entonces pide con next/dynamic (sin SSR) el motor y, desde ahí, los cuadros.
// Sin JavaScript no hay Haku (es decoración: sus frases no dicen nada que no esté ya en la página).
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import type { PropsGuia } from "./GuiaMotor";

const GuiaMotor = dynamic(() => import("./GuiaMotor"), { ssr: false });

export default function HakuGuia(props: PropsGuia) {
  const [listo, setListo] = useState(false);
  useEffect(() => {
    let idle: number | undefined;
    let reloj: ReturnType<typeof setTimeout> | undefined;
    const arrancar = () => {
      if ("requestIdleCallback" in window) idle = window.requestIdleCallback(() => setListo(true), { timeout: 3000 });
      else reloj = setTimeout(() => setListo(true), 1200);
    };
    if (document.readyState === "complete") arrancar();
    else addEventListener("load", arrancar, { once: true });
    return () => {
      removeEventListener("load", arrancar);
      if (idle !== undefined) window.cancelIdleCallback(idle);
      clearTimeout(reloj);
    };
  }, []);
  return listo ? <GuiaMotor {...props} /> : null;
}

export type { PropsGuia };
