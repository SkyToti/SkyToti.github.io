// Ids únicos por instancia: el mismo dibujo pintado dos veces en una página repetía los `id` de sus tramas
// (<pattern>), recortes y degradados, y si el primero estaba oculto el segundo se quedaba sin trama.
// `prefijarIds` antepone un prefijo a cada id definido en el marcado y a todas sus referencias
// (url(#…), href="#…", xlink:href="#…"). Sin dependencias: lo prueba `node --test` sin compilar.

/** deja un id de React (`«r1»`, `_R_a_`, `:r1:`) en caracteres válidos para un id de SVG */
export function limpiarId(id: string): string {
  return id.replace(/[^A-Za-z0-9_-]/g, "");
}

/** `conocidos`: ids definidos FUERA de `svg` a los que también se refiere (los cuadros del hervor usan las tramas
 *  del <defs> del dibujo, que ya está en la página). */
export function prefijarIds(svg: string, prefijo: string, conocidos: Iterable<string> = []): string {
  const ids = new Set<string>(conocidos);
  for (const m of svg.matchAll(/\sid="([^"]+)"/g)) ids.add(m[1]!);
  if (!ids.size || !prefijo) return svg;
  return svg.replace(/(\sid="|url\(#|href="#)([^")]+)/g, (todo, antes: string, id: string) =>
    ids.has(id) ? `${antes}${prefijo}-${id}` : todo,
  );
}
