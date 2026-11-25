/**
 * Iconos propios, todos del mismo trazo (1.25 sobre una retícula de 24), como los de la referencia:
 * de línea muy fina y dibujados para esta pieza. Sin familias de terceros (BRIEF.md §4).
 */
import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement> & { tam?: number };

function Base({ tam = 20, children, ...r }: P & { children: React.ReactNode }) {
  return (
    <svg
      width={tam}
      height={tam}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.25}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...r}
    >
      {children}
    </svg>
  );
}

/** Inicio: una muela (corona con cúspides y dos raíces) */
export const IconoMuela = (p: P) => (
  <Base {...p}>
    <path d="M7.2 4.6c1.5-.9 3-.5 4.8.4 1.8-.9 3.3-1.3 4.8-.4 1.9 1.1 2.2 3.6 1.5 6.1-.5 1.8-1.1 2.9-1.4 4.6-.4 2.3-.5 4.7-1.7 4.7-1.3 0-1.2-2.7-1.6-4.4-.2-.9-.6-1.4-1.6-1.4s-1.4.5-1.6 1.4c-.4 1.7-.3 4.4-1.6 4.4-1.2 0-1.3-2.4-1.7-4.7-.3-1.7-.9-2.8-1.4-4.6-.7-2.5-.4-5 1.5-6.1Z" />
    <path d="M9.3 7.4c.9.4 1.8.5 2.7.1" opacity=".7" />
  </Base>
);

/** Tu equipo: dos personas de línea */
export const IconoEquipo = (p: P) => (
  <Base {...p}>
    <circle cx="9" cy="8.5" r="3" />
    <path d="M3.8 19c.5-3.2 2.6-5 5.2-5s4.7 1.8 5.2 5" />
    <circle cx="16.3" cy="9.3" r="2.4" opacity=".75" />
    <path d="M15.6 14.1c2.3-.1 4.1 1.5 4.6 4.3" opacity=".75" />
  </Base>
);

/** Hoy: el día como un reloj */
export const IconoHoy = (p: P) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="8" />
    <path d="M12 7.3V12l3.2 2" />
  </Base>
);

export const IconoBuscar = (p: P) => (
  <Base {...p}>
    <circle cx="10.8" cy="10.8" r="6" />
    <path d="m15.3 15.3 4.2 4.2" />
  </Base>
);

/** ↗: abrir el detalle (solo eso significa, BRIEF.md §2.6) */
export const IconoAbrir = (p: P) => (
  <Base {...p}>
    <path d="M8 16 16 8M9.5 8H16v6.5" />
  </Base>
);

export const IconoChevron = (p: P) => (
  <Base {...p}>
    <path d="m7 10 5 5 5-5" />
  </Base>
);

export const IconoCerrar = (p: P) => (
  <Base {...p}>
    <path d="M7 7l10 10M17 7 7 17" />
  </Base>
);

export const IconoRegresar = (p: P) => (
  <Base {...p}>
    <path d="M19 12H5.5M11 6.5 5.5 12l5.5 5.5" />
  </Base>
);

/** Arcada: la marca de «Tu CRM»; trazos finos en herradura, como los dientes de una arcada vista desde arriba */
export const Arcada = ({ tam = 22, ...r }: P) => {
  const trazos = Array.from({ length: 13 }, (_, i) => {
    const a = Math.PI * (0.08 + (0.84 * i) / 12);
    const cx = 12 - Math.cos(a) * 7.2;
    const cy = 14.5 - Math.sin(a) * 8.6;
    const nx = -Math.cos(a) * 0.62;
    const ny = -Math.sin(a) * 0.74;
    const l = i === 6 ? 2.6 : 2.1 + 0.5 * Math.sin(a);
    return <path key={i} d={`M${(cx - nx * l * 0.5).toFixed(2)} ${(cy - ny * l * 0.5).toFixed(2)}L${(cx + nx * l).toFixed(2)} ${(cy + ny * l).toFixed(2)}`} />;
  });
  return (
    <svg width={tam} height={tam} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1} strokeLinecap="round" aria-hidden="true" {...r}>
      {trazos}
    </svg>
  );
};

