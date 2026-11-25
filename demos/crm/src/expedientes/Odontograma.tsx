/**
 * El odontograma (BRIEF-4 §3 y §4.B): las 32 piezas permanentes en numeración FDI (la NOM-013-SSA2-2015,
 * 9.2.2.8, pide esa nomenclatura), cada una con sus cinco caras. Va en una tarjeta clara, como en papel:
 * el rojo y el azul clínicos no se leen sobre el degradado oscuro del expediente (≈ 1.8:1).
 * Rojo = por tratar; azul = realizado; trama roja = sugerido por la IA; halo lima = la pieza elegida.
 * Mesial mira a la línea media; en las piezas de arriba la cara vestibular queda hacia arriba y en las
 * de abajo, hacia abajo. Conducto, raíz y ápice se dibujan hacia el lado de la raíz; la ausencia, con una X.
 */
import type { KeyboardEvent } from "react";
import { COLOR_CLINICO, colorDe, NOMBRE_ESTADO, NOMBRE_SUPERFICIE, type EstadoClinico, type Superficie } from "./clinica";

const ARRIBA = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
const ABAJO = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

export interface MarcaPieza {
  pieza: number;
  superficie: Superficie;
  estado: EstadoClinico;
  tipo: string;
}

interface Props {
  marcas: MarcaPieza[];
  elegida: number | null;
  alElegir: (pieza: number) => void;
  ancho: number;
  /** al armar un expediente (BRIEF-4 §4.E): tocar una cara la marca con el pincel */
  alCara?: (pieza: number, superficie: Superficie) => void;
  etiqueta?: string;
  /** «armado»: la leyenda no habla de la IA ni de la muela */
  leyenda?: "completa" | "armado";
}

const f = (n: number) => n.toFixed(1);
const URGENCIA: Record<EstadoClinico, number> = { "por-tratar": 3, sugerido: 2, realizado: 1 };

/** El segmento de anillo entre dos ángulos (grados, 0 = derecha, en sentido horario) */
function sector(cx: number, cy: number, r1: number, r2: number, a0: number, a1: number) {
  const p = (r: number, a: number) => [cx + r * Math.cos((a * Math.PI) / 180), cy + r * Math.sin((a * Math.PI) / 180)];
  const [x0, y0] = p(r2, a0);
  const [x1, y1] = p(r2, a1);
  const [x2, y2] = p(r1, a1);
  const [x3, y3] = p(r1, a0);
  return `M${f(x0)} ${f(y0)} A${f(r2)} ${f(r2)} 0 0 1 ${f(x1)} ${f(y1)} L${f(x2)} ${f(y2)} A${f(r1)} ${f(r1)} 0 0 0 ${f(x3)} ${f(y3)} Z`;
}

