"use client";
// Botón «copiar» del correo. Confirma con un estado que el lector de pantalla anuncia (aria-live) y que se
// borra solo a los 3 s. Sin JavaScript el botón no hace nada, pero el correo está escrito y enlazado al lado.
import { useEffect, useRef, useState } from "react";

export default function CopiarCorreo({
  correo,
  copiar,
  copiado,
  noSeCopio,
}: {
  correo: string;
  copiar: string;
  copiado: string;
  noSeCopio: string;
}) {
  const [estado, setEstado] = useState<"" | "ok" | "error">("");
  const reloj = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(reloj.current), []);

  async function alPulsar() {
    try {
      await navigator.clipboard.writeText(correo);
      setEstado("ok");
    } catch {
      setEstado("error");
    }
    window.clearTimeout(reloj.current);
    reloj.current = window.setTimeout(() => setEstado(""), 3000);
  }

  return (
    <span className="inline-flex flex-wrap items-center gap-x-4 gap-y-2">
      <button type="button" onClick={alPulsar} className="boton min-w-28">
        <span aria-hidden="true" className="font-mono text-ambar">
          {estado === "ok" ? "✓" : "⧉"}
        </span>
        {copiar}
      </button>
      <span role="status" aria-live="polite" className="rotulo text-hueso">
        {estado === "ok" ? copiado : estado === "error" ? noSeCopio : ""}
      </span>
    </span>
  );
}
