// Ayudas para componer escenas con varias partes { grupos, anclas } (tanda 3: repisa, buzón, pie, sello).
// Nada de estilo aquí: solo nombres, anclas y cajas.

export const grupo = (nombre, piezas, extra = {}) => ({ nombre, piezas, ...extra });

/** antepone `pre-` al nombre de cada grupo (dos Haku en la misma escena no comparten data-g) */
export const prefijar = (parte, pre) => ({ ...parte, grupos: parte.grupos.map((g) => ({ ...g, nombre: `${pre}-${g.nombre}` })) });

/** toda la parte se mueve como una sola ancla `anim` (se pierden sus anclas propias: ojos, cola…) */
export function soloAnim(parte, anim, ancla = [0, 0]) {
  return {
    grupos: parte.grupos.map((g) => ({ ...g, anim, piezas: g.piezas.map((p) => ({ ...p, anim })) })),
    anclas: { [anim]: ancla },
  };
}

/** caja [x, y, w, h] que envuelve las piezas (sin contar el grosor del trazo: usa `pad`) */
export function caja(grupos, pad = 10) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  const pon = ([x, y]) => { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); };
  for (const g of grupos) for (const p of g.piezas) {
    if (p.tipo === 'texto') { const t = p.tam || 22; pon([p.x - t * 2.2, p.y - t]); pon([p.x + t * 2.2, p.y + t * 0.3]); continue; }
    if (p.a) { pon(p.a); pon(p.b); }
    if (p.pts) p.pts.forEach(pon);
    if (p.c) { pon([p.c[0] - p.rx, p.c[1] - p.ry]); pon([p.c[0] + p.rx, p.c[1] + p.ry]); }
    if (p.d) { const n = p.d.match(/-?\d*\.?\d+/g).map(Number); for (let i = 0; i + 1 < n.length; i += 2) pon([n[i], n[i + 1]]); }
  }
  return [Math.floor(x0 - pad), Math.floor(y0 - pad), Math.ceil(x1 - x0 + 2 * pad), Math.ceil(y1 - y0 + 2 * pad)];
}

/** dónde cae una pieza suelta (su vb local colocado en [x, y, s]) dentro de un lienzo W×H, en % */
export function hueco(vb, { x, y, s = 1 }, W, H) {
  const r = (v) => Math.round(v * 100) / 100;
  return { x: r(((x + vb[0] * s) / W) * 100), y: r(((y + vb[1] * s) / H) * 100), w: r(((vb[2] * s) / W) * 100), h: r(((vb[3] * s) / H) * 100) };
}

/** nombres de los grupos de una parte */
export const nombres = (parte) => [...new Set(parte.grupos.map((g) => g.nombre))];
