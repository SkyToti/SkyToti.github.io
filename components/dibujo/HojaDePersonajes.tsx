// Hoja de personajes: Haku en seis poses y el agente en cinco, con el kit real (cada pose es su propia ilustración).
import Dibujo from "./Dibujo";
import { DIBUJOS, type NombreDibujo } from "./datos";
import css from "./dibujo.module.css";

const HAKU: [NombreDibujo, string][] = [
  ["haku-sentado", "sentado de frente"],
  ["haku-mirando", "mirando hacia arriba"],
  ["haku-caminando", "caminando de perfil"],
  ["haku-saltando", "saltando"],
  ["haku-empujando", "empujando el sobre desde la orilla"],
  ["haku-dormido", "hecho rosca, dormido"],
];
const AGENTE: [NombreDibujo, string][] = [
  ["agente-parado", "parado"],
  ["agente-caminando", "caminando"],
  ["agente-cargando", "cargando un bloque"],
  ["agente-martillando", "martillando"],
  ["agente-diadema", "con diadema de telefonista"],
];

function Pose({ nombre, rotulo, n }: { nombre: NombreDibujo; rotulo: string; n: number }) {
  return (
    <figure className={css.pose} data-pose={nombre}>
      <figcaption>
        <b>{n}</b> · {rotulo}
      </figcaption>
      <Dibujo nombre={nombre} vivo titulo={DIBUJOS[nombre].titulo} />
    </figure>
  );
}

export default function HojaDePersonajes() {
  return (
    <div style={{ display: "grid", gap: "2.5rem" }}>
      <section aria-label="Haku">
        <h3 style={{ margin: "0 0 1rem" }}>Haku · lynx point</h3>
        <div className={css.hoja}>
          {HAKU.map(([nombre, rotulo], i) => (
            <Pose key={nombre} nombre={nombre} rotulo={rotulo} n={i + 1} />
          ))}
        </div>
      </section>
      <section aria-label="El agente">
        <h3 style={{ margin: "0 0 1rem" }}>El agente · cabeza de foco</h3>
        <div className={`${css.hoja} ${css.hojaAgente}`}>
          {AGENTE.map(([nombre, rotulo], i) => (
            <Pose key={nombre} nombre={nombre} rotulo={rotulo} n={i + 1} />
          ))}
        </div>
      </section>
    </div>
  );
}
