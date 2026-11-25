// Banco del kit de dibujo («Riso con mano de marcador»): la portada final en sus dos composiciones y la hoja de
// personajes, con el kit real. No se enlaza desde ningún lado, no va en el sitemap y no se indexa.
import type { Metadata } from "next";
import Dibujo from "@/components/dibujo/Dibujo";
import EscritorioDeNoche from "@/components/dibujo/EscritorioDeNoche";
import HojaDePersonajes from "@/components/dibujo/HojaDePersonajes";

export const metadata: Metadata = {
  title: "Banco de dibujo",
  robots: { index: false, follow: false },
};

const etiqueta = { fontFamily: "var(--letra-mono, ui-monospace, monospace)", fontSize: "0.8125rem", letterSpacing: "0.06em" } as const;

export default function BancoDeDibujo() {
  return (
    <main id="contenido" style={{ maxWidth: 1320, margin: "0 auto", padding: "4rem clamp(20px, 4vw, 64px)", display: "grid", gap: "5rem" }}>
      <h1 style={{ fontSize: "2rem" }}>Banco de dibujo</h1>

      <section aria-labelledby="b-portada" style={{ display: "grid", gap: "1.25rem" }}>
        <h2 id="b-portada" style={{ fontSize: "1.5rem" }}>Portada · El escritorio de noche</h2>
        <p style={etiqueta}>7 DE 12 COLUMNAS · CAMBIA A LA VERTICAL BAJO 560 PX</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 24, alignItems: "center" }}>
          <div style={{ flex: "5 1 260px", maxWidth: "34ch" }}>
            <p style={{ fontSize: "1.0625rem" }}>Aquí va el texto de la portada. El dibujo acompaña: se lee todo sin esperarlo.</p>
          </div>
          <div data-banco="portada" style={{ flex: "7 1 340px", minWidth: 0 }}>
            <EscritorioDeNoche />
          </div>
        </div>
      </section>

      <section aria-labelledby="b-comp" style={{ display: "grid", gap: "1.25rem" }}>
        <h2 id="b-comp" style={{ fontSize: "1.5rem" }}>Las dos composiciones</h2>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 32, alignItems: "end" }}>
          <div data-banco="portada-h" style={{ flex: "1 1 520px", maxWidth: 900 }}>
            <p style={etiqueta}>ANCHA · 900×640</p>
            <Dibujo nombre="escritorio-h" vivo controles />
          </div>
          <div data-banco="portada-v" style={{ flex: "0 1 360px" }}>
            <p style={etiqueta}>VERTICAL · 360×440</p>
            <Dibujo nombre="escritorio-v" vivo controles />
          </div>
        </div>
      </section>

      <section aria-labelledby="b-hoja" data-banco="personajes" style={{ display: "grid", gap: "1.25rem" }}>
        <h2 id="b-hoja" style={{ fontSize: "1.5rem" }}>Hoja de personajes</h2>
        <HojaDePersonajes />
      </section>
    </main>
  );
}
