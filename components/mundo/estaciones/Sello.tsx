// «El sello» (La pizarra · 160×160): al despertar, el agente alza su sello de goma, lo estampa en la hoja y salta el
// sello redondo «medido» / «measured». Decorativo: las cifras ya están escritas al lado.
// Despierta como todo el kit: con la chispa de su estación (`estacion:llega`). `retraso` (s) escalona varios sellos.
// Para que no estampe solo antes de que llegue la chispa (el kit arranca solo tras 1.2 s a la vista), quien lo monta
// puede esconder su <svg> hasta que la estación tenga `llego` (así lo hace Cifras.module.css).
import Dibujo from "@/components/dibujo/Dibujo";

export default function Sello({ idioma, className, retraso }: { idioma: "es" | "en"; className?: string; retraso?: number }) {
  return <Dibujo nombre={idioma === "en" ? "sello-en" : "sello-es"} vivo retraso={retraso} className={className} />;
}
