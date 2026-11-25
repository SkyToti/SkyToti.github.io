// «Hornea» una ilustración: geometría limpia → SVG a mano con 3 cuadros de hervor (3 semillas fijas).
// Misma entrada → mismo archivo (roughjs con semilla; números redondeados a 1 decimal).
import rough from 'roughjs';
import { estilo, color } from './estilo.mjs';

const gen = rough.generator();
export const SEMILLAS = [11, 47, 83];

const num = (n) => { const r = Math.round(n * 10) / 10; return (Object.is(r, -0) ? 0 : r).toString(); };
const fmt = (d) => d.replace(/-?\d*\.?\d+(?:e-?\d+)?/g, (m) => num(+m)).replace(/\s+/g, ' ')
  .replace(/ ?([MLCQZAmlcqza]) ?/g, '$1').replace(/ -/g, '-').trim();
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const tinta = (k) => color[k || 'hueso'] || k;

// une los sub-trayectos contiguos: el «dash» de DrawSVG se reinicia en cada M
function unir(d) {
  let fin = null;
  return d.trim().split(/(?=M)/).map((p) => {
    const nums = p.match(/-?\d*\.?\d+(?:e-?\d+)?/g)?.map(Number) || [];
    const ini = nums.slice(0, 2);
    const pegada = fin && Math.hypot(ini[0] - fin[0], ini[1] - fin[1]) < 0.75;
    fin = nums.slice(-2);
    return pegada ? p.replace(/^M\s*-?\d*\.?\d+(?:e-?\d+)?[\s,]+-?\d*\.?\d+(?:e-?\d+)?\s*/, '') : p;
  }).join(' ');
}

// remates que se pasan (marcador): alarga los extremos de un trazo abierto
function rematar(pts, k) {
  if (!k || pts.length < 2) return pts;
  const ext = (a, b) => { const dx = a[0] - b[0], dy = a[1] - b[1], n = Math.hypot(dx, dy) || 1; return [a[0] + (dx / n) * k, a[1] + (dy / n) * k]; };
  const q = pts.slice();
  q[0] = ext(pts[0], pts[1]);
  q[q.length - 1] = ext(pts.at(-1), pts.at(-2));
  return q;
}

function dibujable(p, o, remate = 0) {
  switch (p.tipo) {
    case 'linea': { const [a, b] = rematar([p.a, p.b], remate); return gen.line(a[0], a[1], b[0], b[1], o); }
    case 'polilinea': return gen.linearPath(rematar(p.pts, remate), o);
    case 'poligono': return gen.polygon(p.pts, o);
    case 'elipse': return gen.ellipse(p.c[0], p.c[1], p.rx * 2, p.ry * 2, o);
    case 'camino': return gen.path(p.d, o);
  }
  throw new Error(`tipo desconocido: ${p.tipo}`);
}

export function limpio(p) {
  const pt = ([x, y]) => `${num(x)} ${num(y)}`;
  switch (p.tipo) {
    case 'poligono': return `M${p.pts.map(pt).join('L')}Z`;
    case 'elipse': { const [cx, cy] = p.c; return `M${num(cx - p.rx)} ${num(cy)}A${num(p.rx)} ${num(p.ry)} 0 1 0 ${num(cx + p.rx)} ${num(cy)}A${num(p.rx)} ${num(p.ry)} 0 1 0 ${num(cx - p.rx)} ${num(cy)}Z`; }
    case 'camino': return fmt(p.d);
    case 'linea': return `M${pt(p.a)}L${pt(p.b)}`;
    case 'polilinea': return `M${p.pts.map(pt).join('L')}`;
  }
  return '';
}

