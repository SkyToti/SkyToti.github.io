"use client";
// Puerta de la línea viva: entra con import dinámico y sin SSR (no pesa en la carga inicial y, sin JavaScript,
// no se pinta nada). Se monta como primer hijo de <main>, que debe ser `relative isolate`.
import dynamic from "next/dynamic";

const LineaViva = dynamic(() => import("./LineaViva"), { ssr: false });

export default function Mundo() {
  return <LineaViva />;
}
