// El monograma «DB» de la cabecera (64×40): una sola línea que se traza al cargar y se vuelve a trazar al pasar el
// cursor o enfocarlo. Es el enlace al inicio. Servidor: pinta el SVG; <MonogramaTrazo> (cliente, sin GSAP ni Motion)
// solo anima el trazo con la Web Animations API.
import Dibujo from "@/components/dibujo/Dibujo";
import MonogramaTrazo from "./MonogramaTrazo";

export default function Monograma({ href = "/", etiqueta = "Diego Benítez · inicio", className }: { href?: string; etiqueta?: string; className?: string }) {
  return (
    <MonogramaTrazo href={href} etiqueta={etiqueta} className={className}>
      <Dibujo nombre="monograma" />
    </MonogramaTrazo>
  );
}
