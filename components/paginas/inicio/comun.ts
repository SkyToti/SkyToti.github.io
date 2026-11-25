// Ayudantes que comparten las secciones del inicio (components/paginas/Inicio.tsx las ensambla).
import { textoPlano } from "@/lib/contenido";

/** Ancho completo en celular y tableta (4 y 8 columnas); cada pieza agrega su reparto de escritorio. */
export const col = "col-span-4 sm:col-span-8";

/** Un párrafo de Markdown con saltos de línea sencillos (cada renglón, una idea) → un <p> por renglón. */
export function enParrafos(html: string): string {
  return html.replace(/<p>([\s\S]*?)<\/p>/g, (_, dentro: string) =>
    dentro
      .split(/\n+/)
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => `<p>${l}</p>`)
      .join(""),
  );
}

/** Un paso de «Cómo trabajo» (`<strong>Frase.</strong> resto`) → { titulo: la frase en negrita, texto: el resto }. */
export function pasoTira(html: string): { titulo: string; texto: string } {
  const m = html.match(/^\s*<strong>([\s\S]*?)<\/strong>([\s\S]*)$/);
  return m ? { titulo: textoPlano(m[1]), texto: textoPlano(m[2]) } : { titulo: textoPlano(html), texto: "" };
}

/** Dónde va cada pieza de la lámina en escritorio (≥ 1024): la primera, con el medio a 8 columnas; después el
 *  lado del medio alterna (impares a la derecha, pares a la izquierda). En celular y tableta todo va apilado:
 *  rótulo, título, resumen, medio y píldora. Clases completas para que Tailwind las encuentre. */
export function acomodo(numero: number) {
  if (numero === 1) return { texto: "lg:col-start-1 lg:col-span-4", medio: "lg:col-start-5 lg:col-span-8" };
  if (numero % 2 === 1) return { texto: "lg:col-start-1 lg:col-span-5", medio: "lg:col-start-6 lg:col-span-7" };
  return { texto: "lg:col-start-9 lg:col-span-4", medio: "lg:col-start-1 lg:col-span-7" };
}
