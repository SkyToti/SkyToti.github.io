// Banco de la tanda 1 de inventos (conmutador, muela-mapa, folioscopio, bóveda, mesa de los seis), con el kit real.
// No se enlaza desde ningún lado, no va en el sitemap y no se indexa.
import type { Metadata } from "next";
import Boveda from "@/components/mundo/inventos/Boveda";
import Conmutador from "@/components/mundo/inventos/Conmutador";
import Folioscopio from "@/components/mundo/inventos/Folioscopio";
import MesaDeLosSeis from "@/components/mundo/inventos/MesaDeLosSeis";
import MuelaMapa from "@/components/mundo/inventos/MuelaMapa";

export const metadata: Metadata = {
  title: "Banco de inventos · tanda 1",
  robots: { index: false, follow: false },
};

const etiqueta = { fontFamily: "var(--letra-mono, ui-monospace, monospace)", fontSize: "0.8125rem", letterSpacing: "0.06em" } as const;
const caja = { display: "grid", gap: "0.75rem", maxWidth: 720 } as const;

export default function BancoTanda1() {
  return (
    <main id="contenido" style={{ maxWidth: 1320, margin: "0 auto", padding: "4rem clamp(20px, 4vw, 64px)", display: "grid", gap: "4rem" }}>
      <h1 style={{ fontSize: "2rem" }}>Banco de inventos · tanda 1</h1>

      <section data-banco="conmutador" style={caja}>
        <p style={etiqueta}>1 · EL CONMUTADOR DE NOCHE · RECEPCIONISTA CON IA · CON FOTO</p>
        <Conmutador foto={{ src: "/medios/recepcionista-ia/portada.webp", alt: "Portada de la recepcionista con IA" }} />
      </section>

      <section data-banco="muela-mapa" style={caja}>
        <p style={etiqueta}>2 · LA MUELA-MAPA · CRM DENTAL · CON FOTO</p>
        <MuelaMapa foto={{ src: "/medios/crm-dental/tablero-1280.webp", alt: "Tablero del CRM dental" }} />
      </section>

      <section data-banco="folioscopio" style={caja}>
        <p style={etiqueta}>3 · EL FOLIOSCOPIO · YACONTESTO.COM · CON FOTO</p>
        <Folioscopio foto={{ src: "/medios/yacontesto-web/recorrido.jpg", alt: "Recorrido por yacontesto.com" }} />
      </section>

      <section data-banco="boveda" style={caja}>
        <p style={etiqueta}>4 · LA BÓVEDA CON VENTANILLA · MINECRAFT-RCON-MCP · SIN FOTO</p>
        <Boveda />
      </section>

      <section data-banco="mesa-de-los-seis" style={caja}>
        <p style={etiqueta}>5 · LA MESA DE LOS SEIS · TALLER-CLAUDE · SIN FOTO</p>
        <MesaDeLosSeis />
      </section>

      <section data-banco="ingles" style={{ display: "grid", gap: "1.5rem" }}>
        <h2 style={{ fontSize: "1.5rem" }}>Rótulos en inglés</h2>
        <div data-banco="conmutador-en" style={caja}><Conmutador idioma="en" /></div>
        <div data-banco="muela-mapa-en" style={caja}><MuelaMapa idioma="en" /></div>
        <div data-banco="boveda-en" style={caja}><Boveda idioma="en" /></div>
      </section>
    </main>
  );
}
