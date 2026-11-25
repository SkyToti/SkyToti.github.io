import Caso from "@/components/paginas/Caso";
import { contenido } from "@/lib/contenido";
import { metadatosCaso } from "@/lib/metadatos";

type Props = { params: Promise<{ slug: string }> };

// Exportación estática: solo existen los casos de contenido/casos/.
export const dynamicParams = false;
export const generateStaticParams = () => contenido().slugs().map((slug) => ({ slug }));

export async function generateMetadata({ params }: Props) {
  return metadatosCaso("es", (await params).slug);
}

export default async function PaginaCaso({ params }: Props) {
  return <Caso idioma="es" slug={(await params).slug} />;
}
