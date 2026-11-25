// Escena (servidor): la entrada única al motor del plano. Busca la escena por nombre en el registro (escenas/) y
// arma Plano + PlanoVivo (+ Pasos en modo `completo`). Si el nombre no existe, no dibuja nada.
import { ESCENAS, existeEscena } from "@/escenas";
import type { Idioma } from "@/lib/idioma";
import Pasos from "./Pasos";
import Plano from "./Plano";
import PlanoVivo from "./PlanoVivo";

export type PropsEscena = {
  nombre: string;
  idioma: Idioma;
  modo?: "completo" | "mini";
  /** una línea: va en el aria-label del plano */
  resumen: string;
  /** los pasos de «Cómo funciona» ya en HTML, en el mismo orden que los pasos de la escena */
  pasos?: { html: string }[];
};

export default function Escena({ nombre, idioma, modo = "completo", resumen, pasos }: PropsEscena) {
  if (!existeEscena(nombre)) return null;
  const escena = ESCENAS[nombre]!;
  const lista = modo === "completo" && pasos?.length ? pasos : null;
  return (
    <PlanoVivo
      escena={escena}
      idioma={idioma}
      modo={modo}
      totalPasos={lista ? lista.length : escena.pasos.length}
      plano={<Plano escena={escena} idioma={idioma} modo={modo} resumen={resumen} />}
      pasos={lista ? <Pasos pasos={lista} idioma={idioma} /> : null}
    />
  );
}
