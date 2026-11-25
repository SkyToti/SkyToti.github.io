/**
 * Retrato de línea fina (BRIEF.md §3.4): monograma dentro de un aro de 1 px, sin fotos.
 * El doctor que rota lleva además su órbita punteada con el punto lima de dónde está hoy.
 */
export default function Retrato({ iniciales, rota = false, tam = 56, dondeHoy = 0 }: { iniciales: string; rota?: boolean; tam?: number; dondeHoy?: number }) {
  const r = tam / 2;
  const a = -0.7 + dondeHoy * ((2 * Math.PI) / 3);
  return (
    <svg className="retrato" width={tam} height={tam} viewBox={`0 0 ${tam} ${tam}`} aria-hidden="true">
      <circle cx={r} cy={r} r={r * 0.78} fill="none" stroke="currentColor" strokeOpacity={0.75} strokeWidth={1} />
      <text x={r} y={r + tam * 0.11} textAnchor="middle" className="retrato-letras" style={{ fontSize: tam * 0.32 }}>
        {iniciales}
      </text>
      {rota && (
        <>
          <ellipse cx={r} cy={r} rx={r * 0.97} ry={r * 0.36} fill="none" stroke="currentColor" strokeOpacity={0.6} strokeWidth={1} strokeDasharray="2 3" transform={`rotate(-18 ${r} ${r})`} />
          <circle
            cx={r + Math.cos(a) * r * 0.97 * Math.cos(-0.314) - Math.sin(a) * r * 0.36 * Math.sin(-0.314)}
            cy={r + Math.cos(a) * r * 0.97 * Math.sin(-0.314) + Math.sin(a) * r * 0.36 * Math.cos(-0.314)}
            r={Math.max(2.5, tam * 0.05)}
            fill="#dff41c"
          />
        </>
      )}
    </svg>
  );
}
