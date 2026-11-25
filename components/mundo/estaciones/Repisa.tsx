// «La repisa» (Sobre mí): la línea se vuelve repisa, seis objetos caen a su lugar uno por uno y Haku llega de un
// salto. Cada objeto es un botón: al tocarlo o enfocarlo se tambalea (Motion) y suelta su dato en un globo (HTML,
// aria-live). Con Tab se recorren los seis. Los textos llegan por props (los escribe la página, no el dibujo).
// Servidor: pinta los SVG (base ancha 900×360 y vertical 360×520, y los objetos) y se los pasa a <RepisaViva>.
// Ponla dentro de su estación (`data-estacion`) para que despierte con la chispa.
import Dibujo from "@/components/dibujo/Dibujo";
import { DIBUJOS, type NombreDibujo } from "@/components/dibujo/datos";
import RepisaViva, { type ComposicionRepisa } from "./RepisaViva";

export type ClaveRepisa = "ventas" | "estudios" | "noche" | "lugar" | "idiomas" | "haku";
export type DatoRepisa = { clave: ClaveRepisa; titulo: string; texto: string };

const OBJETO: Record<ClaveRepisa, NombreDibujo> = {
  ventas: "repisa-libro",
  estudios: "repisa-cuaderno",
  noche: "repisa-taza",
  lugar: "repisa-globo",
  idiomas: "repisa-diccionario",
  haku: "repisa-plato",
};

const ETIQUETA_HAKU = { es: "Haku", en: "Haku" } as const;

export default function Repisa({ idioma, datos, className }: { idioma: "es" | "en"; datos: DatoRepisa[]; className?: string }) {
  const composicion = (id: "h" | "v"): ComposicionRepisa => {
    const nombre = `repisa-${id}` as const;
    return {
      id,
      base: <Dibujo nombre={nombre} vivo etiquetas={{ haku: ETIQUETA_HAKU[idioma] }} />,
      huecos: DIBUJOS[nombre].huecos ?? {},
      objetos: Object.fromEntries(datos.map((d) => [d.clave, <Dibujo key={d.clave} nombre={OBJETO[d.clave]} />])),
    };
  };
  return <RepisaViva idioma={idioma} datos={datos} composiciones={[composicion("h"), composicion("v")]} className={className} />;
}
