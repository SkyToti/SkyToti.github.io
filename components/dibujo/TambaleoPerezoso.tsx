"use client";
// <TambaleoPerezoso>: la puerta a <Tambaleo> sin meter Motion en la carga inicial. Mientras Motion llega (un trozo
// aparte que se pide al montar), pinta un <div> con el mismo lugar y los mismos hijos; si espera para caer (`cae`
// false) queda oculto solo con `html.mueve` (sin JS o con menos movimiento siempre se ve).
// `precargarTambaleo()` pide el trozo antes de necesitarlo (p. ej. el sello del buzón, que aparece de golpe).
import { useEffect, useState, type ComponentType } from "react";
import type { PropsTambaleo } from "./Tambaleo";
import css from "./dibujo.module.css";

let cargado: ComponentType<PropsTambaleo> | null = null;
let pedido: Promise<ComponentType<PropsTambaleo>> | null = null;

export function precargarTambaleo() {
  pedido ??= import("./Tambaleo").then((m) => (cargado = m.default));
  return pedido;
}

export default function TambaleoPerezoso(props: PropsTambaleo) {
  const [Motor, setMotor] = useState<ComponentType<PropsTambaleo> | null>(() => cargado);
  useEffect(() => {
    if (Motor) return;
    let vivo = true;
    precargarTambaleo().then((C) => { if (vivo) setMotor(() => C); });
    return () => { vivo = false; };
  }, [Motor]);
  if (Motor) return <Motor {...props} />;
  const { children, className, style, cae, datos } = props;
  return (
    <div {...datos} className={`${className ?? ""} ${cae === false ? css.esperaCaer : ""}`} style={style}>
      {children}
    </div>
  );
}
