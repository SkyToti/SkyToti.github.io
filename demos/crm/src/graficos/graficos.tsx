/**
 * Los gráficos de línea fina (BRIEF.md §2.4 y §3.3): trazo de 1 px dibujado con matemáticas.
 * Cada uno codifica su dato; siempre hay línea base, un punto de inicio y el punto lima del «ahora»
 * o de «lo que tú elegiste». Se dibujan en píxeles del mosaico para que el trazo salga nítido.
 */
import type { ReactNode } from "react";

export type Tinta = "clara" | "oscura";

export interface Lienzo {
  w: number;
  h: number;
  tinta: Tinta;
  /** fase de la animación continua, en segundos (0 = quieto) */
  t?: number;
  /** en el detalle: escala y rótulos legibles */
  detalle?: boolean;
  /** dónde está el cursor o el dedo sobre el gráfico (px del gráfico): el gráfico dice su valor ahí */
  sonda?: { x: number; y: number } | null;
}
type Candidato = { x: number; y: number; texto: string };
const hh = (h: number) => `${Math.floor(h)}:${String(Math.round((h % 1) * 60)).padStart(2, "0")}`;

const LIMA = "#dff41c";
export const trazo = (t: Tinta, a = 0.78) => (t === "clara" ? `rgba(255,255,255,${a})` : `rgba(34,30,26,${a * 0.8})`);
const f1 = (n: number) => n.toFixed(1);
/** Ancho aproximado de un rótulo de 12 px en Urbanist (para no encimarlos) */
const anchoTexto = (s: string) => s.length * 6.4;
/** Texto dentro de un gráfico, alineado con su punto */
function Rotulo({ x, y, children, ancla = "middle", fuerte }: { x: number; y: number; children: ReactNode; ancla?: "start" | "middle" | "end"; fuerte?: boolean }) {
  return (
    <text className="rotulo" x={f1(x)} y={f1(y)} textAnchor={ancla} data-fuerte={fuerte || undefined}>
      {children}
    </text>
  );
}

function Svg({ w, h, children, etiqueta }: { w: number; h: number; children: ReactNode; etiqueta: string }) {
  if (w < 4 || h < 4) return null;
  return (
    <svg className="grafico" width={w} height={h} viewBox={`0 0 ${f1(w)} ${f1(h)}`} role="img" aria-label={etiqueta}>
      {children}
    </svg>
  );
}

/** Punto lima con halo: el «ahora» o «lo que tú elegiste» */
export function PuntoLima({ x, y, r = 4.2 }: { x: number; y: number; r?: number }) {
  return (
    <g className="punto-lima">
      <circle cx={x} cy={y} r={r * 2.6} fill={LIMA} opacity={0.22} />
      <circle cx={x} cy={y} r={r} fill={LIMA} />
    </g>
  );
}

/**
 * La sonda: al pasar el cursor o el dedo, el gráfico dice su valor en el punto más cercano
 * (una línea fina, un anillo y una etiqueta blanca pequeña, legible sobre cualquier degradado).
 */
function Sonda({ sonda, candidatos, w, h, eje }: { sonda?: { x: number; y: number } | null; candidatos: Candidato[]; w: number; h: number; eje: "x" | "y" | "xy" }) {
  if (!sonda || !candidatos.length) return null;
  let mejor = candidatos[0];
  let menor = Infinity;
  for (const c of candidatos) {
    const d = eje === "x" ? Math.abs(c.x - sonda.x) : eje === "y" ? Math.abs(c.y - sonda.y) : Math.hypot(c.x - sonda.x, c.y - sonda.y);
    if (d < menor) {
      menor = d;
      mejor = c;
    }
  }
  const tw = mejor.texto.length * 6.4 + 20;
  const lx = Math.max(0, Math.min(w - tw, mejor.x - tw / 2));
  const arriba = mejor.y - 38 >= -6;
  const ly = arriba ? mejor.y - 38 : mejor.y + 14;
  return (
    <g className="sonda" pointerEvents="none">
      {eje === "x" && <line x1={f1(mejor.x)} x2={f1(mejor.x)} y1="0" y2={f1(h)} stroke="currentColor" strokeOpacity={0.4} strokeDasharray="2 3" />}
      <circle cx={f1(mejor.x)} cy={f1(mejor.y)} r={6} fill="none" stroke="currentColor" strokeWidth={1.2} />
      <g transform={`translate(${f1(lx)} ${f1(ly)})`}>
        <rect width={f1(tw)} height="24" rx="7" className="sonda-fondo" />
        <text x={f1(tw / 2)} y="16" textAnchor="middle" className="sonda-texto">
          {mejor.texto}
        </text>
      </g>
    </g>
  );
}

