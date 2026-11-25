// Banco de la tanda 4 · «La tira» (estación 4 del MUNDO): las cuatro viñetas con los pasos reales de
// contenido/perfil.es.md, entre dos bloques altos para poder hacer scroll. No se enlaza, no va en el sitemap, no se indexa.
import type { Metadata } from "next";
import Tira from "@/components/mundo/tira/Tira";
import { contenido, pasosDe, SECCIONES, seccionDe, textoPlano } from "@/lib/contenido";

export const metadata: Metadata = {
  title: "Banco de dibujo · La tira",
  robots: { index: false, follow: false },
};

const relleno = {
  minHeight: "120svh",
  display: "grid",
  placeItems: "center",
  color: "#a7a698",
  fontFamily: "var(--letra-mono, ui-monospace, monospace)",
  fontSize: "0.8125rem",
  letterSpacing: "0.06em",
} as const;

/** «<strong>Título.</strong> Texto» → { titulo, texto } */
function partir(html: string) {
  const m = html.match(/<strong>([\s\S]*?)<\/strong>([\s\S]*)/);
  return m ? { titulo: textoPlano(m[1]), texto: textoPlano(m[2]) } : { titulo: "", texto: textoPlano(html) };
}

export default function BancoTanda4() {
  const perfil = contenido().perfil("es");
  const pasos = pasosDe(seccionDe(perfil, SECCIONES.comoTrabajo)?.html).map((p) => partir(p.html));
  return (
    <main id="contenido">
      <div data-banco="antes" style={relleno}>
        <p>BANCO · TANDA 4 · LA TIRA ↓</p>
      </div>
      <section aria-labelledby="b-tira" data-banco="tira" style={{ maxWidth: 1320, margin: "0 auto", padding: "0 clamp(20px, 4vw, 64px)" }}>
        <h2 id="b-tira" style={{ fontSize: "1.5rem", marginBottom: "2rem" }}>
          Cómo trabajo
        </h2>
        <Tira idioma="es" pasos={pasos} />
      </section>
      <div data-banco="despues" style={relleno}>
        <p>FIN DE LA TIRA ↑</p>
      </div>
    </main>
  );
}
