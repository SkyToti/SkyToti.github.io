// Banco de la tanda 3 del kit: las estaciones de cierre (repisa, buzón, pie, sello, monograma) y las pruebas del
// contrato nuevo (ids por instancia, despertar con la chispa, tocar). No se enlaza ni se indexa.
// Los textos de la repisa son SOLO de este banco (salen de contenido/perfil.es.md y del CV); en el sitio los pasa
// la página.
import type { Metadata } from "next";
import Dibujo from "@/components/dibujo/Dibujo";
import Repisa, { type DatoRepisa } from "@/components/mundo/estaciones/Repisa";
import Buzon from "@/components/mundo/estaciones/Buzon";
import PieHaku from "@/components/mundo/estaciones/PieHaku";
import Sello from "@/components/mundo/estaciones/Sello";
import Monograma from "@/components/mundo/estaciones/Monograma";
import { CopiarCorreo, LlegaLaChispa } from "./Avisos";

export const metadata: Metadata = {
  title: "Banco de la tanda 3",
  robots: { index: false, follow: false },
};

const DATOS: DatoRepisa[] = [
  { clave: "ventas", titulo: "Unos 10 años en ventas", texto: "Antes de programar pasé unos 10 años en ventas y atención a clientes. Sé escuchar lo que alguien necesita y explicarlo sin rodeos." },
  { clave: "estudios", titulo: "Dos ingenierías en línea", texto: "Desarrollo de Software e Inteligencia Artificial, en línea y en paralelo." },
  { clave: "noche", titulo: "Trabajo de noche", texto: "Cuando la casa duerme, el código avanza." },
  { clave: "lugar", titulo: "Cuernavaca, Morelos", texto: "Remoto, híbrido o presencial (Cuernavaca / CDMX)." },
  { clave: "idiomas", titulo: "Idiomas", texto: "Español nativo · Inglés intermedio." },
  { clave: "haku", titulo: "Haku", texto: "Mi gato. Supervisa cada despliegue." },
];

const etiqueta = { fontFamily: "var(--letra-mono, ui-monospace, monospace)", fontSize: "0.8125rem", letterSpacing: "0.06em" } as const;
const seccion = { display: "grid", gap: "1.25rem" } as const;

export default function BancoTanda3() {
  return (
    <main id="contenido" style={{ maxWidth: 1180, margin: "0 auto", padding: "3rem clamp(20px, 4vw, 64px) 6rem", display: "grid", gap: "5rem" }}>
      <header style={{ display: "flex", alignItems: "center", gap: 16 }} data-banco="cabecera">
        <Monograma href="/" etiqueta="Diego Benítez · inicio" />
        <h1 style={{ fontSize: "1.75rem", margin: 0 }}>Banco de la tanda 3</h1>
      </header>

      <section aria-labelledby="t-pie" style={seccion}>
        <h2 id="t-pie" style={{ fontSize: "1.5rem" }}>8 · Pie</h2>
        <p style={etiqueta}>420×200 · TOCA A HAKU (O TAB + ENTER)</p>
        <div data-estacion="pie" data-banco="pie" style={{ maxWidth: 420 }}>
          <PieHaku idioma="es" />
        </div>
      </section>

      <section aria-labelledby="t-sello" style={seccion}>
        <h2 id="t-sello" style={{ fontSize: "1.5rem" }}>2 · El sello (La pizarra)</h2>
        <p style={etiqueta}>160×160 · ES Y EN</p>
        <div data-estacion="pizarra" data-banco="sello" style={{ display: "flex", gap: 32 }}>
          <div style={{ width: 160 }}><Sello idioma="es" /></div>
          <div style={{ width: 160 }}><Sello idioma="en" /></div>
        </div>
      </section>

      <section aria-labelledby="t-ids" style={seccion} data-banco="ids">
        <h2 id="t-ids" style={{ fontSize: "1.5rem" }}>Ids por instancia</h2>
        <p style={etiqueta}>EL MISMO DIBUJO TRES VECES; EL PRIMERO OCULTO. LOS OTROS DOS CONSERVAN SU TRAMA</p>
        <div hidden><Dibujo nombre="repisa-globo" /></div>
        <div style={{ display: "flex", gap: 24 }}>
          <div style={{ width: 140 }}><Dibujo nombre="repisa-globo" /></div>
          <div style={{ width: 140 }}><Dibujo nombre="repisa-globo" /></div>
          <div style={{ width: 140 }}><Dibujo nombre="sello-es" /></div>
        </div>
      </section>

      <section aria-labelledby="t-repisa" style={seccion}>
        <h2 id="t-repisa" style={{ fontSize: "1.5rem" }}>6 · La repisa (Sobre mí)</h2>
        <p style={etiqueta}>ANCHA 900×360 · VERTICAL 360×520 BAJO 600 PX · ESPERA LA CHISPA (O 1.2 S A LA VISTA)</p>
        <div><LlegaLaChispa estacion="repisa" /></div>
        <div data-estacion="repisa" data-banco="repisa" style={{ paddingTop: "7rem" }}>
          <Repisa idioma="es" datos={DATOS} />
        </div>
      </section>

      <section aria-labelledby="t-buzon" style={seccion}>
        <h2 id="t-buzon" style={{ fontSize: "1.5rem" }}>7 · El buzón (Contacto)</h2>
        <p style={etiqueta}>640×420 · SIN CHISPA: ARRANCA SOLO A LOS 1.2 S A LA VISTA</p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}><LlegaLaChispa estacion="buzon" /><CopiarCorreo /></div>
        <div data-estacion="buzon" data-banco="buzon" style={{ maxWidth: 640 }}>
          <Buzon idioma="es" />
        </div>
      </section>
    </main>
  );
}
