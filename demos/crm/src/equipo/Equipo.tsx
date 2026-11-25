import { m as motion} from "motion/react";
import { CRECER } from "../motor/movimiento";
import { DOCTORES, DIAS, doctoresEn, type Doctor, type UnidadId } from "../datos";
import { FAMILIAS, fondo, type FamiliaId } from "../color";
import type { Vista } from "../vista";
import { granoURL, useMedida } from "../ui/medida";
import Retrato from "./Retrato";

const DIA_HOY = ["dom", "lun", "mar", "mie", "jue", "vie", "sab"] as const;
export const NOMBRE_UNIDAD: Record<UnidadId, string> = {
  centro: "Centro",
  norte: "Norte",
  sur: "Sur",
  imagen: "Imagen Dental",
  especialidades: "Especialidades",
};
export const familiaDe = (u: UnidadId): FamiliaId => (u === "norte" || u === "sur" ? "sucursal" : u === "imagen" ? "imagen" : u === "especialidades" ? "especialidades" : "centro");

/** Quiénes se ven en cada unidad */
export function equipoDe(v: Vista): Doctor[] {
  if (v.id === "centro") return doctoresEn("centro");
  if (v.id === "sucursal") return DOCTORES.filter((d) => doctoresEn("norte").includes(d) || doctoresEn("sur").includes(d));
  return DOCTORES;
}

function TarjetaDoctor({ d, ahora, alAbrir, ancho }: { d: Doctor; ahora: Date; alAbrir: () => void; ancho?: boolean }) {
  const [ref, m] = useMedida<HTMLButtonElement>();
  const fam = FAMILIAS[familiaDe(d.unidad)];
  const hoy = DIA_HOY[ahora.getDay()];
  const dondeHoy = hoy === "dom" ? undefined : d.agenda[hoy];
  return (
    <motion.button
      ref={ref}
      layoutId={`doctor-${d.id}`}
      transition={{ layout: CRECER }}
      type="button"
      className="doctor"
      data-doctor={d.id}
      data-ancho={ancho || undefined}
      data-tinta={fam.tinta}
      onClick={alAbrir}
      aria-label={`${d.nombre}, ${d.especialidad}. Abrir su perfil`}
    >
      <span className="tesela-fondo" style={{ backgroundImage: m.w ? fondo(ancho ? "whatsapp" : "rotan", fam, m.w * 1.2, m.h * 1.2, "detalle") : undefined }} aria-hidden="true" />
      <span className="tesela-grano" style={{ backgroundImage: `url(${granoURL()})` }} aria-hidden="true" />
      <Retrato iniciales={d.iniciales} rota={d.rota} tam={ancho ? 64 : 52} dondeHoy={dondeHoy ? ["centro", "norte", "sur"].indexOf(dondeHoy) : 0} />
      <span className="doctor-nombre">{d.nombre}</span>
      <span className="doctor-especialidad">{d.especialidad}</span>
      <span className="doctor-semana" aria-label={`Atiende ${DIAS.filter((x) => d.agenda[x.id]).map((x) => x.largo).join(", ")}`}>
        {DIAS.map((x) => (
          <span key={x.id} className="doctor-dia" data-trabaja={d.agenda[x.id] ? "" : undefined} data-hoy={x.id === hoy || undefined}>
            {x.corto[0]}
          </span>
        ))}
      </span>
      <span className="doctor-hoy">{hoy === "dom" ? "Hoy no hay consulta" : dondeHoy ? `Hoy: ${NOMBRE_UNIDAD[dondeHoy]}` : "Hoy no atiende"}</span>
    </motion.button>
  );
}

/** Tu equipo (BRIEF.md §3.4): los doctores ficticios de datos.ts, con retrato de línea y su semana de ejemplo */
export default function Equipo({ vista, ahora, alAbrir }: { vista: Vista; ahora: Date; alAbrir: (id: string) => void }) {
  const lista = equipoDe(vista);
  return (
    <section className="equipo" aria-label="Tu equipo">
      <header className="equipo-cabeza">
        <h2 className="equipo-titulo">Tu equipo</h2>
        <p className="equipo-sub">
          {lista.length} doctores {vista.id === "todo" ? "en tus clínicas" : `en ${vista.corto}`} · nombres ficticios, agendas de ejemplo
        </p>
      </header>
      <div className="equipo-rejilla">
        {lista.map((d, i) => (
          <TarjetaDoctor key={d.id} d={d} ahora={ahora} alAbrir={() => alAbrir(d.id)} ancho={(i === 0 && !!d.rota) || (i === lista.length - 1 && (lista.length - (lista[0]?.rota ? 1 : 0)) % 2 === 1)} />
        ))}
      </div>
    </section>
  );
}