const elipse = (cx: number, cy: number, rx: number, ry: number) =>
  `M${f1(cx - rx)} ${f1(cy)}a${f1(rx)} ${f1(ry)} 0 1 0 ${f1(2 * rx)} 0a${f1(rx)} ${f1(ry)} 0 1 0 ${f1(-2 * rx)} 0`;

/* ── Pacientes: reloj de arena de dos esferas de alambre ─────────────────────
   El área de cada esfera es proporcional a su base de pacientes (radio ∝ √n). */
export function RelojDeArena({
  w,
  h,
  t = 0,
  arriba,
  abajo,
  elegido,
  nombres,
  limaU,
  sonda,
  textos,
}: Lienzo & { arriba: number; abajo: number; elegido: "arriba" | "abajo" | "ambos"; nombres?: [string, string]; limaU?: number; textos?: [string, string] }) {
  const ra0 = Math.sqrt(Math.max(arriba, 0.01));
  const rb0 = Math.sqrt(Math.max(abajo, 0.01));
  const s = Math.min((h * 0.9) / (2 * ra0 + 2 * rb0), (w * 0.78) / (2 * Math.max(ra0, rb0)));
  const ra = ra0 * s;
  const rb = rb0 * s;
  const cx = w * 0.46;
  const y0 = (h - 2 * ra - 2 * rb) / 2;
  const ca = y0 + ra;
  const yJ = y0 + 2 * ra;
  const cb = yJ + rb;
  const esfera = (cy: number, r: number, clave: string) => {
    const anillos = [];
    const N = 10;
    for (let k = 1; k < N; k++) {
      const phi = -Math.PI / 2 + (k * Math.PI) / N;
      const rx = r * Math.cos(phi);
      anillos.push(<path key={`${clave}a${k}`} d={elipse(cx, cy + r * Math.sin(phi), rx, rx * 0.2)} />);
    }
    const meridianos = [];
    for (let i = 0; i < 4; i++) {
      const th = t * 0.18 + (i * Math.PI) / 4;
      meridianos.push(<path key={`${clave}m${i}`} d={elipse(cx, cy, Math.abs(Math.cos(th)) * r + 0.01, r)} opacity={0.5} />);
    }
    return (
      <g key={clave}>
        {anillos}
        {meridianos}
      </g>
    );
  };
  // el lima viaja entre el centro de arriba (0), la unión (0.5) y el centro de abajo (1)
  const uL = limaU ?? (elegido === "arriba" ? 0 : elegido === "ambos" ? 0.5 : 1);
  const lima = { x: cx, y: uL <= 0.5 ? ca + (yJ - ca) * (uL / 0.5) : yJ + (cb - yJ) * ((uL - 0.5) / 0.5) };
  const xr = cx + Math.max(ra, rb) + 12;
  return (
    <Svg w={w} h={h} etiqueta={`Dos esferas: la de arriba ${arriba}, la de abajo ${abajo}; el tamaño es proporcional a cada base`}>
      <g fill="none" stroke="currentColor" strokeOpacity={0.62} strokeWidth={1} vectorEffect="non-scaling-stroke">
        {esfera(ca, ra, "a")}
        {esfera(cb, rb, "b")}
      </g>
      <PuntoLima {...lima} />
      {nombres && (
        <>
          {[
            [nombres[0], ca, ra, elegido === "arriba"],
            [nombres[1], cb, rb, elegido === "abajo"],
          ].map(([n, cy, r, fuerte], i) => {
            // a la derecha de su esfera si cabe; si no, encima de ella
            const x = Math.min(xr, cx + (r as number) + 12);
            const cabe = x + anchoTexto(n as string) <= w - 2;
            return (
              <Rotulo key={i} x={cabe ? x : cx} y={cabe ? (cy as number) + 4 : (cy as number) - (r as number) - 8} ancla={cabe ? "start" : "middle"} fuerte={fuerte as boolean}>
                {n as string}
              </Rotulo>
            );
          })}
        </>
      )}
      <Sonda sonda={sonda} w={w} h={h} eje="y" candidatos={[{ x: cx, y: ca, texto: textos?.[0] ?? nombres?.[0] ?? "" }, { x: cx, y: cb, texto: textos?.[1] ?? nombres?.[1] ?? "" }].filter((c) => c.texto)} />
    </Svg>
  );
}

