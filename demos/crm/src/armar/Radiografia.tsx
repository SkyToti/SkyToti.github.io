/**
 * Las radiografías de la bandeja para armar un expediente: DIBUJOS hechos para el concepto (regla 6: no son
 * imágenes reales). La panorámica es la misma del expediente, en chico; la periapical y la aleta de mordida
 * se dibujan con el mismo trazo blanco sobre hueso oscuro.
 */
import Panoramica from "../expedientes/Panoramica";
import type { EstudioDibujado } from "./lectura";

const f = (n: number) => n.toFixed(1);

/** una corona con su raíz (o dos), dibujada hacia arriba o hacia abajo desde la línea de mordida */
function pieza(cx: number, y: number, w: number, corona: number, raiz: number, arriba: boolean, raices: 1 | 2, k: string) {
  const s = arriba ? -1 : 1; // la corona crece hacia afuera de la mordida
  const c = y + s * corona;
  const r = c + s * raiz;
  const cor = `M${f(cx - w / 2)} ${f(c)} C${f(cx - w / 2)} ${f(y + s * corona * 0.25)} ${f(cx - w * 0.35)} ${f(y)} ${f(cx)} ${f(y)} C${f(cx + w * 0.35)} ${f(y)} ${f(cx + w / 2)} ${f(y + s * corona * 0.25)} ${f(cx + w / 2)} ${f(c)} Z`;
  const rz =
    raices === 1
      ? `M${f(cx - w * 0.32)} ${f(c)} Q${f(cx - w * 0.22)} ${f(r)} ${f(cx)} ${f(r)} Q${f(cx + w * 0.22)} ${f(r)} ${f(cx + w * 0.32)} ${f(c)}`
      : `M${f(cx - w * 0.44)} ${f(c)} Q${f(cx - w * 0.4)} ${f(r)} ${f(cx - w * 0.24)} ${f(r)} Q${f(cx - w * 0.1)} ${f(r - s * raiz * 0.5)} ${f(cx)} ${f(c + s * raiz * 0.3)} Q${f(cx + w * 0.1)} ${f(r - s * raiz * 0.5)} ${f(cx + w * 0.24)} ${f(r)} Q${f(cx + w * 0.4)} ${f(r)} ${f(cx + w * 0.44)} ${f(c)}`;
  return (
    <g key={k}>
      <path d={cor} />
      <path d={rz} />
      <line x1={f(cx)} y1={f(c + s * 2)} x2={f(cx)} y2={f(r - s * raiz * 0.12)} strokeOpacity={0.35} />
    </g>
  );
}

export default function Radiografia({ tipo, w, h }: { tipo: EstudioDibujado; w: number; h: number }) {
  if (tipo === "panoramica")
    return <Panoramica w={w} h={h} tratadas={[16, 25, 36]} ausentes={[]} hallazgos={[]} estado="sin analizar" avance={0} foco={null} alFoco={() => {}} />;
  if (tipo === "periapical") {
    // una pieza al centro, completa, y media de cada vecina
    const u = Math.min(w / 3.2, h / 3.4);
    return (
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
        <g fill="none" stroke="#ffffff" strokeOpacity={0.62} strokeWidth={1} strokeLinejoin="round">
          {[-1, 0, 1].map((i) => pieza(w / 2 + i * u * 1.18, h * 0.12, u * 1.05, u * 0.9, u * 1.75, false, 2, `p${i}`))}
        </g>
        <path d={`M${f(w / 2 - u * 0.42)} ${f(h * 0.12 + u * 0.45)} h${f(u * 0.84)}`} stroke="#ffffff" strokeOpacity={0.55} strokeWidth={3} strokeLinecap="round" />
      </svg>
    );
  }
  // aleta de mordida: las coronas de arriba y de abajo se encuentran en la mordida
  const u = w / 4.8;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <g fill="none" stroke="#ffffff" strokeOpacity={0.62} strokeWidth={1} strokeLinejoin="round">
        {[0, 1, 2, 3].map((i) => pieza(u * (0.75 + i * 1.1), h / 2 - 2, u * (i < 2 ? 0.86 : 1.02), u * 0.62, h * 0.24, true, i < 2 ? 1 : 2, `a${i}`))}
        {[0, 1, 2, 3].map((i) => pieza(u * (0.8 + i * 1.1), h / 2 + 2, u * (i < 2 ? 0.86 : 1.02), u * 0.6, h * 0.24, false, i < 2 ? 1 : 2, `b${i}`))}
      </g>
    </svg>
  );
}
