// «Pie» (420×200): Haku hecho rosca sobre el final de la línea, tres «z» que hierven y suben y la chispa que se
// apaga a su lado. Tocar a Haku (clic, toque, o Enter/Espacio con el teclado) le abre un ojo y lo vuelve a cerrar.
import Dibujo from "@/components/dibujo/Dibujo";

const TEXTOS = {
  es: { titulo: "Haku dormido al final de la línea", haku: "Haku, dormido (despiértalo)" },
  en: { titulo: "Haku asleep at the end of the line", haku: "Haku, asleep (wake him up)" },
} as const;

export default function PieHaku({ idioma, className }: { idioma: "es" | "en"; className?: string }) {
  const t = TEXTOS[idioma];
  return <Dibujo nombre="pie-haku" vivo titulo={t.titulo} etiquetas={{ haku: t.haku }} className={className} />;
}