/* ── WhatsApp: haz de hélices del día 1 al 30 ──────────────────────────────
   El grosor del haz en cada día es el volumen de conversaciones de ese día. */
export function Helice({ w, h, t = 0, dias, hoy, detalle, sonda }: Lienzo & { dias: number[]; hoy: number }) {
  const x0 = 10;
  const x1 = w - 10;
  const base = h * 0.54;
  const A = h * 0.36;
  const max = Math.max(...dias);
  // volumen suavizado (promedio ponderado de ±2 días): el haz se estrecha los domingos
  const suave = dias.map((_, i) => {
    let s = 0;
    let w = 0;
    for (let k = -2; k <= 2; k++) {
      const j = i + k;
      if (j < 0 || j >= dias.length) continue;
      const p = Math.exp(-(k * k) / 2.2);
      s += dias[j] * p;
      w += p;
    }
    return s / w;
  });
  const vol = (u: number) => {
    const p = u * (dias.length - 1);
    const i = Math.floor(p);
    const f = p - i;
    const a = suave[Math.min(i, dias.length - 1)];
    const b = suave[Math.min(i + 1, dias.length - 1)];
    return 0.3 + (0.7 * (a + (b - a) * (f * f * (3 - 2 * f)))) / max;
  };
  const hebras = 6;
  const caminos = [];
  for (let k = 0; k < hebras; k++) {
    const amp = 0.5 + (0.5 * k) / (hebras - 1);
    const fase = (k * Math.PI) / 5.5 + t * 0.35;
    let d = "";
    const pasos = 110;
    for (let i = 0; i <= pasos; i++) {
      const u = i / pasos;
      const env = Math.pow(Math.sin(Math.PI * u), 0.55) * vol(u);
      const x = x0 + (x1 - x0) * u;
      const y = base - A * env * amp * Math.sin(2 * Math.PI * 2.4 * u + fase);
      d += `${i ? "L" : "M"}${f1(x)} ${f1(y)}`;
    }
    caminos.push(<path key={k} d={d} />);
  }
  const xh = x0 + ((x1 - x0) * (hoy - 1)) / (dias.length - 1);
  return (
    <Svg w={w} h={h} etiqueta={`Conversaciones por día del 1 al ${dias.length}; hoy es el día ${hoy}`}>
      <line x1={x0} y1={base} x2={x1} y2={base} stroke="currentColor" strokeOpacity={0.34} strokeWidth={1} />
      <g fill="none" stroke="currentColor" strokeOpacity={0.72} strokeWidth={1}>
        {caminos}
      </g>
      <circle cx={x0} cy={base} r={3.6} fill="currentColor" />
      <PuntoLima x={xh} y={base} />
      {!detalle && (
        <>
          <Rotulo x={x0} y={base + 18} ancla="start">
            1
          </Rotulo>
          <Rotulo x={x1} y={base + 18} ancla="end">
            30
          </Rotulo>
        </>
      )}
      {detalle && (
        <>
          {[1, 7, 14, 21, 28].map((d) => (
            <Rotulo key={d} x={x0 + ((x1 - x0) * (d - 1)) / (dias.length - 1)} y={h - 4}>
              {d === 1 ? "día 1" : d}
            </Rotulo>
          ))}
          <Rotulo x={xh} y={base - A - 10} fuerte>
            hoy
          </Rotulo>
        </>
      )}
      <Sonda sonda={sonda} w={w} h={h} eje="x" candidatos={dias.map((v, i) => ({ x: x0 + ((x1 - x0) * i) / (dias.length - 1), y: base, texto: `${i + 1} de septiembre: ${Math.round(v)}` }))} />
    </Svg>
  );
}

