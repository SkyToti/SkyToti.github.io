// El hervor fuera del HTML. Cada trazo de un dibujo trae tres cuadros (`<g class="f0">`, `f1`, `f2`); en reposo solo
// se ve el f0 y los otros dos solo los enseña <DibujoVivo> mientras hierve. Eran la mitad del peso de cada SVG y, como
// el SVG va dos veces en la página (el HTML y la carga de React), ~35 % del documento del inicio.
// `partirHervor` deja en el marcado solo los f0 y devuelve, por cada f0 y en orden de documento, el marcado de sus
// f1 y f2. El servidor pinta la base; app/hervor/[nombre]/route.ts publica los cuadros como JSON estático y
// DibujoVivo los pide al acercarse y los mete detrás de cada f0 antes de armar la entrada.
// Sin dependencias: lo prueba `node --test` sin compilar. Los cuadros nunca anidan otro <g>.

const CUADRO = /<g class="f([012])">([\s\S]*?)<\/g>/g;

export function partirHervor(svg: string): { base: string; cuadros: string[] } {
  const cuadros: string[] = [];
  const base = svg.replace(CUADRO, (todo, f: string) => {
    if (f === "0") {
      cuadros.push("");
      return todo;
    }
    if (!cuadros.length) return todo; // un f1/f2 sin f0 delante: se queda donde está
    cuadros[cuadros.length - 1] += todo;
    return "";
  });
  return { base, cuadros };
}
