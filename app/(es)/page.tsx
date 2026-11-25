import Inicio from "@/components/paginas/Inicio";
import { metadatosInicio } from "@/lib/metadatos";

export const generateMetadata = () => metadatosInicio("es");

export default function PaginaInicio() {
  return <Inicio idioma="es" />;
}
