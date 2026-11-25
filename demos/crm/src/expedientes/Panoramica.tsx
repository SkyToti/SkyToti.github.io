/**
 * La radiografía panorámica, DIBUJADA para el concepto (no es una imagen real, regla 6):
 * 32 piezas en numeración FDI, con corona, raíces y conducto, sobre la curva de la sonrisa.
 * Blanco = restauración (radiopaca); punteado = pieza ausente. Lo que señala la IA lleva su color clínico
 * (rojo por tratar, azul realizado; en línea punteada mientras es sugerencia) y un halo lima si está elegido.
 * Mientras analiza, una línea de escaneo la recorre de izquierda a derecha.
 */
import type { ReactNode } from "react";
import { estadoDeHallazgo, type Decision, type Hallazgo } from "./datos";
import { colorClaroDe, type Superficie } from "./clinica";

const ARRIBA = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
const ABAJO = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

type Tipo = "incisivo" | "canino" | "premolar" | "molar";
const tipoDe = (pieza: number): Tipo => {
  const d = pieza % 10;
  return d <= 2 ? "incisivo" : d === 3 ? "canino" : d <= 5 ? "premolar" : "molar";
};
const ANCHO: Record<Tipo, number> = { incisivo: 0.7, canino: 0.8, premolar: 0.82, molar: 1.12 };
const CORONA: Record<Tipo, number> = { incisivo: 1.05, canino: 1.1, premolar: 0.9, molar: 0.85 };
const RAIZ: Record<Tipo, number> = { incisivo: 1.55, canino: 2.0, premolar: 1.5, molar: 1.3 };
const f = (n: number) => n.toFixed(1);

interface Props {
  w: number;
  h: number;
  tratadas: number[];
  ausentes: number[];
  hallazgos: (Hallazgo & { decision?: Decision })[];
  /** «sin analizar» no muestra hallazgos; «analizando» los descubre al paso de la línea */
  estado: "sin analizar" | "analizando" | "analizado";
  /** avance del escaneo, 0–1 */
  avance: number;
  foco: string | null;
  alFoco: (id: string | null) => void;
  /** tocar una marca elige su pieza (la muela la enseña) */
  alPieza?: (n: number) => void;
}

interface Pieza {
  n: number;
  x: number;
  y: number; // borde oclusal
  w: number;
  ch: number;
  rl: number;
  arriba: boolean;
  giro: number;
}

function piezas(w: number, h: number): { lista: Pieza[]; u: number } {
  const fila = (ns: number[], arriba: boolean) => {
    const total = ns.reduce((a, n) => a + ANCHO[tipoDe(n)] * (n % 10 === 2 ? 0.9 : 1), 0) + 0.1 * (ns.length - 1);
    const u = (w * 0.9) / total;
    let x = w * 0.05;
    return {
      u,
      lista: ns.map((n) => {
        const t = tipoDe(n);
        const ancho = ANCHO[t] * (n % 10 === 2 ? 0.9 : 1) * u;
        const cx = x + ancho / 2;
        x += ancho + 0.1 * u;
        const rel = (cx - w / 2) / (w / 2);
        const curva = h * 0.07 * rel * rel; // la sonrisa: los lados suben
        return {
          n,
          x: cx,
          y: h / 2 + (arriba ? -h * 0.018 : h * 0.018) - curva,
          w: ancho,
          ch: CORONA[t] * u * (arriba ? 1 : 0.95),
          rl: RAIZ[t] * u * (arriba ? 0.95 : 1.05),
          arriba,
          giro: rel * (arriba ? -7 : 7),
        };
      }),
    };
  };
  const a = fila(ARRIBA, true);
  const b = fila(ABAJO, false);
  return { lista: [...a.lista, ...b.lista], u: a.u };
}

