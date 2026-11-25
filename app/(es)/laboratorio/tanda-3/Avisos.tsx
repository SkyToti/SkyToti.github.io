"use client";
// Botones del banco de la tanda 3: simulan lo que hará el sitio (la chispa que llega a una estación, el correo
// copiado). No van en ninguna página pública.
export function LlegaLaChispa({ estacion }: { estacion: string }) {
  return (
    <button
      type="button"
      data-llega={estacion}
      style={{ font: "500 0.8125rem/1 var(--letra-mono, ui-monospace, monospace)", padding: "8px 12px", border: "1px solid #5b6f96", borderRadius: 6, background: "transparent", color: "#ede6d6", cursor: "pointer" }}
      onClick={() => {
        const el = document.querySelector<HTMLElement>(`[data-estacion="${estacion}"]`);
        if (!el) return;
        el.classList.add("llego");
        el.dispatchEvent(new CustomEvent("estacion:llega", { bubbles: true }));
      }}
    >
      llega la chispa → {estacion}
    </button>
  );
}

export function CopiarCorreo() {
  return (
    <button
      type="button"
      data-copiar=""
      style={{ font: "500 0.8125rem/1 var(--letra-mono, ui-monospace, monospace)", padding: "8px 12px", border: "1px solid #f5b455", borderRadius: 6, background: "transparent", color: "#f5b455", cursor: "pointer" }}
      onClick={() => document.dispatchEvent(new CustomEvent("correo:copiado"))}
    >
      copiar correo (simulado)
    </button>
  );
}
