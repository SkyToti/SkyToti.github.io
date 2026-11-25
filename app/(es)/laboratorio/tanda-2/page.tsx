// Banco de la tanda 2 de ilustraciones: cuatro inventos (La Elegía, La Isla, Tierra de Viajes, Punto de venta) y el
// cuaderno. Cada dibujo se pinta UNA vez (si se repite, el segundo pierde la trama). No se enlaza ni se indexa.
import type { Metadata } from "next";
import Torre from "@/components/mundo/inventos/Torre";
import IslaFlotante from "@/components/mundo/inventos/IslaFlotante";
import AvionDePapel from "@/components/mundo/inventos/AvionDePapel";
import ColmenaCaja from "@/components/mundo/inventos/ColmenaCaja";
import Cuaderno from "@/components/mundo/inventos/Cuaderno";

export const metadata: Metadata = {
  title: "Banco de dibujo · tanda 2",
  robots: { index: false, follow: false },
};

const etiqueta = { fontFamily: "var(--letra-mono, ui-monospace, monospace)", fontSize: "0.8125rem", letterSpacing: "0.06em" } as const;
const caja = { display: "grid", gap: "1rem", maxWidth: 720 } as const;

export default function BancoTanda2() {
  return (
    <main id="contenido" style={{ maxWidth: 1320, margin: "0 auto", padding: "4rem clamp(20px, 4vw, 64px)", display: "grid", gap: "5rem" }}>
      <h1 style={{ fontSize: "2rem" }}>Banco de dibujo · tanda 2</h1>

      <section aria-labelledby="t-torre" data-banco="torre" style={caja}>
        <h2 id="t-torre" style={{ fontSize: "1.5rem" }}>La Elegía · La torre</h2>
        <p style={etiqueta}>CON FOTO · ES</p>
        <Torre foto={{ src: "/medios/la-elegia/portada.webp", alt: "Portada de La Elegía de las 100 Notas" }} />
      </section>

      <section aria-labelledby="t-isla" data-banco="isla-flotante" style={caja}>
        <h2 id="t-isla" style={{ fontSize: "1.5rem" }}>La Isla · La isla flotante</h2>
        <p style={etiqueta}>CON FOTO · ES</p>
        <IslaFlotante foto={{ src: "/medios/la-isla/pantalla-de-inicio.webp", alt: "Pantalla de inicio de La Isla" }} />
      </section>

      <section aria-labelledby="t-avion" data-banco="avion-de-papel" style={caja}>
        <h2 id="t-avion" style={{ fontSize: "1.5rem" }}>Tierra de Viajes · El avión de papel</h2>
        <p style={etiqueta}>SIN FOTO · EN</p>
        <AvionDePapel idioma="en" />
      </section>

      <section aria-labelledby="t-colmena" data-banco="colmena-caja" style={caja}>
        <h2 id="t-colmena" style={{ fontSize: "1.5rem" }}>Punto de venta · La colmena-caja</h2>
        <p style={etiqueta}>CON FOTO · ES</p>
        <ColmenaCaja foto={{ src: "/medios/punto-de-venta/punto-de-venta.webp", alt: "Pantalla de venta del punto de venta" }} />
      </section>

      <section aria-labelledby="t-cuaderno" data-banco="cuaderno" style={caja}>
        <h2 id="t-cuaderno" style={{ fontSize: "1.5rem" }}>El cuaderno</h2>
        <p style={etiqueta}>ES</p>
        <Cuaderno />
      </section>
    </main>
  );
}