/** El contorno de una pieza en su propio sistema: borde oclusal en y=0 y la raíz hacia -y */
function contorno(p: Pieza): { corona: string; raices: string; conducto: string; relleno: string } {
  const t = tipoDe(p.n);
  const w = p.w / 2;
  const ch = p.ch;
  const rl = p.rl;
  const cuello = w * 0.72;
  let borde: string;
  if (t === "molar") borde = `L${f(-w * 0.85)} ${f(-ch * 0.05)} Q${f(-w * 0.45)} ${f(ch * 0.08)} ${f(0)} ${f(-ch * 0.04)} Q${f(w * 0.45)} ${f(ch * 0.08)} ${f(w * 0.85)} ${f(-ch * 0.05)}`;
  else if (t === "premolar") borde = `L${f(-w * 0.8)} ${f(-ch * 0.05)} Q${f(0)} ${f(ch * 0.1)} ${f(w * 0.8)} ${f(-ch * 0.05)}`;
  else if (t === "canino") borde = `L${f(-w * 0.75)} ${f(-ch * 0.1)} L${f(0)} ${f(ch * 0.06)} L${f(w * 0.75)} ${f(-ch * 0.1)}`;
  else borde = `L${f(-w * 0.82)} ${f(0)} L${f(w * 0.82)} ${f(0)}`;
  const corona = `M${f(-cuello)} ${f(-ch)} C${f(-w * 1.05)} ${f(-ch * 0.75)} ${f(-w)} ${f(-ch * 0.2)} ${f(-w * 0.9)} ${f(-ch * 0.08)} ${borde} C${f(w)} ${f(-ch * 0.2)} ${f(w * 1.05)} ${f(-ch * 0.75)} ${f(cuello)} ${f(-ch)}`;
  const raiz = (cx: number, ancho: number, largo: number, inclina: number) =>
    `M${f(cx - ancho)} ${f(-ch)} Q${f(cx - ancho * 0.7 + inclina * 0.5)} ${f(-ch - largo * 0.65)} ${f(cx + inclina)} ${f(-ch - largo)} Q${f(cx + ancho * 0.7 + inclina * 0.5)} ${f(-ch - largo * 0.65)} ${f(cx + ancho)} ${f(-ch)}`;
  let raices: string;
  let conducto: string;
  if (t === "molar") {
    raices = raiz(-cuello * 0.5, cuello * 0.42, rl, -w * 0.12) + raiz(cuello * 0.5, cuello * 0.42, rl * 0.95, w * 0.1);
    conducto = `M${f(-cuello * 0.5)} ${f(-ch * 0.7)} L${f(-cuello * 0.5 - w * 0.1)} ${f(-ch - rl * 0.85)} M${f(cuello * 0.5)} ${f(-ch * 0.7)} L${f(cuello * 0.5 + w * 0.08)} ${f(-ch - rl * 0.8)}`;
  } else {
    raices = raiz(0, cuello * 0.8, rl, 0);
    conducto = `M0 ${f(-ch * 0.6)} L0 ${f(-ch - rl * 0.88)}`;
  }
  const relleno = `M${f(-w * 0.45)} ${f(-ch * 0.15)} Q${f(-w * 0.5)} ${f(-ch * 0.55)} ${f(0)} ${f(-ch * 0.6)} Q${f(w * 0.5)} ${f(-ch * 0.55)} ${f(w * 0.45)} ${f(-ch * 0.15)} Z`;
  return { corona, raices, conducto, relleno };
}

/** Dónde cae cada cara dentro de la pieza (en su sistema local); mesial mira a la línea media */
function puntoSuperficie(p: Pieza, s: Superficie, centro: number): [number, number] {
  const m = p.x < centro ? 1 : -1;
  if (s === "oclusal") return [0, -p.ch * 0.1];
  if (s === "mesial") return [m * p.w * 0.4, -p.ch * 0.45];
  if (s === "distal") return [-m * p.w * 0.4, -p.ch * 0.45];
  if (s === "vestibular") return [m * p.w * 0.12, -p.ch * 0.55];
  if (s === "palatina") return [-m * p.w * 0.12, -p.ch * 0.55];
  if (s === "cervical") return [-m * p.w * 0.3, -p.ch * 1.02];
  if (s === "raiz") return [0, -p.ch - p.rl * 0.5];
  if (s === "conducto") return [0, -p.ch - p.rl * 0.42];
  return [0, -p.ch - p.rl * 0.95];
}