export default function Odontograma({ marcas, elegida, alElegir, ancho: exterior, alCara, etiqueta, leyenda = "completa" }: Props) {
  // el ancho del contenedor (que no depende del dibujo) menos el relleno de la tarjeta
  const ancho = Math.max(200, exterior - 20);
  // en el teléfono el paso baja hasta 16 px para que quepan las 16 piezas (las caras también se marcan con botones)
  const paso = Math.max(16, Math.min(40, (ancho - 16) / 16.6));
  const R = paso * 0.4;
  const alto = paso * 5.2;
  const x0 = (ancho - paso * 16 - paso * 0.6) / 2 + paso / 2;
  const yArriba = paso * 1.55;
  const yAbajo = alto - paso * 1.55;
  const mejor = (pieza: number, s: Superficie) =>
    marcas.filter((m) => m.pieza === pieza && m.superficie === s).sort((a, b) => URGENCIA[b.estado] - URGENCIA[a.estado])[0];
  const relleno = (m?: MarcaPieza) => (!m ? "transparent" : m.estado === "sugerido" ? "url(#odo-trama)" : colorDe(m.estado));

  const pieza = (n: number, i: number, arriba: boolean) => {
    const cx = x0 + i * paso + (i >= 8 ? paso * 0.6 : 0);
    const cy = arriba ? yArriba : yAbajo;
    const izquierda = i < 8; // cuadrantes 1 y 4: su mesial mira a la derecha (a la línea media)
    const lado = (s: "mesial" | "distal") => (s === "mesial" ? (izquierda ? "der" : "izq") : izquierda ? "izq" : "der");
    const arribaCara: Superficie = arriba ? "vestibular" : "palatina";
    const abajoCara: Superficie = arriba ? "palatina" : "vestibular";
    const caras: [Superficie, number, number][] = [
      [arribaCara, 225, 315],
      [lado("mesial") === "der" ? "mesial" : "distal", -45, 45],
      [abajoCara, 45, 135],
      [lado("mesial") === "izq" ? "mesial" : "distal", 135, 225],
    ];
    const propias = marcas.filter((m) => m.pieza === n);
    const ausente = propias.find((m) => m.tipo === "ausente" || m.tipo === "extraccion");
    const raizY = arriba ? -1 : 1; // la raíz de arriba sube; la de abajo baja
    const conducto = mejor(n, "conducto");
    const raiz = mejor(n, "raiz");
    const apice = mejor(n, "periapical");
    const cervical = mejor(n, "cervical");
    const esElegida = elegida === n;
    const resumen = propias.length
      ? propias.map((m) => `${NOMBRE_SUPERFICIE[m.superficie]}: ${NOMBRE_ESTADO[m.estado]}`).join("; ")
      : "sin marcas";
    const tecla = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        alElegir(n);
      }
    };
    return (
      <g
        key={n}
        className="odo-pieza"
        data-pieza={n}
        data-elegida={esElegida || undefined}
        data-marcada={propias.length > 0 || undefined}
        role="button"
        tabIndex={0}
        aria-pressed={esElegida}
        aria-label={`Pieza ${n}: ${resumen}`}
        onClick={() => alElegir(n)}
        onKeyDown={tecla}
      >
        {esElegida && <circle cx={f(cx)} cy={f(cy)} r={f(R + paso * 0.18)} className="odo-halo" />}
        <circle cx={f(cx)} cy={f(cy)} r={f(paso * 0.5)} fill="transparent" />
        {/* la raíz: conducto, raíz y ápice, hacia su lado */}
        {(conducto || raiz || apice) && !ausente && (
          <g>
            <line
              x1={f(cx)}
              y1={f(cy + raizY * R * 0.2)}
              x2={f(cx)}
              y2={f(cy + raizY * (R + paso * 0.34))}
              stroke={colorDe((conducto ?? raiz ?? apice)!.estado)}
              strokeWidth={2}
              strokeDasharray={(conducto ?? raiz ?? apice)!.estado === "sugerido" ? "2 2" : undefined}
            />
            {apice && <circle cx={f(cx)} cy={f(cy + raizY * (R + paso * 0.42))} r={f(paso * 0.1)} fill={relleno(apice)} stroke={colorDe(apice.estado)} strokeWidth={1} />}
          </g>
        )}
        {caras.map(([s, a0, a1]) => {
          const m = mejor(n, s);
          return (
            <path
              key={s}
              d={sector(cx, cy, R * 0.42, R, a0, a1)}
              fill={relleno(m)}
              className="odo-cara"
              data-cara={s}
              onClick={
                alCara
                  ? (e) => {
                      e.stopPropagation();
                      alElegir(n);
                      alCara(n, s);
                    }
                  : undefined
              }
            />
          );
        })}
        <circle
          cx={f(cx)}
          cy={f(cy)}
          r={f(R * 0.42)}
          fill={relleno(mejor(n, "oclusal"))}
          className="odo-cara"
          data-cara="oclusal"
          onClick={
            alCara
              ? (e) => {
                  e.stopPropagation();
                  alElegir(n);
                  alCara(n, "oclusal");
                }
              : undefined
          }
        />
        {cervical && (
          <path
            d={sector(cx, cy, R + 1.5, R + 3.5, arriba ? 200 : 20, arriba ? 340 : 160)}
            fill={relleno(cervical)}
            stroke="none"
          />
        )}
        {ausente && (
          <g stroke={colorDe(ausente.estado)} strokeWidth={1.8} strokeLinecap="round">
            <line x1={f(cx - R)} y1={f(cy - R)} x2={f(cx + R)} y2={f(cy + R)} />
            <line x1={f(cx + R)} y1={f(cy - R)} x2={f(cx - R)} y2={f(cy + R)} />
          </g>
        )}
        <text x={f(cx)} y={f(arriba ? cy - R - paso * 0.52 : cy + R + paso * 0.8)} textAnchor="middle" className="odo-numero">
          {n}
        </text>
      </g>
    );
  };

  return (
    <div className="odontograma">
      <svg width={ancho} height={alto} viewBox={`0 0 ${f(ancho)} ${f(alto)}`} role="group" aria-label={etiqueta ?? "Odontograma: toca una pieza para verla en la muela"} data-editable={alCara ? true : undefined}>
        <defs>
          <pattern id="odo-trama" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="4" height="4" fill="#ffffff" />
            <rect width="1.8" height="4" fill={COLOR_CLINICO.rojo} />
          </pattern>
        </defs>
        <line x1={f(ancho / 2)} y1={f(paso * 0.3)} x2={f(ancho / 2)} y2={f(alto - paso * 0.3)} className="odo-eje" />
        <line x1={f(x0 - paso * 0.5)} y1={f(alto / 2)} x2={f(ancho - x0 + paso * 0.5)} y2={f(alto / 2)} className="odo-eje" />
        {ARRIBA.map((n, i) => pieza(n, i, true))}
        {ABAJO.map((n, i) => pieza(n, i, false))}
      </svg>
      <ul className="odo-leyenda" aria-label="Qué significa cada color">
        <li>
          <span className="odo-muestra" style={{ background: COLOR_CLINICO.rojo }} /> por tratar
        </li>
        <li>
          <span className="odo-muestra" style={{ background: COLOR_CLINICO.azul }} /> realizado
        </li>
        {leyenda === "completa" && (
          <li>
            <span className="odo-muestra odo-muestra-trama" /> sugerido por la IA
          </li>
        )}
        <li>
          <span className="odo-muestra odo-muestra-lima" /> {leyenda === "completa" ? "la que ves en la muela" : "la pieza elegida"}
        </li>
      </ul>
    </div>
  );
}
