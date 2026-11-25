import { useEffect, useState } from "react";

/** ¿Es un teléfono? (menos de 641 px de ancho): los detalles son hojas que suben desde abajo */
export function useTelefono(): boolean {
  const q = "(max-width: 640px)";
  const [si, setSi] = useState(() => typeof window !== "undefined" && window.matchMedia(q).matches);
  useEffect(() => {
    const m = window.matchMedia(q);
    const f = () => setSi(m.matches);
    m.addEventListener("change", f);
    return () => m.removeEventListener("change", f);
  }, []);
  return si;
}
