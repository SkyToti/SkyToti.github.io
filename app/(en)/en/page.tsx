import Inicio from "@/components/paginas/Inicio";
import { metadatosInicio } from "@/lib/metadatos";

export const generateMetadata = () => metadatosInicio("en");

export default function PaginaInicio() {
  return <Inicio idioma="en" />;
}