/** Glifos de las llamadas: dibujos de dato, como los de la referencia */
export const GlifoCorona = (p: P) => (
  <Base tam={40} strokeWidth={1} {...p}>
    <path d="M5.5 10.2c.4-2.4 1.9-3.6 3.4-3.2 1 .3 1.6 1.1 3.1 1.1s2.1-.8 3.1-1.1c1.5-.4 3 .8 3.4 3.2.3 1.9-.2 3.6-.9 4.8H6.4c-.7-1.2-1.2-2.9-.9-4.8Z" />
    <path d="M6.4 15h11.2l-1.1 3.2H7.5L6.4 15Z" opacity=".6" />
    <path d="M9.4 18.2v1.6M14.6 18.2v1.6" opacity=".45" />
    <circle cx="12" cy="3.4" r=".7" />
    <path d="M12 4.1v2.3" opacity=".5" />
  </Base>
);

export const GlifoImplante = (p: P) => (
  <Base tam={40} strokeWidth={1} {...p}>
    <path d="M8 4.5h8l-.6 3H8.6L8 4.5Z" />
    <path d="M9.3 7.5v11.2l2.7 2.3 2.7-2.3V7.5" opacity=".75" />
    <path d="M9.3 9.4l5.4 1.2M9.3 11.8l5.4 1.2M9.3 14.2l5.4 1.2M9.3 16.6l5.4 1.2" opacity=".55" />
  </Base>
);

export const GlifoBrackets = (p: P) => (
  <Base tam={40} strokeWidth={1} {...p}>
    <path d="M6.5 5.5c1.6-.8 3.3-.6 5.5.3 2.2-.9 3.9-1.1 5.5-.3 1.5.8 1.8 2.8 1.2 5.2-.6 2.3-1.2 3.9-1.5 6.2-.3 1.9-.6 3.4-1.6 3.4-1.1 0-1.2-2.1-1.6-3.6-.2-.8-.8-1.3-2-1.3s-1.8.5-2 1.3c-.4 1.5-.5 3.6-1.6 3.6-1 0-1.3-1.5-1.6-3.4-.3-2.3-.9-3.9-1.5-6.2-.6-2.4-.3-4.4 1.2-5.2Z" opacity=".55" />
    <rect x="10" y="8.6" width="4" height="3.2" rx=".6" />
    <path d="M2.5 10.2h7.5M14 10.2h7.5" />
  </Base>
);

export const GlifoEscaneo = (p: P) => (
  <Base tam={40} strokeWidth={1} {...p}>
    <path d="M7 5.2c1.5-.8 3-.5 5 .3 2-.8 3.5-1.1 5-.3 1.5.8 1.8 2.8 1.2 5.2-.5 2-1.1 3.3-1.4 5.3-.3 2.2-.5 4-1.6 4-1.2 0-1.2-2.4-1.6-4-.2-.9-.7-1.4-1.6-1.4s-1.4.5-1.6 1.4c-.4 1.6-.4 4-1.6 4-1.1 0-1.3-1.8-1.6-4-.3-2-.9-3.3-1.4-5.3-.6-2.4-.3-4.4 1.2-5.2Z" opacity=".45" />
    <path d="M4.5 8.2h15M5 11.4h14M6 14.6h12" strokeDasharray="1.2 1.6" opacity=".7" />
    <path d="M3 12.9h18" />
  </Base>
);

/** Expedientes: una hoja con su esquina doblada y una muela pequeña */
export const IconoExpediente = (p: P) => (
  <Base {...p}>
    <path d="M6.5 3.8h7.6l3.9 3.9v12.5H6.5Z" />
    <path d="M14.1 3.8v3.9H18" opacity=".7" />
    <path d="M9.4 11.4c.8-.5 1.7-.3 2.6.1.9-.4 1.8-.6 2.6-.1 1 .6 1.1 1.9.7 3.1-.3.9-.5 1.6-.7 2.5-.2 1-.3 1.6-.8 1.6s-.6-1-.8-1.7c-.1-.4-.4-.7-1-.7s-.9.3-1 .7c-.2.7-.3 1.7-.8 1.7s-.6-.6-.8-1.6c-.2-.9-.4-1.6-.7-2.5-.4-1.2-.3-2.5.7-3.1Z" opacity=".85" />
  </Base>
);