export default function Panoramica({ w, h, tratadas, ausentes, hallazgos, estado, avance, foco, alFoco, alPieza }: Props) {
  if (w < 20 || h < 20) return null;
  const { lista, u } = piezas(w, h);
  const xEscaneo = w * 0.03 + avance * w * 0.94;
  const visible = (x: number) => estado === "analizado" || (estado === "analizando" && x < xEscaneo);
  const trazos: ReactNode[] = [];
  const marcas: ReactNode[] = [];
  const numeros: ReactNode[] = [];
  for (const p of lista) {
    const c = contorno(p);
    const s = p.arriba ? 1 : -1;
    const tr = `translate(${f(p.x)} ${f(p.y)}) rotate(${f(p.giro)}) scale(1 ${s})`;
    const ausente = ausentes.includes(p.n);
    const conHallazgo = hallazgos.filter((x) => x.pieza === p.n && x.decision !== "descartado");
    trazos.push(
      <g key={p.n} transform={tr} opacity={ausente ? 0.28 : 1} strokeDasharray={ausente ? "2 3" : undefined}>
        <path d={c.raices} />
        <path d={c.corona} />
        {!ausente && <path d={c.conducto} opacity={0.35} />}
        {tratadas.includes(p.n) && !ausente && <path d={c.relleno} fill="#ffffff" fillOpacity={0.62} stroke="none" />}
      </g>,
    );
    const marcada = conHallazgo.length > 0 && visible(p.x);
    numeros.push(
      <text key={p.n} x={f(p.x)} y={f(p.arriba ? p.y - p.ch - p.rl - 6 : p.y + p.ch + p.rl + 14)} textAnchor="middle" className="pano-numero" data-marcada={marcada || undefined}>
        {p.n}
      </text>,
    );
    for (const hz of conHallazgo) {
      if (!visible(p.x)) continue;
      const [lx, ly] = puntoSuperficie(p, hz.superficie, w / 2);
      const estado = estadoDeHallazgo(hz.decision) ?? "sugerido";
      const color = colorClaroDe(estado);
      const rad = (p.giro * Math.PI) / 180;
      const gx = p.x + lx * Math.cos(rad) - ly * s * Math.sin(rad);
      const gy = p.y + lx * Math.sin(rad) + ly * s * Math.cos(rad);
      const activo = foco === hz.id;
      marcas.push(
        <g
          key={hz.id}
          className="pano-hallazgo"
          data-hallazgo={hz.id}
          data-activo={activo || undefined}
          data-confirmado={hz.decision === "confirmado" || undefined}
          data-estado={estado}
          onPointerEnter={() => alFoco(hz.id)}
          onPointerLeave={() => alFoco(null)}
          onClick={() => {
            alPieza?.(hz.pieza);
            alFoco(hz.id);
          }}
          style={{ cursor: "pointer" }}
        >
          {activo && <circle cx={f(gx)} cy={f(gy)} r={f(u * 0.5)} fill="#dff41c" fillOpacity={0.32} stroke="#dff41c" strokeWidth={1.4} />}
          <circle cx={f(gx)} cy={f(gy)} r={f(u * 0.3)} fill="none" stroke={color} strokeWidth={1.8} strokeDasharray={estado === "sugerido" ? "2.2 1.8" : undefined} />
          <circle cx={f(gx)} cy={f(gy)} r={2.4} fill={color} />
          <circle cx={f(gx)} cy={f(gy)} r={f(u * 0.9)} fill="transparent" stroke="none" />
        </g>,
      );
    }
  }
  return (
    <svg className="panoramica" width={w} height={h} viewBox={`0 0 ${f(w)} ${f(h)}`} role="img" aria-label="Radiografía panorámica dibujada para el concepto: 32 piezas, sus restauraciones y lo que señala la IA">
      <defs>
        <radialGradient id="pano-hueso-arriba" cx="50%" cy="30%" r="62%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.16" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="pano-hueso-abajo" cx="50%" cy="72%" r="62%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.14" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="pano-escaneo" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="#dff41c" stopOpacity="0" />
          <stop offset="100%" stopColor="#dff41c" stopOpacity="0.28" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width={w} height={h * 0.5} fill="url(#pano-hueso-arriba)" />
      <rect x="0" y={h * 0.5} width={w} height={h * 0.5} fill="url(#pano-hueso-abajo)" />
      <g fill="none" stroke="#ffffff" strokeOpacity={0.62} strokeWidth={1} strokeLinejoin="round">
        {trazos}
      </g>
      {numeros}
      {estado === "analizando" && (
        <g className="pano-linea">
          <rect x={f(xEscaneo - 60)} y="0" width="60" height={h} fill="url(#pano-escaneo)" />
          <line x1={f(xEscaneo)} y1="0" x2={f(xEscaneo)} y2={h} stroke="#dff41c" strokeWidth={1.5} />
        </g>
      )}
      {marcas}
    </svg>
  );
}