/* ── Sillones: arcos desde la apertura hasta la hora en que cada doctor deja el sillón ── */
export function ArcosSillon({
  w,
  h,
  detalle,
  sonda,
  turnos,
  ahora,
}: Lienzo & { turnos: { fin: number; quien: string }[]; ahora: number | null }) {
  const x0 = 14;
  const x1 = w - 14;
  // deja sitio abajo para dos renglones de rótulos (se alternan para no chocar) y, en el detalle, las horas
  const base = h - (turnos.some((tu) => tu.quien) ? 44 : 26) - (detalle ? 22 : 0);
  const X = (hora: number) => x0 + ((hora - 8) / 12) * (x1 - x0);
  const alto = base - 8;
  const arcos = turnos.map((tu, i) => {
    const xf = X(tu.fin);
    const rx = (xf - x0) / 2;
    const ry = Math.min(rx * 1.02, alto);
    return <path key={i} d={`M${f1(x0)} ${f1(base)}A${f1(rx)} ${f1(ry)} 0 0 1 ${f1(xf)} ${f1(base)}`} />;
  });
  const horas = [];
  for (let hr = 9; hr < 20; hr++) if (!turnos.some((tu) => tu.fin === hr)) horas.push(<circle key={hr} cx={X(hr)} cy={base} r={1.5} fill="currentColor" fillOpacity={0.8} />);
  return (
    <Svg w={w} h={h} etiqueta={`Un sillón, de 8:00 a 20:00: ${turnos.map((tu) => `${tu.quien} hasta las ${tu.fin}:00`).join(", ")}`}>
      <g fill="none" stroke="currentColor" strokeOpacity={0.74} strokeWidth={1}>
        {arcos}
      </g>
      {horas}
      {turnos.map((tu, i) => (
        <circle key={i} cx={X(tu.fin)} cy={base} r={3.4} fill="currentColor" />
      ))}
      <circle cx={x0} cy={base} r={3.6} fill="currentColor" />
      <Rotulo x={x0} y={base + 22} ancla="start">8:00</Rotulo>
      {turnos.map((tu, i) => (
        <Rotulo key={i} x={X(tu.fin)} y={base + (i % 2 ? 38 : 22)} ancla={tu.fin >= 19.5 ? "end" : tu.fin <= 8.5 ? "start" : "middle"}>
          {tu.quien}
        </Rotulo>
      ))}
      {ahora !== null && ahora >= 8 && ahora <= 20 && <PuntoLima x={X(ahora)} y={base} r={3.8} />}
      {detalle &&
        [10, 12, 14, 16, 18].map((hr) => (
          <Rotulo key={hr} x={X(hr)} y={base + (turnos.some((tu) => tu.quien) ? 58 : 40)}>
            {hr}:00
          </Rotulo>
        ))}
      <Sonda sonda={sonda} w={w} h={h} eje="x" candidatos={turnos.filter((tu) => tu.fin > 8.05).map((tu, i, arr) => ({ x: X(tu.fin), y: base, texto: `${tu.quien || "Trabajo"}: ${hh(i === 0 ? 8 : arr[i - 1].fin)} a ${hh(tu.fin)}` }))} />
    </Svg>
  );
}

