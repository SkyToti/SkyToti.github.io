import Tesela from "./Tesela";
import { ArcosImagen, ArcosSillon, Elipsoide, Embudo, Helice, PuntosEnLinea, RelojDeArena } from "../graficos/graficos";
import { DIAS_WHATSAPP, type Vista } from "../vista";
import type { FamiliaId, TeselaId } from "../color";
import { useSuave } from "../motor/suave";
import { DOCTORES } from "../datos";

interface Props {
  vista: Vista;
  ahora: Date;
  alAbrir: (id: TeselaId) => void;
  /** qué mosaico está abierto en su detalle (deja su hueco en la rejilla) */
  abierto: TeselaId | null;
  estreno?: boolean;
}

const MAX_TURNOS = 7;
const DIAS = ["dom", "lun", "mar", "mie", "jue", "vie", "sab"] as const;
const CLINICAS = ["centro", "norte", "sur"];
const NOMBRE_CLINICA = ["Centro", "Norte", "Sur"];

/** Dónde está hoy el doctor que rota, según su agenda DE EJEMPLO y el día real (-1: hoy no hay consulta) */
export function dondeRota(ahora: Date): number {
  const dia = DIAS[ahora.getDay()];
  if (dia === "dom") return -1;
  const u = DOCTORES.find((d) => d.rota)?.agenda[dia];
  return u ? CLINICAS.indexOf(u) : -1;
}

/** Quién está en el sillón ahora (o qué sigue), para el estado del mosaico de sillones */
export function estadoSillon(turnos: { fin: number; quien: string }[], ahora: Date): string {
  if (ahora.getDay() === 0) return "Hoy no hay consulta";
  const h = ahora.getHours() + ahora.getMinutes() / 60;
  if (h < 8) return "Abre a las 8:00";
  const turno = turnos.find((t) => t.fin > h);
  if (!turno) return "Cerrado";
  if (turno.quien) return `Ahora: ${turno.quien.toLowerCase()}`;
  return `Quedan ${turnos.filter((t) => t.fin > h).length}`;
}

/**
 * Las flechas mueven el foco entre mosaicos (BRIEF.md §3.4): va al mosaico más cercano en esa dirección,
 * midiendo en pantalla, así sirve igual en la rejilla del iPad que apilado en el teléfono.
 */
function moverConFlechas(e: React.KeyboardEvent) {
  const dir = { ArrowRight: [1, 0], ArrowLeft: [-1, 0], ArrowDown: [0, 1], ArrowUp: [0, -1] }[e.key];
  const actual = document.activeElement as HTMLElement | null;
  if (!dir || !actual?.matches(".tesela-abrir")) return;
  // en horizontal se comparan los bordes de arriba y en vertical los de la izquierda: como se lee
  const centro = (el: Element) => {
    const r = el.closest(".tesela")!.getBoundingClientRect();
    return dir[0] ? { x: r.left + r.width / 2, y: r.top } : { x: r.left, y: r.top + r.height / 2 };
  };
  const a = centro(actual);
  let mejor: HTMLElement | null = null;
  let menor = Infinity;
  for (const b of e.currentTarget.querySelectorAll<HTMLElement>(".tesela-abrir")) {
    if (b === actual) continue;
    const c = centro(b);
    const dx = c.x - a.x;
    const dy = c.y - a.y;
    const avance = dx * dir[0] + dy * dir[1];
    if (avance <= 4) continue;
    const costo = avance + 2 * Math.abs(dir[0] ? dy : dx);
    if (costo < menor) {
      menor = costo;
      mejor = b;
    }
  }
  if (mejor) {
    e.preventDefault();
    mejor.focus();
  }
}

