// «El buzón» (Contacto · 640×420): al despertar, Haku empuja el sobre desde la orilla de la mesa, el sobre cae
// girando al buzón y sube la banderita. Segunda broma: cuando el sitio avisa que copió el correo
//   document.dispatchEvent(new CustomEvent("correo:copiado"))
// baja una estampa «copiado» / «copied» sobre el buzón (Motion, con resorte) y la banderita tiembla.
// Tocar el buzón mueve la banderita; pasar o tocar a Haku, su oreja. Decorativo: el botón de copiar vive en la página.
import Dibujo from "@/components/dibujo/Dibujo";
import BuzonVivo from "./BuzonVivo";

export default function Buzon({ idioma, className }: { idioma: "es" | "en"; className?: string }) {
  return (
    <BuzonVivo
      className={className}
      dibujo={<Dibujo nombre="buzon" vivo />}
      estampa={<Dibujo nombre={idioma === "en" ? "estampa-copied" : "estampa-copiado"} />}
    />
  );
}