// muestrea un camino M/L/C absoluto (la chispa en reposo, sin JS)
export function puntoEn(d, t) {
  const tok = d.match(/[MLC]|-?\d*\.?\d+/g); const segs = []; let cur = null, i = 0, cmd;
  while (i < tok.length) {
    if (/[MLC]/.test(tok[i])) cmd = tok[i++];
    const n = () => +tok[i++];
    if (cmd === 'M') cur = [n(), n()];
    else if (cmd === 'L') { const a = cur, b = [n(), n()]; segs.push((s) => [a[0] + (b[0] - a[0]) * s, a[1] + (b[1] - a[1]) * s]); cur = b; }
    else if (cmd === 'C') { const a = cur, c1 = [n(), n()], c2 = [n(), n()], b = [n(), n()]; segs.push((s) => { const m = 1 - s; return [0, 1].map((k) => m * m * m * a[k] + 3 * m * m * s * c1[k] + 3 * m * s * s * c2[k] + s * s * s * b[k]); }); cur = b; }
  }
  const pts = []; segs.forEach((f) => { for (let s = 0; s <= 1; s += 0.02) pts.push(f(s)); });
  const acc = [0]; for (let k = 1; k < pts.length; k++) acc.push(acc[k - 1] + Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]));
  const meta = acc.at(-1) * t; const k = acc.findIndex((v) => v >= meta);
  return pts[Math.max(0, k)];
}