/* ── Doctores que rotan: el elipsoide de alambre y sus órbitas ─────────────
   Un punto por clínica sobre el ecuador; el lima es donde está hoy el doctor que rota. */
export function Elipsoide({
  w,
  h,
  detalle,
  sonda,
  t = 0,
  puntos,
  elegido,
  hoy,
}: Lienzo & { puntos: string[]; elegido: number; hoy?: string }) {
  const cx = w / 2;
  const cy = h * 0.5;
  const R = Math.min(w * 0.36, h * 0.4);
  const giro = t * 0.12;
  const meridianos = [];
  for (let i = 0; i < 7; i++) {
    const th = giro + (i * Math.PI) / 7;
    meridianos.push(<path key={i} d={elipse(cx, cy, Math.abs(Math.cos(th)) * R + 0.01, R * 1.04)} />);
  }
  const ecuador = elipse(cx, cy, R, R * 0.3);
  const enOrbita = (j: number) => {
    const a = giro + (j * 2 * Math.PI) / puntos.length + 0.6;
    return { x: cx + R * Math.cos(a), y: cy + R * 0.3 * Math.sin(a), frente: Math.sin(a) };
  };
  const pts = puntos.map((_, j) => enOrbita(j));
  // «elegido» puede ser fraccionario mientras el lima viaja por la órbita; -1 = hoy no está en ninguna
  const lima = elegido >= 0 ? enOrbita(elegido) : null;
  const cercano = Math.round(elegido);
  return (
    <Svg w={w} h={h} etiqueta={`${puntos.length} clínicas en órbita${elegido >= 0 ? `; hoy el doctor que rota está en ${puntos[cercano]}` : ""}`}>
      <g fill="none" stroke="currentColor" strokeOpacity={0.5} strokeWidth={1}>
        {meridianos}
      </g>
      <path d={ecuador} fill="none" stroke="currentColor" strokeOpacity={0.85} strokeWidth={1} />
      {pts.map((p, j) =>
        j === cercano && lima ? null : <circle key={j} cx={p.x} cy={p.y} r={2.4 + 1.2 * (p.frente + 1) * 0.5} fill="currentColor" opacity={0.55 + 0.45 * (p.frente + 1) * 0.5} />,
      )}
      {lima && <PuntoLima x={lima.x} y={lima.y} r={3.8} />}
      {detalle &&
        pts.map((p, j) => (
          <Rotulo key={j} x={p.x + (p.x > cx ? 12 : -12)} y={p.y + 4} ancla={p.x > cx ? "start" : "end"} fuerte={j === cercano}>
            {puntos[j]}
          </Rotulo>
        ))}
      {hoy && (
        <Rotulo x={cx} y={cy + R * 1.04 + 17} fuerte>
          {hoy}
        </Rotulo>
      )}
      <Sonda sonda={sonda} w={w} h={h} eje="xy" candidatos={pts.map((p, j) => ({ x: p.x, y: p.y, texto: puntos[j] + (lima && j === cercano ? ": Varela, hoy" : "") }))} />
    </Svg>
  );
}

