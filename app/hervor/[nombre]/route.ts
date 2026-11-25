// Los cuadros 2 y 3 del hervor de cada dibujo (components/dibujo/hervor.ts), como JSON estático:
// out/hervor/<nombre>.json. Una lista con el marcado de f1+f2 de cada f0, en orden de documento y sin prefijar ids
// (DibujoVivo los prefija como su SVG).
import { DIBUJOS, type NombreDibujo } from "@/components/dibujo/datos";
import { partirHervor } from "@/components/dibujo/hervor";

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(DIBUJOS).map((nombre) => ({ nombre: `${nombre}.json` }));
}

export async function GET(_peticion: Request, { params }: { params: Promise<{ nombre: string }> }) {
  const { nombre } = await params;
  const datos = DIBUJOS[nombre.replace(/\.json$/, "") as NombreDibujo];
  return Response.json(datos ? partirHervor(datos.svg).cuadros : []);
}