/** El mosaico de la pantalla principal: siete mosaicos de tres tamaños, separados por canales blancos */
export default function Mosaico({ vista, ahora, alAbrir, abierto, estreno }: Props) {
  const t = vista.teselas;
  const fam = (id: TeselaId): FamiliaId => t[id].familia ?? (vista.familia === "mezcla" ? "centro" : vista.familia);
  const hora = ahora.getHours() + ahora.getMinutes() / 60;
  const dia = Math.min(30, ahora.getDate());

  // cada gráfico interpola sus números hacia la unidad nueva: las líneas cambian de forma sin saltos
  const gp = t.pacientes.g;
  const pac = useSuave({ arriba: gp.arriba, abajo: gp.abajo, limaU: gp.elegido === "arriba" ? 0 : gp.elegido === "ambos" ? 0.5 : 1 });
  const esc = useSuave(t.whatsapp.g.escala);
  const turnos = t.sillones.g.turnos;
  const fines = useSuave(Array.from({ length: MAX_TURNOS }, (_, i) => turnos[i]?.fin ?? 8));
  const rota = dondeRota(ahora);
  const elegidoRota = useSuave(Math.max(0, rota));
  const ordenes = useSuave(t.laboratorio.g.ordenes);
  const fuentesN = useSuave(t.imagen.g.fuentes.map((f) => f.n));

  const unidadEsfera = vista.id === "imagen" ? "estudios" : vista.id === "laboratorio" ? "órdenes" : "mil pacientes";
  const textoEsfera = (n: string, v: number) => (v < 0.1 ? `${n}: desde cero` : `${n}: ${Math.round(v)} ${unidadEsfera}`);
  const textosEsferas: [string, string] = [textoEsfera(gp.nombres[0], gp.arriba), textoEsfera(gp.nombres[1], gp.abajo)];
  const hueco = (id: TeselaId) => <div key={id} className="tesela-hueco" style={{ gridArea: id }} aria-hidden="true" />;
  const abrir = (id: TeselaId) => () => alAbrir(id);
  const comun = (id: TeselaId, i: number) => ({ datos: t[id], familia: fam(id), area: id, alAbrir: abrir(id), estreno, retraso: 0.12 + i * 0.09 });

  return (
    <section className="mosaico" aria-label={`Datos de ${vista.corto}`} onKeyDown={moverConFlechas}>
      {abierto === "pacientes" ? (
        hueco("pacientes")
      ) : (
        <Tesela
          {...comun("pacientes", 0)}
          grafico={(m) => <RelojDeArena {...m} arriba={pac.arriba} abajo={pac.abajo} elegido={gp.elegido} limaU={pac.limaU} nombres={gp.nombres} textos={textosEsferas} />}
        />
      )}
      {abierto === "whatsapp" ? (
        hueco("whatsapp")
      ) : (
        <Tesela
          {...comun("whatsapp", 1)}
          grafico={(m) => <Helice {...m} dias={DIAS_WHATSAPP.map((d) => d * esc)} hoy={dia} />}
        />
      )}
      {abierto === "sillones" ? (
        hueco("sillones")
      ) : (
        <Tesela
          {...comun("sillones", 2)}
          datos={{ ...t.sillones, estado: t.sillones.fantasma ? undefined : estadoSillon(turnos, ahora) }}
          grafico={(m) => (
            <ArcosSillon {...m} ahora={ahora.getDay() === 0 ? null : hora} turnos={fines.map((fin, i) => ({ fin, quien: turnos[i]?.quien ?? "" }))} />
          )}
        />
      )}
      {abierto === "rotan" ? (
        hueco("rotan")
      ) : (
        <Tesela
          {...comun("rotan", 3)}
          datos={{ ...t.rotan, sub: rota < 0 ? "Hoy no hay consulta" : `Varela hoy: ${NOMBRE_CLINICA[rota]}` }}
          grafico={(m) => <Elipsoide {...m} puntos={t.rotan.g.puntos} elegido={rota < 0 ? -1 : elegidoRota} />}
        />
      )}
      {abierto === "laboratorio" ? hueco("laboratorio") : <Tesela {...comun("laboratorio", 4)} grafico={(m) => <Embudo {...m} ordenes={ordenes} />} />}
      {abierto === "imagen" ? (
        hueco("imagen")
      ) : (
        <Tesela
          {...comun("imagen", 5)}
          grafico={(m) => <ArcosImagen {...m} elegido={t.imagen.g.elegido} fuentes={t.imagen.g.fuentes.map((f, i) => ({ ...f, n: fuentesN[i] ?? f.n }))} />}
        />
      )}
      {abierto === "expansion" ? hueco("expansion") : <Tesela {...comun("expansion", 6)} grafico={(m) => <PuntosEnLinea {...m} {...t.expansion.g} />} />}
    </section>
  );
}