/* ── Laboratorio: el embudo; una elipse por orden, de la más vieja (arriba) a la de hoy ── */
export function Embudo({ w, h, t = 0, ordenes, detalle, sonda }: Lienzo & { ordenes: number }) {
  const cx = w / 2;
  const arriba = h * 0.1;
  const abajo = h * 0.8;
  const R = Math.min(w * 0.4, h * 0.46);
  const els = [];
  // «ordenes» puede ser fraccionario en la transición: la última elipse entra con opacidad
  const total = Math.ceil(ordenes - 0.001);
  for (let k = 0; k < total; k++) {
    const u = total === 1 ? 1 : k / (Math.max(ordenes, 1.001) - 1);
    const uu = Math.min(1, u);
    const rx = R * (1 - uu) ** 1.15 + R * 0.06;
    const y = arriba + (abajo - arriba) * uu;
    const dx = Math.sin(t * 0.6 + k * 0.55) * 1.6 * (1 - uu);
    const parcial = k === total - 1 ? Math.min(1, ordenes - k) : 1;
    els.push(<path key={k} d={elipse(cx + dx, y, rx, rx * 0.2)} opacity={parcial} />);
  }
  return (
    <Svg w={w} h={h} etiqueta={`${Math.round(ordenes)} órdenes al laboratorio este mes, de la más vieja a la de hoy`}>
      <line x1={cx} y1={arriba - 6} x2={cx} y2={abajo + 12} stroke="currentColor" strokeOpacity={0.4} strokeWidth={1} />
      <g fill="none" stroke="currentColor" strokeOpacity={0.66} strokeWidth={1}>
        {els}
      </g>
      <PuntoLima x={cx} y={abajo + 12} r={3.8} />
      {detalle && (
        <>
          <Rotulo x={cx + R + 14} y={arriba + 4} ancla="start">
            la más vieja del mes
          </Rotulo>
          <Rotulo x={cx + 16} y={abajo + 16} ancla="start" fuerte>
            la de hoy
          </Rotulo>
        </>
      )}
      <Sonda sonda={sonda} w={w} h={h} eje="y" candidatos={Array.from({ length: total }, (_, k) => { const u = total === 1 ? 1 : Math.min(1, k / (Math.max(ordenes, 1.001) - 1)); return { x: cx + R * (1 - u) ** 1.15 + R * 0.06, y: arriba + (abajo - arriba) * u, texto: `Orden ${k + 1} de ${Math.round(ordenes)}${k === total - 1 ? ": la de hoy" : ""}` }; })} />
    </Svg>
  );
}

/* ── Imagen Dental: arcos de cada fuente de referencias hacia Imagen ─────────────
   Cada arco es un haz: una línea por cada 5 estudios del mes. */
export function ArcosImagen({
  w,
  h,
  sonda,
  fuentes,
  elegido,
}: Lienzo & { fuentes: { nombre: string; n: number; fuerte?: boolean }[]; elegido: boolean }) {
  const x0 = 16;
  const xd = w - 22;
  const base = h * 0.72;
  const paso = (xd - x0) / (fuentes.length + 0.6);
  const arcos = fuentes.map((f, i) => {
    const xs = x0 + paso * i;
    const hebras = Math.max(1, Math.round(f.n / 5));
    const rx = (xd - xs) / 2;
    const lineas = [];
    for (let k = 0; k < hebras; k++) {
      const ry = Math.min(rx, base - 6) * (0.78 + (0.22 * k) / Math.max(1, hebras - 1));
      lineas.push(<path key={k} d={`M${f1(xs)} ${f1(base)}A${f1(rx)} ${f1(ry)} 0 0 1 ${f1(xd)} ${f1(base)}`} />);
    }
    return { xs, lineas, f };
  });
  return (
    <Svg w={w} h={h} etiqueta={`Referencias a Imagen Dental este mes: ${fuentes.map((f) => `${f.nombre} ${f.n}`).join(", ")}`}>
      <line x1={x0} y1={base} x2={xd} y2={base} stroke="currentColor" strokeOpacity={0.3} strokeWidth={1} />
      <g fill="none" stroke="currentColor" strokeOpacity={0.5} strokeWidth={1}>
        {arcos.map((a, i) => (
          <g key={i}>{a.lineas}</g>
        ))}
      </g>
      {arcos.map((a, i) => (
        <circle key={i} cx={a.xs} cy={base} r={3.2} fill="currentColor" />
      ))}
      {elegido ? <PuntoLima x={xd} y={base} r={4} /> : <circle cx={xd} cy={base} r={4} fill="currentColor" />}
      {(() => {
        // solo los rótulos que caben sin encimarse (el de Imagen, al final, siempre)
        let fin = -Infinity;
        const limite = xd - anchoTexto("Imagen") - 8;
        return arcos.map((a, i) => {
          if (!a.f.fuerte) return null;
          const tw = anchoTexto(a.f.nombre);
          const ini = i === 0 ? a.xs : a.xs - tw / 2;
          if (ini < fin + 8 || ini + tw > limite) return null;
          fin = ini + tw;
          return (
            <Rotulo key={i} x={a.xs} y={base + 20} ancla={i === 0 ? "start" : "middle"} fuerte>
              {a.f.nombre}
            </Rotulo>
          );
        });
      })()}
      <Rotulo x={xd} y={base + 20} ancla="end">
        Imagen
      </Rotulo>
      <Sonda sonda={sonda} w={w} h={h} eje="x" candidatos={[...arcos.map((a) => ({ x: a.xs, y: base, texto: `${a.f.nombre}: ${Math.round(a.f.n)} estudios` })), { x: xd, y: base, texto: `Imagen Dental: ${Math.round(fuentes.reduce((t, f) => t + f.n, 0))} este mes` }]} />
    </Svg>
  );
}

