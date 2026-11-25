import { useRef, useState } from "react";
import { AnimatePresence, m as motion} from "motion/react";
import Pantalla from "../ui/PantallaCompleta";
import Odontograma from "../expedientes/Odontograma";
import { COLOR_CLINICO, NOMBRE_SUPERFICIE, nombrePieza, type Superficie } from "../expedientes/clinica";
import { PACIENTES as NOMBRES } from "../agenda/datos";
import { useMedida } from "../ui/medida";
import Radiografia from "./Radiografia";
import Chat from "./Chat";
import { ANTECEDENTES, ESTUDIOS_DIBUJADOS, MOTIVOS, tipoDeMarca, type Armado, type Lectura } from "./lectura";

interface Props {
  /** de dónde crece: la lista de expedientes o la fila de un estudio en Imagen Dental */
  layoutId: string;
  /** el id del expediente que se creará */
  id: string;
  inicial?: Partial<Armado>;
  /** para las capturas: abrir ya en el chat */
  faseInicial?: "armado" | "chat";
  alCerrar: () => void;
  alLlevar: (a: Armado, l: Lectura) => void;
}

type Pincel = "por-tratar" | "realizado" | "borrar";
const CARAS: Superficie[] = ["oclusal", "mesial", "distal", "vestibular", "palatina", "conducto"];
const UNIDADES: [Armado["unidad"], string][] = [
  ["centro", "Centro"],
  ["norte", "Norte"],
  ["imagen", "Imagen Dental"],
];

/**
 * Armar un expediente (BRIEF-4 §4.E): paciente ficticio, motivo, antecedentes, el odontograma inicial con el
 * pincel rojo (por tratar) o azul (realizado), los estudios de una bandeja de radiografías dibujadas y notas.
 * «Mandar a la IA» abre el pseudo-chat en la misma pantalla. Nada se guarda: vive en esta pestaña.
 */
