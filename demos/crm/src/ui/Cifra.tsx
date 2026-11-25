import { formatear, partirCifra, useSuave } from "../motor/suave";

/** Una cifra que cuenta hasta su número (desde 0 al aparecer; desde la anterior al cambiar de unidad) */
export default function Cifra({ valor, desdeCero = false }: { valor: string; desdeCero?: boolean }) {
  const p = partirCifra(valor);
  const n = useSuave(p.n ?? 0, 950, desdeCero ? 0 : undefined);
  if (p.n === null) return <>{valor}</>;
  return (
    <>
      {p.pre}
      {formatear(p.decimales ? n : Math.round(n), p.decimales, p.miles)}
      {p.post}
    </>
  );
}