export function hornear(def) {
  const suf = def.nombre;
  const idTrama = (t) => `tr-${t}-${suf}`;
  const usadas = new Set();

  const trazos = (p, semilla) => {
    const base = estilo.lineas[p.linea];
    const o = { ...estilo.comun, ...base, ...(p.rugoso || {}), seed: semilla, stroke: tinta(p.tinta) };
    delete o.remate;
    const abierto = p.tipo === 'linea' || p.tipo === 'polilinea';
    const sw = base.strokeWidth === estilo.lineas.ext.strokeWidth ? '' : ` stroke-width="${base.strokeWidth}"`;
    const st = (p.tinta || 'hueso') === 'hueso' ? '' : ` stroke="${tinta(p.tinta)}"`;
    return gen.toPaths(dibujable(p, o, abierto ? (p.remate ?? base.remate ?? 0) : 0))
      .filter((q) => q.stroke && q.stroke !== 'none')
      .map((q) => `<path class="t${p.entra === 'fade' ? ' tf' : ''}" d="${fmt(unir(q.d))}"${st}${sw}${p.punteado ? ` stroke-dasharray="${p.punteado}"` : ''}/>`)
      .join('');
  };

  const rellenos = (p) => {
    let out = '';
    if (p.rol) {
      const r = estilo.rellenos[p.rol];
      if (!r) throw new Error(`rol sin relleno: ${p.rol}`);
      const [dx, dy] = p.mueve || r.mueve || estilo.REG;
      const mv = dx || dy ? ` transform="translate(${dx} ${dy})"` : '';
      const op = (p.op ?? r.op) < 1 ? ` opacity="${p.op ?? r.op}"` : '';
      out += `<path d="${limpio(p)}" fill="${tinta(r.color)}"${mv}${op}/>`;
    }
    if (p.trama) {
      usadas.add(p.trama);
      const t = estilo.tramas[p.trama];
      out += `<path d="${limpio(p)}" fill="url(#${idTrama(p.trama)})"${(p.op ?? t.op) < 1 ? ` opacity="${p.op ?? t.op}"` : ''}/>`;
    }
    return out;
  };

  const texto = (p) => {
    const r = estilo.rotulo;
    const tam = num(p.tam || r.tam);
    const giro = p.giro ? ` transform="rotate(${num(p.giro)} ${num(p.x)} ${num(p.y)})"` : '';
    // `largo`: ancho fijo (textLength) para rótulos que deben caber en un hueco (el texto de un sello)
    const largo = p.largo ? ` textLength="${num(p.largo)}" lengthAdjust="spacingAndGlyphs"` : '';
    return `<text class="tf" x="${num(p.x)}" y="${num(p.y)}"${giro}${largo}${p.ancla ? ` text-anchor="${p.ancla}"` : ''} font-size="${tam}" fill="${tinta(p.tinta || 'ambar')}" stroke="none" style="font-family:${r.familia};font-weight:${p.peso || r.peso};font-variation-settings:'INFM' ${r.infm},'BNCE' ${r.bnce}">${esc(p.texto)}</text>`;
  };

  const capas = { luz: [], base: [], arriba: [] };
  for (const g of def.grupos) {
    // tramos consecutivos con la misma (anim, capa)
    const tramos = [];
    for (const p of g.piezas) {
      const capa = p.capa || g.capa || 'base', anim = p.anim || g.anim || '';
      const ult = tramos.at(-1);
      if (ult && ult.capa === capa && ult.anim === anim) ult.piezas.push(p);
      else tramos.push({ capa, anim, piezas: [p] });
    }
    for (const t of tramos) {
      const rel = t.piezas.filter((p) => p.tipo !== 'texto').map(rellenos).join('');
      const conTrazo = t.piezas.filter((p) => p.linea && p.tipo !== 'texto');
      // `cuadros: 1` (tanda 6, tráfico): un solo trazo, sin hervor (los ciclos cuadro a cuadro ya se mueven solos)
      const cuadros = conTrazo.length ? (def.cuadros === 1 ? SEMILLAS.slice(0, 1) : SEMILLAS).map((s, i) => `<g class="f${i}">${conTrazo.map((p) => trazos(p, s)).join('')}</g>`).join('') : '';
      const textos = t.piezas.filter((p) => p.tipo === 'texto').map(texto).join('');
      const o = t.anim && def.anclas?.[t.anim];
      // `opacidad` del grupo: su estado en reposo (p. ej. 0 = solo aparece por un gesto; sin JS sigue oculto)
      const op = g.opacidad !== undefined && g.opacidad < 1 ? ` opacity="${num(g.opacidad)}"` : '';
      const attrs = `data-g="${g.nombre}"${t.anim ? ` data-anim="${t.anim}"` : ''}${o ? ` data-o="${num(o[0])} ${num(o[1])}"` : ''}${op}`;
      capas[t.capa].push(`<g ${attrs}>${rel ? `<g class="rel" stroke="none">${rel}</g>` : ''}${cuadros}${textos}</g>`);
    }
  }

  const extra = [];
  for (const z of def.zonas || []) extra.push(`<path data-zona="${z.nombre}" d="${limpio(z)}" fill="transparent" stroke="none"/>`);
  if (def.guia) {
    const [x, y] = puntoEn(def.guia.d, def.guia.fin);
    extra.push(`<path data-guia data-fin="${def.guia.fin}" d="${fmt(def.guia.d)}" stroke="none"/>`);
    extra.push(`<path data-estela d="${fmt(def.guia.d)}" stroke="${color.ambar}" stroke-width="4" opacity="0"/>`);
    extra.push(`<g data-chispa transform="translate(${num(x)} ${num(y)})"><circle r="13" fill="${color.ambar}" opacity=".22" stroke="none"/><circle r="5.5" fill="${color.ambar}" stroke="none"/></g>`);
  }

  const defs = [...usadas].sort().map((k) => {
    const t = estilo.tramas[k];
    return `<pattern id="${idTrama(k)}" width="${t.paso}" height="${t.paso}" patternUnits="userSpaceOnUse" patternTransform="rotate(18)"><circle cx="${t.paso / 2}" cy="${t.paso / 2}" r="${t.r}" fill="${tinta(t.color)}"/></pattern>`;
  }).join('');

  const svg = (defs ? `<defs>${defs}</defs>` : '')
    + `<g fill="none" stroke="${color.hueso}" stroke-width="${estilo.lineas.ext.strokeWidth}" stroke-linecap="round" stroke-linejoin="round">`
    + `<g data-capa="luz">${capas.luz.join('')}</g>`
    + `<g data-capa="base">${capas.base.join('')}</g>`
    + `<g data-capa="arriba">${capas.arriba.join('')}</g>`
    + extra.join('')
    + `</g>`;

  const [vx, vy, vw, vh] = def.vb;
  // orden de entrada: los grupos en el orden en que se declararon (o el que diga la ilustración)
  const nombres = def.orden || [...new Set(def.grupos.map((g) => g.nombre))];
  return {
    nombre: def.nombre,
    titulo: def.titulo,
    vb: `${num(vx)} ${num(vy)} ${num(vw)} ${num(vh)}`,
    ancho: vw,
    alto: vh,
    orden: nombres,
    anclas: Object.fromEntries(Object.entries(def.anclas || {}).map(([k, v]) => [k, [+num(v[0]), +num(v[1])]])),
    gestos: def.gestos || {},
    alEntrar: def.alEntrar || [],
    alPasar: def.alPasar || [],
    ...(def.lampara ? { lampara: def.lampara } : {}),
    ...(def.alTocar?.length ? { alTocar: def.alTocar } : {}),
    ...(def.huecos ? { huecos: def.huecos } : {}),
    svg,
  };
}