export default function Armar({ layoutId, id, inicial, faseInicial = "armado", alCerrar, alLlevar }: Props) {
  const [a, setA] = useState<Armado>(() => ({ nombre: "", edad: 38, unidad: "centro", motivo: "", antecedentes: [], marcas: [], estudios: [], notas: "", ...inicial }));
  const [fase, setFase] = useState<"armado" | "chat">(faseInicial);
  const [pincel, setPincel] = useState<Pincel>("por-tratar");
  const [pieza, setPieza] = useState<number | null>(null);
  const [intento, setIntento] = useState(false);
  const [refO, mo] = useMedida<HTMLDivElement>();
  const nombre = useRef<HTMLInputElement>(null);
  const estudios = useRef<HTMLDivElement>(null);
  const cambia = (x: Partial<Armado>) => setA((v) => ({ ...v, ...x }));

  // el pincel: tocar lo que ya tiene ese color lo quita; «borrar» quita cualquier marca
  const marcar = (p: number, s: Superficie, ausente = false) =>
    setA((v) => {
      const sinPieza = v.marcas.filter((m) => m.pieza !== p);
      const propias = v.marcas.filter((m) => m.pieza === p);
      const falta = propias.find((m) => m.tipo === "ausente" || m.tipo === "extraccion");
      if (pincel === "borrar") return { ...v, marcas: [...sinPieza, ...propias.filter((m) => (ausente ? m !== falta : m.superficie !== s))] };
      const tipo = tipoDeMarca(s, pincel, ausente);
      if (ausente) {
        // una pieza que falta (o que se va a extraer) no tiene caras
        if (falta && falta.estado === pincel) return { ...v, marcas: sinPieza };
        return { ...v, marcas: [...sinPieza, { pieza: p, superficie: "raiz", estado: pincel, tipo }] };
      }
      const resto = propias.filter((m) => m !== falta && m.superficie !== s);
      const igual = propias.find((m) => m.superficie === s && m.estado === pincel);
      return { ...v, marcas: [...sinPieza, ...resto, ...(igual ? [] : [{ pieza: p, superficie: s, estado: pincel, tipo }])] };
    });

  const faltan = [!a.nombre.trim() && "el nombre del paciente", !a.estudios.length && "al menos un estudio"].filter(Boolean) as string[];
  const mandar = () => {
    if (faltan.length) {
      setIntento(true);
      if (!a.nombre.trim()) nombre.current?.focus();
      else estudios.current?.querySelector<HTMLElement>("button")?.focus();
      return;
    }
    setFase("chat");
  };
  const marcaDe = (p: number, s: Superficie) => a.marcas.find((m) => m.pieza === p && m.superficie === s);
  const faltaDe = (p: number) => a.marcas.find((m) => m.pieza === p && (m.tipo === "ausente" || m.tipo === "extraccion"));

  return (
    <Pantalla
      layoutId={layoutId}
      titulo={fase === "armado" ? "Armar un expediente" : `La IA lee el expediente de ${a.nombre.trim()}`}
      clase="armar"
      sub={fase === "armado" ? "Paciente ficticio · lo que armes vive solo en esta pestaña" : "Apoyo al diagnóstico por construir · guionado: no sale nada a internet"}
      alCerrar={alCerrar}
      alEsc={() => {
        if (fase === "chat") {
          setFase("armado");
          return true;
        }
        return false;
      }}
    >
      <AnimatePresence mode="wait" initial={false}>
        {fase === "armado" ? (
          <motion.div key="armado" className="arm-cuerpo" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
            <form
              className="arm-form"
              aria-label="Datos del paciente"
              onSubmit={(e) => {
                e.preventDefault();
                mandar();
              }}
            >
              <div className="arm-fila">
                <label className="agenda-campo arm-nombre">
                  <span>Paciente</span>
                  <input
                    ref={nombre}
                    list="arm-nombres"
                    value={a.nombre}
                    onChange={(e) => cambia({ nombre: e.target.value })}
                    placeholder="Nombre ficticio"
                    name="nombre-paciente"
                    autoComplete="off"
                    maxLength={32}
                    aria-invalid={(intento && !a.nombre.trim()) || undefined}
                  />
                  <datalist id="arm-nombres">
                    {NOMBRES.map((n) => (
                      <option key={n} value={n} />
                    ))}
                  </datalist>
                </label>
                <label className="agenda-campo arm-edad">
                  <span>Edad</span>
                  <input type="number" min={1} max={99} value={a.edad || ""} onChange={(e) => cambia({ edad: Number(e.target.value) })} name="edad" inputMode="numeric" />
                </label>
              </div>
              <fieldset className="nueva-unidad-grupo">
                <legend>Dónde se atiende</legend>
                <div className="nueva-unidad-opciones">
                  {UNIDADES.map(([u, n]) => (
                    <label key={u} className="nueva-unidad-opcion" data-elegida={a.unidad === u || undefined}>
                      <input type="radio" name="unidad-paciente" value={u} checked={a.unidad === u} onChange={() => cambia({ unidad: u })} />
                      {n}
                    </label>
                  ))}
                </div>
              </fieldset>
              <label className="agenda-campo">
                <span>Motivo de consulta</span>
                <input value={a.motivo} onChange={(e) => cambia({ motivo: e.target.value })} placeholder="Lo que cuenta el paciente" name="motivo" autoComplete="off" maxLength={60} />
              </label>
              <div className="arm-sugerencias" role="group" aria-label="Motivos frecuentes">
                {MOTIVOS.map((m) => (
                  <button key={m} type="button" className="arm-chip arm-chip-chico" aria-pressed={a.motivo === m} onClick={() => cambia({ motivo: m })}>
                    {m}
                  </button>
                ))}
              </div>
              <fieldset className="nueva-unidad-grupo">
                <legend>Antecedentes</legend>
                <div className="arm-sugerencias">
                  {ANTECEDENTES.map((x) => (
                    <button
                      key={x}
                      type="button"
                      className="arm-chip"
                      aria-pressed={a.antecedentes.includes(x)}
                      onClick={() => cambia({ antecedentes: a.antecedentes.includes(x) ? a.antecedentes.filter((y) => y !== x) : [...a.antecedentes, x] })}
                    >
                      {x}
                    </button>
                  ))}
                </div>
              </fieldset>
              <label className="agenda-campo">
                <span>Notas</span>
                <textarea value={a.notas} onChange={(e) => cambia({ notas: e.target.value })} placeholder="Lo que viste en la consulta" name="notas" rows={3} maxLength={280} />
              </label>
            </form>

            <div className="arm-lado">
              <section className="arm-odonto" aria-label="Odontograma inicial">
                <div className="arm-odonto-cabeza">
                  <h2 className="exp-subtitulo">Odontograma inicial</h2>
                  <div className="arm-pincel" role="radiogroup" aria-label="Pincel">
                    {(
                      [
                        ["por-tratar", "Por tratar"],
                        ["realizado", "Realizado"],
                        ["borrar", "Borrar"],
                      ] as [Pincel, string][]
                    ).map(([p, n]) => (
                      <button
                        key={p}
                        type="button"
                        role="radio"
                        aria-checked={pincel === p}
                        className="arm-pincel-opcion"
                        data-pincel={p}
                        onClick={() => setPincel(p)}
                        style={p !== "borrar" ? { ["--pincel" as string]: p === "realizado" ? COLOR_CLINICO.azul : COLOR_CLINICO.rojo } : undefined}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
                <div ref={refO} className="odo-medida">
                  {mo.w > 0 && (
                    <Odontograma
                      marcas={a.marcas}
                      elegida={pieza}
                      alElegir={setPieza}
                      alCara={(p, s) => marcar(p, s)}
                      ancho={mo.w}
                      etiqueta="Odontograma inicial: toca una cara para marcarla con el pincel"
                      leyenda="armado"
                    />
                  )}
                </div>
                {pieza ? (
                  <div className="arm-pieza" aria-label={`Pieza ${pieza}`}>
                    <p className="arm-pieza-nombre">
                      <span className="arm-pieza-n">{pieza}</span> {nombrePieza(pieza).toLowerCase()}
                    </p>
                    <div className="arm-sugerencias" role="group" aria-label={`Caras de la pieza ${pieza}`}>
                      {CARAS.map((s) => {
                        const m = marcaDe(pieza, s);
                        return (
                          <button
                            key={s}
                            type="button"
                            className="arm-chip arm-chip-cara"
                            aria-pressed={!!m}
                            data-cara-boton={s}
                            style={m ? { ["--marca" as string]: m.estado === "realizado" ? COLOR_CLINICO.azul : COLOR_CLINICO.rojo } : undefined}
                            onClick={() => marcar(pieza, s)}
                          >
                            {NOMBRE_SUPERFICIE[s].replace(" o lingual", "")}
                          </button>
                        );
                      })}
                      <button
                        type="button"
                        className="arm-chip arm-chip-cara"
                        aria-pressed={!!faltaDe(pieza)}
                        style={faltaDe(pieza) ? { ["--marca" as string]: faltaDe(pieza)!.estado === "realizado" ? COLOR_CLINICO.azul : COLOR_CLINICO.rojo } : undefined}
                        onClick={() => marcar(pieza, "raiz", true)}
                      >
                        {pincel === "por-tratar" ? "Extracción" : "Ausente"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="arm-pista">Toca una cara de cualquier pieza para marcarla con el pincel, o elige la pieza y usa sus botones.</p>
                )}
              </section>

              <section className="arm-estudios" aria-label="Estudios">
                <div className="arm-odonto-cabeza">
                  <h2 className="exp-subtitulo">Estudios</h2>
                  <span className="agenda-nota">radiografías dibujadas para el concepto</span>
                </div>
                <div className="arm-bandeja" ref={estudios}>
                  {ESTUDIOS_DIBUJADOS.map((e) => {
                    const dentro = a.estudios.includes(e.id);
                    return (
                      <button
                        key={e.id}
                        type="button"
                        className="arm-estudio"
                        data-estudio-armado={e.id}
                        aria-pressed={dentro}
                        onClick={() => cambia({ estudios: dentro ? a.estudios.filter((x) => x !== e.id) : [...a.estudios, e.id] })}
                      >
                        <span className="radio-mini" aria-hidden="true">
                          <Radiografia tipo={e.id} w={150} h={62} />
                        </span>
                        <span className="arm-estudio-nombre">{e.nombre}</span>
                        <span className="arm-estudio-que">{dentro ? "en el expediente" : e.que}</span>
                      </button>
                    );
                  })}
                </div>
              </section>
            </div>

            <div className="arm-pie">
              <p className="arm-falta" role="status">
                {intento && faltan.length ? `Para mandarlo falta ${faltan.join(" y ")}.` : ""}
              </p>
              <button type="button" className="exp-analizar arm-mandar" onClick={mandar}>
                <span className="exp-analizar-punto" aria-hidden="true" />
                Mandar a la IA
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div key="chat" className="arm-chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
            <Chat armado={a} id={id} alVolver={() => setFase("armado")} alLlevar={(l) => alLlevar(a, l)} />
          </motion.div>
        )}
      </AnimatePresence>
    </Pantalla>
  );
}
