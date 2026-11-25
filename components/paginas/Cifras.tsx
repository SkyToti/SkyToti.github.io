// Cotas: cifras medidas, como las medidas de un plano (número en mono con su etiqueta y su línea de cota).
// El número llega ya con su valor final; components/movimiento/Animar.tsx lo cuenta si hay movimiento.
// El lector de pantalla lee la copia oculta (fija), no la que cambia.
type Cifra = { valor: string; etiqueta: string };

export default function Cifras({ cifras, etiqueta, columnas = 4 }: { cifras: Cifra[]; etiqueta?: string; columnas?: 2 | 3 | 4 }) {
  const rejilla = { 2: "sm:grid-cols-2", 3: "sm:grid-cols-3", 4: "sm:grid-cols-2 lg:grid-cols-4" }[columnas];
  return (
    <ul aria-label={etiqueta} className={`grid grid-cols-2 gap-x-5 gap-y-10 sm:gap-x-6 ${rejilla}`}>
      {cifras.map((c) => (
        <li key={c.etiqueta} data-revelar className="flex flex-col">
          {/* Línea de cota: |———| */}
          <span aria-hidden="true" className="relative mb-5 block h-3 border-x-[1.5px] border-linea-viva">
            <span className="absolute inset-x-0 top-1/2 block border-t-[1.5px] border-linea-viva" />
          </span>
          <span className="font-mono text-[clamp(1.5rem,3.4vw,2.75rem)] leading-none font-medium tracking-[-0.02em] text-hueso tabular-nums">
            <span aria-hidden="true" data-contar={c.valor}>
              {c.valor}
            </span>
            <span className="sr-only">{c.valor}</span>
          </span>
          <span className="mt-3 max-w-[30ch] text-[0.9375rem] leading-snug text-hueso-apagado">{c.etiqueta}</span>
        </li>
      ))}
    </ul>
  );
}
