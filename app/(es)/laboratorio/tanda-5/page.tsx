// Banco de la tanda 5 · «Haku, el guía»: la hoja con todos los ciclos (cada uno en bucle, con pausa) y una página
// larga con cinco estaciones falsas de 100svh (data-lado alternado; la última es «pie») donde una chispa falsa
// despacha `estacion:llega` al pasar, para ver a Haku guiar. Frases de relleno a propósito (las reales las pone el
// orquestador). No se enlaza, no va en el sitemap, no se indexa.
import type { Metadata } from "next";
import BancoEstaciones from "@/components/mundo/guia/BancoEstaciones";
import HakuGuia from "@/components/mundo/guia/HakuGuia";
import HojaCiclos from "@/components/mundo/guia/HojaCiclos";

export const metadata: Metadata = {
  title: "Banco de dibujo · Haku, el guía",
  robots: { index: false, follow: false },
};

const FRASES: Record<string, string[]> = {
  "banco-uno": ["frase de prueba 1 (uno)", "frase de prueba 2 (uno)"],
  "banco-dos": ["frase de prueba 1 (dos)"],
  "banco-tres": ["frase de prueba 1 (tres)", "frase de prueba 2 (tres)", "frase de prueba 3 (tres)"],
  "banco-cuatro": ["frase de prueba 1 (cuatro): una más larga para ver cómo se parte el globo en dos o tres renglones"],
  pie: ["frase de prueba (pie)"],
};
const REPUESTO = ["frase de repuesto A", "frase de repuesto B"];

const ESTACIONES = [
  { nombre: "banco-uno", lado: "der" },
  { nombre: "banco-dos", lado: "izq" },
  { nombre: "banco-tres", lado: "der" },
  { nombre: "banco-cuatro", lado: "izq" },
  { nombre: "pie", lado: undefined },
] as const;

const mono = { fontFamily: "var(--letra-mono, ui-monospace, monospace)", fontSize: "0.8125rem", letterSpacing: "0.06em", color: "#a7a698" } as const;

export default function BancoTanda5() {
  return (
    <main id="contenido" style={{ paddingTop: 96 }}>
      <section aria-labelledby="b-hoja" style={{ maxWidth: 1320, margin: "0 auto", padding: "0 clamp(16px, 4vw, 64px) 64px" }}>
        <h1 id="b-hoja" style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>
          Haku · ciclos cuadro a cuadro
        </h1>
        <p style={{ ...mono, marginBottom: "1.5rem" }}>BANCO · TANDA 5 · lienzo 160×120, piso y pivote comunes, un trazo por cuadro</p>
        <HojaCiclos />
      </section>
      {ESTACIONES.map((e, i) => (
        <section
          key={e.nombre}
          data-estacion={e.nombre}
          data-banco-estacion=""
          {...(e.lado ? { "data-lado": e.lado } : {})}
          style={{
            position: "relative",
            minHeight: "100svh",
            display: "flex",
            alignItems: "center",
            justifyContent: e.lado === "izq" ? "flex-start" : e.lado === "der" ? "flex-end" : "center",
            padding: "0 clamp(16px, 6vw, 96px)",
            borderTop: "1px dashed #2a3854",
          }}
        >
          <div style={{ width: "min(34rem, 80%)", aspectRatio: "16 / 10", border: "2px solid #2a3854", borderRadius: 8, display: "grid", placeItems: "center", ...mono }}>
            <p>
              ESTACIÓN {i + 1} · {e.nombre} · contenido a la {e.lado ?? "mitad"}
            </p>
          </div>
          {i === 1 ? (
            <a href="#contenido" style={{ position: "absolute", left: "38%", bottom: 40, ...mono, color: "#f5b455" }} data-banco="boton-abajo">
              un botón cerca del piso (el globo no lo tapa)
            </a>
          ) : null}
        </section>
      ))}
      <BancoEstaciones />
      <HakuGuia idioma="es" frases={FRASES} repuesto={REPUESTO} />
    </main>
  );
}
