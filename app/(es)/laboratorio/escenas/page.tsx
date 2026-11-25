// Banco de pruebas de las escenas del plano: todas en `completo` y en `mini`, en español y en inglés.
// No se enlaza desde ningún lado, no va en el sitemap y no se indexa. Lo recorre scripts/capturas-escenas.mjs.
import type { Metadata } from "next";
import { Escena } from "@/components/plano";
import { ESCENAS } from "@/escenas";
import { contenido, type Seccion } from "@/lib/contenido";
import type { Idioma } from "@/lib/idioma";

export const metadata: Metadata = {
  title: "Banco de escenas",
  robots: { index: false, follow: false },
};

const PASOS_CASO = ["como-funciona", "how-it-works"];
const PASOS_PERFIL = ["como-trabajo", "how-i-work"];

/** Los <li> de primer nivel de la lista de una sección, como HTML. */
function itemsDe(seccion: Seccion | undefined): { html: string }[] {
  if (!seccion) return [];
  return [...seccion.html.matchAll(/<li>([\s\S]*?)<\/li>/g)].map((m) => ({ html: m[1]!.trim() }));
}

function datos(idioma: Idioma) {
  const lector = contenido();
  const perfil = lector.perfil(idioma);
  const porEscena = new Map(lector.casos(idioma).flatMap((c) => (c.escena ? [[c.escena, c] as const] : [])));
  return Object.keys(ESCENAS).map((nombre) => {
    if (nombre === "firma")
      return {
        nombre,
        titulo: perfil.titular ?? perfil.nombre,
        resumen: perfil.titular ?? perfil.nombre,
        pasos: itemsDe(perfil.secciones.find((s) => PASOS_PERFIL.includes(s.id))),
      };
    const caso = porEscena.get(nombre);
    return {
      nombre,
      titulo: caso?.titulo ?? nombre,
      resumen: caso?.resumen ?? nombre,
      pasos: itemsDe(caso?.secciones.find((s) => PASOS_CASO.includes(s.id))),
    };
  });
}

function Banco({ idioma }: { idioma: Idioma }) {
  const lista = datos(idioma);
  return (
    <section lang={idioma === "en" ? "en" : undefined} aria-labelledby={`banco-${idioma}`} style={{ display: "grid", gap: "4rem" }}>
      <h2 id={`banco-${idioma}`} style={{ fontSize: "1.5rem" }}>
        {idioma === "es" ? "Español" : "English"}
      </h2>
      {lista.map((e) => (
        <article key={e.nombre} data-banco={`${idioma}-${e.nombre}-completo`} style={{ display: "grid", gap: "1rem" }}>
          <h3 style={{ fontFamily: "var(--letra-mono, ui-monospace, monospace)", fontSize: "0.8125rem", letterSpacing: "0.06em" }}>
            {e.nombre.toUpperCase()} — {e.titulo}
          </h3>
          <Escena nombre={e.nombre} idioma={idioma} modo="completo" resumen={e.resumen} pasos={e.pasos} />
        </article>
      ))}
      <h2 style={{ fontSize: "1.25rem" }}>mini</h2>
      <div style={{ display: "grid", gap: "3rem", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 420px), 1fr))" }}>
        {lista.map((e) => (
          <article key={e.nombre} data-banco={`${idioma}-${e.nombre}-mini`} style={{ display: "grid", gap: "0.75rem" }}>
            <h3 style={{ fontFamily: "var(--letra-mono, ui-monospace, monospace)", fontSize: "0.8125rem", letterSpacing: "0.06em" }}>
              {e.nombre.toUpperCase()}
            </h3>
            <Escena nombre={e.nombre} idioma={idioma} modo="mini" resumen={e.resumen} />
          </article>
        ))}
      </div>
    </section>
  );
}

export default function BancoDeEscenas() {
  return (
    <main id="contenido" style={{ maxWidth: 1320, margin: "0 auto", padding: "4rem clamp(20px, 4vw, 64px)", display: "grid", gap: "6rem" }}>
      <h1 style={{ fontSize: "2rem" }}>Banco de escenas</h1>
      <Banco idioma="es" />
      <Banco idioma="en" />
      {/* Un nombre que no existe no dibuja nada ni rompe el build. */}
      <Escena nombre="no-existe" idioma="es" resumen="—" />
    </main>
  );
}
