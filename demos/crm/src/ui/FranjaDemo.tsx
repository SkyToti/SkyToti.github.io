import { useEffect, useState } from "react";
import "./franja-demo.css";

const CLAVE = "demo-crm-franja-cerrada";

/**
 * La franja de la demo: dice que es una demo de diseño con datos de ejemplo y lleva de regreso al portafolio.
 * Fija y discreta, por debajo de las pantallas completas (nunca tapa sus controles) y se esconde mientras corre
 * el recorrido guiado, que trae su propia salida. Se puede cerrar; vuelve al abrir otra pestaña.
 */
export default function FranjaDemo() {
  const [abierta, setAbierta] = useState(() => {
    try {
      return sessionStorage.getItem(CLAVE) !== "1";
    } catch {
      return true;
    }
  });

  useEffect(() => {
    const raiz = document.documentElement;
    if (abierta) raiz.dataset.franjaDemo = "";
    else delete raiz.dataset.franjaDemo;
  }, [abierta]);

  if (!abierta) return null;
  return (
    <aside className="franja-demo" aria-label="Aviso de demo">
      <span>Demo de diseño · datos de ejemplo</span>
      <span aria-hidden="true">·</span>
      <a href="/trabajo/crm-dental/">← Volver al portafolio</a>
      <button
        type="button"
        aria-label="Cerrar el aviso de demo"
        onClick={() => {
          try {
            sessionStorage.setItem(CLAVE, "1");
          } catch {
            /* sin almacenamiento: se cierra solo en esta vista */
          }
          setAbierta(false);
        }}
      >
        ×
      </button>
    </aside>
  );
}
