// Banco de la tanda 6 · «El tráfico»: seis bloques de relleno de 80svh con un cruce distinto entre cada par, y el
// ambiente (retícula + marcas a mano) detrás de todo. No se enlaza, no va en el sitemap, no se indexa.
import type { Metadata } from "next";
import Ambiente from "@/components/mundo/trafico/Ambiente";
import Cruce, { type TipoCruce } from "@/components/mundo/trafico/Cruce";

export const metadata: Metadata = {
  title: "Banco de dibujo · El tráfico",
  robots: { index: false, follow: false },
};

const relleno = {
  minHeight: "80svh",
  display: "grid",
  placeItems: "center",
  alignContent: "center",
  gap: "0.75rem",
  padding: "0 clamp(20px, 4vw, 64px)",
  color: "#a7a698",
  fontFamily: "var(--letra-mono, ui-monospace, monospace)",
  fontSize: "0.8125rem",
  letterSpacing: "0.06em",
  textAlign: "center",
} as const;

const CRUCES: { tipo: TipoCruce; numero?: string }[] = [
  { tipo: "carrito", numero: "02" },
  { tipo: "avion" },
  { tipo: "viga" },
  { tipo: "moneda" },
  { tipo: "nubes" },
];

export default function BancoTanda6() {
  return (
    <>
      <Ambiente />
      <main id="contenido">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i}>
            <section data-banco={`bloque-${i + 1}`} style={relleno}>
              <p style={{ margin: 0 }}>BANCO · TANDA 6 · EL TRÁFICO · BLOQUE {i + 1} DE 6</p>
              <p style={{ margin: 0, maxWidth: "34rem", color: "#ede6d6", fontFamily: "var(--letra-texto)", letterSpacing: 0, fontSize: "1.0625rem" }}>
                Un párrafo de relleno para comprobar que el ambiente no le baja el contraste al texto: las marcas viven en
                las orillas y la retícula es la del sitio.
              </p>
            </section>
            {CRUCES[i] && <Cruce tipo={CRUCES[i].tipo} numero={CRUCES[i].numero} />}
          </div>
        ))}
      </main>
    </>
  );
}
