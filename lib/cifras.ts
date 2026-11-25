// Partir una cifra escrita («Más de 2,000», «~14,000», «~10 años», «1.8 MB») en prefijo, número y sufijo, y
// volver a escribirla con otro número y el mismo formato. Lo usa el contador (components/movimiento/Animar.tsx).
// Sin imports: también lo importa `node --test`.

export type CifraPartida = {
  prefijo: string;
  numero: number;
  sufijo: string;
  decimales: number;
  /** true si el original agrupa los miles con coma («2,000»). */
  miles: boolean;
};

/** null si el valor no trae número (entonces no se anima). */
export function partirCifra(valor: string): CifraPartida | null {
  const m = /\d[\d,]*(?:\.\d+)?/.exec(valor);
  if (!m) return null;
  const crudo = m[0];
  const [entero = "", fraccion = ""] = crudo.split(".");
  const numero = Number(entero.replace(/,/g, "") + (fraccion ? `.${fraccion}` : ""));
  if (!Number.isFinite(numero)) return null;
  return {
    prefijo: valor.slice(0, m.index),
    numero,
    sufijo: valor.slice(m.index + crudo.length),
    decimales: fraccion.length,
    miles: entero.includes(","),
  };
}

/** Escribe `n` con el formato de la cifra partida. escribirCifra(partirCifra(v), partirCifra(v).numero) === v. */
export function escribirCifra(c: CifraPartida, n: number): string {
  let texto = n.toFixed(c.decimales);
  if (c.miles) {
    const [entero = "", fraccion] = texto.split(".");
    texto = entero.replace(/\B(?=(\d{3})+(?!\d))/g, ",") + (fraccion ? `.${fraccion}` : "");
  }
  return `${c.prefijo}${texto}${c.sufijo}`;
}