/* ── Expansión: puntos sobre una línea; los de hoy llenos, los de planes huecos ── */
export function PuntosEnLinea({
  w,
  h,
  grupos,
  sonda,
}: Lienzo & { grupos: { cuantos: number; tipo: "hoy" | "abre" | "plan"; extra?: boolean; rotulo: string; nombres?: string[] }[] }) {
  const candidatos: Candidato[] = [];
  const x0 = 14;
  const x1 = w - 14;
  const y = h * 0.4;
  const rotulos: ReactNode[] = [];
  const total = grupos.reduce((a, g) => a + g.cuantos + (g.extra ? 1 : 0), 0) + (grupos.length - 1) * 1.4;
  const paso = (x1 - x0) / (total - 1);
  let x = x0;
  const nodos: ReactNode[] = [];
  grupos.forEach((g, gi) => {
    const n = g.cuantos + (g.extra ? 1 : 0);
    rotulos.push(
      <Rotulo key={gi} x={x - 4} y={y + 26} ancla="start" fuerte={g.tipo === "abre"}>
        {g.rotulo}
      </Rotulo>,
    );
    for (let i = 0; i < n; i++) {
      const esExtra = g.extra && i === n - 1;
      const k = `${gi}-${i}`;
      candidatos.push({
        x,
        y,
        texto: g.tipo === "hoy" ? `${g.nombres?.[i] ?? "La clínica"}, hoy` : g.tipo === "abre" ? "Sur, por abrir" : `${g.rotulo}: la ${i + 1}.ª${esExtra ? ", si se da" : ""}`,
      });
      if (g.tipo === "hoy") nodos.push(<circle key={k} cx={x} cy={y} r={4.4} fill="currentColor" />);
      else if (g.tipo === "abre") nodos.push(<PuntoLima key={k} x={x} y={y} r={4.4} />);
      else
        nodos.push(
          <circle
            key={k}
            cx={x}
            cy={y}
            r={4.4}
            fill="none"
            stroke="currentColor" strokeOpacity={esExtra ? 0.5 : 0.85}
            strokeWidth={1}
            strokeDasharray={esExtra ? "2 2.2" : undefined}
          />,
        );
      x += paso;
    }
    x += paso * 1.4;
  });
  return (
    <Svg w={w} h={h} etiqueta="Tus clínicas de hoy y las de tus planes">
      <line x1={x0} y1={y} x2={x1} y2={y} stroke="currentColor" strokeOpacity={0.34} strokeWidth={1} />
      {nodos}
      {rotulos}
      <Sonda sonda={sonda} w={w} h={h} eje="x" candidatos={candidatos} />
    </Svg>
  );
}
